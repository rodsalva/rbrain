---
type: concept
title: "Product Roadmap — Prioritização de Features"
domain: product
tags: [domain:product, roadmap, prioritization, features]
---

## Tabela de Priorização

| Priority | Item | Effort (1-10) | Ratio (P/E) |
|---|---|---|---|
| 10 | Jurisprudência funcionando | 5 | 2.00 |
| 9 | Atualização diária (Monitoramento v0) | 5 | 1.80 |
| 8 | Pesquisa completa (10 mins+) | 10 | 0.80 |
| 7 | Múltiplas mensagens | 8 | 0.90 |
| 6 | Classificador de tese | 10 | 0.60 |
| 5 | Reforma tributária | 7 | 0.71 |
| 4 | Tributário 5 estados e 5 municípios top | 8 | 0.50 |
| 3 | Monitoramento (full) | 8 | 0.38 |
| 2 | Cross-domain | 8 | 0.25 |

## Notas de Decisão

- **Classificador de tese (6):** Pré-requisito para Jurisprudência (10) funcionar de verdade. Mapeia queries ao universo legal formal (temas STF, STJ, CARF). Linguagem nativa do Analista Tributário.
- **Reforma tributária (5):** Gap real validado por Leo Choi (interação #16). Time-sensitive — MP 1.303/2025 ainda em transição. Trabalho de conteúdo, não arquitetura.
- **Tributário estados/municípios (4):** ICMS sem todos os estados = produto incompleto com falsa confiança. Scope em aberto (5 vs. todos). Sobe antes do Monitoramento porque o Monitoramento depende dessa cobertura.
- **Monitoramento full (3):** Muito mais valioso com cobertura tributária de estados/municípios. Sequência lógica: cobre conteúdo → monitora → cruza domínios.
- **Cross-domain (2):** Downstream do Classificador de tese. Não adianta construir sem a fundação de classificação pronta.

## Dependências

```
Classificador de tese (6)
  └─► Jurisprudência (10) — habilitado
  └─► Cross-domain (2) — depende

Tributário estados (4)
  └─► Monitoramento full (3) — depende
```

---

## Timeline

- **2026-04-15** | Definição — Prioritização completa definida em sessão com Claude.
