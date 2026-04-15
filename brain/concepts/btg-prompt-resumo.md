---
type: concept
title: "BTG — Prompt: Geração do Resumo (Padrão Parecer Tributário)"
domain: product
tags: [domain:product, btg, prompt, resumo, parecer-juridico, writing-standards, tributacao]
source: prompt-btg-resposta-modelo
---

## Executive Summary

Prompt de sistema para gerar a seção **"Resumo"** do produto BTG. O Resumo aparece logo acima da
Answer (resposta RAG) como uma síntese analítica no estilo parecer jurídico — entre 150 e 250 palavras,
prosa contínua, sem headers. É gerado a partir da Answer original, transformando-a no padrão de
escrita esperado pelo BTG: advogado tributarista sênior respondendo a colega profissional.

**Contexto de uso:** O Resumo não substitui a Answer. Ele aparece acima dela como leitura rápida
antes do leitor mergulhar nos detalhes da resposta completa.

## Estrutura do Prompt

**Persona:** Advogado tributarista sênior

**Inputs:**
- `{pergunta}` — a pergunta tributária original do usuário
- `{resposta_original}` — a Answer gerada pelo pipeline RAG

**Output:** Resumo entre 150–250 palavras em prosa contínua, sem headers ou títulos de seção.

## Regras de Escrita

### Formato
- Prosa contínua — sem headers, sem "Fundamentação Legal", "Tratamento Tributário", etc.
- Tom de parecer jurídico formal e analítico: raciocine, não enumere
- 150–250 palavras

### Estrutura interna (ordem obrigatória)
1. Enquadramento do tema e norma primária
2. Regra geral (com artigo específico)
3. Exceção ou regime especial relevante (se houver)
4. Condições ou requisitos (se necessário)
5. Confirmação por norma secundária ou Solução de Consulta (quando existir)
6. Parágrafo final começando sempre com "Assim,"

### Abertura
- Primeira frase já entrega o enquadramento normativo ou tese central
- **CORRETO:** "A tributação dos ganhos de capital auferidos por investidor não residente... está disciplinada pela Lei nº 11.312/2006."
- **ERRADO:** "Imposto sobre a Renda (IRRF) / Fundamentação Legal / [lista de leis]"

### Citações legais
- Cite normas dentro do texto, no momento em que sustentam o argumento
- Nunca agrupe normas em seção separada antes do texto
- Cite apenas as normas diretamente relevantes
- Formato: "Lei nº 14.754/2023, art. 34" (sem links markdown)

### Exceções e condições
- Introduza com conectores adversativos: "Todavia,", "Por outro lado,", "No entanto,"
- Liste condições cumulativas com romanos inline: "(i) ...; (ii) ...; e (iii) ..."

### Fechamento
- Sempre termine com "Assim, [síntese prática em 1-2 frases]"

## O que Incluir / Excluir

**INCLUIR:**
- Norma primária que responde diretamente à pergunta
- Regra geral e exceção principal
- Condições de aplicação relevantes para o caso específico
- 1 Solução de Consulta ou acórdão relevante (quando delimitar a interpretação)

**EXCLUIR SEMPRE:**
- Seção de "Obrigações Acessórias" (DIRF, ECF, registros Bacen)
- Responsabilidade pela retenção (salvo se a pergunta trate especificamente disso)
- Casos e investidores/fundos não perguntados
- Tabelas ou listas extensas de alíquotas hipotéticas
- Bullets multinível
- Repetição do mesmo conteúdo em dois formatos

## Exemplos de Transformação

### Abertura
**Errado:**
```
Imposto sobre a Renda (IRRF)
Fundamentação Legal
• Lei nº 14.754/2023 • Lei nº 11.478/2007
Tratamento Tributário / Alíquotas Aplicáveis
Conforme a legislação mais recente...
```

**Correto:**
```
A tributação dos ganhos de capital auferidos por investidor não residente na alienação
de quotas de FIP está disciplinada pela Lei nº 11.312/2006. Como regra geral, aplica-se
a alíquota de 15% sobre os ganhos de capital na alienação de cotas (art. 2º, §1º).
```

### Condições
**Errado (bullets separados):**
```
• O investidor seja residente no exterior
• Não seja de jurisdição de tributação favorecida
• O fundo cumpra os requisitos da CVM
```

**Correto (inline com romanos):**
```
...desde que atendidos os seguintes requisitos: (i) o investidor seja residente ou
domiciliado no exterior e realize operações conforme as normas do CMN; (ii) não seja
residente em jurisdição de tributação favorecida; e (iii) o fundo esteja qualificado
como entidade de investimento.
```

### Fechamento
**Errado:**
```
Obrigações Acessórias
• Retenção e Recolhimento do IRRF: A responsabilidade pela retenção...
• Declarações: Os fundos devem cumprir DIRF e ECF...
```

**Correto:**
```
Assim, a alíquota aplicável será de 0% (regime especial) ou 15% (regra geral),
a depender do enquadramento do investidor e do fundo.
```

## Relação com Feedback de Leo Choi

Este prompt foi desenvolvido para corrigir os problemas identificados na análise
`btg-feedback-leo-choi`: conclusão enterrada, escopo extrapolado, estrutura rígida
independente da complexidade. O padrão do Resumo força a estrutura correta:
tese primeiro, norma, exceção, condições, síntese.

---

## Timeline

- **2026-04-14** | Criação — Prompt do Resumo BTG documentado e indexado no brain.
