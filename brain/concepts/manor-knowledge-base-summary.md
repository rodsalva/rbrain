---
type: concept
title: "Manor — Knowledge Base Summary"
domain: strategy
tags: [domain:strategy, summary, estado-geral]
last_updated: 2026-04-16
---

# Manor — Knowledge Base Summary

> Last updated: 2026-04-16

---

## 1. The Company: Manor

Manor is a **Brazilian tax AI platform** — "tributário federal, como um sênior responderia." The team is **7 people**: Rodrigo Salvador, Felipe Graccho Vasconcellos, Milton Mazetto, Paulo Sergio Romero Jr, Gustavo Chen, Lucas Rossi, and Saulo Furuta. The primary tenant is called "norma." At least one external client test exists (Odebrecht).

**Current state**: ~20-30 companies/firms in free trial for 3-4 months. Primary documented customer: **BTG Pactual** (Leo Choi, 22 interactions analyzed). Pricing planned at R$10,000/mo (Research, 3 users) and R$25,000/mo (Intelligence, 10 users).

---

## 2. Strategic Position (Moat Audit)

Sherlock Defense framework (Winston Weinberg / Harvey) applied to Manor:

| Level | Status | Detail |
|---|---|---|
| **Level 1** — Better than ChatGPT + prompt | **PASSES** | Manor is meaningfully better for Brazilian tax law |
| **Level 2, Pillar 1** — Corpus/domain understanding | **Have it** | Legislation + jurisprudence indexed |
| **Level 2, Pillar 2** — Client context (CARF/CNPJ) | **DON'T HAVE YET** | Immediate priority |
| **Level 2, Pillar 3** — Enterprise relationships + data flywheel | **INCIPIENT** | BTG in negotiation |

**Critical pivot**: Milton and Felipe concluded **CARF > SPED** for the current contencioso/compliance focus. CARF data is public, accessible by CNPJ, no proxy needed. SPED is deferred to a future fiscal audit product ("outro business").

**The CARF vision**: client enters CNPJ → Manor pulls all administrative tax proceedings → generates complete analysis per case → creates automatic monitoring → all before the client's first login. Proof-of-concept exists: 42 BTG Pactual proceedings extracted and structured in `data/carf-btg/`, with 24 published decisions.

---

## 3. Market Intelligence

**Three key external sources ingested:**

| Source | Key Insight |
|---|---|
| **a16z / Sebas Mejia (Tako CEO)** | "Custo Brasil" = 10-20% of GDP in regulatory friction. $20-30B in labor+tax compliance. Skip-generation: HaaS → AI agents, bypassing SaaS entirely. |
| **Access / Winston Weinberg (Harvey CEO)** | Legal AI market went from resistance (2023) → inflection (2024) → business model transformation (2025). Harvey raised $300M Series D. Expanding into tax. |
| **Milton (internal)** | Three distinct tax personas (Contábil, Fiscal, Tributário). SPED = unified fiscal ontology. CARF = zero-barrier public data moat. |

**Competitive reference**: Harvey charges US$200/license, minimum 30 = US$6k/month. Manor's competitor charges R$600/person/month.

**Brazil's paradox**: the most complex regulatory framework also has the most advanced regulatory infrastructure (PIX, eSocial, NF-e, SPED). Complexity = moat; infrastructure = lever.

---

## 4. Product State

**Two documented failure patterns** from BTG (Leo Choi, 22 interactions):

- **Pattern A** — 9 of 22 queries returned **blank responses** (worst: 6 attempts over 7 hours on April 6 about swaps in FIIs)
- **Pattern B** — 12 of 22 were **verbose/non-assertive** (conclusion buried, scope creep, same template for simple and complex questions)

**Corrective actions taken**: a "Resumo" prompt template now enforces conclusion-first, 150-250 words, senior tax attorney persona, inline citations, ending with "Assim,".

**Product roadmap** (priority-ranked by P/E ratio):

| P/E | Feature | Priority | Effort |
|---|---|---|---|
| 2.00 | Jurisprudência functioning | 10 | 5 |
| 1.80 | Daily updates (Monitoring v0) | 9 | 5 |
| 0.90 | Multiple messages | 7 | 8 |
| 0.80 | Full research (10 min+) | 8 | 10 |
| 0.71 | Tax reform | 5 | 7 |
| 0.60 | Thesis classifier | 6 | 10 |

Key dependency: **Thesis classifier** (effort 10) is prerequisite for Jurisprudência and Cross-domain.

---

## 5. Sales Motion

**Tomanini mentorship** (April 14, 2026) produced a comprehensive playbook:

**Top 3 DOs**: (1) Enter first, expand later — getting in is harder than upselling from R$3k to R$30k. (2) Tie to a strategic KPI the director cares about (rework, risk, outside counsel cost — not "reduce operations"). (3) Sell to the full chain, aiming for the top.

**Top 3 DON'Ts**: (1) Don't enter cheap out of fear — R$3k when worth R$30k creates an inescapable price ceiling. (2) Don't mention headcount cuts to people managers. (3) Don't give long trials (3 days max — "give the kid a lollipop, let them lick twice, take it away").

**ICP defined**: Law firms with 10+ tax lawyers (priority while per-user pricing); enterprises with dedicated tax director + outside counsel spend + active CARF/STJ cases + tax reform impact.

**Quick qualification**: 3 of 4 signals = qualified (internal tax team 3+, outside counsel 1x/month+, critical event coming, decision-maker accessible).

**BTG sales deck exists**: 8-slide HTML proposal at `brain/docs/sales/btg-pactual-proposta-v5-2026-04-14.html`.

---

## 6. Domain Taxonomy

5 domains, each with a hub page:

| Domain | Pages Indexed | Gaps Documented |
|---|---|---|
| **Market** | 4 | ICP by segment, pain map per function, WTP research, competitive analysis |
| **Product** | 2 | Other BTG users, quantitative metrics, assertiveness benchmark |
| **Sales** | 3 | (none documented) |
| **Technology** | 1 | Stack decisions, SPED integration architecture |
| **Strategy** | 5 | Competitive analysis of legaltech/tax AI |

---

## 7. People Network

| Person | Role | Key Contribution |
|---|---|---|
| **Milton Mazetto** | Co-builder, market/technical thesis | Tax function taxonomy, SPED ontology, CARF pivot |
| **Felipe (Graccho Vasconcellos)** | Co-founder, also at Tax Group | Pricing alignment, BTG negotiation, CARF > SPED validation |
| **Tomanini** | Sales mentor, friend | Complete enterprise sales framework (15 DOs, 10 DON'Ts) |
| **Leo Choi** | BTG user, primary feedback source | 22 interactions, high frustration, direct feedback on assertiveness |
| **Winston Weinberg** | Harvey CEO (external reference) | Sherlock Defense framework, legal AI market dynamics |
| **Sebas Mejia** | Tako CEO (external reference) | Custo Brasil quantification, HaaS→AI thesis, defensibility framework |

---

## 8. Key Tensions & Open Questions

1. **Moat gap**: Two of three Level 2 pillars are missing. CARF integration and BTG close are existential priorities.
2. **Product quality**: 41% blank response rate with the most important client. Corpus gaps on investment fund taxation are documented but not yet resolved.
3. **Pricing paradox**: Tomanini says don't enter cheap (R$3k when worth R$30k), but the deck shows R$10k-25k/mo which is aggressive for trial-to-paid conversion of free users at 3-4 months.
4. **Technology domain is thin**: Only 1 page indexed. No documentation of Manor's own architecture, model choices, embedding strategy, or retrieval pipeline.
5. **Harvey expanding into tax**: Documented as a market validation signal, but also a direct competitive threat — and they have $300M and hundreds of thousands of users.
6. **SPED deferred but critical**: Milton is building a SKOS classifier using SPED's ontology. This is powerful IP but marked as "future phase." The classifier is also a prerequisite for the thesis classifier (priority 6 on the roadmap, which itself unlocks jurisprudência at priority 10).

---

## 9. Data Assets

- **CARF/BTG dossier** (`data/carf-btg/`): 42 proceedings, 24 with published decisions, structured JSON + markdown per case.
- **Internal users** (`data/manor_internal_users.csv`): 33 auth records for 7 people across multiple tenants.
- **BTG interaction analysis** (`brain/assets/analise_leo_choi_btg.txt`): 22 interactions with corrected model answers.
- **Resumo prompt template** (`brain/assets/prompt_btg_resposta_modelo.txt`): production prompt for conclusion-first tax opinions.
- **BTG sales proposal** (`brain/docs/sales/btg-pactual-proposta-v5-2026-04-14.html`): 8-slide dark-themed HTML deck.

---

*This summary is the living snapshot of Manor's knowledge base. Update the `last_updated` date each time this file is refreshed.*
