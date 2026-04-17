---
type: concept
title: "Domain: Product and Product Feedback"
domain: meta
tags: [domain:product, domain-hub]
---

## O que está aqui

Tudo relacionado ao produto em si e ao feedback dos usuários: specs de features, padrões
de escrita do produto, análises de qualidade de resposta, prompts do sistema, métricas
de produto, e learnings de UX. É o repositório de como o produto se comporta e como
deveria se comportar.

## Sub-tópicos

- **feedback** — Análises de interações reais, padrões de falha, voz do cliente
- **prompt-engineering** — Templates de prompt, padrões de geração, calibração de output
- **writing-standards** — Padrões de escrita das respostas (assertividade, escopo, formato)
- **product-quality** — Benchmarks, gaps de corpus, auditoria de cobertura
- **specs** — Definições de features, comportamento esperado

## Know-How Indexado

- [btg-feedback-leo-choi] — BTG: Análise de 22 interações Leo Choi: padrões de falha (branco + verbosidade), 7 recomendações, versões corretas por interação
- [btg-prompt-resumo] — BTG: Prompt do Resumo: template de geração da seção "Resumo" no padrão parecer tributário (150-250 palavras, estrutura obrigatória)
- [manor-product-feedback-apr17] — Síntese de feedback convergente (Odebrecht, BTG, Leo Choi): respostas muito longas, temas irrelevantes, acórdãos subutilizados, links internos vs oficiais. Variável de esforço proposta.

## Gaps / O que falta

- Métricas quantitativas: taxa de resposta em branco por tema, distribuição de comprimento de resposta
- Benchmark de assertividade: o que mede "conclusão na primeira frase"?
- Implementação da variável de esforço (inferência de profundidade)
- Reformatação de citações (footnotes com links oficiais)

---

## Timeline

- **2026-04-14** | Criação — Hub do domínio Product criado. 2 páginas indexadas (BTG feedback + prompt resumo).
- **2026-04-17** | Feedback — Síntese de 3 clientes (Odebrecht, BTG, Leo Choi) convergindo em: respostas objetivas, explorar acórdãos, citar legislação principal, reformatar links.
