---
type: concept
title: "Strategic Signal → Roadmap Decision Loop"
domain: strategy
tags: [domain:strategy, process, ritual, cofounder, roadmap, manor, signal-intelligence]
status: proposal
---

## Problema

Hoje o RBrain ingere continuamente múltiplas fontes de sinal estratégico (WhatsApp dos sócios, Granola, Braintrust, Google Docs). O sinal entra, fica pesquisável, aparece ocasionalmente no briefing — **mas não existe um ritual estruturado que converta convergência de sinais em decisão commitada no roadmap**.

Resultado: insights importantes ficam inertes. Quando viram decisão, é por força de quem gritou mais alto ou se lembrou, não por sinal objetivo. E decisões tomadas não têm rastro de qual fonte as originou.

Esta proposta fecha o loop: **sinal multi-fonte → convergência → proposta de decisão → review semanal → commit no roadmap → mensuração pós-decisão**.

## Princípios

1. **Convergência antes de decisão** — uma fonte com forte opinião = ruído; duas ou mais convergindo = sinal. Threshold explícito evita reação impulsiva.
2. **Convergência cross-source vale mais** — sócio + cliente Braintrust + Harvey dizendo a mesma coisa > três sócios dizendo a mesma coisa. Peso diferenciado por fonte.
3. **Roadmap é o destino** — toda decisão vira movimento nos 20 blocos (10 Tax Intelligence OS + 10 Tax Execution Platform). Sem destino, não é decisão.
4. **Rastro bidirecional** — cada bloco do roadmap referencia o sinal que o originou; cada cluster referencia qual bloco endereçou.
5. **Timebox** — sinal sem decisão em 2 semanas é escalado ou arquivado com motivo. Inércia é decisão implícita ruim.
6. **Mensuração** — decisões shipadas voltam pro loop: a convergência acertou? Aprende-se o padrão por fonte e por tipo.

## Fontes de sinal

| Fonte | Status ingestão | Peso sugerido | Racional |
|---|---|---|---|
| **WhatsApp cofounders** | ✅ existe | 3 | Sinal interno mais forte, mas viesado por proximidade |
| **Granola** (reuniões) | ✅ existe | 2 | Captura discussões estruturadas com clientes/prospects/sócios |
| **Braintrust** (feedback) | ✅ existe | 2 | Input de clientes reais usando o produto |
| **Google Drive** (docs) | ✅ existe | 1 | Documentos colaborativos — sinal denso mas menos frequente |
| **YouTube** (legaltech/VC) | ❌ **a construir** | 2 | Sinal externo de mercado, antecipa tendência |
| **Slack** | ✅ existe | 1 | Conversas operacionais, raramente estratégicas |

### Curadoria YouTube (novo componente)

**Três modos de busca** — nenhum é um canal fixo:

1. **People mode** — entrevistas recentes com pessoas específicas em qualquer canal:
   - Max Junestrand (Legora cofounder), Winston Weinberg / Gabe Pereyra (Harvey AI), demais founders de legaltech vertical-AI
   - Query YouTube: `"<nome>" interview` restrito a últimos 30 dias
   - Captura independentemente de qual canal hospedou

2. **Trending mode** — vídeos recentes bombando em canais VC/strategy:
   - **a16z** (Andreessen Horowitz) — vertical AI, enterprise, founder content
   - **Sequoia Capital** — AI Ascent, arc talks, founder interviews
   - **20VC** (Harry Stebbings) — founder + investor interviews
   - **YC** — office hours, founder talks
   - Filtros: últimos 14 dias + views acima de threshold do canal (ex: 50k+ pra a16z/Sequoia, 20k+ pra 20VC)

3. **Ad-hoc mode** — `rbrain youtube <url>` pra qualquer vídeo que o Rodrigo quiser forçar pra dentro (algo viralizando fora do radar)

Filtro comum em todos os modos: keywords relevantes no título/descrição/transcript:
`legaltech, tax, legal AI, vertical AI, founder, GTM, product strategy, enterprise AI, agentic workflow, compliance, ops, AI startup, legal tech, lawyer AI`

Páginas salvas com frontmatter: `source_type: youtube`, `channel: <nome>`, `featured_person: <se people mode>`, `url: <link>`, `published_at: <data>`, `view_count: <n>`. Tag automática: `source:youtube`, `source:youtube-<channel-slug>`, `source:youtube-<person-slug>` quando aplicável.

Ingestão roda diariamente (8h BRT, antes do git-update das 9h).

## Arquitetura do loop

```
[WhatsApp sócios] ──┐
[Granola]          ──┤
[Braintrust]       ──┼─→ ingest (maioria já existe)
[Google Drive]     ──┤
[YouTube curado]   ──┘   (a construir)
      ↓
[brain concepts/sources com source: tag + weight]
      ↓ extract (novo: rbrain signal-extract)
[signal-clusters com ≥2 fontes convergindo, peso agregado ≥ threshold]
      ↓ propose (novo: rbrain signal-propose)
[brain/decisions/pending/*.md — proposta + bloco-alvo + sinais fonte]
      ↓ review semanal (ritual humano, quinta 17h BRT)
[decisão: approve / defer / reject + justificativa]
      ↓ commit (manual pelo Rodrigo)
[bloco do roadmap atualizado + brain/decisions/decided/*.md]
      ↓ ship + measure
[post-decision: hit/miss loggado em brain/decisions/outcomes/]
```

## Componentes

### 1. Extração de convergência (`rbrain signal-extract`)

- Lê páginas taggeadas com `source:*` nos últimos 14 dias (janela configurável por source — YouTube pode ter 30 dias, WhatsApp só 14)
- Agrupa por tema usando embedding similarity (threshold 0.82 inicial)
- Calcula peso do cluster = soma dos pesos das fontes distintas presentes (não soma de itens; 3 mensagens do mesmo sócio = peso 3, não 9)
- Identifica clusters com peso ≥ 4 (ex: 2 sócios + 1 cliente Braintrust = 3+2+2 = 7; ou 1 sócio + 1 vídeo Sequoia + 1 Granola = 3+2+2 = 7)
- Output: lista de clusters com fontes, trechos-chave, data primeiro/último sinal, peso agregado

Threshold inicial de peso = **4**. Calibra após piloto.

### 2. Proposta de decisão (`rbrain signal-propose`)

- Para cada cluster, gera rascunho em `brain/decisions/pending/YYYY-MM-DD-{slug}.md` com:
  - **Sinais:** fontes, trechos-chave, timestamps, peso por fonte, peso total
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
- Output: move pra `brain/decisions/decided/` com `decision:` e `committed_block:` se approve

### 4. Commit no roadmap

- Decisão approved → Rodrigo edita o bloco correspondente em `brain/concepts/manor-product-roadmap.md`
- Adiciona linha `origem: brain/decisions/decided/YYYY-MM-DD-{slug}` no bloco (com fontes listadas)
- Commit git com referência cruzada

### 5. Mensuração pós-decisão

- Quando o bloco é shipado (release tag ou marco), criar `brain/decisions/outcomes/YYYY-MM-DD-{slug}.md`
- Campos: `original_signals`, `decision`, `shipped_at`, `hit|miss|partial`, `learnings`, `sources_that_were_right`
- Retro trimestral: ler outcomes, identificar padrões:
  - Quais fontes acertam mais? (recalibrar pesos)
  - Quais tipos de convergência produzem melhores decisões?
  - YouTube antecipa ou segue o mercado?

## Integração com infraestrutura existente

- **Daily briefing**: nova seção "Decisões pendentes" listando `brain/decisions/pending/` com deadline ≤3 dias + fontes resumidas
- **ATD**: convergência forte (peso ≥6) vira ATD automático com prefix `ATD decide:` + deadline 14d
- **Daily sync 3x/dia**: YouTube ingestão entra como novo passo (após Braintrust, antes do Organize)
- **Daily git-update (9h BRT)**: roda `rbrain signal-extract` se última execução >48h
- **Domain**: todo item de decisão tagueado `domain:strategy` + linkado ao hub `domain-strategy`

## O que NÃO fazer nesta versão

- Não auto-aprovar nada. LLM sugere, humano decide.
- Não tentar classificar "urgência" automaticamente — deadline fixo 14d evita micro-otimização.
- Não ingerir YouTube sem curadoria de canal — seria ruído infinito.
- Não gamificar (scorecards por sócio/fonte). Cria perverse incentives.
- Não considerar sinais de clientes prospects (fora do Braintrust) nesta v1 — escopo.

## Próximos passos (se aprovado)

### Pré-requisito: construir ingestão YouTube
1. Implementar `src/commands/youtube.ts` usando YouTube Data API + transcript extractor
2. Definir `~/.rbrain/youtube-channels.json` com lista curada (Legora, Harvey, Sequoia, a16z, YC, ad-hoc)
3. Adicionar filtro de keywords + paginação por data de publicação
4. Testar em 1 canal primeiro (Legora) antes de escalar
5. Integrar no `rbrain-daily-sync.sh`

### Loop propriamente dito
6. Criar estrutura `brain/decisions/{pending,decided,outcomes}/`
7. Implementar `rbrain signal-extract` em `src/commands/signal-extract.ts`
8. Implementar `rbrain signal-propose` em `src/commands/signal-propose.ts`
9. Criar hub `brain/concepts/domain-strategy.md` se não existir
10. Piloto cego: rodar sobre últimos 14-30 dias já ingeridos (sem YouTube inicialmente) — validar clusters
11. Após piloto: calibrar threshold de similaridade + peso por fonte + confirmar dia/hora do review

## Critérios de sucesso

Após 8 semanas rodando:
- Ao menos 4 decisões commited no roadmap originadas deste loop
- ≥70% das propostas geradas resultam em decisão (approve ou reject explícito), não deferidas indefinidamente
- ≥2 outcomes positivos mensurados (sinal convergiu → decisão tomada → shipado → validou)
- Zero incidente de "isso eu já tinha falado, por que não foi feito?" entre sócios
- Ao menos 1 decisão com sinal externo (YouTube/Sequoia/Harvey) predominante — prova que o loop captura mercado, não só intuição interna

## Status

Proposta aberta para review. Nenhum código/estrutura criada até aprovação explícita.
