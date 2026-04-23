---
type: concept
title: "Manor — Manifesto & Execution Plan"
domain: strategy
domains: [strategy, sales]
tags: [domain:strategy, domain:sales, manifesto, narrative, investor, execution, moat]
last_updated: 2026-04-16
---

# Manor

## The Observation

Brazil collects more tax per capita than any country in Latin America. It also spends more per capita on tax compliance than any country in the world. These are not the same number — and the gap between them is the opportunity.

Three tax professionals sit inside every large Brazilian company: the Contabil (recording the past), the Fiscal (complying in the present), and the Tributario (interpreting the law for the future). They work across seven layers of contradictory legislation, 27 state-level ICMS regimes, decades of CARF jurisprudence, and a tax reform — EC 132/2023 — that is the largest fiscal event in 30 years. Their tools are PDFs, Excel, and expensive outside counsel.

This is not a technology problem waiting for a better chatbot. It is a knowledge infrastructure problem waiting for the right pipes.

---

## The Thesis

**AI does not win in tax by being smarter. It wins by being connected.**

A foundation model — ChatGPT, Claude, Gemini — can answer a generic tax question reasonably well. It cannot pull your company's 42 pending CARF proceedings by CNPJ, tell you which ones have published decisions that affect your provisioning, monitor the DOU for legislation that changes your thesis on IRRF for non-residents, and deliver that analysis in the voice of a senior tax attorney before your first login.

That is what Manor does.

The moat is not the model. The moat is the pipes: the CARF data by CNPJ (public, no proxy needed, no trust dependency), the jurisprudence corpus indexed by thesis, and the enterprise feedback loop that makes every answer better than the last.

Harvey proved this works. $300M Series D, hundreds of thousands of users, enterprises buying Harvey alongside ChatGPT because domain-specific value is real and durable. Winston Weinberg's Sherlock Defense framework says: assume the LLM providers will enter your vertical — then build what they can't replicate without years of pipes, relationships, and domain signal. Harvey did it for common law. Manor does it for Brazilian tax.

---

## The Market

**The numbers.**

Sebas Mejia (Tako CEO, ex-Rappi founder) estimates $20-30 billion in compliance friction in Brazil — not taxes paid, but the cost of managing the complexity: wrong filings, late filings, outside counsel for questions that should be answerable internally, provisioning errors, tax reform confusion. This is the waste we capture.

**The structural shift.**

Brazil skipped the SaaS generation. Labor was cheaper than software — "Humans as a Service" was the default. Entire tax departments are armies of analysts doing manual research. AI enables these companies to skip directly from HaaS to AI agents. The TAM is not the software market — it is the software market plus the labor market.

**The timing.**

Three forces converge right now:
1. **Tax reform (EC 132/2023)** — multi-year transition creates mandatory urgency. Every company needs to understand the impact on their specific tax position. This is the critical event that Tomanini says closes deals.
2. **Legal AI validation** — Harvey's trajectory (resistance in 2023, inflection in 2024, business model transformation in 2025) proves enterprises buy domain AI at premium prices alongside general-purpose models.
3. **Infrastructure readiness** — Brazil already built the rails: PIX, eSocial, NF-e, CARF's public database. The regulatory infrastructure is ahead of most developed countries. What's missing is the intelligence layer on top.

**Who buys.**

Two ICPs, different motions:
- **Law firms with 10+ tax lawyers** — priority now while pricing is per-user. Harvey charges US$200/license, minimum 30 = US$6k/month. These firms already understand the value proposition.
- **Enterprises with a dedicated tax director** — the medium-term prize. Outside counsel spend of 1-4x/month, active CARF/STJ cases, tax reform impact. The ROI argument: we reduce your dependency on Mattos Filho for day-to-day questions, not eliminate them — but the routine half of that spend moves in-house.

**Who does not buy** (and we walk away): SMEs without dedicated tax staff, companies 100% dependent on outside counsel with no internal team, price expectation R$200-500/month, no urgency or critical event. We sell to the top, not the bottom. This is a conscious choice — it sacrifices early revenue growth for defensibility.

---

## The Product

Manor's product arc is two macro blocks: **Intelligence** then **Execution**.

The full arc: **Public infrastructure → Intelligence → Action**

| | Macro 1 | Macro 2 |
|---|---|---|
| **Name** | Tax Intelligence OS | Tax Execution Platform |
| **Question** | What does the law say about me? | What do I do about it? |
| **Persona** | Tributário (strategist) | Fiscal (operator) + Contábil (recorder) |
| **Framework** | Apoiar (support) | Substituir (replace) |

---

### Macro 1: Tax Intelligence OS

The private sector's complete infrastructure for understanding Brazil's tax complexity.

**Layer 1 — Foundation: Be reliable**
1. **Search & Analyze** — assertion-first answers (Resumo format: conclusion first, 150-250 words, senior tax attorney voice, inline citations) + deep legal opinions with executive summary, legal basis, jurisprudential X-ray, risk assessment. Every claim traceable to an official source. *(LIVE)*
2. **Monitor** — daily DOU + jurisprudence updates, filtered by client relevance. The analyst opens Manor in the morning and sees what changed overnight — not a firehose, a curated brief.

**Layer 2 — Context: Know the client**
3. **CARF by CNPJ** — client enters CNPJ. Manor pulls all proceedings, generates complete analysis per case, creates automatic monitoring, presents everything on first login. Zero onboarding friction. *(Building now — 42 BTG proceedings extracted as proof-of-concept)*
4. **Thesis Classifier** — jurisprudence indexed by argument, not just keyword. Unlocks proper jurisprudence retrieval and cross-domain analysis.
5. **Tax Reform Intelligence** — EC 132/2023 transition impact per client's specific tax position. Time-sensitive: the companies that build the intelligence layer during the transition become the default when it ends.

**Layer 3 — Depth: From tool to working partner**
6. **Conversational follow-ups** — drill down, challenge, explore a thesis. Tax professionals don't ask one question; they work a problem.
7. **Full research mode** — 10+ minute deep legal opinions that replace outside counsel billable hours. The feature that justifies R$10-25k/month.

**Layer 4 — Scale: From individual to institution**
8. **State/municipal coverage** — ICMS across 27 states. Without this, every answer carries an invisible asterisk. Closes the false confidence gap.
9. **Enterprise features** — multi-user, teams, audit trails. The infrastructure for Tomanini's DO #1: enter first, expand later.
10. **Provisioning intelligence** — automated alerts when jurisprudence trends affect financial provisions. The bridge to Macro 2: intelligence becomes actionable.

---

### Macro 2: Tax Execution Platform

The private sector's complete infrastructure for acting on Brazil's tax complexity.

**Layer 1 — Compliance automation (serves the Fiscal)**
1. **Compliance calendar** — automated deadlines per client, per regime, per jurisdiction.
2. **Filing preparation** — draft SPED/EFD submissions from client data. The Fiscal's core daily job, automated.
3. **Obligation validation** — cross-check filings against current law. Did we file correctly? What did we miss?
4. **Cross-jurisdiction compliance** — ICMS obligations across multiple states, unified in one view.

**Layer 2 — Financial automation (serves the Contábil)**
5. **Tax position dashboard** — real-time total tax exposure across all jurisdictions. The CFO's single pane of glass.
6. **Automated provisioning** — adjust balance sheet provisions based on CARF trends and jurisprudence shifts.
7. **Audit-ready documentation** — continuous generation of the documentation package that external auditors and RFB will request.

**Layer 3 — Strategic automation (serves the Tributário at the next level)**
8. **Audit defense** — when RFB audits, Manor generates the complete defense dossier automatically.
9. **Tax optimization engine** — restructuring recommendations grounded in current jurisprudence + reform trajectory.
10. **Regulatory change execution** — when law changes, Manor shows exactly what to change in operations, filings, and provisions — and drafts the changes.

---

## The Moat (Honest Assessment)

We apply Weinberg's Sherlock Defense rigorously to ourselves.

**Level 1 — Value Capture Floor: PASSES.**
Manor is meaningfully better than raw ChatGPT + correct prompt for Brazilian tax law. The corpus, the formatting, the thesis-level analysis — a generic model cannot replicate this today.

**Level 2 — Sherlock Defense: TWO OF THREE PILLARS MISSING.**

| Pillar | Status | What closes it |
|---|---|---|
| Corpus + domain understanding | **Have it** | Legislation + jurisprudence indexed, Resumo format calibrated |
| Client context (CARF/CNPJ) | **Building** | Public data, no proxy — integration in progress. 42 BTG proceedings already extracted as proof-of-concept |
| Enterprise relationships + data flywheel | **Incipient** | BTG in negotiation. Every interaction from a real enterprise user generates signal that OpenAI cannot replicate without years of pipes |

**What we do NOT have yet:**
- The thesis classifier (prerequisite for jurisprudence to work properly and for cross-domain analysis)
- State/municipal tax coverage (ICMS across all 27 states — without it, the product has false confidence on state-level questions)
- A closed enterprise contract that generates real feedback density

**What we have that is hard to replicate:**
- The CARF-by-CNPJ pipeline — public data, but building the extraction, structuring, and analysis layer is 6-12 months of domain engineering
- A team that understands the domain at the practitioner level, not the consultant level

---

## The Execution Plan

### Phase 1 — Fix & Close (Now through June 2026) → Blocks 1-2

**Product:** Solidify the Foundation layer.
- Audit and fill corpus gaps that caused 9 blank responses for Leo Choi (IN RFB 1.585/2015, swap in FIIs, derivatives within funds)
- Deploy Resumo prompt template across all responses (conclusion-first, assertion-driven)
- Implement question complexity classification (simple questions get short answers, complex questions get full opinions)

**Sales:**
- Re-engage Leo Choi with the fixed product. His feedback after adjustments is the single most important data point
- Demo BTG's own 42 CARF proceedings — show them their own tax dispute map, organized by type, with decisions analyzed. This is Tomanini's DO #14: "proactive demo with client's real data"
- Identify the decision-maker above Leo Choi. Sell the director on outside counsel cost reduction (Tomanini's DO #2: KPI that matters)
- Set a hard trial cutoff. 3-4 months of free access must end. Align price expectations explicitly (Tomanini's DO #11: "I'm not an NGO")
- Close at R$10k/month minimum. Do not discount out of fear (Tomanini's DON'T #1)

**Milestone:** BTG signed. First paying enterprise client. Data flywheel begins.

### Phase 2 — CARF Intelligence (July-September 2026) → Blocks 2-3

**Product:** Ship the Context layer.
- Ship CARF-by-CNPJ integration (Block 3): client enters CNPJ → proceedings loaded → analysis generated → monitoring created
- Ship Monitoring v0 (Block 2): daily DOU + jurisprudence updates, filtered by client relevance
- Ship jurisprudence search (P/E ratio 2.0 — highest value per effort)

**Sales:**
- Use BTG as reference (verbal only — Tomanini's DO #13). "BTG is using Manor for their tax contencioso. You have the same problems."
- Targeted outreach to 10 qualified prospects (3 of 4 signals: internal tax team 3+, outside counsel 1x/month+, critical event, decision-maker accessible)
- Price at R$10k-25k/month depending on users and tier

**Milestone:** 5 paying clients. CARF integration live. Level 2 Pillar 2 (client context) closed.

### Phase 3 — Classifier & Depth (October-December 2026) → Blocks 4-7

**Product:** Ship the Context and Depth layers.
- Ship thesis classifier (Block 4). Unlocks proper jurisprudence retrieval and cross-domain analysis.
- Ship tax reform intelligence (Block 5). Time-sensitive due to EC 132/2023 transition.
- Ship conversational follow-ups (Block 6) and full research mode (Block 7).

**Sales:**
- Expand within existing accounts (Tomanini's DO #1: entering is hard, expanding is easy)
- Corporate legal ICP activation — enterprises, not just law firms (Tomanini's insight: "corporate legal is the more important medium-term ICP")

**Milestone:** Thesis classifier live. Product covers the three core jobs: search, monitor, analyze. Revenue from 10+ clients.

### Phase 4 — Scale (2027) → Blocks 8-10

**Product:** Ship the Scale layer. Complete the Tax Intelligence OS.
- State/municipal coverage (Block 8): ICMS for all 27 states
- Enterprise features (Block 9): multi-user, teams, audit trails
- Provisioning intelligence (Block 10): the bridge to Macro 2

**Sales:**
- Structured expansion playbook: enter → prove value → expand seats → expand use cases → expand budget
- Target: 30+ enterprise clients, R$500k+ MRR

**Milestone:** Tax Intelligence OS complete. Data flywheel running. Level 2 Pillar 3 (enterprise relationships) established. Defensible against foundation model entry. Ready for Macro 2.

---

## Why We Win

Not because we are smarter. Not because we have more money. Not because we have a better model.

We win because:

1. **The complexity is the moat.** Brazilian tax is the hardest regulatory domain in the world. Building a machine-readable corpus with proper taxonomy, maintaining it as laws change weekly, and encoding the practitioner's judgment into the system — this is a multi-year investment that no global AI company will prioritize. Harvey is expanding into tax, but they understand common law. They do not understand CTN + CARF + 27 ICMS regimes + EC 132/2023 transition rules. Sebas Mejia's principle: "run toward complexity."

2. **The pipes are the product.** CARF data is public but useless without the extraction, structuring, and analysis layer. Jurisprudence is available but not indexed by thesis. We build the pipes that turn public infrastructure into private intelligence. This is what Weinberg means by "context complexity" — the moat Harvey built for M&A, applied to Brazilian tax.

3. **The timing is irreversible.** Tax reform creates a 3-5 year window of mandatory urgency. Every company in Brazil must understand the impact on their tax position. The companies that build the intelligence layer during the transition become the default when the transition ends. Miss this window and the next one is a generation away.

4. **We start at the top.** Law firms with 10+ tax lawyers. Enterprises with dedicated tax directors. The most complex use cases, the highest willingness to pay, the deepest feedback signal. This is Harvey's conscious strategy — slower early revenue, faster long-term defensibility. The bottom of the market is where foundation models commoditize you.

5. **The skip-generation advantage.** Our clients never adopted tax SaaS. They are going from human armies directly to AI. We are not replacing software — we are replacing a workflow that has not changed in 30 years. The switching cost from "Excel + outside counsel" to Manor is lower than from "incumbent SaaS" to Manor. Paradoxically, the lack of existing software adoption makes our sales motion easier, not harder.

---

## What Could Kill Us

We are honest about the risks:

1. **Product quality.** 41% blank responses with our most important prospect. If we cannot deliver reliable, assertive answers on the topics our ICP cares about, nothing else matters. This is existential and it is first priority.

2. **Harvey enters Brazil seriously.** $300M and hundreds of thousands of users. If they hire a Brazilian tax team and build the pipes, they have distribution we cannot match. Our defense: they are years away from understanding CTN + CARF at practitioner depth, and their attention is split across dozens of jurisdictions. But we should not be complacent.

3. **We run out of time before the flywheel spins.** 7 people, no external funding (as documented). If we cannot convert free trials to paying clients before cash runs out, the thesis is irrelevant. Tomanini's urgency is real: stop giving away the product.

4. **Foundation models get good enough.** If Claude or GPT-5 can answer Brazilian tax questions at 90% of Manor's quality with zero setup, our Level 1 moat erodes. Defense: the pipes (CARF, monitoring, thesis classification) are what Level 2 is for. We must close Level 2 before Level 1 becomes commodity.

5. **Tax reform gets delayed or simplified.** If the transition slows or the new system turns out to be simpler than expected, the urgency window closes. This is low probability — Brazilian tax reform has never been simple — but it would reduce the "why now" pressure.

---

## Description

**Manor is an AI platform that enables the private sector to navigate Brazil's tax complexity by turning public regulatory infrastructure into intelligence.**

---

*This manifesto is a living document. Updated: 2026-04-17.*
