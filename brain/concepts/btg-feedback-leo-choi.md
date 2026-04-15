---
type: concept
title: "BTG — Análise de Feedback: Leo Choi (22 interações)"
domain: product
domains: [product, market]
tags: [domain:product, btg, feedback, product-quality, assertividade, verbosidade, tributacao, customer-research]
source: analise-critica-leo-choi
customer: leo-choi
company: btg-pactual
---

## Executive Summary

Análise crítica de 22 interações do usuário Leo Choi (BTG Pactual) entre 25 mar e 13 abr 2026.
Feedback direto: *"Muitas vezes não responde de forma assertiva e às vezes me parece que traz muita
informação quando não necessário para perguntas mais simples."* Foram identificados dois padrões
de falha: 9 respostas em branco (indisponibilidade) e 12 respostas tecnicamente ricas mas
estruturalmente pobres (conclusão enterrada, escopo extrapolado, citações redundantes).

## Diagnóstico

### Padrão A — Falha Completa (9/22 interações)
Interações: #1, #2, #3, #4, #10, #11, #12, #13, #14

O usuário foi forçado a reformular a mesma pergunta múltiplas vezes sem obter retorno.
Pior cluster: pergunta sobre swap em FIIs — 6 tentativas ao longo de ~7 horas no mesmo dia (06/04/2026).

**Causa provável:** ausência de documentação indexada sobre temas específicos (IN RFB 1.585/2015,
FIIs com derivativos, swap dentro de fundos). O sistema falha especialmente em perguntas que
cruzam múltiplas categorias.

### Padrão B — Resposta Verbosa e Não-Assertiva (12/22 interações)
Interações: #5, #6, #7, #8, #15, #16, #17, #18, #19, #20, #21, #22

**Sub-falhas recorrentes:**
- Conclusão principal enterrada ao final, após seções de contexto
- Escopo extrapolado (responde temas não perguntados)
- Mesmo template para perguntas simples e complexas
- Citações redundantes do mesmo dispositivo sob IDs diferentes
- Mistura de legislação vigente com proposta (MP 1.303/2025) sem distinção clara
- Terminologia incorreta: "IRPF" em contextos de não residentes (correto: IRRF)

## Recomendações

**Crítico (impacto alto):**
1. Auditar corpus indexado nos temas que retornaram em branco (IN 1.585/2015, FII + derivativos, swap). Testar cobertura por tema antes de colocar em produção para novos usuários.
2. Implementar classificação de complexidade da pergunta. Perguntas tipo "quais as normas" → lista estruturada. Perguntas tipo "como se tributa X em Y contexto" → análise completa. O volume de resposta deve ser proporcional à complexidade da pergunta.

**Moderado (impacto médio):**
3. Inverter estrutura: "conclusão → fundamento → detalhes" em vez de "contexto → fundamento → conclusão". A primeira frase deve entregar o enquadramento normativo ou tese central.
4. Flag visual explícito para normas propostas (MP 1.303/2025) vs. legislação vigente. Nunca misturar alíquotas vigentes e propostas sem distinção temporal clara.
5. Consolidar citações ao mesmo dispositivo — uma referência bem colocada supera cinco fragmentadas.

**Menor (impacto baixo):**
6. Padronizar "IRRF" para não residentes — eliminar "IRPF" nesses contextos.
7. Marcar inferências explicitamente: substituir "sugerindo que..." por "o texto não traz disposição expressa sobre essa hipótese — ausência de previsão não equivale a equiparação automática."

## Temas com Resposta em Branco (Gaps de Corpus)

- Custo de aquisição de cotas para fins tributários (IN 1.585/2015, Art. 103)
- Swap em FIIs — tributação e obrigações acessórias
- [Documentar novos gaps conforme surgem]

## Respostas Modelo por Interação

Ver referência completa: `brain/assets/analise_leo_choi_btg.txt` (794 linhas)

Temas com versão correta documentada:
- **#1–4** Custo de aquisição de cotas (IN 1.585/2015, Art. 103)
- **#5** Obrigação do administrador — custo zero como default
- **#6** IRRF/IRPF em dividendos, JCP e BDRs
- **#7** IOF em operações com coobrigados (STF, STJ, CARF)
- **#8** Normas de ganho de capital para PJ (alíquotas progressivas 15%–22,5%)
- **#9/14** Swap em FIIs — IRRF, IOF, obrigações acessórias
- **#15** Legislação INR em fundos (Lei 14.754/2023, IN 1.585/2015)
- **#16** Tax Reform — tabela comparativa legislação atual × pós-reforma × transição
- **#17** Amortização offshore com entrega de FIP para INR (configuração de alienação)
- **#18** Recebimento de ativos em conta de não residente (CNR)
- **#19** Depreciação de propriedade para investimento — crédito PIS/COFINS
- **#20** Não incidência em opções em bolsa para INR (IN 1.585/2015, Art. 90)
- **#21** Integralização de cotas de FIP em FIM por INR (Lei 13.043/2014, Art. 1º)
- **#22** Tributação do usufrutuário de quotas de FIP (Lei 14.754/2023, Art. 36)

## Open Threads

- [ ] Auditoria do corpus para os 9 temas sem resposta — feito?
- [ ] Classificação de complexidade implementada?
- [ ] Novo feedback de Leo Choi após ajustes?

---

## Timeline

- **2026-04-14** | Análise — Análise crítica de 22 interações Leo Choi concluída. 9 falhas de disponibilidade, 12 de assertividade/escopo. 7 recomendações documentadas.
- **2026-04-13** | Interação #22 — Última interação analisada: usufrutuário de FIP.
- **2026-04-06** | Cluster crítico — 6 tentativas sobre swap em FIIs sem retorno (maior cluster de frustração).
- **2026-03-25** | Início — Primeiras 4 interações sem resposta sobre custo de aquisição de cotas.
