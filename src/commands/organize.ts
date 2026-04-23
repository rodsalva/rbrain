/**
 * rbrain organize — classify unorganized pages into domains and add tags.
 *
 * Two classification modes:
 *   1. Keyword-based (default, free, instant) — uses signal vocabulary from DOMAINS.md
 *   2. LLM-based (--llm flag) — uses Claude Haiku for ambiguous cases
 *
 * Usage:
 *   rbrain organize [--dry-run] [--source slack|braintrust|granola|gdrive]
 *   rbrain organize --backfill          Process ALL untagged pages
 *   rbrain organize --since YYYY-MM-DD  Only pages updated after date
 *   rbrain organize --llm               Use Claude API instead of keywords
 */

import type { BrainEngine } from '../core/engine.ts';

const DOMAINS = ['market', 'product', 'sales', 'technology', 'strategy'] as const;
type Domain = (typeof DOMAINS)[number];

interface Classification {
  slug: string;
  domain: Domain;
  confidence: 'high' | 'medium' | 'low';
}

// ── Keyword classifier ───────────────────────────────────────────────────────
// Signal vocabulary from DOMAINS.md + Manor-specific terms

const DOMAIN_SIGNALS: Record<Domain, RegExp[]> = {
  market: [
    /\b(TAM|SAM|SOM)\b/i,
    /\b(ICP|ideal customer|cliente ideal)\b/i,
    /\b(segment|segmento|segmentação)\b/i,
    /\b(persona|personas)\b/i,
    /\b(NPS|net promoter)\b/i,
    /\b(churn|retenção|retention)\b/i,
    /\b(entrevista.*(cliente|customer)|customer.*(interview|research))\b/i,
    /\b(willingness.to.pay|disposição.*(pagar|pagamento))\b/i,
    /\b(market.siz|dimensionamento|tamanho.*mercado)\b/i,
    /\b(competitive.*landscape|concorrência|concorrente|competitor)\b/i,
    /\b(demand.signal|sinal.*demanda)\b/i,
    /\b(pain.point|dor.*cliente)\b/i,
    /\b(cohort|coorte)\b/i,
    /\b(customer.success|sucesso.*cliente)\b/i,
    /\b(market.trend|tendência.*mercado)\b/i,
  ],
  product: [
    /\b(feature|funcionalidade|recurso)\b/i,
    /\b(roadmap|backlog)\b/i,
    /\b(spec|especificação)\b/i,
    /\b(feedback.*(usuário|user|produto|product))\b/i,
    /\b(UX|user.experience|experiência.*usuário)\b/i,
    /\b(prioriz|priorit)\b/i,
    /\b(métrica.*produto|product.metric)\b/i,
    /\b(A\/B|teste.*ab|ab.test)\b/i,
    /\b(usabilidade|usability)\b/i,
    /\b(sprint|story.point|user.story)\b/i,
    /\b(product.decision|decisão.*produto)\b/i,
    /\b(bug|issue|ticket)\b/i,
    /\b(resposta.*padrão|resposta.*completa|search.*result)\b/i,
    /\b(reformulação|reformula)\b/i,
  ],
  sales: [
    /\b(GTM|go.to.market)\b/i,
    /\b(pricing|preço|precificação)\b/i,
    /\b(outbound|inbound|PLG|product.led)\b/i,
    /\b(pipeline|funil|funnel)\b/i,
    /\b(objeção|objection|objeções)\b/i,
    /\b(canal|channel|distribuição|distribution)\b/i,
    /\b(posicionamento|positioning|messaging)\b/i,
    /\b(launch|lançamento)\b/i,
    /\b(playbook|sales.motion)\b/i,
    /\b(partnership|parceria|parceiro)\b/i,
    /\b(demand.gen|geração.*demanda|lead)\b/i,
    /\b(pitch|proposta.*comercial|commercial.proposal)\b/i,
    /\b(deal|negócio|contrato|contract)\b/i,
    /\b(conversion|conversão)\b/i,
    /\b(vendas|venda|selling|sell)\b/i,
    /\b(comprar|por.que.comprar|buy)\b/i,
    /\b(discovery.*call|reunião.*comercial)\b/i,
  ],
  technology: [
    /\b(arquitetura|architecture)\b/i,
    /\b(stack|infra|infrastructure)\b/i,
    /\b(AI|ML|machine.learning|LLM|GPT|embedding)\b/i,
    /\b(API|endpoint|REST|GraphQL)\b/i,
    /\b(data.model|modelo.*dados|schema)\b/i,
    /\b(integração|integration)\b/i,
    /\b(build.vs.buy|comprar.*construir)\b/i,
    /\b(security|segurança|compliance)\b/i,
    /\b(performance|benchmark|latência|latency)\b/i,
    /\b(deploy|CI\/CD|pipeline.*deploy|docker|kubernetes)\b/i,
    /\b(database|banco.*dados|postgres|redis|supabase)\b/i,
    /\b(SPED|EFD|eSocial|DCTF|ECF|ECD)\b/i,
    /\b(crawler|scraper|scraping)\b/i,
    /\b(search.*engine|busca|vector.*search)\b/i,
    /\b(alert|alerta|monitor|monitoramento)\b/i,
    /\b(service-|manor-service-)\b/i,
    /\b(preprod|staging|production|prod-)\b/i,
  ],
  strategy: [
    /\b(estratégia|strategy)\b/i,
    /\b(moat|vantagem.*competitiva|competitive.*advantage)\b/i,
    /\b(business.model|modelo.*negócio)\b/i,
    /\b(fundraising|captação|investidor|investor)\b/i,
    /\b(OKR|objetivo|goal.setting)\b/i,
    /\b(visão|vision|mission|missão)\b/i,
    /\b(narrativa|narrative)\b/i,
    /\b(competição|competition|competitive.positioning)\b/i,
    /\b(market.entry|entrada.*mercado)\b/i,
    /\b(M&A|merger|acquisition|aquisição)\b/i,
    /\b(scenario.planning|cenário)\b/i,
    /\b(7.powers|porter|hamilton.helmer)\b/i,
    /\b(manifesto|execution.plan)\b/i,
    /\b(long.term|longo.prazo|strategic.bet)\b/i,
    /\b(TAM.*billion|TAM.*bilhão|addressable)\b/i,
  ],
};

// Slug-based signals (channel names, source prefixes that strongly indicate domain)
const SLUG_SIGNALS: Record<string, Domain> = {
  'deploys': 'technology',
  'preprod': 'technology',
  'prod-workflows': 'technology',
  'test-workflows': 'technology',
  'preprod-workflows': 'technology',
  'prod-alerts': 'technology',
  'preprod-alerts': 'technology',
  'test-alerts': 'technology',
  'general-alerts': 'technology',
  'bugs-p0': 'technology',
  'manor-service-': 'technology',
  'manor-app-': 'technology',
  'manor-python-': 'technology',
  'eng': 'technology',
  'agent-resposta': 'product',
  'sugestoes-finais': 'product',
};

function classifyByKeywords(
  slug: string,
  title: string,
  content: string,
): Classification {
  const text = `${title} ${content}`.toLowerCase();

  // Check slug signals first (strong signal for Slack channels)
  for (const [pattern, domain] of Object.entries(SLUG_SIGNALS)) {
    if (slug.includes(pattern)) {
      return { slug, domain, confidence: 'high' };
    }
  }

  // Score each domain by keyword matches
  const scores: Record<Domain, number> = {
    market: 0,
    product: 0,
    sales: 0,
    technology: 0,
    strategy: 0,
  };

  for (const domain of DOMAINS) {
    for (const regex of DOMAIN_SIGNALS[domain]) {
      const matches = text.match(new RegExp(regex.source, 'gi'));
      if (matches) {
        scores[domain] += matches.length;
      }
    }
  }

  // Find winner
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]) as [
    Domain,
    number,
  ][];
  const [topDomain, topScore] = sorted[0];
  const [, secondScore] = sorted[1];

  if (topScore === 0) {
    // No signals found — default to technology for operational content
    return { slug, domain: 'technology', confidence: 'low' };
  }

  // Confidence: high if clear winner, medium if close
  const ratio = secondScore > 0 ? topScore / secondScore : topScore;
  const confidence =
    ratio >= 2 ? 'high' : ratio >= 1.3 ? 'medium' : 'low';

  return { slug, domain: topDomain, confidence };
}

// ── LLM classifier (fallback) ────────────────────────────────────────────────

const API_URL = 'https://api.anthropic.com/v1/messages';

async function classifyBatchLLM(
  pages: Array<{ slug: string; title: string; type: string; snippet: string }>,
): Promise<Classification[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const pageList = pages
    .map(
      (p, i) =>
        `[${i}] slug="${p.slug}" title="${p.title}" type="${p.type}"\n${p.snippet}`,
    )
    .join('\n---\n');

  const resp = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `Classify each page into ONE domain: market, product, sales, technology, strategy.
Context: Manor is a Brazilian tax/regulatory tech startup.
Respond ONLY with JSON: [{"i": 0, "domain": "market", "confidence": "high"}, ...]

${pageList}`,
        },
      ],
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Claude API error ${resp.status}: ${text}`);
  }

  const data = (await resp.json()) as {
    content: Array<{ type: string; text: string }>;
  };
  const text = data.content[0]?.text || '[]';
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  try {
    const results = JSON.parse(jsonMatch[0]) as Array<{
      i: number;
      domain: string;
      confidence: string;
    }>;
    return results
      .filter((r) => DOMAINS.includes(r.domain as Domain))
      .map((r) => ({
        slug: pages[r.i]?.slug || '',
        domain: r.domain as Domain,
        confidence: (r.confidence || 'medium') as Classification['confidence'],
      }))
      .filter((r) => r.slug);
  } catch {
    return [];
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

export async function runOrganize(engine: BrainEngine, args: string[]) {
  const dryRun = args.includes('--dry-run');
  const backfill = args.includes('--backfill');
  const useLLM = args.includes('--llm');

  const sourceIdx = args.indexOf('--source');
  const sourceFilter = sourceIdx !== -1 ? args[sourceIdx + 1] : undefined;

  const sinceIdx = args.indexOf('--since');
  const sinceArg = sinceIdx !== -1 ? args[sinceIdx + 1] : undefined;

  console.log(`Scanning for unorganized pages… (mode: ${useLLM ? 'LLM' : 'keywords'})`);

  const allPages = await engine.listPages({ limit: 99999 });

  // Filter out test fixtures, skill docs, and hub pages
  let candidates = allPages.filter(
    (p) =>
      !p.slug.startsWith('test/') &&
      !p.slug.startsWith('skills/') &&
      !p.slug.startsWith('concepts/domain-'),
  );

  if (sourceFilter) {
    candidates = candidates.filter((p) => p.slug.startsWith(sourceFilter + '/'));
  }

  if (sinceArg) {
    const sinceDate = new Date(sinceArg + 'T00:00:00Z');
    candidates = candidates.filter(
      (p) => p.updated_at && new Date(p.updated_at) >= sinceDate,
    );
  }

  // Find pages without domain tags
  const untagged: typeof candidates = [];
  for (const page of candidates) {
    const tags = await engine.getTags(page.slug);
    if (!tags.some((t: string) => t.startsWith('domain:'))) {
      untagged.push(page);
    }
  }

  // Determine scope
  let toProcess = untagged;
  if (!backfill && !sinceArg && !sourceFilter) {
    const today = new Date().toISOString().slice(0, 10);
    const todayPages = untagged.filter(
      (p) => p.updated_at && p.updated_at.toString().startsWith(today),
    );
    if (todayPages.length > 0) {
      console.log(
        `Found ${untagged.length} total untagged, processing ${todayPages.length} from today.`,
      );
      toProcess = todayPages;
    } else {
      console.log(
        `No pages from today need organizing (${untagged.length} total untagged).`,
      );
      console.log(
        'Use --backfill to process all, or --since YYYY-MM-DD for a date range.',
      );
      return;
    }
  } else {
    console.log(`Found ${toProcess.length} unorganized pages to classify.`);
  }

  if (toProcess.length === 0) {
    console.log('Everything is organized!');
    return;
  }

  // Classify
  const domainCounts: Record<string, number> = {};
  let classified = 0;
  let errors = 0;
  const batchSize = 20;

  if (useLLM) {
    // LLM mode: batch classification
    for (let i = 0; i < toProcess.length; i += batchSize) {
      const batch = toProcess.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(toProcess.length / batchSize);
      process.stdout.write(
        `\r  Batch ${batchNum}/${totalBatches} (${i + batch.length}/${toProcess.length})…`,
      );

      try {
        const results = await classifyBatchLLM(
          batch.map((p) => ({
            slug: p.slug,
            title: p.title || p.slug,
            type: p.type || 'note',
            snippet: (p.compiled_truth || '').slice(0, 500),
          })),
        );

        for (const r of results) {
          if (dryRun) {
            console.log(
              `\n    [dry-run] ${r.slug} → domain:${r.domain} (${r.confidence})`,
            );
          } else {
            await engine.addTag(r.slug, `domain:${r.domain}`);
          }
          domainCounts[r.domain] = (domainCounts[r.domain] || 0) + 1;
          classified++;
        }

        if (i + batchSize < toProcess.length) {
          await new Promise((r) => setTimeout(r, 1000));
        }
      } catch (e: unknown) {
        console.error(
          `\n  Error batch ${batchNum}: ${e instanceof Error ? e.message : e}`,
        );
        errors++;
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  } else {
    // Keyword mode: instant classification
    for (let i = 0; i < toProcess.length; i++) {
      const p = toProcess[i];
      if (i % 100 === 0) {
        process.stdout.write(`\r  ${i}/${toProcess.length}…`);
      }

      const result = classifyByKeywords(
        p.slug,
        p.title || '',
        (p.compiled_truth || '').slice(0, 2000),
      );

      if (dryRun) {
        if (i < 20 || result.confidence === 'low') {
          console.log(
            `\n    [dry-run] ${result.slug} → domain:${result.domain} (${result.confidence})`,
          );
        }
      } else {
        await engine.addTag(p.slug, `domain:${result.domain}`);
      }
      domainCounts[result.domain] = (domainCounts[result.domain] || 0) + 1;
      classified++;
    }
  }

  console.log(`\n\nOrganize complete${dryRun ? ' (DRY RUN)' : ''}:`);
  console.log(`  ${classified} pages classified`);
  if (errors) console.log(`  ${errors} batch errors`);
  console.log('\nBy domain:');
  for (const [d, n] of Object.entries(domainCounts).sort(
    (a, b) => b[1] - a[1],
  )) {
    console.log(`  ${d}: ${n}`);
  }
}
