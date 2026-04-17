---
type: concept
title: "Manor — Síntese de Feedback de Produto (abr/2026): Respostas Objetivas + Citações"
domain: product
domains: [product, market]
tags: [domain:product, domain:market, manor, feedback, odebrecht, btg, leo-choi, response-quality, ux, citations]
---

## Compiled Truth

### Contexto

Três fontes de feedback convergentes coletadas entre 16–17/abr/2026:
Odebrecht (via Felipe), BTG Wealth Management, e Leo Choi (escritório top-tier).

### 1. Odebrecht — Feedback Detalhado (Leo Choi / equipe tributária)

> "A plataforma apresentou uma melhora significativa no tempo de retorno de resposta
> se comparado com nov/25, contudo quando comparado com algumas IAs que usamos aqui
> na Odebrecht (Copilot e ChatGPT) o tempo de retorno ainda é bem superior."

**Problemas reportados:**
- Perguntas básicas retornam textos de 5+ parágrafos com informações irrelevantes
- Exemplo: pergunta sobre alíquota de ganho de capital na alienação de FIP por INR
  → resposta fala de FIA, FIP IE, base de cálculo, JCP, FII, obrigação acessória
- **Expectativa:** "sim ou não + artigo específico da IN com descritivo"
- Para estudos abrangentes a resposta é útil; para o dia-a-dia, precisa praticidade

### 2. BTG Wealth Management — Impressão da Reunião (16/abr)

Resumo de Felipe sobre a call:
> "Tanto do nosso lado, pro nosso time mesmo pra estudar casos que chegam,
> e eventualmente estudar determinados assuntos. E também pros assessores
> financeiros — escalabilidade para não responder a mesma coisa N vezes no dia."

Dois use cases validados:
- Time jurídico interno → pesquisa de casos
- Assessores financeiros (sem formação jurídica) → self-service

### 3. Leo Choi (Escritório Top-Tier)

Escritório e empresa top querem **mais** — não só resposta curta, mas mais
**objetiva, certeira, sem coisas não-importantes**. Já gostam e veem potencial.

### 4. Felipe — Análise Técnica de Qualidade das Respostas (17/abr)

**Problema 1: Temas desnecessários**
- Pergunta sobre dedução de perdas não técnicas de energia do IRPJ/CSLL
- Resposta incluiu: combustíveis, regime de lucro presumido, arbitrado, benefício fiscal
- Milton reconhece que "energia" pode ter puxado "combustíveis", mas o modelo
  precisa ser ancorado no conceito tributário brasileiro, não no conceito genérico

**Problema 2: Acórdãos subutilizados**
- Manor cita acórdãos na resposta, mas **não explora** o conteúdo deles
- Os acórdãos são ricos: endereçam a questão, citam normas, exploram fundamentos
- A resposta não cita a principal lei sobre o tema, **apesar do acórdão citado
  endereçar esse ponto**

**Problema 3: Links e Citações**
- Copy-paste da resposta mostra links internos da Manor, não links das fontes oficiais
- **Fix necessário:** texto limpo + bloco de citações no final com links oficiais
  (legislação e jurisprudência)

### Insight Estratégico (Milton, 17/abr)

> "O advogado está querendo a Manor como fonte de informação para ele realizar
> o estudo — ele quer informações pontuais. A gente está indo pra entregar o que
> o advogado entregaria, pulando a etapa de estudo dele."

Duas posições:
- **Felipe/Leo Choi:** advogado quer pesquisa precisa pra montar sua peça
- **Milton:** a barra do Felipe é tão alta que "estamos produzindo algo que o
  advogado médio não tem nem capacidade de compreender o quão foda é"

Convergência: o valor real vai aparecer quando alguém usar a Manor pra fazer
um recurso no CARF e ganhar.

### Variável de Esforço (Milton, 16/abr)

Proposta de calibrar a profundidade da resposta automaticamente:
- Se o usuário escreveu um tratado → responde à vontade
- Se quer resposta rápida → volta um parágrafo
- Deve ser **invisível** pro usuário (não um toggle)
- RS sugeriu 3 níveis explícitos: rápido, padrão, aprofundada — Milton prefere inferência automática

### Action Items Derivados

- [ ] Implementar calibração de profundidade de resposta (inferência de intenção)
- [ ] Melhorar exploração dos acórdãos citados — extrair normas e fundamentos
- [ ] Reformatar citações: texto limpo + footnotes com links oficiais no final
- [ ] Ancorar respostas no conceito tributário brasileiro (não no conceito genérico)
- [ ] Felipe criar doc de feedbacks positivos destacados (conversões de mornos/negativos)

---

## Timeline

- **2026-04-16** | Feedback — Odebrecht envia feedback detalhado via Felipe. BTG Wealth call feedback resumido.
- **2026-04-17** | Análise — Felipe demonstra problemas de verbosidade e subutilização de acórdãos com exemplos concretos. Milton propõe variável de esforço. Convergência sobre necessidade de respostas mais objetivas.
