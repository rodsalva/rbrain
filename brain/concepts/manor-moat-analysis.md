---
type: concept
title: "Manor — Sherlock Defense Moat Audit"
domain: strategy
tags: [domain:strategy, manor, moat, sherlock-defense, sped, btg, tributacao]
---

## Compiled Truth

### O que é esse documento

Aplicação do framework Sherlock Defense (Winston Weinberg / Harvey) ao contexto de Manor.
Resultado de uma sessão de análise estratégica em 15/abr/2026.

### Level 1 Check: Passa

Manor é meaningfully better do que acesso raw ao mesmo modelo + prompt correto.
O corpus de leis e o entendimento profundo do domínio tributário brasileiro
já diferencia o produto de um chatgpt com prompt.

### Level 2 Check: Moat Audit

Três pilares de moat para uma empresa de application-layer AI:

| Pilar | Status | Detalhe |
|---|---|---|
| Corpus / entendimento do domínio | ✓ Tem | Leis e entendimento tributário |
| Integrações de contexto (SPED/eSocial) | ✗ Não tem ainda | Em design por Milton |
| Enterprise relationships + data flywheel | ✗ Incipiente | BTG em negociação |

**Conclusão:** Dois dos três pilares estão faltando. Não há moat durável ainda — há vantagem de head start.

### Prioridades Estratégicas

1. **Fechar BTG** — cada interação real é sinal que OpenAI não pode replicar rapidamente.
   Tratar a relação enterprise não apenas como receita, mas como data flywheel.

2. **Construir integração SPED** — ver [sped-ontologia-infraestrutura]. Quando Manor
   conectar nos sistemas fiscais reais do cliente, deixa de ser chatbot e vira infraestrutura.
   Milton já está desenhando o classificador com conexão ao SPED.

### O que muda quando os dois forem fechados

- SPED: resposta passa a ser grounded em dados reais do cliente, não apenas no corpus de leis.
  OpenAI não tem os pipes. Isso não é uma feature — é infraestrutura.
- BTG + próximos clientes: densidade de sinal domain-specific que cria flywheel de qualidade
  impossível de replicar sem anos de relacionamento enterprise.

---

## Timeline

- **2026-04-15** | Análise — Sherlock Defense aplicado ao Manor. Resultado: Level 1 passa,
  dois dos três pilares de Level 2 faltando. Prioridade: fechar BTG + integração SPED.
