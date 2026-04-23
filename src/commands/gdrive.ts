/**
 * rbrain gdrive — fetch Google Docs/Drive files and ingest into RBrain.
 *
 * OAuth2 flow with Drive scope. First run auto-opens browser for one-time auth.
 * Every subsequent run refreshes the access token silently — no browser needed.
 *
 * Token stored at:       ~/.rbrain/gdrive-token.json
 * Credentials read from: ~/.config/gcloud/application_default_credentials.json
 *
 * Usage:
 *   rbrain gdrive [--since YYYY-MM-DD] [--days N] [--no-embed] [--dry-run]
 *   rbrain gdrive --auth          Force re-authentication
 *   rbrain gdrive --full          Sync all files (no date filter)
 */

import { createServer } from 'node:http';
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { exec } from 'node:child_process';
import type { BrainEngine } from '../core/engine.ts';
import { importFromContent } from '../core/import-file.ts';

const STATE_DIR   = join(homedir(), '.rbrain');
const TOKEN_PATH  = join(STATE_DIR, 'gdrive-token.json');
const STATE_PATH  = join(STATE_DIR, 'gdrive-state.json');
const CREDS_PATH  = join(STATE_DIR, 'gdrive-credentials.json');

const TOKEN_URL  = 'https://oauth2.googleapis.com/token';
const AUTH_URL   = 'https://accounts.google.com/o/oauth2/v2/auth';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.readonly';

// ── Types ─────────────────────────────────────────────────────────────────────

interface OAuthCreds {
  client_id: string;
  client_secret: string;
}

interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number; // unix timestamp ms
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  createdTime: string;
  webViewLink?: string;
}

interface GDriveState {
  last_sync: string | null;
}

// ── Credentials ───────────────────────────────────────────────────────────────

function loadCreds(): OAuthCreds {
  if (!existsSync(CREDS_PATH)) {
    throw new Error(
      `Google OAuth credentials not found.\n\n` +
      `One-time setup (2 minutes):\n` +
      `  1. Go to: https://console.cloud.google.com/apis/credentials\n` +
      `  2. Create project (if needed) → Enable Drive API\n` +
      `     https://console.cloud.google.com/apis/library/drive.googleapis.com\n` +
      `  3. Credentials → Create → OAuth client ID → Desktop app\n` +
      `  4. Copy client ID and secret, then run:\n` +
      `     rbrain gdrive --set-creds CLIENT_ID CLIENT_SECRET\n`
    );
  }
  const creds = JSON.parse(readFileSync(CREDS_PATH, 'utf-8')) as Record<string, string>;
  if (!creds.client_id || !creds.client_secret) {
    throw new Error(`${CREDS_PATH} is missing client_id or client_secret.`);
  }
  return { client_id: creds.client_id, client_secret: creds.client_secret };
}

function saveCreds(creds: OAuthCreds) {
  mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(CREDS_PATH, JSON.stringify(creds, null, 2), { mode: 0o600 });
  console.log(`Credentials saved to ${CREDS_PATH}`);
}

// ── Token management ──────────────────────────────────────────────────────────

function loadToken(): TokenData | null {
  if (!existsSync(TOKEN_PATH)) return null;
  try {
    return JSON.parse(readFileSync(TOKEN_PATH, 'utf-8')) as TokenData;
  } catch { return null; }
}

function saveToken(token: TokenData) {
  mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2), { mode: 0o600 });
}

async function refreshToken(creds: OAuthCreds, refreshToken: string): Promise<TokenData> {
  const resp = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: creds.client_id,
      client_secret: creds.client_secret,
    }).toString(),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Token refresh failed (${resp.status}): ${text}`);
  }

  const data = await resp.json() as {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
  };

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token || refreshToken,
    expires_at: Date.now() + (data.expires_in - 60) * 1000,
  };
}

async function runAuthFlow(creds: OAuthCreds): Promise<TokenData> {
  const port = 9876;
  const redirectUri = `http://localhost:${port}`;

  const authUrl = new URL(AUTH_URL);
  authUrl.searchParams.set('client_id', creds.client_id);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', DRIVE_SCOPE);
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent'); // ensures refresh_token is returned

  console.log('\nOpening browser for Google Drive authorization...');
  console.log('(This only happens once. Future runs refresh silently.)\n');

  const code = await new Promise<string>((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url!, `http://localhost:${port}`);
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');

      if (code) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(
          '<html><body style="font-family:sans-serif;padding:40px">' +
          '<h2>✓ Authorization successful!</h2>' +
          '<p>You can close this tab and return to your terminal.</p>' +
          '</body></html>'
        );
        server.close();
        resolve(code);
      } else {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end(
          `<html><body style="font-family:sans-serif;padding:40px">` +
          `<h2>✗ Authorization failed</h2><p>${error}</p></body></html>`
        );
        server.close();
        reject(new Error(`Auth denied: ${error}`));
      }
    });

    server.listen(port, () => {
      exec(`open "${authUrl.toString()}"`, (err) => {
        if (err) {
          console.log('Could not open browser automatically. Open this URL manually:');
          console.log(authUrl.toString());
        }
      });
      console.log(`Waiting for authorization... (timeout: 3 minutes)`);
    });

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        reject(new Error(
          `Port ${port} is in use. Stop any process on that port and retry.`
        ));
      } else {
        reject(err);
      }
    });

    setTimeout(() => {
      server.close();
      reject(new Error('Auth timed out (3 minutes). Run: rbrain gdrive --auth'));
    }, 180_000);
  });

  // Exchange auth code for tokens
  const resp = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: creds.client_id,
      client_secret: creds.client_secret,
    }).toString(),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Token exchange failed (${resp.status}): ${text}`);
  }

  const data = await resp.json() as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  if (!data.refresh_token) {
    throw new Error(
      'Google did not return a refresh_token.\n' +
      'Revoke access at https://myaccount.google.com/permissions and run: rbrain gdrive --auth'
    );
  }

  const token: TokenData = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + (data.expires_in - 60) * 1000,
  };

  saveToken(token);
  console.log('Authorization complete. Token saved permanently.\n');
  return token;
}

async function getValidToken(creds: OAuthCreds, forceAuth: boolean): Promise<string> {
  if (forceAuth) {
    if (existsSync(TOKEN_PATH)) {
      unlinkSync(TOKEN_PATH);
      console.log('Cleared stored token. Re-authenticating...');
    }
    const token = await runAuthFlow(creds);
    return token.access_token;
  }

  const stored = loadToken();

  // Still valid
  if (stored && Date.now() < stored.expires_at) {
    return stored.access_token;
  }

  // Expired but have refresh token — try silent refresh
  if (stored?.refresh_token) {
    try {
      const refreshed = await refreshToken(creds, stored.refresh_token);
      saveToken(refreshed);
      return refreshed.access_token;
    } catch {
      console.log('Silent refresh failed. Opening browser for re-authentication...');
    }
  }

  // Full auth flow needed
  const token = await runAuthFlow(creds);
  return token.access_token;
}

// ── State ─────────────────────────────────────────────────────────────────────

function loadState(): GDriveState {
  if (existsSync(STATE_PATH)) {
    try { return JSON.parse(readFileSync(STATE_PATH, 'utf-8')) as GDriveState; }
    catch { /* corrupted */ }
  }
  return { last_sync: null };
}

function saveState(state: GDriveState) {
  mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(STATE_PATH, JSON.stringify({ ...state, saved_at: new Date().toISOString() }, null, 2));
}

// ── Drive API ─────────────────────────────────────────────────────────────────

// Google Workspace types → export MIME
const EXPORT_AS: Record<string, string> = {
  'application/vnd.google-apps.document':     'text/plain',
  'application/vnd.google-apps.spreadsheet':  'text/csv',
  'application/vnd.google-apps.presentation': 'text/plain',
};

// Native text types we can download directly
const DOWNLOADABLE = new Set([
  'text/plain', 'text/markdown', 'text/html', 'text/csv',
  'application/json', 'application/xml', 'text/xml',
]);

async function listDriveFiles(
  accessToken: string,
  since: string,
  pageToken?: string
): Promise<{ files: DriveFile[]; nextPageToken?: string }> {
  const params = new URLSearchParams({
    q: `modifiedTime > '${since}' and trashed = false`,
    pageSize: '100',
    fields: 'nextPageToken,files(id,name,mimeType,modifiedTime,createdTime,webViewLink)',
    orderBy: 'modifiedTime desc',
  });
  if (pageToken) params.set('pageToken', pageToken);

  const resp = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (resp.status === 401) {
    throw new Error('Access token expired mid-sync. Run again to refresh.');
  }
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Drive list error (${resp.status}): ${text}`);
  }

  return resp.json() as Promise<{ files: DriveFile[]; nextPageToken?: string }>;
}

async function fetchContent(accessToken: string, file: DriveFile): Promise<string | null> {
  const exportMime = EXPORT_AS[file.mimeType];

  if (exportMime) {
    const resp = await fetch(
      `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=${encodeURIComponent(exportMime)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!resp.ok) return null;
    return resp.text();
  }

  if (DOWNLOADABLE.has(file.mimeType)) {
    const resp = await fetch(
      `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!resp.ok) return null;
    return resp.text();
  }

  return null; // binary / unsupported
}

// ── Formatting ────────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<string, string> = {
  'application/vnd.google-apps.document':     'Google Doc',
  'application/vnd.google-apps.spreadsheet':  'Google Sheet',
  'application/vnd.google-apps.presentation': 'Google Slides',
};

function toSlug(file: DriveFile): string {
  const date = file.modifiedTime.slice(0, 10);
  const safeName = file.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
  const shortId = file.id.slice(0, 8);
  return `gdrive/${date}/${safeName}-${shortId}`;
}

function toMarkdown(file: DriveFile, content: string): string {
  const typeLabel = TYPE_LABEL[file.mimeType] || 'File';
  const date = file.modifiedTime.slice(0, 10);
  const urlLine = file.webViewLink ? `url: "${file.webViewLink}"\n` : '';

  // Truncate very large files
  const body = content.length > 40_000
    ? content.slice(0, 40_000) + '\n\n*[content truncated — file too large]*'
    : content;

  return `---
type: source
title: "${file.name.replace(/"/g, "'")}"
tags: [gdrive, google-docs]
source: gdrive
date: ${date}
file_id: ${file.id}
file_type: ${typeLabel}
${urlLine}---

# ${file.name}

**Type:** ${typeLabel}
**Modified:** ${date}
${file.webViewLink ? `**Link:** ${file.webViewLink}` : ''}

---

${body.trim()}
`;
}

// ── Main ──────────────────────────────────────────────────────────────────────

export async function runGdrive(engine: BrainEngine, args: string[]) {
  // Handle --set-creds CLIENT_ID CLIENT_SECRET (no DB needed)
  const setCredsIdx = args.indexOf('--set-creds');
  if (setCredsIdx !== -1) {
    const clientId     = args[setCredsIdx + 1];
    const clientSecret = args[setCredsIdx + 2];
    if (!clientId || !clientSecret) {
      console.error('Usage: rbrain gdrive --set-creds CLIENT_ID CLIENT_SECRET');
      process.exit(1);
    }
    saveCreds({ client_id: clientId, client_secret: clientSecret });
    // Clear any existing token so auth re-runs with new creds
    if (existsSync(TOKEN_PATH)) unlinkSync(TOKEN_PATH);
    console.log('Done. Run: rbrain gdrive --days 10');
    return;
  }

  const noEmbed   = args.includes('--no-embed');
  const dryRun    = args.includes('--dry-run');
  const forceAuth = args.includes('--auth');
  const fullSync  = args.includes('--full');

  const sinceIdx = args.indexOf('--since');
  const daysIdx  = args.indexOf('--days');

  // Determine the cutoff date
  let since: string;
  if (sinceIdx !== -1) {
    since = args[sinceIdx + 1];
  } else if (daysIdx !== -1) {
    const days = parseInt(args[daysIdx + 1], 10);
    const d = new Date();
    d.setDate(d.getDate() - days);
    since = d.toISOString().slice(0, 10);
  } else if (fullSync) {
    since = '2020-01-01';
  } else {
    // Default: since last sync, or 10 days ago on first run
    const state = loadState();
    if (state.last_sync) {
      since = state.last_sync;
    } else {
      const d = new Date();
      d.setDate(d.getDate() - 10);
      since = d.toISOString().slice(0, 10);
    }
  }

  console.log(`Google Drive sync — files modified since ${since}`);

  // Load OAuth credentials
  let creds: OAuthCreds;
  try {
    creds = loadCreds();
  } catch (e: unknown) {
    console.error(`\nError: ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  }

  // Get valid access token (auto-opens browser on first run or after auth failure)
  let accessToken: string;
  try {
    accessToken = await getValidToken(creds, forceAuth);
  } catch (e: unknown) {
    console.error(`\nAuth error: ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  }

  // Fetch all files in the window
  console.log('Fetching file list from Google Drive...');
  const allFiles: DriveFile[] = [];
  let pageToken: string | undefined;

  try {
    do {
      const result = await listDriveFiles(accessToken, `${since}T00:00:00`, pageToken);
      allFiles.push(...result.files);
      pageToken = result.nextPageToken;
    } while (pageToken);
  } catch (e: unknown) {
    console.error(`\nDrive API error: ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  }

  // Filter to supported types
  const supported = allFiles.filter(
    f => EXPORT_AS[f.mimeType] || DOWNLOADABLE.has(f.mimeType)
  );

  const skippedTypes = allFiles.length - supported.length;
  console.log(
    `Found ${allFiles.length} files (${supported.length} text/doc` +
    `${skippedTypes > 0 ? `, ${skippedTypes} binary skipped` : ''}).`
  );

  if (supported.length === 0) {
    console.log('Nothing to import. Knowledge base is up to date.');
    saveState({ last_sync: new Date().toISOString().slice(0, 10) });
    return;
  }

  if (dryRun) {
    console.log('\nDry run — files that would be imported:');
    for (const f of supported) {
      const typeLabel = (TYPE_LABEL[f.mimeType] || f.mimeType).padEnd(14);
      console.log(`  ${f.modifiedTime.slice(0, 10)}  ${typeLabel}  ${f.name}`);
    }
    return;
  }

  // Fetch content and ingest
  let imported = 0;
  let skipped  = 0;
  let errors   = 0;

  for (let i = 0; i < supported.length; i++) {
    const file = supported[i];
    process.stdout.write(`\r  [${i + 1}/${supported.length}] ${file.name.slice(0, 55)}...`);

    try {
      const content = await fetchContent(accessToken, file);
      if (!content?.trim()) {
        skipped++;
        continue;
      }

      const slug     = toSlug(file);
      const markdown = toMarkdown(file, content);
      const result   = await importFromContent(engine, slug, markdown, { noEmbed });

      if (result.status === 'imported') {
        imported++;
      } else {
        skipped++;
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`\n  Error on "${file.name}": ${msg}`);
      errors++;
    }
  }

  console.log('');
  saveState({ last_sync: new Date().toISOString().slice(0, 10) });

  console.log(`\nGoogle Drive sync complete:`);
  console.log(`  ${imported} files imported`);
  console.log(`  ${skipped} files skipped (empty or unchanged)`);
  if (errors) console.log(`  ${errors} errors`);
}
