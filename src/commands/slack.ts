/**
 * rbrain slack — fetch messages from Slack (channels, DMs, group DMs) and ingest into RBrain.
 *
 * Uses a User OAuth token (xoxp-) for full access including DMs.
 *
 * One-time setup:
 *   1. In your Slack app → OAuth & Permissions → User Token Scopes → add:
 *        channels:history  channels:read  groups:history  groups:read
 *        im:history  im:read  mpim:history  mpim:read  users:read
 *   2. rbrain slack --auth    (opens browser, completes OAuth, saves token)
 *
 * Usage:
 *   rbrain slack --auth                          One-time OAuth setup
 *   rbrain slack [--since YYYY-MM-DD] [--days N] [--full]
 *                [--channels #ch1,#ch2] [--no-embed] [--dry-run]
 */

import { createInterface } from 'node:readline';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { exec } from 'node:child_process';
import type { BrainEngine } from '../core/engine.ts';
import { importFromContent } from '../core/import-file.ts';

const STATE_DIR   = join(homedir(), '.rbrain');
const CONFIG_PATH = join(STATE_DIR, 'slack-config.json');
const STATE_PATH  = join(STATE_DIR, 'slack-state.json');
const SLACK_API   = 'https://slack.com/api';

const OAUTH_AUTH_URL  = 'https://slack.com/oauth/v2/authorize';
const OAUTH_TOKEN_URL = `${SLACK_API}/oauth.v2.access`;
// Slack requires HTTPS for redirect URIs — we use a manual paste flow instead
const CALLBACK_URL    = 'https://rodsalva.github.io/rbrain-oauth-callback/';

const USER_SCOPES = [
  'channels:history', 'channels:read',
  'groups:history',   'groups:read',
  'im:history',       'im:read',
  'mpim:history',     'mpim:read',
  'users:read',
].join(',');

// ── Config ────────────────────────────────────────────────────────────────────

interface SlackConfig {
  user_token?: string;        // xoxp- (preferred, full access)
  bot_token?: string;         // xoxb- (fallback, channels only)
  client_id?: string;
  client_secret?: string;
  channel_names?: string[];   // saved channel filter
}

interface SlackState {
  last_sync: string | null;
  channel_cursors: Record<string, string>;   // channel_id → last ts
}

function loadConfig(): SlackConfig {
  const cfg: SlackConfig = {};
  if (process.env.SLACK_USER_TOKEN) cfg.user_token = process.env.SLACK_USER_TOKEN;
  if (process.env.SLACK_BOT_TOKEN)  cfg.bot_token  = process.env.SLACK_BOT_TOKEN;
  if (existsSync(CONFIG_PATH)) {
    try { Object.assign(cfg, JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'))); } catch { /* corrupted */ }
  }
  return cfg;
}

function saveConfig(cfg: SlackConfig) {
  mkdirSync(STATE_DIR, { recursive: true });
  const existing = loadConfig();
  writeFileSync(CONFIG_PATH, JSON.stringify({ ...existing, ...cfg }, null, 2));
}

function loadState(): SlackState {
  if (existsSync(STATE_PATH)) {
    try { return JSON.parse(readFileSync(STATE_PATH, 'utf-8')); } catch { /* corrupted */ }
  }
  return { last_sync: null, channel_cursors: {} };
}

function saveState(state: SlackState) {
  mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(STATE_PATH, JSON.stringify({ ...state, saved_at: new Date().toISOString() }, null, 2));
}

// ── OAuth flow (manual paste — Slack requires HTTPS redirect URIs) ────────────

async function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans.trim()); }));
}

async function runAuth(clientId: string, clientSecret: string): Promise<string> {
  const state   = Math.random().toString(36).slice(2);
  const authUrl = `${OAUTH_AUTH_URL}?client_id=${clientId}&user_scope=${encodeURIComponent(USER_SCOPES)}&redirect_uri=${encodeURIComponent(CALLBACK_URL)}&state=${state}`;

  console.log('\n─────────────────────────────────────────────────');
  console.log('Step 1: Opening Slack authorization in your browser…');
  console.log('─────────────────────────────────────────────────\n');
  exec(`open "${authUrl}"`);

  console.log('Step 2: Authorize the app in your browser.');
  console.log('         After approving, you\'ll land on a page with a URL like:');
  console.log(`         ${CALLBACK_URL}?code=XXXXX&state=…\n`);
  console.log('Step 3: Copy the full URL from your browser address bar and paste it below.\n');

  const pasted = await prompt('Paste the full redirect URL here: ');

  let code: string;
  try {
    const url = new URL(pasted);
    code = url.searchParams.get('code') || '';
    const returnedState = url.searchParams.get('state') || '';
    if (!code) throw new Error('No code found in URL');
    if (returnedState !== state) throw new Error('State mismatch — please try again');
  } catch (e: unknown) {
    // Also try parsing just the code if user pasted only the code value
    if (pasted.match(/^[A-Za-z0-9._-]{10,}$/) && !pasted.startsWith('http')) {
      code = pasted;
    } else {
      throw new Error(`Could not parse URL: ${e instanceof Error ? e.message : e}`);
    }
  }

  const resp = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: CALLBACK_URL }),
  });
  const data = await resp.json() as Record<string, unknown>;
  if (!data.ok) throw new Error(`Token exchange failed: ${data.error}`);

  const authed = data.authed_user as Record<string, unknown>;
  const token  = String(authed?.access_token || '');
  if (!token.startsWith('xoxp-')) throw new Error(`Expected user token (xoxp-), got: ${token.slice(0, 10)}`);
  return token;
}

// ── Slack API helpers ─────────────────────────────────────────────────────────

interface SlackChannel {
  id: string;
  name?: string;            // undefined for DMs
  is_im?: boolean;
  is_mpim?: boolean;
  is_private?: boolean;
  num_members?: number;
  purpose?: { value: string };
  user?: string;            // DM partner user ID
}

interface SlackMessage {
  ts: string;
  text: string;
  user?: string;
  bot_id?: string;
  subtype?: string;
  thread_ts?: string;
  reply_count?: number;
  reactions?: Array<{ name: string; count: number }>;
  files?: Array<{ name?: string; title?: string }>;
}

interface SlackUser {
  id: string;
  real_name?: string;
  profile?: { display_name?: string; real_name?: string };
  is_bot?: boolean;
}

async function slackGet(token: string, method: string, params: Record<string, string> = {}): Promise<Record<string, unknown>> {
  const url = new URL(`${SLACK_API}/${method}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Slack HTTP ${res.status} on ${method}`);
  const data = await res.json() as Record<string, unknown>;
  if (!data.ok) throw new Error(`Slack API error on ${method}: ${data.error}`);
  return data;
}

async function fetchAllChannels(token: string): Promise<SlackChannel[]> {
  const all: SlackChannel[] = [];
  let cursor = '';
  do {
    const params: Record<string, string> = {
      limit: '200',
      exclude_archived: 'true',
      types: 'public_channel,private_channel,im,mpim',
    };
    if (cursor) params.cursor = cursor;
    const data = await slackGet(token, 'conversations.list', params);
    all.push(...((data.channels as SlackChannel[]) || []));
    const meta = data.response_metadata as { next_cursor?: string } | undefined;
    cursor = meta?.next_cursor || '';
  } while (cursor);
  return all;
}

async function fetchMessages(token: string, channelId: string, oldest: string): Promise<SlackMessage[]> {
  const all: SlackMessage[] = [];
  let cursor = '';
  do {
    const params: Record<string, string> = { channel: channelId, limit: '200', oldest, inclusive: 'false' };
    if (cursor) params.cursor = cursor;
    const data = await slackGet(token, 'conversations.history', params);
    all.push(...((data.messages as SlackMessage[]) || []));
    const hasMore = data.has_more as boolean;
    const meta    = data.response_metadata as { next_cursor?: string } | undefined;
    cursor = hasMore ? (meta?.next_cursor || '') : '';
  } while (cursor);
  return all;
}

async function fetchThreadReplies(token: string, channelId: string, threadTs: string): Promise<SlackMessage[]> {
  const data = await slackGet(token, 'conversations.replies', { channel: channelId, ts: threadTs, limit: '100' });
  return ((data.messages as SlackMessage[]) || []).slice(1);
}

// ── User resolution ───────────────────────────────────────────────────────────

const userCache = new Map<string, SlackUser>();

async function getUser(token: string, userId: string): Promise<SlackUser> {
  if (userCache.has(userId)) return userCache.get(userId)!;
  try {
    const data = await slackGet(token, 'users.info', { user: userId });
    const user = data.user as SlackUser;
    userCache.set(userId, user);
    return user;
  } catch {
    const fallback: SlackUser = { id: userId };
    userCache.set(userId, fallback);
    return fallback;
  }
}

async function userName(token: string, userId: string): Promise<string> {
  const u = await getUser(token, userId);
  return u.profile?.display_name || u.profile?.real_name || u.real_name || userId;
}

// ── Channel display name ──────────────────────────────────────────────────────

async function channelDisplayName(token: string, ch: SlackChannel): Promise<string> {
  if (ch.is_im && ch.user) return `dm-${await userName(token, ch.user)}`;
  if (ch.is_mpim) return ch.name || 'group-dm';
  return ch.name || ch.id;
}

// ── Formatting ─────────────────────────────────────────────────────────────────

function tsToDate(ts: string): string {
  return new Date(parseFloat(ts) * 1000).toISOString().slice(0, 10);
}
function tsToTime(ts: string): string {
  return new Date(parseFloat(ts) * 1000).toISOString().slice(11, 16);
}

async function formatMsg(token: string, msg: SlackMessage, indent = ''): Promise<string> {
  const who  = msg.user ? await userName(token, msg.user) : (msg.bot_id ? 'Bot' : '?');
  const time = tsToTime(msg.ts);
  const text = (msg.text || '')
    .replace(/<@([A-Z0-9]+)>/g, (_, uid) => `@${userCache.get(uid)?.profile?.display_name || uid}`)
    .replace(/<#[A-Z0-9]+\|([^>]+)>/g, '#$1')
    .replace(/<([^|>]+)\|([^>]+)>/g, '[$2]($1)')
    .replace(/<(https?:[^>]+)>/g, '$1');
  const reactions = msg.reactions?.map(r => `:${r.name}:×${r.count}`).join(' ') || '';
  const files = msg.files?.map(f => `📎 ${f.title || f.name || 'file'}`).join(' ') || '';
  const extras = [files, reactions].filter(Boolean).join('  ');
  return `${indent}**${who}** \`${time}\`  ${text}${extras ? '\n' + indent + '  ' + extras : ''}`;
}

function groupByDate(msgs: SlackMessage[]): Map<string, SlackMessage[]> {
  const map = new Map<string, SlackMessage[]>();
  for (const m of msgs) {
    const d = tsToDate(m.ts);
    if (!map.has(d)) map.set(d, []);
    map.get(d)!.push(m);
  }
  return map;
}

async function buildNote(
  token: string,
  ch: SlackChannel,
  displayName: string,
  date: string,
  messages: SlackMessage[],
): Promise<string> {
  const sorted  = [...messages].sort((a, b) => parseFloat(a.ts) - parseFloat(b.ts));
  const real    = sorted.filter(m => !m.subtype || m.subtype === 'thread_broadcast');
  const [year, month] = date.split('-');

  const lines: string[] = [];
  const threadsSeen = new Set<string>();

  for (const msg of real) {
    if (msg.thread_ts && msg.thread_ts !== msg.ts) continue;   // skip inline replies

    lines.push(await formatMsg(token, msg));

    if ((msg.reply_count ?? 0) > 0 && !threadsSeen.has(msg.ts)) {
      threadsSeen.add(msg.ts);
      try {
        const replies = await fetchThreadReplies(token, ch.id, msg.ts);
        for (const r of replies) lines.push(await formatMsg(token, r, '  > '));
      } catch { /* skip */ }
    }

    lines.push('');
  }

  const dateLabel = new Date(date + 'T12:00:00Z').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const type      = ch.is_im ? 'dm' : ch.is_mpim ? 'group-dm' : 'channel';
  const purpose   = (!ch.is_im && !ch.is_mpim && ch.purpose?.value) ? `\n> ${ch.purpose.value}\n` : '';

  const tags = ['slack', displayName.replace(/[^a-z0-9-]/gi, '-').toLowerCase(), `${year}-${month}`, type];

  return `---
type: note
title: "${displayName} — ${dateLabel}"
tags: [${tags.join(', ')}]
source: slack
date: ${date}
channel: ${displayName}
channel_id: ${ch.id}
channel_type: ${type}
---

# ${displayName} — ${dateLabel}
${purpose}
${lines.join('\n').trim()}
`;
}

// ── Main ───────────────────────────────────────────────────────────────────────

export async function runSlack(engine: BrainEngine, args: string[]) {

  // --set-token xoxb-... (legacy bot token, kept for compat)
  const setTokenIdx = args.indexOf('--set-token');
  if (setTokenIdx !== -1) {
    const tok = args[setTokenIdx + 1];
    if (!tok) { console.error('Usage: rbrain slack --set-token <token>'); process.exit(1); }
    const key = tok.startsWith('xoxp-') ? 'user_token' : 'bot_token';
    saveConfig({ [key]: tok });
    console.log(`Slack ${key} saved to ${CONFIG_PATH}`);
    return;
  }

  // --set-channels #eng,#all-manor
  const setChIdx = args.indexOf('--set-channels');
  if (setChIdx !== -1) {
    const names = (args[setChIdx + 1] || '').split(',').map(c => c.replace(/^#/, '').trim()).filter(Boolean);
    saveConfig({ channel_names: names });
    console.log(`Channel filter saved: ${names.map(n => '#' + n).join(', ')}`);
    return;
  }

  // --auth  — OAuth flow to get user token
  if (args.includes('--auth')) {
    const cfg = loadConfig();
    let clientId     = cfg.client_id     || process.env.SLACK_CLIENT_ID     || '';
    let clientSecret = cfg.client_secret || process.env.SLACK_CLIENT_SECRET || '';

    if (!clientId) {
      const idx = args.indexOf('--client-id');
      clientId = idx !== -1 ? args[idx + 1] : '';
    }
    if (!clientSecret) {
      const idx = args.indexOf('--client-secret');
      clientSecret = idx !== -1 ? args[idx + 1] : '';
    }

    if (!clientId || !clientSecret) {
      console.error(`
Slack OAuth requires your app's Client ID and Secret.
Find them at: https://api.slack.com/apps → Your App → Basic Information → App Credentials

Run:
  rbrain slack --auth --client-id YOUR_ID --client-secret YOUR_SECRET

Or save them first:
  rbrain slack --set-credentials --client-id YOUR_ID --client-secret YOUR_SECRET
  rbrain slack --auth
`);
      process.exit(1);
    }

    // Save credentials for future use
    saveConfig({ client_id: clientId, client_secret: clientSecret });

    console.log('\nMake sure your Slack app has these User Token Scopes:');
    console.log('  channels:history  channels:read  groups:history  groups:read');
    console.log('  im:history  im:read  mpim:history  mpim:read  users:read\n');
    console.log('And this Redirect URL in OAuth & Permissions → Redirect URLs:');
    console.log(`  ${CALLBACK_URL}\n`);

    try {
      const token = await runAuth(clientId, clientSecret);
      saveConfig({ user_token: token });
      console.log('\n✅ User token saved! Running first sync (last 7 days)…\n');
      args = args.filter(a => a !== '--auth');
      if (!args.includes('--days') && !args.includes('--since') && !args.includes('--full')) {
        args.push('--days', '7');
      }
    } catch (e: unknown) {
      console.error(`Auth failed: ${e instanceof Error ? e.message : e}`);
      process.exit(1);
    }
  }

  // --set-credentials
  if (args.includes('--set-credentials')) {
    const idIdx = args.indexOf('--client-id');
    const secIdx = args.indexOf('--client-secret');
    const clientId = idIdx !== -1 ? args[idIdx + 1] : '';
    const clientSecret = secIdx !== -1 ? args[secIdx + 1] : '';
    if (!clientId || !clientSecret) {
      console.error('Usage: rbrain slack --set-credentials --client-id ID --client-secret SECRET');
      process.exit(1);
    }
    saveConfig({ client_id: clientId, client_secret: clientSecret });
    console.log('Slack credentials saved.');
    return;
  }

  const cfg   = loadConfig();
  const token = cfg.user_token || cfg.bot_token;

  if (!token) {
    const hasCredentials = !!(cfg.client_id && cfg.client_secret);
    console.error(`
Slack token not found.

${hasCredentials
  ? 'Run: rbrain slack --auth'
  : `Steps:
  1. Go to https://api.slack.com/apps → your RBrain app
  2. OAuth & Permissions → User Token Scopes → add:
       channels:history  channels:read  groups:history  groups:read
       im:history  im:read  mpim:history  mpim:read  users:read
  3. Add Redirect URL in OAuth & Permissions → Redirect URLs:
       ${CALLBACK_URL}
  4. rbrain slack --auth --client-id YOUR_CLIENT_ID --client-secret YOUR_SECRET`}
`);
    process.exit(1);
  }

  const isUserToken = token.startsWith('xoxp-');
  const noEmbed     = args.includes('--no-embed');
  const dryRun      = args.includes('--dry-run');
  const fullSync    = args.includes('--full');
  const chanArg     = args.indexOf('--channels') !== -1 ? args[args.indexOf('--channels') + 1] : undefined;
  const filterNames = chanArg
    ? chanArg.split(',').map(c => c.replace(/^#/, '').trim())
    : cfg.channel_names;

  const sinceIdx = args.indexOf('--since');
  const sinceArg = sinceIdx !== -1 ? args[sinceIdx + 1] : undefined;
  const daysIdx  = args.indexOf('--days');
  const daysArg  = daysIdx !== -1 ? parseInt(args[daysIdx + 1], 10) : undefined;

  const state = loadState();
  let oldest: string;

  if (fullSync) {
    oldest = '0';
    console.log('Mode: FULL sync (all history)');
  } else if (sinceArg) {
    oldest = String(new Date(sinceArg + 'T00:00:00Z').getTime() / 1000);
    console.log(`Mode: SINCE ${sinceArg}`);
  } else if (daysArg) {
    const d = new Date(); d.setDate(d.getDate() - daysArg);
    oldest = String(d.getTime() / 1000);
    console.log(`Mode: LAST ${daysArg} days`);
  } else if (state.last_sync) {
    oldest = String(new Date(state.last_sync + 'T00:00:00Z').getTime() / 1000);
    console.log(`Mode: INCREMENTAL — since ${state.last_sync}`);
  } else {
    const d = new Date(); d.setDate(d.getDate() - 7);
    oldest = String(d.getTime() / 1000);
    console.log('Mode: FIRST RUN — last 7 days (use --full for all history)');
  }

  // Fetch channels
  console.log('Fetching conversations…');
  let channels: SlackChannel[];
  try {
    const all = await fetchAllChannels(token);
    channels = isUserToken
      ? all   // user token: all conversations (channels + DMs + group DMs)
      : all.filter(c => !c.is_im && !c.is_mpim);  // bot token: channels only
  } catch (e: unknown) {
    console.error(`Failed: ${e instanceof Error ? e.message : e}`);
    process.exit(1);
  }

  // Apply name filter (only applies to named channels, DMs always included if user token)
  if (filterNames?.length) {
    channels = channels.filter(c => c.is_im || c.is_mpim || (c.name && filterNames.includes(c.name)));
  }

  // Resolve display names
  const channelNames = new Map<string, string>();
  for (const ch of channels) {
    channelNames.set(ch.id, await channelDisplayName(token, ch));
  }

  const types = {
    channels: channels.filter(c => !c.is_im && !c.is_mpim).length,
    dms:      channels.filter(c => c.is_im).length,
    groupDms: channels.filter(c => c.is_mpim).length,
  };
  console.log(`Found ${channels.length} conversations (${types.channels} channels, ${types.dms} DMs, ${types.groupDms} group DMs)`);

  let totalImported = 0, totalSkipped = 0, totalErrors = 0;
  const newCursors: Record<string, string> = { ...state.channel_cursors };

  for (const ch of channels) {
    const displayName = channelNames.get(ch.id)!;
    const channelOldest = state.channel_cursors[ch.id] || oldest;
    process.stdout.write(`  ${displayName}… `);

    let messages: SlackMessage[];
    try {
      messages = await fetchMessages(token, ch.id, channelOldest);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('not_in_channel') || msg.includes('channel_not_found') || msg.includes('missing_scope')) {
        console.log(`(skipped: ${msg.includes('missing_scope') ? 'missing scope' : 'not in channel'})`);
        continue;
      }
      console.log(`ERROR: ${msg}`);
      totalErrors++;
      continue;
    }

    if (messages.length === 0) { console.log('no new messages'); continue; }
    console.log(`${messages.length} messages`);

    const latestTs = messages.reduce((max, m) => (m.ts > max ? m.ts : max), '0');
    if (latestTs !== '0') newCursors[ch.id] = latestTs;

    const byDate = groupByDate(messages);
    for (const [date, dayMsgs] of byDate.entries()) {
      const slug = `slack/${date}/${displayName.replace(/[^a-z0-9-]/gi, '-').toLowerCase()}`;

      if (dryRun) {
        console.log(`    [dry-run] ${slug} (${dayMsgs.length} msgs)`);
        continue;
      }

      let content: string;
      try {
        content = await buildNote(token, ch, displayName, date, dayMsgs);
      } catch (e: unknown) {
        console.error(`    Error building ${slug}: ${e instanceof Error ? e.message : e}`);
        totalErrors++;
        continue;
      }

      try {
        const result = await importFromContent(engine, slug, content, { noEmbed });
        if (result.status === 'imported') totalImported++;
        else totalSkipped++;
      } catch (e: unknown) {
        console.error(`    Error importing ${slug}: ${e instanceof Error ? e.message : e}`);
        totalErrors++;
      }
    }
  }

  if (!dryRun) {
    saveState({ last_sync: new Date().toISOString().slice(0, 10), channel_cursors: newCursors });
  }

  console.log(`\nSlack sync complete:`);
  console.log(`  ${totalImported} notes imported`);
  console.log(`  ${totalSkipped} notes skipped (unchanged)`);
  if (totalErrors) console.log(`  ${totalErrors} errors`);
}
