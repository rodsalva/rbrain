/**
 * rbrain signal-propose — convert extracted signal clusters into pending
 * decision drafts under brain/decisions/pending/.
 *
 * Reads cluster JSON from stdin (output of `rbrain signal-extract --json`)
 * or re-runs extract internally.
 *
 * Usage:
 *   rbrain signal-extract --json | rbrain signal-propose
 *   rbrain signal-propose --run-extract [--days 14] [--min-weight 4]
 *   rbrain signal-propose --dry-run     (print drafts instead of writing)
 *
 * Each cluster becomes brain/decisions/pending/YYYY-MM-DD-<slug>.md with:
 *   - frontmatter (id, weight, sources, deadline)
 *   - signals section (per-source quotes)
 *   - target block suggestion (keyword heuristic)
 *   - options / trade-offs (placeholders — humans fill)
 */

import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import type { BrainEngine } from '../core/engine.ts';

const DECISIONS_DIR = 'brain/decisions/pending';
const ROADMAP_FILE  = 'brain/concepts/manor-product-roadmap.md';
const DEADLINE_DAYS = 14;

interface ClusterInput {
  id: string;
  weight: number;
  sources: Record<string, number>;
  first_signal: string;
  last_signal: string;
  members: Array<{
    slug: string;
    title: string;
    source_type: string;
    date: string;
    preview: string;
  }>;
}

// ── Roadmap block heuristic ───────────────────────────────────────────────────

interface RoadmapBlock {
  id: string;       // e.g. "intel-01" or "exec-03"
  title: string;
  keywords: string[];
}

function loadRoadmapBlocks(): RoadmapBlock[] {
  if (!existsSync(ROADMAP_FILE)) return [];
  const content = readFileSync(ROADMAP_FILE, 'utf-8');
  const blocks: RoadmapBlock[] = [];

  // Parse ## Block headings (best-effort; humans fix later)
  const lines = content.split('\n');
  let current: RoadmapBlock | null = null;
  for (const line of lines) {
    const m = line.match(/^##\s+(.+)$/);
    if (m) {
      if (current) blocks.push(current);
      const title = m[1].trim();
      current = {
        id: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30),
        title,
        keywords: title.toLowerCase().split(/\s+/).filter(w => w.length >= 4),
      };
    } else if (current) {
      // Accumulate any noun-ish words from block body as extra keywords
      const words = line.toLowerCase().match(/[a-záàâãéèêíïóôõöúçñ]{5,}/g) ?? [];
      current.keywords.push(...words.slice(0, 10));
    }
  }
  if (current) blocks.push(current);
  return blocks;
}

function suggestBlock(clusterText: string, blocks: RoadmapBlock[]): RoadmapBlock | null {
  if (blocks.length === 0) return null;
  const text = clusterText.toLowerCase();
  let best: { block: RoadmapBlock; score: number } | null = null;
  for (const b of blocks) {
    let score = 0;
    for (const kw of new Set(b.keywords)) {
      if (text.includes(kw)) score += 1;
    }
    if (!best || score > best.score) best = { block: b, score };
  }
  return best && best.score > 0 ? best.block : null;
}

// ── Draft generation ──────────────────────────────────────────────────────────

function slugifyCluster(c: ClusterInput): string {
  const sample = c.members[0]?.title ?? c.id;
  return sample.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    .slice(0, 50);
}

function computeDeadline(firstSignal: string): string {
  const d = new Date(firstSignal);
  d.setDate(d.getDate() + DEADLINE_DAYS);
  return d.toISOString().slice(0, 10);
}

function renderDraft(c: ClusterInput, blocks: RoadmapBlock[]): string {
  const today = new Date().toISOString().slice(0, 10);
  const deadline = computeDeadline(c.first_signal);
  const slug = slugifyCluster(c);
  const filename = `${today}-${slug}.md`;

  const allText = c.members.map(m => `${m.title}\n${m.preview}`).join('\n\n');
  const suggested = suggestBlock(allText, blocks);

  const sourceSummary = Object.entries(c.sources)
    .map(([s, n]) => `${s}×${n}`).join(' + ');

  const lines: string[] = [];
  lines.push('---');
  lines.push('type: decision');
  lines.push('status: pending');
  lines.push(`title: "Decision: ${c.members[0]?.title.replace(/"/g, "'").slice(0, 80) ?? 'Cluster ' + c.id}"`);
  lines.push('domain: strategy');
  lines.push('tags: [domain:strategy, decision, pending]');
  lines.push(`cluster_id: ${c.id}`);
  lines.push(`weight: ${c.weight}`);
  lines.push(`sources: "${sourceSummary}"`);
  lines.push(`first_signal: ${c.first_signal}`);
  lines.push(`last_signal: ${c.last_signal}`);
  lines.push(`deadline: ${deadline}`);
  if (suggested) lines.push(`suggested_block: "${suggested.title.replace(/"/g, "'")}"`);
  lines.push('---');
  lines.push('');
  lines.push(`# Proposta de decisão: ${c.members[0]?.title ?? 'Cluster ' + c.id}`);
  lines.push('');
  lines.push(`**Deadline:** ${deadline} (14 dias a partir de ${c.first_signal})`);
  lines.push(`**Peso agregado:** ${c.weight}`);
  lines.push(`**Fontes:** ${sourceSummary}`);
  lines.push('');
  lines.push('## Sinais');
  lines.push('');
  for (const m of c.members) {
    lines.push(`### [${m.source_type}] ${m.title}`);
    lines.push(`*${m.date}* · \`brain/${m.slug}\``);
    lines.push('');
    lines.push('> ' + m.preview.replace(/\n/g, '\n> ').trim());
    lines.push('');
  }

  lines.push('## Convergência');
  lines.push('');
  lines.push('_[preencher: o que essas fontes têm em comum, em 2-3 linhas]_');
  lines.push('');

  lines.push('## Bloco-alvo do roadmap');
  lines.push('');
  if (suggested) {
    lines.push(`**Sugerido por keyword-match:** ${suggested.title}`);
    lines.push('');
    lines.push('_[confirmar, trocar ou descartar]_');
  } else {
    lines.push('_[preencher: qual dos 20 blocos do roadmap isto afeta]_');
  }
  lines.push('');

  lines.push('## Opções');
  lines.push('');
  lines.push('- [ ] **Expandir bloco existente** — _[descrever]_');
  lines.push('- [ ] **Repriorizar** (subir/descer)');
  lines.push('- [ ] **Adicionar bloco novo** — _[título]_');
  lines.push('- [ ] **Rejeitar** — motivo: _[preencher]_');
  lines.push('');

  lines.push('## Trade-offs');
  lines.push('');
  lines.push('_[o que se perde com a opção escolhida? Que bloco precisa ser adiado?]_');
  lines.push('');

  lines.push('## Decisão');
  lines.push('');
  lines.push('_[approve / defer / reject — preencher no review semanal quinta 17h]_');
  lines.push('');

  return lines.join('\n') + '\n';
}

// ── Input sources ─────────────────────────────────────────────────────────────

async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) return '';
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf-8');
}

// ── Main ──────────────────────────────────────────────────────────────────────

export async function runSignalPropose(engine: BrainEngine, args: string[]): Promise<void> {
  const dryRun    = args.includes('--dry-run');
  const runExtract = args.includes('--run-extract');

  let clusters: ClusterInput[] = [];

  if (runExtract) {
    // Re-run signal-extract inline to get clusters
    const { runSignalExtract } = await import('./signal-extract.ts');
    const extractArgs = args.filter(a => !['--dry-run', '--run-extract'].includes(a));
    extractArgs.push('--json');

    // Capture stdout
    const origLog = console.log;
    let capture = '';
    console.log = (s: string) => { capture += s + '\n'; };
    try {
      await runSignalExtract(engine, extractArgs);
    } finally {
      console.log = origLog;
    }
    try { clusters = JSON.parse(capture.trim() || '[]'); } catch { clusters = []; }
  } else {
    const input = await readStdin();
    if (!input.trim()) {
      console.error('No input. Either pipe from signal-extract --json or pass --run-extract.');
      console.error('Example: rbrain signal-extract --json | rbrain signal-propose');
      process.exit(1);
    }
    try { clusters = JSON.parse(input); } catch (e) {
      console.error(`Could not parse input as JSON: ${e instanceof Error ? e.message : e}`);
      process.exit(1);
    }
  }

  if (!Array.isArray(clusters) || clusters.length === 0) {
    console.log('No clusters to propose.');
    return;
  }

  const blocks = loadRoadmapBlocks();
  console.log(`Loaded ${blocks.length} roadmap blocks for keyword-matching.`);

  if (!dryRun) mkdirSync(DECISIONS_DIR, { recursive: true });

  let written = 0;
  for (const c of clusters) {
    const draft = renderDraft(c, blocks);
    const slug = slugifyCluster(c);
    const today = new Date().toISOString().slice(0, 10);
    const path = join(DECISIONS_DIR, `${today}-${slug}.md`);

    if (dryRun) {
      console.log(`\n── ${path} ──\n${draft}`);
    } else if (existsSync(path)) {
      console.log(`⚠ skipping (exists): ${path}`);
    } else {
      writeFileSync(path, draft);
      console.log(`✓ ${path}`);
      written++;
    }
  }

  if (!dryRun) console.log(`\nWrote ${written} pending decision(s) to ${DECISIONS_DIR}/`);
}
