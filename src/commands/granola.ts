/**
 * rbrain granola — fetch meeting notes from the Granola cloud API and ingest into RBrain.
 *
 * Reads credentials from ~/Library/Application Support/Granola/supabase.json
 * (written by the Granola desktop app). No CLI or running app required.
 *
 * Usage:
 *   rbrain granola [--since YYYY-MM-DD] [--limit N] [--no-embed] [--dry-run]
 *   rbrain granola --full    (ignore last-sync state, fetch all)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import type { BrainEngine } from '../core/engine.ts';
import { importFromContent } from '../core/import-file.ts';

const STATE_DIR  = join(homedir(), '.rbrain');
const STATE_PATH = join(STATE_DIR, 'granola-state.json');
const CREDS_PATH = join(homedir(), 'Library', 'Application Support', 'Granola', 'supabase.json');

const GRANOLA_API   = 'https://api.granola.ai/v2/get-documents';
const GRANOLA_BATCH = 'https://api.granola.ai/v1/get-documents-batch';
const GRANOLA_TX    = 'https://api.granola.ai/v1/get-document-transcript';
const WORKOS_TOKEN  = 'https://api.workos.com/user_management/authenticate';
const WORKOS_CLIENT = 'client_01JZJ0XBDAT8PHJWQY09Y0VD61';

// ── Credentials ───────────────────────────────────────────────────────────────

interface WorkosTokens {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  obtained_at?: number;
}

interface SupabaseJson {
  workos_tokens: string;   // JSON-encoded WorkosTokens
  [k: string]: unknown;
}

function loadCreds(): { token: string; credsData: SupabaseJson; tokens: WorkosTokens } {
  if (!existsSync(CREDS_PATH)) {
    throw new Error(`Granola credentials not found at ${CREDS_PATH}.\nInstall and sign in to Granola: https://granola.ai`);
  }
  const raw = JSON.parse(readFileSync(CREDS_PATH, 'utf-8')) as SupabaseJson;
  const tokens = JSON.parse(raw.workos_tokens) as WorkosTokens;
  return { token: tokens.access_token, credsData: raw, tokens };
}

async function getValidToken(): Promise<string> {
  const { token, credsData, tokens } = loadCreds();
  const expiresAt = (tokens.obtained_at ?? 0) + (tokens.expires_in ?? 21600) * 1000;
  if (Date.now() < expiresAt - 5 * 60 * 1000) return token;

  // Refresh
  const res = await fetch(WORKOS_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: WORKOS_CLIENT,
      grant_type: 'refresh_token',
      refresh_token: tokens.refresh_token,
    }),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`);

  const newTokens = await res.json() as WorkosTokens;
  tokens.access_token  = newTokens.access_token;
  tokens.refresh_token = newTokens.refresh_token;
  tokens.obtained_at   = Date.now();
  tokens.expires_in    = newTokens.expires_in ?? 21600;
  credsData.workos_tokens = JSON.stringify(tokens);
  writeFileSync(CREDS_PATH, JSON.stringify(credsData));
  return newTokens.access_token;
}

// ── State ─────────────────────────────────────────────────────────────────────

interface GranolaState {
  last_sync: string | null;
  last_meeting_id: string | null;
}

function loadState(): GranolaState {
  if (existsSync(STATE_PATH)) {
    try { return JSON.parse(readFileSync(STATE_PATH, 'utf-8')); } catch { /* corrupted */ }
  }
  return { last_sync: null, last_meeting_id: null };
}

function saveState(state: GranolaState) {
  mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(STATE_PATH, JSON.stringify({ ...state, saved_at: new Date().toISOString() }, null, 2));
}

// ── API calls ─────────────────────────────────────────────────────────────────

interface GranolaDoc {
  id: string;
  title?: string;
  created_at?: string;
  updated_at?: string;
  markdown?: string;
  content?: string;
  notes?: string;
  panels?: Array<{ markdown?: string; content?: string }>;
  last_viewed_panel?: { markdown?: string; content?: string };
  attendees?: Array<{ name?: string; email?: string }>;
  participants?: Array<{ name?: string; email?: string } | string>;
  [k: string]: unknown;
}

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: '*/*',
    'User-Agent': 'Granola/5.354.0',
    'X-Client-Version': '5.354.0',
  };
}

async function fetchAllDocs(token: string, limit: number, since: string | null): Promise<GranolaDoc[]> {
  const all: GranolaDoc[] = [];
  let offset = 0;
  const page = Math.min(limit, 100);

  while (all.length < limit) {
    const res = await fetch(GRANOLA_API, {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify({ limit: page, offset, include_last_viewed_panel: true }),
    });
    if (!res.ok) throw new Error(`Granola API error: ${res.status}`);
    const data = await res.json() as { documents?: GranolaDoc[]; docs?: GranolaDoc[] } | GranolaDoc[];
    const docs = Array.isArray(data) ? data : ((data as any).documents ?? (data as any).docs ?? []) as GranolaDoc[];
    if (docs.length === 0) break;

    // Filter by since date
    const filtered = since
      ? docs.filter(d => (d.created_at ?? '') >= since)
      : docs;
    all.push(...filtered);

    if (docs.length < page) break;
    if (since && docs.some(d => (d.created_at ?? '') < since)) break; // passed the cutoff
    offset += docs.length;
  }

  return all.slice(0, limit);
}

async function fetchTranscript(token: string, docId: string): Promise<string> {
  const res = await fetch(GRANOLA_TX, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({ document_id: docId }),
  });
  if (!res.ok) return '';
  const data = await res.json() as Record<string, unknown>;
  return String(data.transcript || data.transcription || data.text || '');
}

// ── Note types ────────────────────────────────────────────────────────────────

interface GranolaNote {
  id: string;
  title: string;
  date: string;
  participants: string[];
  notes: string;
  transcript: string;
  summary: string;
}

function docToNote(doc: GranolaDoc): GranolaNote {
  const id    = doc.id;
  const title = doc.title || 'Untitled Meeting';
  const date  = String(doc.created_at || doc.updated_at || new Date().toISOString()).slice(0, 10);

  // Extract participants from attendees or participants field
  const rawPeople = (doc.attendees ?? doc.participants ?? []) as Array<string | Record<string, unknown>>;
  const participants = rawPeople.map(p =>
    typeof p === 'string' ? p : String((p as Record<string, unknown>).name || (p as Record<string, unknown>).email || JSON.stringify(p))
  );

  // Best notes content: last_viewed_panel > panels[last] > markdown > content > notes
  const noteContent =
    doc.last_viewed_panel?.markdown ||
    doc.last_viewed_panel?.content ||
    (Array.isArray(doc.panels) && doc.panels.length > 0
      ? (doc.panels[doc.panels.length - 1]?.markdown || doc.panels[doc.panels.length - 1]?.content || '')
      : '') ||
    doc.markdown ||
    doc.content ||
    doc.notes ||
    '';

  return {
    id,
    title,
    date,
    participants,
    notes: String(noteContent),
    transcript: '',   // fetched separately
    summary: String(doc.summary || doc.ai_summary || ''),
  };
}

// ── Slug + Markdown ───────────────────────────────────────────────────────────

function toSlug(note: GranolaNote): string {
  const shortId = note.id.replace(/-/g, '').slice(0, 8) || Math.random().toString(36).slice(2, 10);
  return `granola/${note.date}/${shortId}`;
}

function toMarkdown(note: GranolaNote): string {
  const participantList = note.participants.length ? note.participants.join(', ') : 'Unknown';
  const tags = ['granola', 'meeting',
    ...note.participants.slice(0, 3)
      .map(p => p.split(/[@\s]/)[0].toLowerCase().replace(/[^a-z0-9-]/g, ''))
      .filter(Boolean),
  ];

  const parts = [`---
type: note
title: "${note.title.replace(/"/g, "'")}"
tags: [${tags.join(', ')}]
source: granola
date: ${note.date}
participants: "${participantList}"
meeting_id: ${note.id}
---

# ${note.title}

**Date:** ${note.date}
**Participants:** ${participantList}
`];

  if (note.summary?.trim()) parts.push(`\n## Summary\n\n${note.summary.trim()}\n`);
  if (note.notes?.trim())   parts.push(`\n## Notes\n\n${note.notes.trim()}\n`);
  if (note.transcript?.trim()) {
    const t = note.transcript.trim();
    const truncated = t.length > 20_000 ? t.slice(0, 20_000) + '\n\n*[transcript truncated]*' : t;
    parts.push(`\n## Transcript\n\n${truncated}\n`);
  }

  return parts.join('');
}

// ── Main ──────────────────────────────────────────────────────────────────────

export async function runGranola(engine: BrainEngine, args: string[]) {
  const noEmbed  = args.includes('--no-embed');
  const dryRun   = args.includes('--dry-run');
  const fullSync = args.includes('--full');

  const sinceIdx = args.indexOf('--since');
  const sinceArg = sinceIdx !== -1 ? args[sinceIdx + 1] : undefined;

  const limitIdx = args.indexOf('--limit');
  const limit    = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : 200;

  // Determine sync window
  const state = loadState();
  let since: string | null = null;
  if (!fullSync && !sinceArg && state.last_sync) {
    since = state.last_sync;
    console.log(`Mode: INCREMENTAL — meetings since ${since}`);
  } else if (sinceArg) {
    since = sinceArg;
    console.log(`Mode: SINCE ${since}`);
  } else {
    console.log('Mode: FULL sync');
  }

  let token: string;
  try {
    token = await getValidToken();
  } catch (e: unknown) {
    console.error(`Failed to authenticate with Granola: ${e instanceof Error ? e.message : e}`);
    process.exit(1);
  }

  console.log('Fetching meeting notes from Granola API…');
  let docs: GranolaDoc[];
  try {
    docs = await fetchAllDocs(token, limit, since);
  } catch (e: unknown) {
    console.error(`Failed to fetch notes: ${e instanceof Error ? e.message : e}`);
    process.exit(1);
  }

  console.log(`Found ${docs.length} meetings.`);
  if (docs.length === 0) {
    console.log('Nothing to sync. Knowledge base is up to date.');
    saveState({ last_sync: new Date().toISOString().slice(0, 10), last_meeting_id: state.last_meeting_id });
    return;
  }

  // Convert docs to notes + fetch transcripts
  console.log('Fetching transcripts…');
  const notes: GranolaNote[] = [];
  for (let i = 0; i < docs.length; i++) {
    const note = docToNote(docs[i]);
    process.stdout.write(`\r  ${i + 1}/${docs.length}: ${note.title.slice(0, 50)}…`);
    try {
      note.transcript = await fetchTranscript(token, note.id);
    } catch { /* no transcript */ }
    notes.push(note);
  }
  console.log('');

  if (dryRun) {
    console.log('\nDry run — first 3 notes:');
    for (const n of notes.slice(0, 3)) {
      console.log(`\n--- ${toSlug(n)} ---`);
      console.log(toMarkdown(n).slice(0, 400) + '…');
    }
    return;
  }

  // Ingest into RBrain
  let imported = 0, skipped = 0, errors = 0;
  for (const note of notes) {
    const slug    = toSlug(note);
    const content = toMarkdown(note);
    try {
      const result = await importFromContent(engine, slug, content, { noEmbed });
      if (result.status === 'imported') imported++;
      else skipped++;
    } catch (e: unknown) {
      console.error(`  Error importing ${slug}: ${e instanceof Error ? e.message : e}`);
      errors++;
    }
  }

  saveState({
    last_sync: new Date().toISOString().slice(0, 10),
    last_meeting_id: notes[notes.length - 1]?.id ?? state.last_meeting_id,
  });

  console.log(`\nGranola sync complete:`);
  console.log(`  ${imported} meetings imported`);
  console.log(`  ${skipped} meetings skipped (unchanged)`);
  if (errors) console.log(`  ${errors} errors`);
}
