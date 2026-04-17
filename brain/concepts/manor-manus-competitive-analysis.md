---
type: concept
title: "Manus AI — Análise Competitiva vs Manor (abr/2026)"
domain: strategy
domains: [strategy, technology]
tags: [domain:strategy, domain:technology, manor, manus, competitive, carf, ai-agent, hallucination]
---

## Compiled Truth

### O que é Manus

Manus é um AI agent que consegue acessar fontes públicas (CARF, soluções de consulta)
autonomamente para responder perguntas tributárias. Não é um chatbot com corpus —
é um agente que navega e extrai dados em tempo real.

### Teste: BTG Pactual CARF Litigation Intelligence (17/abr/2026)

Felipe testou Manus com consulta sobre BTG Pactual no CARF.
Resultado: **"Manus acertou tudo, bizarro."**

O PDF gerado ("CARF Litigation Intelligence: Banco BTG Pactual S.A.") contém:
- Entity mapping por CNPJ (30.306.294/0001-45)
- Seleção de caso e análise de tese (processo 16682.720859/2014-51 — CP Patronal/PLR)
- Cross-reference com jurisprudência recente (Braskem, Pátria, Cemig — abril 2026)
- Risk assessment e predição de resultado

### Teste: Dedutibilidade de Perdas Não Técnicas de Energia

Manus "matou a questão" — acertou o cerne usando apenas solução de consulta + CARF.
Gerou PDF de 4 páginas com análise completa, citando acórdãos reais e recentes
(Energisa jan/2025, Eletropaulo jul/2024, Light abr/2024 e fev/2025).

### Teste: Análise de Tendências do CARF (2022-2026)

Milton propôs teste "bulk": "análise todos os acórdãos do CARF dos últimos 4 anos
e me mostre as tendências de cada turma." Manus gerou 5 páginas com análise por seção,
novas súmulas, e temas críticos. **Mas** RS observou que análise bulk não rola da mesma forma —
não é indexação completa, é acesso pontual via busca do CARF.

### Assessment de Risco (Milton)

- **Taxa de alucinação:** ~20% ("de tudo que usei até hoje")
- **No agregado:** alucina bem menos do que acerta
- **Diferencial Manor vs Manus:** Manor acessa TODOS os acórdãos indexados.
  Manus acessa acórdãos soltos usando a busca do CARF. São capacidades diferentes.
- **O jogo é o mesmo:** Claude deve conseguir fazer algo parecido
- **"Se a gente tiver o classificador e o SLA de alucinação, a gente tem mercado."**

### Implicações Estratégicas

1. **Manus não é um concorrente direto, mas demonstra que agents genéricos podem
   acessar dados públicos de CARF** — o moat de Manor não pode depender apenas de acesso
2. **O moat real está em:** indexação completa + classificação de teses + SLA de alucinação
3. **Oportunidade:** Manor pode ser fornecedora de dados para agents como Manus no futuro
   (Milton: "pensa que nós podemos fornecer isso pra Manus alguma hora")
4. **Decisão:** não compartilhar descoberta sobre Manus externamente

### Felipe: Acórdãos são a chave (não SPED)

Felipe discorda que SPED resolva o problema de respostas imprecisas:
> "Não consigo entender como um sistema público de escrituração digital pode resolver isso.
> Basta olhar a legislação e juris pra chegar numa resposta."

**A conclusão de Felipe aplica-se a todo o output da Manor, não só CARF:**
- Manor precisa explorar melhor os acórdãos que já cita
- Legislação + jurisprudência > SPED para qualidade de resposta

---

## Timeline

- **2026-04-17** | Discovery — Felipe testa Manus com consultas tributárias reais (BTG CARF, perdas de energia). Resultados precisos. Time avalia impacto competitivo. Milton: ~20% hallucination rate. Decisão de não divulgar externamente.
