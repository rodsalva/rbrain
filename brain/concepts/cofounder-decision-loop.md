---
type: concept
title: "Cofounder Feedback → Roadmap Decision Loop"
domain: strategy
tags: [domain:strategy, process, ritual, cofounder, roadmap, manor]
status: proposal
---

## Problema

Hoje o RBrain ingere continuamente o WhatsApp dos sócios (feedback sobre Manor, threats como Manus/JusIA, ideias de produto, ajustes de estratégia). O sinal entra, fica pesquisável, aparece ocasionalmente no briefing — **mas não existe um ritual estruturado que converta convergência de sócios em decisão commitada no roadmap**.

Resultado: insights importantes ficam inertes. Quando virar decisão, é por força de quem gritou mais alto ou se lembrou, não por sinal objetivo. E decisões tomadas não têm rastro de qual feedback as originou.

Esta proposta fecha o loop: **sinal → convergência → proposta de decisão → review semanal → commit no roadmap → mensuração pós-decisão**.

## Princípios

1. **Convergência antes de decisão** — um sócio com forte opinião = ruído; dois ou mais convergindo = sinal. Threshold explícito evita reação impulsiva.
2. **Roadmap é o destino** — toda decisão vira movimento nos 20 blocos (10 Tax Intelligence OS + 10 Tax Execution Platform). Sem destino, não é decisão.
3. **Rastro bidirecional** — cada bloco do roadmap referencia o feedback que o originou; cada feedback-cluster referencia qual bloco endereçou.
4. **Timebox** — feedback sem decisão em 2 semanas é escalado ou arquivado com motivo. Inércia é decisão implícita ruim.
5. **Mensuração** — decisões shipadas voltam pro loop: a convergência acertou? Aprende-se o padrão.

## Arquitetura do loop

```
[WhatsApp sócios]
      ↓ ingest (já existe)
[brain concepts/sources tagged cofounder-feedback]
      ↓ extract (novo: rbrain cofounder-extract)
[feedback-clusters com ≥2 sócios convergindo]
      ↓ propose (novo: rbrain cofounder-propose)
[brain/decisions/pending/*.md — proposta de decisão + bloco-alvo]
      ↓ review semanal (ritual humano, quinta 17h BRT)
[decisão: approve / defer / reject + justificativa]
      ↓ commit (manual pelo Rodrigo)
[bloco do roadmap atualizado + brain/decisions/decided/*.md]
      ↓ ship + measure
[post-decision: hit/miss loggado em brain/decisions/outcomes/]
```

## Componentes

### 1. Extração de convergência (`rbrain cofounder-extract`)

- Lê todas as páginas taggeadas `cofounder-feedback` nos últimos 14 dias
- Agrupa por tema usando embedding similarity (threshold configurável)
- Identifica clusters com ≥2 sócios distintos expressando posição alinhada
- Output: lista de clusters com participantes, trechos-chave, data de primeiro e último sinal

Heurística inicial: threshold de similaridade 0.82 + janela 14 dias + mínimo 2 sócios. Ajustar após primeiras execuções.

### 2. Proposta de decisão (`rbrain cofounder-propose`)

- Para cada cluster, gera rascunho em `brain/decisions/pending/YYYY-MM-DD-{slug}.md` com:
  - **Sinal:** quais sócios, o que disseram, quando
  - **Convergência:** ponto comum extraído
  - **Bloco-alvo sugerido:** qual dos 20 blocos do roadmap é afetado (keyword match + LLM se disponível)
  - **Opções de decisão:** expandir bloco / repriorizar / adicionar bloco / rejeitar
  - **Trade-offs:** o que se perde com cada opção
  - **Deadline:** 14 dias a partir do primeiro sinal

### 3. Review semanal (humano, não automatizável)

- Quando: quinta 17h BRT (antes da semana fechar, sócios ainda acessíveis)
- Quem: Rodrigo + ao menos 1 sócio presente (pode ser assíncrono via WhatsApp se a proposta for clara)
- Como: percorrer `brain/decisions/pending/` ordenado por deadline mais próximo
- Para cada proposta: **approve** / **defer+motivo** / **reject+motivo**
- Output: move pra `brain/decisions/decided/` com campo `decision:` preenchido e `committed_block:` se approve

### 4. Commit no roadmap

- Decisão approved → Rodrigo edita o bloco correspondente em `brain/concepts/manor-product-roadmap.md` (ou equivalente quando existir hub de blocos)
- Adiciona linha `origem: brain/decisions/decided/YYYY-MM-DD-{slug}` no bloco
- Commit git com referência cruzada

### 5. Mensuração pós-decisão

- Quando o bloco é shipado (release tag ou marco), criar `brain/decisions/outcomes/YYYY-MM-DD-{slug}.md`
- Campos: `original_signal`, `decision`, `shipped_at`, `hit|miss|partial`, `learnings`
- Retro trimestral: ler outcomes, identificar padrões (quais sócios convergem melhor? Quais tipos de sinal acertam mais?)

## Integração com infraestrutura existente

- **Daily briefing**: nova seção "Decisões pendentes" listando `brain/decisions/pending/` com deadline próximo (≤3 dias)
- **ATD**: convergência forte pode virar ATD automático com prefix `ATD decide:` + deadline 14d
- **Daily git update routine** (9h BRT): roda `rbrain cofounder-extract` se última execução >48h
- **Domain**: todo item de decisão tagueado `domain:strategy` + linkado ao hub `domain-strategy` (criar se não existir)

## O que NÃO fazer nesta versão

- Não auto-aprovar nada. LLM sugere, humano decide.
- Não tentar classificar "urgência" automaticamente — deadline fixo 14d evita micro-otimização.
- Não unificar com todos os outros feedbacks (clientes, prospects). Escopo: só sócios, por enquanto.
- Não gamificar (scorecards por sócio). Cria perverse incentives.

## Próximos passos (se aprovado)

1. Criar estrutura de pastas: `brain/decisions/{pending,decided,outcomes}/`
2. Implementar `rbrain cofounder-extract` em `src/commands/cofounder-extract.ts` (reutilizando embedding + tag-filter existentes)
3. Implementar `rbrain cofounder-propose` em `src/commands/cofounder-propose.ts`
4. Criar hub `brain/concepts/domain-strategy.md` (se não existir)
5. Rodar uma execução piloto cega sobre os últimos 14 dias de WhatsApp cofounder já ingeridos — validar se os clusters fazem sentido antes de montar o ritual
6. Após piloto: calibrar threshold de similaridade + confirmar dia/hora do review

## Critérios de sucesso

Após 8 semanas rodando:
- Ao menos 4 decisões committed no roadmap originadas deste loop
- ≥70% das propostas geradas resultam em decisão (approve ou reject explícito), não deferidas indefinidamente
- ≥2 outcomes positivos mensurados (sinal convergiu → decisão tomada → shipado → validou no mercado)
- Zero incidente de "isso eu já tinha falado, por que não foi feito?" entre sócios

## Status

Proposta aberta para review. Nenhum código/estrutura criada até aprovação explícita.
