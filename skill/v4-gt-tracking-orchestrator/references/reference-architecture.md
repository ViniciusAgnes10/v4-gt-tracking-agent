# Arquitetura de Referencia

## Fluxo logico

```text
Sites / LPs / Forms / WhatsApp / Calls
              |
              v
Identity Capture: UTMs + click IDs + cookies + consent
              |
              v
CRM / Marketing Automation / Commerce / Billing
              |
              v
Ingestion Layer: API, webhook, polling, files
              |
              v
BASE_CRM + CONTACT_IDENTITY + SOURCE_EVENTS
              |
              v
TRACKING_EVENTOS_CRM + TRACKING_ATUAL_CRM
              |
       +------+-------+
       |              |
       v              v
Media Connectors   Attribution Hub
       |              |
       v              v
Meta / Google / TikTok / LinkedIn / Microsoft
              |
              v
Audiences + Dashboards + Decisions
```

## Componentes

| Componente | Funcao | Chave | Frequencia | Contingencia |
|---|---|---|---|---|
| Identity Capture | capturar origem e identidade | session/contact | tempo real | form hidden fields + cookie |
| Ingestion | trazer dados da fonte | source record id | webhook/polling | overlap e replay |
| BASE_CRM | estado atual consolidado | lead/deal id | 5-15 min | full sync manual |
| Event Store | marcos imutaveis | lead + event | continuo | dedup e replay interno |
| Media Connectors | devolver conversoes | event_id/order_id | 5-60 min | fila e retry |
| Attribution Hub | reconciliar cliques e receita | lead/contact/event | 15-60 min | fallback classificado |
| Audiences | segmentar identidades | audience + identity | 1-24 h | rebuild completo |
| Dashboard | monitorar negocio e tracking | metric + time | 5 min-diario | stale state explicito |

## Build vs buy

Preferir ferramentas gerenciadas quando reduzem risco operacional. Usar codigo proprio para regras de negocio, deduplicacao, atribuicao, normalizacao e auditoria que precisam de controle e explicabilidade.
