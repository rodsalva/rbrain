# Domain Hub Pages

Domain hub pages live in the brain as `concept` pages. They are the table of contents
for each theme. The agent creates and maintains these pages.

**Location in brain:** `brain/concepts/domain-{slug}.md`
**Slug in rbrain:** `concepts/domain-{slug}`

## The 5 Hubs to Create

```bash
rbrain put concepts/domain-market
rbrain put concepts/domain-product
rbrain put concepts/domain-sales
rbrain put concepts/domain-technology
rbrain put concepts/domain-strategy
```

After creating all, sync:
```bash
rbrain sync --no-pull --no-embed
```

---

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
<!-- Remova quando o gap for preenchido. -->

---

## Timeline

- **{data}** | Criação — Hub do domínio {name} criado.
```

---

## Per-Domain Initial Content

### `domain-market` — Market and Customers
Sub-topics: `icp`, `segmentation`, `customer-research`, `market-sizing`, `personas`,
`competitive`, `retention`, `churn`, `willingness-to-pay`

### `domain-product` — Product and Product Feedback
Sub-topics: `feedback`, `roadmap`, `prioritization`, `user-research`, `specs`,
`metrics`, `ux`, `ab-testing`, `feature-decisions`

### `domain-sales` — Sales and Go-to-Market
Sub-topics: `gtm`, `pricing`, `positioning`, `messaging`, `pipeline`, `playbook`,
`objections`, `partnerships`, `distribution`, `demand-gen`, `launch`

### `domain-technology` — Technology
Sub-topics: `architecture`, `ai-ml`, `infrastructure`, `stack`, `integrations`,
`data-model`, `security`, `performance`, `build-vs-buy`

### `domain-strategy` — Strategy
Sub-topics: `vision`, `moats`, `business-model`, `fundraising`, `okrs`,
`market-entry`, `narrative`, `competitive-positioning`, `7-powers`
