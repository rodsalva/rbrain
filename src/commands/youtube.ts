/**
 * rbrain youtube — ingest YouTube video transcripts into RBrain as strategic signal.
 *
 * Three modes:
 *   1. Ad-hoc: rbrain youtube <url>
 *   2. Watchlist poll: rbrain youtube --watch
 *        - channels (e.g. a16z, Sequoia, 20VC, YC): latest N videos, filter by views/recency
 *        - people (e.g. Max Junestrand, Winston Weinberg): search "<name> interview" last 30 days
 *        - searches (e.g. "Harvey AI interview"): free-form queries
 *   3. Config management: --init-config / --add-person / --add-channel / --list
 *
 * Watchlist modes (channels/people/searches) require YOUTUBE_API_KEY env var.
 * Ad-hoc URL mode works without API key (transcript + HTML scrape).
 *
 * State:  ~/.rbrain/youtube-state.json  (seen video IDs per source)
 * Config: ~/.rbrain/youtube-watchlist.json
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { YoutubeTranscript } from 'youtube-transcript';
import type { BrainEngine } from '../core/engine.ts';
import { importFromContent } from '../core/import-file.ts';

const STATE_DIR   = join(homedir(), '.rbrain');
const CONFIG_PATH = join(STATE_DIR, 'youtube-watchlist.json');
const STATE_PATH  = join(STATE_DIR, 'youtube-state.json');

const YT_API_BASE  = 'https://www.googleapis.com/youtube/v3';
const YT_SEARCH    = `${YT_API_BASE}/search`;
const YT_VIDEOS    = `${YT_API_BASE}/videos`;
const YT_CHANNELS  = `${YT_API_BASE}/channels`;

const DEFAULT_KEYWORDS = [
  'legaltech', 'legal tech', 'legal AI', 'lawyer AI',
  'tax', 'compliance',
  'vertical AI', 'enterprise AI', 'agentic',
  'founder', 'GTM', 'product strategy',
  'AI startup', 'SaaS',
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface WatchlistChannel {
  id: string;           // YouTube channel ID (starts with UC)
  name: string;         // display name
  min_views?: number;   // skip videos below this view count
  max_age_days?: number; // skip videos older than this
}

interface WatchlistPerson {
  name: string;
  keywords?: string[];  // additional filter terms
  max_age_days?: number;
}

interface WatchlistSearch {
  query: string;
  max_age_days?: number;
}

interface YoutubeWatchlist {
  channels?: WatchlistChannel[];
  people?: WatchlistPerson[];
  searches?: WatchlistSearch[];
  keywords?: string[];  // global content filter (applied to title/description)
}

interface YoutubeState {
  last_sync: string | null;
  seen_video_ids: string[];
}

interface VideoMeta {
  id: string;
  title: string;
  channel: string;
  channel_id?: string;
  published_at: string;  // YYYY-MM-DD
  view_count?: number;
  description?: string;
  featured_person?: string;
  source_mode: 'ad-hoc' | 'channel' | 'person' | 'search';
  source_query?: string;
}

// ── Config + state I/O ────────────────────────────────────────────────────────

function loadWatchlist(): YoutubeWatchlist {
  if (existsSync(CONFIG_PATH)) {
    try { return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8')); } catch { /* corrupted */ }
  }
  return {};
}

function saveWatchlist(wl: YoutubeWatchlist) {
  mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(wl, null, 2));
}

function loadState(): YoutubeState {
  if (existsSync(STATE_PATH)) {
    try { return JSON.parse(readFileSync(STATE_PATH, 'utf-8')); } catch { /* corrupted */ }
  }
  return { last_sync: null, seen_video_ids: [] };
}

function saveState(s: YoutubeState) {
  mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(STATE_PATH, JSON.stringify(s, null, 2));
}

function defaultWatchlist(): YoutubeWatchlist {
  return {
    channels: [
      // IMPORTANT: replace id with real UC... from YouTube. Names are hints.
      { id: 'UCKWaEZ-_VweaEx1j62do_vQ', name: 'a16z', min_views: 50_000, max_age_days: 14 },
      { id: 'UCLtTf_uKt0Itd0NG7txrwXA', name: 'Sequoia Capital', min_views: 30_000, max_age_days: 14 },
      { id: 'UCGVO5Z6W1fBHEoiEqjlr2HA', name: '20VC', min_views: 20_000, max_age_days: 14 },
      { id: 'UCcefcZRL2oaA_uBNeo5UOWg', name: 'Y Combinator', min_views: 20_000, max_age_days: 14 },
    ],
    people: [
      { name: 'Max Junestrand', keywords: ['Legora', 'legaltech'], max_age_days: 30 },
      { name: 'Winston Weinberg', keywords: ['Harvey', 'legal AI'], max_age_days: 30 },
      { name: 'Gabe Pereyra', keywords: ['Harvey', 'legal AI'], max_age_days: 30 },
    ],
    searches: [
      { query: 'Legora interview', max_age_days: 30 },
      { query: 'Harvey AI interview', max_age_days: 30 },
    ],
    keywords: DEFAULT_KEYWORDS,
  };
}

// ── URL + metadata ────────────────────────────────────────────────────────────

function extractVideoId(url: string): string | null {
  // Supports: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/shorts/ID, /embed/ID
  const m =
    url.match(/[?&]v=([a-zA-Z0-9_-]{11})/) ||
    url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/) ||
    url.match(/\/shorts\/([a-zA-Z0-9_-]{11})/) ||
    url.match(/\/embed\/([a-zA-Z0-9_-]{11})/) ||
    url.match(/^([a-zA-Z0-9_-]{11})$/);
  return m ? m[1] : null;
}

/** Scrape video page HTML for metadata when no API key is available. */
async function scrapeVideoMeta(videoId: string): Promise<Partial<VideoMeta>> {
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36' },
  });
  if (!res.ok) throw new Error(`Failed to fetch video page: ${res.status}`);
  const html = await res.text();

  const titleMatch  = html.match(/<meta property="og:title" content="([^"]+)"/);
  const channelM    = html.match(/"ownerChannelName":"([^"]+)"/) || html.match(/"author":"([^"]+)"/);
  const channelIdM  = html.match(/"externalChannelId":"(UC[^"]+)"/) || html.match(/"channelId":"(UC[^"]+)"/);
  const publishedM  = html.match(/"publishDate":"([0-9-]{10})/) || html.match(/"uploadDate":"([0-9-]{10})/);
  const viewsM      = html.match(/"viewCount":"(\d+)"/) || html.match(/"viewCount":{"simpleText":"([\d,]+)/);
  const descM       = html.match(/<meta property="og:description" content="([^"]+)"/);

  return {
    id: videoId,
    title:       titleMatch?.[1] ? decodeEntities(titleMatch[1]) : `Video ${videoId}`,
    channel:     channelM?.[1] || 'Unknown',
    channel_id:  channelIdM?.[1],
    published_at: publishedM?.[1] || new Date().toISOString().slice(0, 10),
    view_count:  viewsM?.[1] ? parseInt(viewsM[1].replace(/,/g, ''), 10) : undefined,
    description: descM?.[1] ? decodeEntities(descM[1]) : undefined,
  };
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\\u0026/g, '&');
}

// ── Transcript ────────────────────────────────────────────────────────────────

async function fetchTranscript(videoId: string): Promise<string> {
  try {
    const segments = await YoutubeTranscript.fetchTranscript(videoId);
    return segments.map(s => s.text).join(' ');
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // Common failures: no captions, region block, video unavailable
    throw new Error(`Transcript unavailable: ${msg}`);
  }
}

// ── Markdown generation ───────────────────────────────────────────────────────

function toSlug(meta: VideoMeta): string {
  const channelSlug = meta.channel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30);
  return `youtube/${meta.published_at}/${channelSlug}-${meta.id}`;
}

function toMarkdown(meta: VideoMeta, transcript: string): string {
  const url = `https://www.youtube.com/watch?v=${meta.id}`;

  const tags = [
    'youtube', 'source-external',
    `source:youtube-${meta.channel.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}`,
  ];
  if (meta.featured_person) {
    tags.push(`source:youtube-person-${meta.featured_person.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}`);
  }

  const fm = [
    '---',
    'type: source',
    `title: "${meta.title.replace(/"/g, "'")}"`,
    `tags: [${tags.join(', ')}]`,
    'source: youtube',
    `source_type: youtube`,
    `channel: "${meta.channel.replace(/"/g, "'")}"`,
    meta.channel_id ? `channel_id: ${meta.channel_id}` : null,
    `url: ${url}`,
    `published_at: ${meta.published_at}`,
    meta.view_count !== undefined ? `view_count: ${meta.view_count}` : null,
    meta.featured_person ? `featured_person: "${meta.featured_person}"` : null,
    `source_mode: ${meta.source_mode}`,
    meta.source_query ? `source_query: "${meta.source_query.replace(/"/g, "'")}"` : null,
    'domain: strategy',
    '---',
    '',
    `# ${meta.title}`,
    '',
    `**Channel:** ${meta.channel}  `,
    `**Published:** ${meta.published_at}  `,
    meta.view_count !== undefined ? `**Views:** ${meta.view_count.toLocaleString()}  ` : null,
    `**URL:** ${url}`,
    '',
  ].filter(Boolean).join('\n');

  const desc = meta.description?.trim() ? `\n## Description\n\n${meta.description.trim()}\n` : '';
  const tx = transcript.trim();
  const truncated = tx.length > 40_000 ? tx.slice(0, 40_000) + '\n\n*[transcript truncated]*' : tx;
  const txSection = tx ? `\n## Transcript\n\n${truncated}\n` : '\n## Transcript\n\n*[unavailable]*\n';

  return fm + desc + txSection;
}

// ── Content filter ────────────────────────────────────────────────────────────

function matchesKeywords(text: string, keywords: string[]): boolean {
  if (!keywords || keywords.length === 0) return true;
  const lower = text.toLowerCase();
  return keywords.some(k => lower.includes(k.toLowerCase()));
}

// ── YouTube Data API (watchlist modes) ────────────────────────────────────────

async function ytApi(url: string, params: Record<string, string>, apiKey: string): Promise<any> {
  const qs = new URLSearchParams({ ...params, key: apiKey });
  const res = await fetch(`${url}?${qs.toString()}`);
  if (!res.ok) throw new Error(`YouTube API ${res.status}: ${await res.text().catch(() => '')}`);
  return res.json();
}

async function searchVideos(query: string, maxAgeDays: number, apiKey: string): Promise<string[]> {
  const publishedAfter = new Date(Date.now() - maxAgeDays * 86_400_000).toISOString();
  const data = await ytApi(YT_SEARCH, {
    q: query, part: 'id', type: 'video', order: 'relevance', maxResults: '10', publishedAfter,
  }, apiKey);
  return (data.items ?? []).map((it: any) => it.id?.videoId).filter(Boolean);
}

async function channelRecentVideos(channelId: string, maxAgeDays: number, apiKey: string): Promise<string[]> {
  const publishedAfter = new Date(Date.now() - maxAgeDays * 86_400_000).toISOString();
  const data = await ytApi(YT_SEARCH, {
    channelId, part: 'id', type: 'video', order: 'date', maxResults: '10', publishedAfter,
  }, apiKey);
  return (data.items ?? []).map((it: any) => it.id?.videoId).filter(Boolean);
}

async function videoDetails(videoIds: string[], apiKey: string): Promise<Record<string, VideoMeta>> {
  if (videoIds.length === 0) return {};
  const data = await ytApi(YT_VIDEOS, {
    id: videoIds.join(','), part: 'snippet,statistics',
  }, apiKey);
  const out: Record<string, VideoMeta> = {};
  for (const it of (data.items ?? []) as any[]) {
    out[it.id] = {
      id: it.id,
      title: it.snippet?.title ?? `Video ${it.id}`,
      channel: it.snippet?.channelTitle ?? 'Unknown',
      channel_id: it.snippet?.channelId,
      published_at: (it.snippet?.publishedAt ?? new Date().toISOString()).slice(0, 10),
      view_count: it.statistics?.viewCount ? parseInt(it.statistics.viewCount, 10) : undefined,
      description: it.snippet?.description,
      source_mode: 'ad-hoc', // overwritten by caller
    };
  }
  return out;
}

// ── Ingestion ─────────────────────────────────────────────────────────────────

async function ingestVideo(
  engine: BrainEngine,
  meta: VideoMeta,
  opts: { noEmbed: boolean; dryRun: boolean },
): Promise<boolean> {
  let transcript = '';
  try {
    transcript = await fetchTranscript(meta.id);
  } catch (e) {
    console.log(`  ⚠ ${meta.id} — ${e instanceof Error ? e.message : String(e)}`);
  }

  const slug = toSlug(meta);
  const md = toMarkdown(meta, transcript);

  if (opts.dryRun) {
    console.log(`  [dry-run] would ingest ${slug} (${transcript.length} chars transcript)`);
    return true;
  }

  try {
    await importFromContent(engine, {
      slug,
      content: md,
      skipEmbedding: opts.noEmbed,
    });
    console.log(`  ✓ ${slug}${transcript ? ` (${transcript.length} chars)` : ' (no transcript)'}`);
    return true;
  } catch (e) {
    console.log(`  ✗ ${slug} — ${e instanceof Error ? e.message : String(e)}`);
    return false;
  }
}

// ── Watch mode (polls watchlist) ──────────────────────────────────────────────

async function runWatch(
  engine: BrainEngine,
  opts: { noEmbed: boolean; dryRun: boolean; limit: number },
): Promise<void> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.error('YOUTUBE_API_KEY not set. Watch mode needs it for search/channel queries.');
    console.error('Get one at https://console.cloud.google.com → Enable YouTube Data API v3.');
    console.error('Ad-hoc URL mode works without: rbrain youtube <url>');
    process.exit(1);
  }

  const wl = loadWatchlist();
  const state = loadState();
  const seen = new Set(state.seen_video_ids);
  const globalKw = wl.keywords ?? DEFAULT_KEYWORDS;

  const candidates: Array<{ id: string; mode: VideoMeta['source_mode']; query?: string; person?: string }> = [];

  // Collect candidate video IDs
  for (const ch of wl.channels ?? []) {
    try {
      const ids = await channelRecentVideos(ch.id, ch.max_age_days ?? 14, apiKey);
      for (const id of ids) candidates.push({ id, mode: 'channel', query: ch.name });
    } catch (e) {
      console.log(`  ⚠ channel ${ch.name}: ${e instanceof Error ? e.message : e}`);
    }
  }

  for (const p of wl.people ?? []) {
    const q = `${p.name} interview`;
    try {
      const ids = await searchVideos(q, p.max_age_days ?? 30, apiKey);
      for (const id of ids) candidates.push({ id, mode: 'person', query: q, person: p.name });
    } catch (e) {
      console.log(`  ⚠ person ${p.name}: ${e instanceof Error ? e.message : e}`);
    }
  }

  for (const s of wl.searches ?? []) {
    try {
      const ids = await searchVideos(s.query, s.max_age_days ?? 30, apiKey);
      for (const id of ids) candidates.push({ id, mode: 'search', query: s.query });
    } catch (e) {
      console.log(`  ⚠ search "${s.query}": ${e instanceof Error ? e.message : e}`);
    }
  }

  // Dedupe + filter seen
  const uniqueIds = Array.from(new Set(candidates.map(c => c.id))).filter(id => !seen.has(id));
  const byId = new Map(candidates.map(c => [c.id, c] as const));
  console.log(`Found ${uniqueIds.length} new candidate videos`);

  if (uniqueIds.length === 0) return;

  // Fetch details in batch (50 per call max)
  const allMeta: Record<string, VideoMeta> = {};
  for (let i = 0; i < uniqueIds.length; i += 50) {
    const batch = uniqueIds.slice(i, i + 50);
    Object.assign(allMeta, await videoDetails(batch, apiKey));
  }

  let ingested = 0;
  for (const id of uniqueIds.slice(0, opts.limit)) {
    const meta = allMeta[id];
    if (!meta) continue;
    const cand = byId.get(id)!;
    meta.source_mode = cand.mode;
    meta.source_query = cand.query;
    if (cand.person) meta.featured_person = cand.person;

    // Channel min_views filter
    if (cand.mode === 'channel') {
      const chCfg = (wl.channels ?? []).find(c => c.name === cand.query);
      if (chCfg?.min_views && meta.view_count !== undefined && meta.view_count < chCfg.min_views) {
        continue;
      }
    }

    // Keyword filter
    const haystack = `${meta.title} ${meta.description ?? ''}`;
    if (!matchesKeywords(haystack, globalKw)) continue;

    const ok = await ingestVideo(engine, meta, opts);
    if (ok) {
      ingested++;
      seen.add(id);
    }
  }

  // Persist state
  state.seen_video_ids = Array.from(seen).slice(-5000); // cap memory
  state.last_sync = new Date().toISOString();
  saveState(state);

  console.log(`\nIngested ${ingested} / ${uniqueIds.length} candidates`);
}

// ── Config management ─────────────────────────────────────────────────────────

function cmdInitConfig(): void {
  if (existsSync(CONFIG_PATH)) {
    console.log(`Config exists at ${CONFIG_PATH}. Remove it first if you want to reset.`);
    return;
  }
  saveWatchlist(defaultWatchlist());
  console.log(`Wrote default watchlist to ${CONFIG_PATH}`);
  console.log('Review and edit channel IDs (the defaults are best-effort guesses).');
}

function cmdList(): void {
  const wl = loadWatchlist();
  console.log(`Watchlist: ${CONFIG_PATH}`);
  console.log(`  Channels: ${wl.channels?.length ?? 0}`);
  (wl.channels ?? []).forEach(c => console.log(`    - ${c.name} (${c.id})`));
  console.log(`  People:   ${wl.people?.length ?? 0}`);
  (wl.people ?? []).forEach(p => console.log(`    - ${p.name}`));
  console.log(`  Searches: ${wl.searches?.length ?? 0}`);
  (wl.searches ?? []).forEach(s => console.log(`    - "${s.query}"`));
  console.log(`  Keywords: ${(wl.keywords ?? DEFAULT_KEYWORDS).length}`);
}

function cmdAddPerson(name: string, keywordsCsv?: string): void {
  const wl = loadWatchlist();
  wl.people = wl.people ?? [];
  if (wl.people.some(p => p.name.toLowerCase() === name.toLowerCase())) {
    console.log(`Already in watchlist: ${name}`);
    return;
  }
  wl.people.push({
    name,
    keywords: keywordsCsv ? keywordsCsv.split(',').map(s => s.trim()) : undefined,
    max_age_days: 30,
  });
  saveWatchlist(wl);
  console.log(`Added person: ${name}`);
}

function cmdAddChannel(id: string, name: string): void {
  const wl = loadWatchlist();
  wl.channels = wl.channels ?? [];
  if (wl.channels.some(c => c.id === id)) {
    console.log(`Already in watchlist: ${id}`);
    return;
  }
  wl.channels.push({ id, name, max_age_days: 14 });
  saveWatchlist(wl);
  console.log(`Added channel: ${name} (${id})`);
}

// ── Main dispatch ─────────────────────────────────────────────────────────────

export async function runYoutube(engine: BrainEngine, args: string[]): Promise<void> {
  const noEmbed = args.includes('--no-embed');
  const dryRun  = args.includes('--dry-run');
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : 20;

  // Config commands (don't need engine)
  if (args.includes('--init-config')) { cmdInitConfig(); return; }
  if (args.includes('--list'))        { cmdList(); return; }

  const addPersonIdx = args.indexOf('--add-person');
  if (addPersonIdx !== -1) {
    const name = args[addPersonIdx + 1];
    const kwIdx = args.indexOf('--keywords');
    const kw = kwIdx !== -1 ? args[kwIdx + 1] : undefined;
    if (!name) { console.error('Usage: rbrain youtube --add-person <name> [--keywords kw1,kw2]'); process.exit(1); }
    cmdAddPerson(name, kw);
    return;
  }

  const addChIdx = args.indexOf('--add-channel');
  if (addChIdx !== -1) {
    const id = args[addChIdx + 1];
    const nameIdx = args.indexOf('--name');
    const name = nameIdx !== -1 ? args[nameIdx + 1] : undefined;
    if (!id || !name) { console.error('Usage: rbrain youtube --add-channel <UC...> --name <display-name>'); process.exit(1); }
    cmdAddChannel(id, name);
    return;
  }

  // Watch mode
  if (args.includes('--watch')) {
    await runWatch(engine, { noEmbed, dryRun, limit });
    return;
  }

  // Ad-hoc URL mode — first non-flag arg
  const url = args.find(a => !a.startsWith('-'));
  if (!url) {
    console.error('Usage:');
    console.error('  rbrain youtube <url>              Ingest one video');
    console.error('  rbrain youtube --watch            Poll watchlist (needs YOUTUBE_API_KEY)');
    console.error('  rbrain youtube --init-config      Write default watchlist');
    console.error('  rbrain youtube --list             Show current watchlist');
    console.error('  rbrain youtube --add-person <n> [--keywords k1,k2]');
    console.error('  rbrain youtube --add-channel <UC...> --name <n>');
    process.exit(1);
  }

  const videoId = extractVideoId(url);
  if (!videoId) {
    console.error(`Cannot extract video ID from: ${url}`);
    process.exit(1);
  }

  console.log(`Fetching ${videoId}…`);
  const partial = await scrapeVideoMeta(videoId);
  const meta: VideoMeta = {
    id: videoId,
    title: partial.title ?? `Video ${videoId}`,
    channel: partial.channel ?? 'Unknown',
    channel_id: partial.channel_id,
    published_at: partial.published_at ?? new Date().toISOString().slice(0, 10),
    view_count: partial.view_count,
    description: partial.description,
    source_mode: 'ad-hoc',
  };

  await ingestVideo(engine, meta, { noEmbed, dryRun });
}
