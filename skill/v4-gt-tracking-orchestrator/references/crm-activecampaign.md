# ActiveCampaign

## Escopo

Tratar ActiveCampaign como automacao de marketing e CRM quando deals/pipelines estiverem em uso.

## Objetos

Mapear contacts, contact fields, tags, lists, automations, campaigns, forms, event tracking, site tracking, deals, pipelines, stages, users e webhooks.

## Regras

- separar tags historicas de status atual;
- evitar usar inscricao em lista como unica definicao de etapa;
- mapear contact ID para deal IDs;
- controlar duplicidade por email e IDs nativos;
- registrar eventos de conversao e automacoes que alteram deals;
- validar Site Tracking/Event Tracking e consentimento;
- usar API com paginacao, rate limit e retries.

## Auditoria

- tags conflitantes;
- automacoes circulares;
- contatos sem origem;
- deals sem contato;
- campos de UTM sobrescritos;
- eventos sem timestamp ou chave de deduplicacao.
