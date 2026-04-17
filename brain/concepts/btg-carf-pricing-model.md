---
type: concept
title: "BTG — Modelo de Negócio: CARF Contingency Intelligence"
domain: sales
domains: [sales, product]
tags: [domain:sales, btg, pricing, business-model, carf, contingency, per-case, value-based, roadmap]
company: btg-pactual
---

## Visão do Produto

**CARF Contingency Classifier** — motor de risco para carteiras de contingências tributárias.

Não é uma ferramenta de pesquisa jurídica. É um **motor de quantificação de risco financeiro**
para gestão patrimonial, M&A, e decisões de crédito. Esse reframe é o que abre a porta do
Wealth Management e sai da caixa "software para advogados".

### O que faz (por caso):
1. **Identificação de tese** — qual é o tema jurídico do caso
2. **Score CARF** — % de favorabilidade baseado em precedentes do CARF na mesma tese
3. **Score Judiciário** — % de favorabilidade em TRF/STJ para mesma tese (pós-CARF)
4. **Valor esperado** — caso R$50M × 30% de chance = perda esperada R$35M
5. **Tier de recomendação**: Brigar / Negociar / Vender para fundo de precatório
6. **Precedentes de suporte** — 5-10 decisões mais próximas ao caso

**Vista de carteira para BTG:** upload de 200 casos de clientes → dashboard de exposição total,
tiered por risco, com valor esperado e ação recomendada por caso.

---

## Modelo de Negócio

### Premissa central
Não cobrar por seat. Não cobrar por usuário. **Cobrar por caso processado, tiered por valor monetário.**

A lógica: o valor entregue é diretamente proporcional ao tamanho do caso. Uma análise
que muda a estratégia de um caso R$50M pode valer R$5-15M para o cliente. O preço
deve refletir o valor em jogo, não a quantidade de pessoas que clicam.

### Pricing por caso

| Tamanho do Caso | Preço por Análise |
|-----------------|-------------------|
| < R$1M          | R$800/caso         |
| R$1M – R$10M    | R$3.500/caso       |
| R$10M – R$50M   | R$12.000/caso      |
| > R$50M         | R$30.000/caso      |

### Licença anual de carteira (modelo BTG)

Para grandes clientes como BTG, vender licença por volume de carteira sob análise:

| Volume da Carteira | Anuidade       |
|--------------------|----------------|
| Até R$500M em valor de casos | R$180k/ano |
| Até R$2B            | R$450k/ano     |
| Ilimitado           | R$900k/ano     |

Um único cliente BTG usando a ferramenta para due diligence de uma aquisição R$500M
com exposição CARF relevante já justifica o contrato anual inteiro.

---

## Segunda Linha de Receita — Marketplace de Precatórios

Para casos classificados como **"CARF desfavorável + Judiciário desfavorável"** com valor alto:
- Manor oferece introdução a compradores de precatório
- Fee de referência: **2–3% do valor transacionado**
- Exemplo: caso R$4M, prob. vitória 20% → cliente vende por R$1,2M → Manor recebe R$24-36k

Não é feature. É um modelo de negócio atrelado ao output do produto.

---

## Por que BTG Wealth Management especificamente

O Wealth Management não litiga os casos — eles **assessoram clientes** e tomam
**decisões de crédito/investimento** com base em contingências dos clientes.

**3 casos de uso de alto valor:**

1. **Crédito** — Cliente pede R$200M. Tem R$80M em disputas CARF. São passivos reais ou de papel? Hoje leva semanas para saber. Com a ferramenta: 1 hora por caso.

2. **M&A / Due Diligence** — PE quer adquirir empresa com 15 casos CARF abertos valendo R$300M. Due diligence manual = 3 meses. Com a ferramenta: 3 horas.

3. **Gestão Patrimonial** — Cliente HNW quer saber se negocia acordo em caso R$40M ou briga. A ferramenta entrega o valor esperado de cada caminho.

---

## Pitch para BTG (uma frase)

> *"Quando um cliente traz uma empresa para crédito ou aquisição com R$200M em contingências CARF,
> quanto tempo leva hoje para o time precificar esse risco? A gente faz em menos de uma hora,
> por caso, com scores de precedentes. E para os casos que o cliente deveria vender em vez de
> brigar, a gente conecta com compradores."*

---

## Relação com Outras Linhas

- **Karoline Muniz (BTG Litigation)** — futuro, diferente da Wealth. Foco em pesquisa de casos,
  bulk analysis, sugestão de jurisprudência. Superfície diferente, mesma infra.
- **Mateus (B2C estudantes)** — canal de distribuição separado, preço diferente, não confundir com BTG.

---

## Feedback da Reunião BTG (16/abr/2026)

Felipe resumiu a impressão do BTG Wealth após a call:
> "Tanto aqui do nosso lado, pro nosso time mesmo pra estudar casos que chegam,
> e também pros assessores financeiros — a gente vem sentindo a necessidade de utilizar
> estruturas como essa pra dar escalabilidade e não ter que responder a mesma coisa
> N vezes no dia."

**Dois use cases validados pelo BTG:**
1. **Time jurídico interno** — estudar casos que chegam, pesquisar assuntos
2. **Assessores financeiros** (agentes autônomos, sem formação jurídica) — self-service escalável

**Próximos passos:** Felipe pediu a Milton para liberar o resumo para BTG e Odebrecht.
Saulo tem mais conhecimento da estrutura para fazer isso.

---

## Open Threads

- [x] BTG Wealth Management — reunião de 16/04/2026: 2 use cases validados (pesquisa interna + assessores)
- [ ] Liberar resumo para BTG e Odebrecht (via Saulo ou Milton)
- [ ] Validar tiers de preço com feedback do BTG
- [ ] Definir quem são os compradores de precatório para o marketplace
- [ ] Karoline Muniz — quando agendar e qual ângulo

---

## Timeline

- **2026-04-16** | Definição — Business model definido como resultado das calls de daily sync + Mateus + reunião BTG 4PM. Per-case pricing tiered por valor monetário. Licença anual de carteira para enterprise.
- **2026-04-16** | Feedback — Reunião BTG Wealth: dois use cases validados (time jurídico interno + assessores financeiros). Felipe pediu liberação do resumo.
- **2026-04-17** | Intelligence — Manus AI gerou "CARF Litigation Intelligence: BTG Pactual S.A." com mapeamento preciso de processos e teses. Demonstra que dados CARF por CNPJ são acessíveis por agents genéricos.
