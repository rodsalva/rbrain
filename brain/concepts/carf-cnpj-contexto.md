---
type: concept
title: "CARF via CNPJ — Contexto de Contencioso sem Procuração"
domain: technology
domains: [technology, strategy]
tags: [domain:technology, domain:strategy, carf, cnpj, contencioso, manor, infraestrutura, integracao]
---

## Compiled Truth

### O Insight (Milton Mazetto, 15/abr/2026)

O CARF (Conselho Administrativo de Recursos Fiscais) tem dados públicos acessíveis por CNPJ.
**Sem procuração. Sem autorização do cliente. Sem estar "dentro" da empresa.**

Isso significa que ao receber o CNPJ de um cliente, Manor pode imediatamente:
- Puxar todos os processos administrativos tributários do cliente no CARF
- Gerar análises completas de cada processo (via Saulo, o agente Manor)
- Criar monitoramentos automáticos de andamento
- Tudo isso antes do primeiro acesso do cliente

### Por que isso é mais importante que SPED para Manor agora

Manor foca em **contencioso tributário + compliance + consultoria** — não em garantir
o funcionamento fiscal operacional da empresa. Para esse foco:

| Fonte | Relevância | Barreira de acesso |
|---|---|---|
| CARF via CNPJ | Alta — é o contencioso | Nenhuma — dado público |
| SPED | Média-alta — é operacional | Alta — precisa procuração + confiança total |

Milton: "Na minha opinião o SPED não é tão interessante quanto isso aqui."
Felipe: "Concordo. E é muito longe de onde estamos. Outro business. Auditoria."

### Fontes públicas por CNPJ (sem procuração)

- **CARF:** `carf.fazenda.gov.br` — processos administrativos, recursos, acórdãos
- **TRF3/PJe:** `pje1g.trf3.jus.br` — processos judiciais federais vinculados ao CNPJ

Exemplo de what's there para um CNPJ grande (ex: BTG 30.306.294/0001-45):
lista completa de processos no CARF, incluindo empresas do grupo.

### A visão de produto (Milton)

> "Pensa no cliente entrando na Manor com o CNPJ. A Manor entra no CARF e pra cada processo
> gera uma resposta completa do Saulo e deixa pronta esperando o primeiro acesso,
> e cria monitoramentos com base nisso."

Isso transforma Manor de um Q&A sobre leis em um sistema de **inteligência de contencioso
personalizada por cliente** — carregada automaticamente, sem friction de onboarding.

### Implicação para o moat

Esta é a integração de contexto certa para o momento:
- Pública → sem dependência de confiança do cliente para acesso inicial
- Específica por empresa → OpenAI genérico não faz isso sem os pipes
- Alinhada com o foco (contencioso) → não é uma feature ortogonal

É o equivalente ao que Harvey tem com o contexto de cada cliente — mas acessível
desde o primeiro dia, sem anos de relacionamento.

---

## Timeline

- **2026-04-15** | Insight — Milton identificou CARF via CNPJ como a integração de
  contexto prioritária para Manor. Dados públicos, sem procuração, diretamente relevante
  para contencioso. Felipe confirmou. SPED deslocado para horizonte futuro (auditoria).
