---
title: Manor Product Roadmap
type: concept
domain: product
tags:
  - domain-product
  - manor
  - roadmap
  - strategy
  - moat-analysis
---

## Manor Product Arc

**Description:** Manor is an AI platform that enables the private sector to navigate Brazil's tax complexity by turning public regulatory infrastructure into intelligence.

**Full arc:** Public infrastructure → Intelligence → Action

### External narrative (persona arc)

| | Macro 1 | Macro 2 |
|---|---|---|
| **Name** | Tax Intelligence OS | Tax Execution Platform |
| **Question** | What does the law say about me? | What do I do about it? |
| **Persona** | Tributário (strategist) | Fiscal (operator) + Contábil (recorder) |
| **End state** | Best intelligence in Brazil | Best execution in Brazil |

### Internal priority (moat arc)

Five pillars that carry the 18-month moat. Everything else is supporting.

| Pillar | Why defensible | Feeds |
|---|---|---|
| **1.3 CARF by CNPJ** | Proprietary litigation maps per CNPJ. Pillar-enabling infrastructure — Thesis Classifier and Audit Defense depend on it. | 1.4, 2.8 |
| **1.4 Thesis Classifier** | Jurisprudence indexed by argument requires hand-curated legal taxonomy. Horizontal AI cannot shortcut this. | 1.7, 2.8, 2.9 |
| **1.8 State/municipal coverage** | ICMS across 27 states is a dataset-construction nightmare. First mover owns it. | 2.4, 2.5 |
| **1.10 + 2.6 Provisioning spine** | CARF trends × client financials × balance sheet logic. Creates proprietary provisioning-outcome dataset. | 2.7 |
| **2.8 Audit defense** | Requires all prior data + liability assumption. Creates a "battle-tested defense" dataset no competitor can bootstrap. | — |

Over-invest R&D in the five pillars. Build everything else to "good enough" standard.

### Milton framework (corrected)

The Apoiar/Substituir line does not run between Macro 1 and Macro 2. It runs deeper inside Macro 2.

- **Apoiar** = AI produces output the human approves per-instance
- **Substituir** = AI produces output that flows into the world without per-instance approval

| Classification | Features |
|---|---|
| **Apoiar** | All of Macro 1 (1.1–1.10); Macro 2 items 2.1–2.5 |
| **Apoiar-at-scale** (sophisticated but still ratified by human) | 2.8 (audit defense), 2.9 (tax optimization) |
| **True Substituir** | 2.6 (automated provisioning), 2.7 (audit-ready documentation), 2.10 (regulatory change execution) |

Only three features in the entire roadmap are true Substituir. Pricing follows this distinction, not the macro boundary.

---

## Macro 1: Tax Intelligence OS

The private sector's complete infrastructure for UNDERSTANDING Brazil's tax complexity.

### Layer 1 — Foundation: Be reliable
1. **Search & Analyze** — assertion-first answers + deep legal opinions (LIVE)
2. **Monitor** — daily DOU + jurisprudence, filtered by relevance

### Layer 2 — Context: Know the client
3. **CARF by CNPJ** ★ — litigation map loaded before first login [MOAT PILLAR]
4. **Thesis Classifier** ★ — jurisprudence indexed by argument, not just keyword [MOAT PILLAR]
5. **Tax Reform Intelligence** — EC 132/2023 impact per client's specific position (time-bounded: moat decays as reform implementation settles)

### Layer 3 — Depth: From tool to working partner
6. **Conversational follow-ups** — drill down, challenge, explore a thesis
7. **Full research mode + audit-ready documentation** — 10+ minute legal opinions that replace outside counsel hours; documentation artifacts generated as byproduct (collapsed from former Macro 2 item 2.7)

### Layer 4 — Scale: From individual to institution + execution bridge
8. **State/municipal coverage** ★ — ICMS across 27 states, closing the false confidence gap [MOAT PILLAR]
9. **Enterprise features** — multi-user, teams, audit trails
10. **Provisioning intelligence** ★ — alerts when jurisprudence trends affect financial provisions [MOAT PILLAR — prototype of automated provisioning]
11. **Compliance calendar** — automated deadlines per client, per regime, per jurisdiction (migrated from Macro 2; low-risk, high-frequency, creates daily habitual usage)

Layer 4 is also the **pricing bridge**: introduce usage-based components (provisioning alerts, deep research credits) to condition clients before Macro 2 forces the per-outcome fork.

---

## Macro 2: Tax Execution Platform

The institutional workflow macro — with a Substituir core and an Apoiar-at-scale ring.

### Layer 1 — Compliance automation (serves the Fiscal) [Apoiar]
1. **Filing preparation** — draft SPED/EFD submissions from client data
2. **Obligation validation** — cross-check filings against current law
3. **Cross-jurisdiction compliance** — ICMS obligations across multiple states, unified view

### Layer 2 — Financial automation (serves the Contábil) [Substituir core]
4. **Tax position dashboard** — real-time total tax exposure across all jurisdictions [Apoiar]
5. **Automated provisioning** ★ — adjust balance sheet provisions based on CARF trends [MOAT PILLAR — True Substituir]

### Layer 3 — Strategic automation (serves the Tributário at next level)
6. **Audit defense** ★ — when RFB audits, Manor generates the complete defense dossier [MOAT PILLAR — Apoiar-at-scale]
7. **Tax optimization engine** — restructuring recommendations grounded in jurisprudence + reform [Apoiar-at-scale]
8. **Regulatory change execution** — law changes → operational changes, filings, provisions drafted [True Substituir]

---

## Pricing model by layer

| Layer | Dominant persona | Pricing model | ACV order of magnitude |
|---|---|---|---|
| Macro 1 L1–L3 | Tributário | Per-seat | Thousands → low tens of thousands |
| Macro 1 L4 | Tributário + institution | Per-seat + usage add-ons | Tens of thousands |
| Macro 2 L1 (Fiscal) | Fiscal | Per-obligation or unlimited-seat flat fee | Low six figures |
| Macro 2 L2 (Contábil) | Contábil | Per-provision or per-entry | Mid six figures |
| Macro 2 L3 (strategic) | Tributário at next level | Per-outcome + success fees | High six / low seven figures |

Per-seat pricing breaks the moment the Fiscal enters the account (teams 3–10x larger than Tributário). Do not attempt to migrate per-seat clients to per-outcome cold.

---

Defined: 2026-04-17. Strategic overlay: 2026-04-17.
