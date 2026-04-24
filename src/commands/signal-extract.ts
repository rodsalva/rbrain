/**
 * rbrain signal-extract — find convergent signals across sources.
 *
 * Walks pages tagged source:* in a time window, finds clusters by vector
 * similarity, weights each cluster by distinct source types present, and
 * emits clusters that pass the weight threshold.
 *
 * Usage:
 *   rbrain signal-extract [--days 14] [--min-weight 4]
 *                         [--threshold 0.78] [--json]
 *                         [--sources s1,s2,...]
 *
 * Output: JSON array of clusters on stdout (pipe to signal-propose).
 *
 * Source weights (match the design doc):
 *   whatsapp-cofounders=3  granola=2  braintrust=2
 *   gdrive=1               youtube=2  slack=1
 *   (unknown sources default to 1)
 */

import type { BrainEngine } from '../core/engine.ts';
import type { Page } from '../core/types.ts';

const DEFAULT_DAYS = 14;
const DEFAULT_MIN_WEIGHT = 4;
const DEFAULT_THRESHOLD = 0.78;

const SOURCE_WEIGHTS: Record<string, number> = {
  'whatsapp-cofounders': 3,
  'whatsapp': 3,
  'granola': 2,
  'braintrust': 2,
  'youtube': 2,
  'gdrive': 1,
  'slack': 1,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

interface PageWithEmbedding {
  page: Page;
  sourceType: string;  // e.g. "whatsapp-cofounders", "youtube", etc.
  embedding: Float32Array;
  preview: string;     // first ~500 chars of the page
  date: string;        // YYYY-MM-DD from tag or created_at
}

interface Cluster {
  id: string;               // deterministic hash of member slugs
  members: PageWithEmbedding[];
  sources: Record<string, number>;  // source type → count
  weight: number;
  first_signal: string;
  last_signal: string;
  sample_titles: string[];
}

function sourceTypeFromTags(tags: string[]): string | null {
  for (const t of tags) {
    if (t.startsWith('source:')) {
      const s = t.slice('source:'.length).split('-')[0];
      return s;
    }
  }
  // Fallback: specific source shorthand tags
  for (const t of tags) {
    if (['granola', 'youtube', 'slack', 'braintrust', 'gdrive', 'whatsapp'].includes(t)) return t;
  }
  return null;
}

function weightFor(sourceType: string): number {
  return SOURCE_WEIGHTS[sourceType] ?? 1;
}

function cosineSim(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na  += a[i] * a[i];
    nb  += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom > 0 ? dot / denom : 0;
}

function parseSince(arg: string | undefined, days: number): Date {
  if (arg) return new Date(arg);
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

// ── Main ──────────────────────────────────────────────────────────────────────

export async function runSignalExtract(engine: BrainEngine, args: string[]): Promise<void> {
  const daysIdx = args.indexOf('--days');
  const days = daysIdx !== -1 ? parseInt(args[daysIdx + 1], 10) : DEFAULT_DAYS;

  const minWIdx = args.indexOf('--min-weight');
  const minWeight = minWIdx !== -1 ? parseInt(args[minWIdx + 1], 10) : DEFAULT_MIN_WEIGHT;

  const thIdx = args.indexOf('--threshold');
  const threshold = thIdx !== -1 ? parseFloat(args[thIdx + 1]) : DEFAULT_THRESHOLD;

  const sinceIdx = args.indexOf('--since');
  const sinceArg = sinceIdx !== -1 ? args[sinceIdx + 1] : undefined;

  const sourcesIdx = args.indexOf('--sources');
  const sourceFilter = sourcesIdx !== -1
    ? new Set(args[sourcesIdx + 1].split(',').map(s => s.trim()))
    : null;

  const emitJson = args.includes('--json');
  const verbose  = args.includes('--verbose');

  const since = parseSince(sinceArg, days);
  const sinceStr = since.toISOString().slice(0, 10);

  if (verbose) console.error(`Scanning pages since ${sinceStr}, min_weight=${minWeight}, sim>=${threshold}…`);

  // 1. Collect candidate pages across source tags
  const sourceTags = [
    'source:whatsapp-cofounders', 'source:whatsapp',
    'source:granola', 'granola',
    'source:braintrust', 'braintrust',
    'source:gdrive',
    'source:youtube', 'youtube',
    'source:slack',
  ];

  const seenSlugs = new Set<string>();
  const candidates: PageWithEmbedding[] = [];

  for (const tag of sourceTags) {
    const pages = await engine.listPages({ tag, limit: 500 });
    for (const p of pages) {
      if (seenSlugs.has(p.slug)) continue;
      const tags = await engine.getTags(p.slug);
      const srcType = sourceTypeFromTags(tags);
      if (!srcType) continue;
      if (sourceFilter && !sourceFilter.has(srcType)) continue;

      // Date filter
      const createdAt = p.created_at instanceof Date ? p.created_at : new Date(p.created_at as any);
      if (createdAt < since) continue;

      // Get first chunk with embedding for this page
      const chunks = await engine.getChunks(p.slug);
      const embedded = chunks.find(c => c.embedding && c.chunk_source === 'compiled_truth') ?? chunks.find(c => c.embedding);
      if (!embedded || !embedded.embedding) continue;

      candidates.push({
        page: p,
        sourceType: srcType,
        embedding: embedded.embedding,
        preview: (chunks[0]?.chunk_text ?? '').slice(0, 500),
        date: createdAt.toISOString().slice(0, 10),
      });
      seenSlugs.add(p.slug);
    }
  }

  if (verbose) console.error(`Candidates with embeddings: ${candidates.length}`);

  // 2. Greedy single-linkage clustering (O(n²) — fine for <500 pages)
  const assigned = new Set<number>();
  const clusters: PageWithEmbedding[][] = [];

  for (let i = 0; i < candidates.length; i++) {
    if (assigned.has(i)) continue;
    const cluster = [candidates[i]];
    assigned.add(i);

    for (let j = i + 1; j < candidates.length; j++) {
      if (assigned.has(j)) continue;
      const sim = cosineSim(candidates[i].embedding, candidates[j].embedding);
      if (sim >= threshold) {
        cluster.push(candidates[j]);
        assigned.add(j);
      }
    }
    if (cluster.length >= 2) clusters.push(cluster);
  }

  if (verbose) console.error(`Raw clusters (>=2 members): ${clusters.length}`);

  // 3. Weight each cluster by distinct source types
  const weighted: Cluster[] = clusters.map(members => {
    const sources: Record<string, number> = {};
    for (const m of members) sources[m.sourceType] = (sources[m.sourceType] ?? 0) + 1;

    const weight = Object.keys(sources)
      .reduce((sum, src) => sum + weightFor(src), 0);

    const dates = members.map(m => m.date).sort();
    const clusterId = 'cl-' + members.map(m => m.page.slug).sort().join('|').slice(0, 60)
      .replace(/[^a-z0-9]+/gi, '-').toLowerCase();

    return {
      id: clusterId,
      members,
      sources,
      weight,
      first_signal: dates[0],
      last_signal: dates[dates.length - 1],
      sample_titles: members.slice(0, 5).map(m => m.page.title),
    };
  })
  .filter(c => c.weight >= minWeight)
  .sort((a, b) => b.weight - a.weight);

  if (verbose) console.error(`Clusters passing weight threshold: ${weighted.length}`);

  // 4. Emit
  if (emitJson) {
    const out = weighted.map(c => ({
      id: c.id,
      weight: c.weight,
      sources: c.sources,
      first_signal: c.first_signal,
      last_signal: c.last_signal,
      members: c.members.map(m => ({
        slug: m.page.slug,
        title: m.page.title,
        source_type: m.sourceType,
        date: m.date,
        preview: m.preview,
      })),
    }));
    console.log(JSON.stringify(out, null, 2));
  } else {
    if (weighted.length === 0) {
      console.log(`No convergent signals found (scanned ${candidates.length} pages, min_weight=${minWeight}, sim>=${threshold}).`);
      return;
    }
    console.log(`\n${weighted.length} convergent signal cluster(s):\n`);
    for (const c of weighted) {
      const srcSummary = Object.entries(c.sources)
        .map(([s, n]) => `${s}×${n}(w${weightFor(s)})`).join(' + ');
      console.log(`[${c.id.slice(0, 20)}]  weight=${c.weight}  ${c.first_signal} → ${c.last_signal}`);
      console.log(`  sources: ${srcSummary}`);
      console.log(`  samples:`);
      for (const t of c.sample_titles) console.log(`    - ${t}`);
      console.log();
    }
  }
}
