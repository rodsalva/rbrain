# Domain Registry

Every piece of know-how produced — analysis, frameworks, notes, case studies, learnings —
must be classified into a **domain** at ingest time. Domains are the top-level themes of
this brain. They act as routing keys: when a question arrives, the agent identifies the
relevant domain and scopes the search accordingly.

## How Domains Work

- Every `concept`, `source`, and `media` page should have a `domain:` frontmatter field.
- `person` and `company` pages are indexed by domain via tags (e.g. `tag: domain:market`).
- Each domain has a **hub page** at `concepts/domain-{slug}.md` that acts as a table of
  contents: it lists all key pages in that domain and provides the "what's here" overview.
- Agent must link new concept/source pages to the relevant domain hub via
  `rbrain link <new-slug> concepts/domain-{slug} covers` when creating them.

## Domain Classification Rules

When ingesting material:
1. Scan for domain signals: topic vocabulary, named entities, explicit context.
2. Assign ONE primary domain via `domain:` frontmatter field.
3. Use `domains:` (plural) for cross-domain content (max 2).
4. Tag the page with `domain:{slug}` for filter queries.
5. Link to the domain hub page.

## Query Routing Rules

When a question arrives:
1. Identify the domain from the question vocabulary and entities.
2. Run: `rbrain get concepts/domain-{slug}` to load the hub (table of contents for that theme).
3. Search within that domain: `rbrain query "question" --tag=domain:{slug}`.
4. Fall back to global search only if domain search returns no results.

---

## Official Domains

### `market`
**Full name:** Market and Customers

**What goes here:** Market sizing (TAM/SAM/SOM), customer segmentation, ICP definition,
customer research findings, interview insights, personas, willingness-to-pay analysis,
competitive landscape, market trends, demand signals, customer pain points, cohort analysis,
NPS and retention signals, churn reasons, customer success learnings.

**What does NOT go here:** How to sell to customers (→ `sales`), what to build based on
feedback (→ `product`), macro trends without customer grounding (→ `strategy`).

**Hub page:** `concepts/domain-market`
**Tags:** `domain:market`
**Key sub-topics:** `icp`, `segmentation`, `customer-research`, `market-sizing`, `personas`,
`competitive`, `retention`, `churn`, `willingness-to-pay`

---

### `product`
**Full name:** Product and Product Feedback

**What goes here:** Feature definitions, product feedback synthesis, user research,
usability findings, prioritization frameworks, roadmap decisions and their rationale,
product specs, UX principles applied to the product, A/B test results, product metrics
and their interpretation, feedback loops from customers back into the product.

**What does NOT go here:** Why customers exist or their segments (→ `market`),
how to bring product to market (→ `sales`), infrastructure and technical implementation (→ `technology`).

**Hub page:** `concepts/domain-product`
**Tags:** `domain:product`
**Key sub-topics:** `feedback`, `roadmap`, `prioritization`, `user-research`, `specs`,
`metrics`, `ux`, `ab-testing`, `feature-decisions`

---

### `sales`
**Full name:** Sales and Go-to-Market

**What goes here:** GTM strategy, sales motions (PLG, outbound, channel), pricing strategy,
sales playbooks, pipeline management, objection handling, deal frameworks, partnership
strategy, distribution channels, marketing strategy, demand generation, positioning and
messaging, conversion analysis, sales team structure and incentives, launch strategies.

**What does NOT go here:** Who the customers are (→ `market`), what the product does (→ `product`),
technical integrations for sales tools (→ `technology`).

**Hub page:** `concepts/domain-sales`
**Tags:** `domain:sales`
**Key sub-topics:** `gtm`, `pricing`, `positioning`, `messaging`, `pipeline`, `playbook`,
`objections`, `partnerships`, `distribution`, `demand-gen`, `launch`

---

### `technology`
**Full name:** Technology

**What goes here:** Architecture decisions, technical stack choices, infrastructure,
AI/ML implementation, engineering principles, technical debt decisions, build vs. buy
analyses, API design, data models, security and compliance technical requirements,
performance benchmarks, integrations, developer tooling.

**What does NOT go here:** Product specs that technology enables (→ `product`),
market analysis of tech companies (→ `market`), AI as a strategic topic (→ `strategy`).

**Hub page:** `concepts/domain-technology`
**Tags:** `domain:technology`
**Key sub-topics:** `architecture`, `ai-ml`, `infrastructure`, `stack`, `integrations`,
`data-model`, `security`, `performance`, `build-vs-buy`

---

### `strategy`
**Full name:** Strategy

**What goes here:** Company strategy, vision and mission, competitive moats (7 Powers,
Porter), business model design, long-term bets, OKRs and goal-setting frameworks,
make-or-break strategic decisions, market entry strategy, M&A rationale, investor
narratives, fundraising strategy, strategic partnerships, scenario planning.

**What does NOT go here:** Execution-level GTM (→ `sales`), feature-level product decisions
(→ `product`), customer-level insights (→ `market`).

**Hub page:** `concepts/domain-strategy`
**Tags:** `domain:strategy`
**Key sub-topics:** `vision`, `moats`, `business-model`, `fundraising`, `okrs`,
`market-entry`, `narrative`, `competitive-positioning`, `7-powers`

---

## Signal Reference (for Classification)

| Vocabulary signals | Domain |
|---|---|
| TAM, SAM, SOM, ICP, segmento, persona, NPS, churn, entrevista de cliente, willingness-to-pay | `market` |
| feature, roadmap, spec, feedback de usuário, UX, priorização, métrica de produto, A/B | `product` |
| GTM, pricing, outbound, PLG, pipeline, objeção, canal, posicionamento, messaging, launch | `sales` |
| arquitetura, stack, infra, AI/ML, API, data model, integração, build vs. buy | `technology` |
| estratégia, moat, modelo de negócio, fundraising, OKR, visão, narrativa, competição | `strategy` |

When content spans two domains (e.g. "pricing strategy informed by customer research"),
use `domains: [sales, market]` and tag both; the primary domain is where the weight sits.

---

## Adding a New Domain

When material doesn't fit any existing domain:
1. Check if it's a sub-topic of an existing domain first.
2. If truly new: add it here with the same structure.
3. Create the hub page: `concepts/domain-{slug}.md`.

## Hub Page Template

```markdown
---
type: concept
title: "Domain: {Name}"
domain: meta
tags: [domain:{slug}, domain-hub]
---

## O que está aqui

{Descrição em 2-3 frases do que este domínio cobre.}

## Sub-tópicos

- **{sub-topico}** — {descrição curta}

## Know-How Indexado

<!-- Agent: mantenha esta lista. Adicione novas páginas ao criar. -->
<!-- Formato: [slug] — {título}: {resumo em uma linha} -->

## Gaps / O que falta

<!-- Agent: quando uma pergunta não tem resposta no brain, anote aqui. -->

---

## Timeline

- **{data}** | Criação — Hub do domínio {name} criado.
```

---

*This file is the domain resolver. Read it before classifying any ingested material.*
