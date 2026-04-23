/**
 * rbrain braintrust — fetch Q&A pairs from Braintrust BTQL API and ingest into RBrain.
 *
 * Replicates the logic from the Rodrigo Brainstrust fetch_qa_knowledge.py script.
 * Supports incremental fetching (only new traces since last run).
 *
 * Usage:
 *   rbrain braintrust [--full] [--project-id ID] [--api-key KEY] [--no-embed] [--dry-run]
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import type { BrainEngine } from '../core/engine.ts';
import { importFromContent } from '../core/import-file.ts';

const BTQL_URL   = 'https://api.braintrust.dev/btql';
const PROJECT_ID = 'f2d180cc-c629-4732-af04-29efe2f0419a';
const PAGE_SIZE  = 200; // smaller pages avoid BTQL 504 timeouts

// ── Internal user exclusion ───────────────────────────────────────────────────
// Reads data/manor_internal_users.csv (checked into repo) or
// ~/.rbrain/manor_internal_users.csv (fallback for compiled binary).

function loadInternalUsers(): Set<string> {
  const candidates = [
    join(import.meta.dir, '../../data/manor_internal_users.csv'),
    join(homedir(), '.rbrain', 'manor_internal_users.csv'),
  ];
  for (const csvPath of candidates) {
    if (!existsSync(csvPath)) continue;
    const lines = readFileSync(csvPath, 'utf-8').trim().split('\n').slice(1); // skip header
    const identifiers = new Set<string>();
    for (const line of lines) {
      const cols = line.split(',');
      const id    = cols[1]?.trim();
      const email = cols[2]?.trim();
      if (id)    identifiers.add(id.toLowerCase());
      if (email) identifiers.add(email.toLowerCase());
    }
    return identifiers;
  }
  return new Set();
}

const INTERNAL_USERS = loadInternalUsers();

const TARGET_NAMES: Record<string, string> = {
  'normal-search':                 'Normal Search',
  'complete-search':               'Complete Search',
  'reform-comparison':             'Tax Reform',
  'reform-comparison-stream':      'Tax Reform',
  'reform-comparison-v2':          'Tax Reform',
  'reform-comparison-v3-endpoint': 'Tax Reform',
};

const STATE_DIR  = join(homedir(), '.rbrain');
const STATE_PATH = join(STATE_DIR, 'braintrust-state.json');

// ── Types ─────────────────────────────────────────────────────────────────────

interface BraintrustRow {
  id: string;
  input: unknown;
  output: unknown;
  metadata: unknown;
  created: string;
  name: string;
}

interface QAEntry {
  id: string;
  created: string;
  search_type: string;
  trace_name: string;
  user_id: string;
  question: string;
  answer: string;
}

// ── State ─────────────────────────────────────────────────────────────────────

function loadState(): { last_created: string | null } {
  if (existsSync(STATE_PATH)) {
    try {
      return JSON.parse(readFileSync(STATE_PATH, 'utf-8'));
    } catch { /* corrupted */ }
  }
  return { last_created: null };
}

function saveState(lastCreated: string) {
  mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(STATE_PATH, JSON.stringify({
    last_created: lastCreated,
    saved_at: new Date().toISOString(),
  }, null, 2));
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

async function fetchTraces(apiKey: string, since: string | null): Promise<BraintrustRow[]> {
  const mode = since ? `since ${since}` : 'ALL historical';
  console.log(`Fetching Braintrust traces (${mode})…`);

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  const namesFilter = Object.keys(TARGET_NAMES)
    .map(n => `'${n}'`)
    .join(', ');

  const allRows: BraintrustRow[] = [];
  const seenIds = new Set<string>();
  let after = since;
  let page = 0;

  while (true) {
    const dateClause = after ? `AND created > '${after}'` : '';
    const query = `
SELECT id, input, output, metadata, created, name
FROM project_logs('${PROJECT_ID}')
WHERE is_root = true
  AND name IN (${namesFilter})
  ${dateClause}
ORDER BY created ASC
LIMIT ${PAGE_SIZE}
`;

    let data: { data?: BraintrustRow[] };
    let lastErr: unknown;
    let ok = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const resp = await fetch(BTQL_URL, {
          method: 'POST',
          headers,
          body: JSON.stringify({ query, fmt: 'json' }),
        });
        if (!resp.ok) {
          const text = await resp.text();
          throw new Error(`Braintrust API error ${resp.status}: ${text}`);
        }
        data = await resp.json() as { data?: BraintrustRow[] };
        ok = true;
        break;
      } catch (e: unknown) {
        lastErr = e;
        if (attempt < 3) {
          const wait = attempt * 5000;
          process.stdout.write(`\n[!] Page ${page + 1} attempt ${attempt} failed — retrying in ${wait / 1000}s…`);
          await new Promise(r => setTimeout(r, wait));
        }
      }
    }
    if (!ok) {
      const msg = lastErr instanceof Error ? lastErr.message : String(lastErr);
      console.error(`\n[!] Request failed on page ${page + 1} after 3 attempts: ${msg}`);
      throw lastErr;
    }

    const batch = data.data || [];
    page++;

    let newInBatch = 0;
    for (const row of batch) {
      if (row.id && !seenIds.has(row.id)) {
        seenIds.add(row.id);
        allRows.push(row);
        newInBatch++;
      }
    }

    process.stdout.write(`\r  Page ${page} — ${allRows.length} rows total…`);

    if (batch.length < PAGE_SIZE) break; // last page

    const lastCreated = batch[batch.length - 1]?.created;
    if (!lastCreated || lastCreated === after) break;
    after = lastCreated;
  }

  console.log(`\nFetched ${allRows.length} traces total.`);
  return allRows;
}

// ── Extraction ────────────────────────────────────────────────────────────────

function extractUserId(row: BraintrustRow): string {
  let meta = row.metadata as Record<string, unknown> || {};
  if (typeof meta === 'string') {
    try { meta = JSON.parse(meta); } catch { meta = {}; }
  }
  const paths = ['user_id', 'email', 'user.email', 'user.name', 'userId', 'user.id'];
  for (const path of paths) {
    let val: unknown = meta;
    for (const part of path.split('.')) {
      val = (val && typeof val === 'object') ? (val as Record<string, unknown>)[part] : undefined;
      if (!val) break;
    }
    if (val) return String(val);
  }
  return 'unknown';
}

const Q_KEYS = ['question', 'content', 'text', 'message', 'value'];
const A_KEYS = ['parecer', 'answer', 'response', 'content', 'text', 'message', 'value'];

function extractText(field: unknown, keys: string[]): string {
  if (!field) return '';
  if (typeof field === 'string') {
    // try JSON parse
    try {
      const parsed = JSON.parse(field);
      return extractText(parsed, keys);
    } catch {
      return field.trim();
    }
  }
  if (Array.isArray(field)) {
    const parts = field.map(item => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        for (const k of keys) {
          if (k in (item as Record<string, unknown>)) {
            const v = (item as Record<string, unknown>)[k];
            return typeof v === 'string' ? v : JSON.stringify(v);
          }
        }
      }
      return '';
    });
    return parts.filter(Boolean).join(' | ');
  }
  if (typeof field === 'object' && field !== null) {
    // For structured answers (e.g. reform-comparison with comparison_table + description)
    const obj = field as Record<string, unknown>;
    // Prefer description or parecer as the primary text, then fall back to keys
    if (obj.description) return String(obj.description);
    if (obj.parecer) return String(obj.parecer);
    for (const k of keys) {
      if (k in obj) {
        const v = obj[k];
        return typeof v === 'string' ? v : JSON.stringify(v, null, 2);
      }
    }
    return JSON.stringify(field, null, 2);
  }
  return String(field);
}

// ── Build entries ─────────────────────────────────────────────────────────────

function buildEntries(traces: BraintrustRow[]): QAEntry[] {
  const entries: QAEntry[] = [];
  let skipped = 0;

  for (const row of traces) {
    const userId = extractUserId(row);
    if (userId === 'unknown') {
      skipped++;
      continue;
    }

    // Exclude Manor internal team members
    if (INTERNAL_USERS.has(userId.toLowerCase())) {
      skipped++;
      continue;
    }

    const question = extractText(row.input, Q_KEYS);
    if (!question.trim()) {
      skipped++;
      continue;
    }

    const answer = extractText(row.output, A_KEYS);

    entries.push({
      id:          row.id,
      created:     row.created,
      search_type: TARGET_NAMES[row.name] || row.name,
      trace_name:  row.name,
      user_id:     userId,
      question,
      answer,
    });
  }

  if (skipped) {
    console.log(`Skipped ${skipped} traces (unknown users or empty questions).`);
  }
  return entries;
}

// ── Markdown formatter ────────────────────────────────────────────────────────

function toSlug(entry: QAEntry): string {
  // Use short id (first 8 chars) for dedup
  const shortId = entry.id.replace(/-/g, '').slice(0, 8);
  const typeSlug = entry.search_type.toLowerCase().replace(/\s+/g, '-');
  return `braintrust/${typeSlug}/${shortId}`;
}

function toMarkdown(entry: QAEntry): string {
  const date = entry.created.slice(0, 10);
  const typeTag = entry.search_type.toLowerCase().replace(/\s+/g, '-');

  // Format answer — if it's a JSON object with comparison_table, render it cleanly
  let answerText = entry.answer;
  try {
    const parsed = JSON.parse(entry.answer);
    if (parsed && typeof parsed === 'object') {
      const parts: string[] = [];
      if (parsed.description) parts.push(parsed.description);
      if (parsed.comparison_table) {
        parts.push('\n## Tabela Comparativa\n');
        parts.push(parsed.comparison_table);
      }
      if (parsed.confidence !== undefined) {
        parts.push(`\n*Confiança: ${(parsed.confidence * 100).toFixed(0)}%*`);
      }
      answerText = parts.join('\n\n').trim();
    }
  } catch { /* not JSON, use as-is */ }

  return `---
type: note
title: "Q&A: ${entry.question.slice(0, 80).replace(/"/g, "'")}"
tags: [braintrust, qa, ${typeTag}]
source: braintrust
search_type: ${entry.search_type}
trace_id: ${entry.id}
user_id: ${entry.user_id}
date: ${date}
---

## Pergunta

${entry.question}

## Resposta

${answerText || '*Sem resposta registrada.*'}
`;
}

// ── Main ──────────────────────────────────────────────────────────────────────

export async function runBraintrust(engine: BrainEngine, args: string[]) {
  const fullRefresh = args.includes('--full');
  const noEmbed     = args.includes('--no-embed');
  const dryRun      = args.includes('--dry-run');

  const projectIdIdx = args.indexOf('--project-id');
  const projectId = projectIdIdx !== -1 ? args[projectIdIdx + 1] : PROJECT_ID;

  const apiKeyIdx = args.indexOf('--api-key');
  const apiKey = apiKeyIdx !== -1
    ? args[apiKeyIdx + 1]
    : process.env.BRAINTRUST_API_KEY;

  if (!apiKey) {
    console.error('Braintrust API key required. Set BRAINTRUST_API_KEY env var or use --api-key KEY.');
    process.exit(1);
  }

  // --since DATE overrides state (useful for chunked historical backfill)
  const sinceIdx = args.indexOf('--since');
  const sinceArg = sinceIdx !== -1 ? args[sinceIdx + 1] : undefined;

  // Determine fetch window
  const state = loadState();
  let since: string | null;
  if (sinceArg) {
    since = sinceArg;
    console.log(`Mode: SINCE ${since} (manual override)`);
  } else if (fullRefresh) {
    since = null;
    console.log('Mode: FULL historical fetch.');
  } else if (state.last_created) {
    since = state.last_created;
    console.log(`Mode: INCREMENTAL — fetching traces after ${since}`);
  } else {
    // No state and no --full: default to last 90 days to avoid BTQL timeouts
    const d = new Date();
    d.setDate(d.getDate() - 90);
    since = d.toISOString().slice(0, 10);
    console.log(`Mode: DEFAULT — fetching traces since ${since} (use --full for all history)`);
  }

  // Fetch
  const rawTraces = await fetchTraces(apiKey, since);

  if (rawTraces.length === 0) {
    console.log('No new traces found. Knowledge base is up to date.');
    return;
  }

  const entries = buildEntries(rawTraces);
  console.log(`Processing ${entries.length} Q&A entries…`);

  if (dryRun) {
    console.log('\nDry run — first 3 entries:');
    for (const e of entries.slice(0, 3)) {
      console.log(`\n--- ${toSlug(e)} ---`);
      console.log(toMarkdown(e).slice(0, 300) + '…');
    }
    return;
  }

  // Ingest into RBrain
  let imported = 0;
  let skipped  = 0;
  let errors   = 0;

  for (const entry of entries) {
    const slug    = toSlug(entry);
    const content = toMarkdown(entry);
    try {
      const result = await importFromContent(engine, slug, content, { noEmbed });
      if (result.status === 'imported') {
        imported++;
      } else {
        skipped++;
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`  Error importing ${slug}: ${msg}`);
      errors++;
    }
  }

  // Save state
  const lastCreated = rawTraces[rawTraces.length - 1]?.created;
  if (lastCreated) saveState(lastCreated);

  // Summary
  const byType: Record<string, number> = {};
  for (const e of entries) {
    byType[e.search_type] = (byType[e.search_type] || 0) + 1;
  }

  console.log(`\nBraintrust sync complete:`);
  console.log(`  ${imported} entries imported`);
  console.log(`  ${skipped} entries skipped (unchanged)`);
  if (errors) console.log(`  ${errors} errors`);
  console.log('\nBy search type:');
  for (const [t, n] of Object.entries(byType)) {
    console.log(`  ${t}: ${n}`);
  }
}
