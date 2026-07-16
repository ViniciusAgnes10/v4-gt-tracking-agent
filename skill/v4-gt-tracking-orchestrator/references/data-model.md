# Modelo de Dados

## Tabelas nucleares

### BASE_CRM

Uma linha por lead/deal. Representar o estado atual. Chave: `lead_id`.

Campos: dados principais, flags de funil, origem, contato, CRM, first touch, last touch, click IDs, comerciais e timestamps.

### TRACKING_EVENTOS_CRM

Historico imutavel. Chave: `lead_id + internal_event`. Nao sobrescrever eventos emitidos; corrigir por evento de ajuste ou campo de auditoria.

### TRACKING_ATUAL_CRM

Visao atual por lead. Chave: `lead_id`. Conter stage atual, marcos historicos, elegibilidade e ultima atualizacao.

### API_STATUS

- item;
- status;
- updated_at;
- quantidade;
- duracao_ms;
- ultimo_cursor;
- observacao;
- owner.

### LOG_ERROS_API

- error_id;
- timestamp;
- lead_id;
- internal_event;
- platform;
- action;
- code;
- message_sanitized;
- attempts;
- retry_at;
- corrected;
- corrected_at;
- owner.

### DOCS_EVIDENCE

- platform;
- document_title;
- official_url;
- consulted_at;
- version;
- relevant_rule;
- implementation_impact.

### APPROVAL_QUEUE

- approval_id;
- client;
- action;
- target;
- before_state;
- proposed_state;
- risk;
- rollback;
- requested_at;
- requested_by;
- approved_at;
- approved_by;
- status.

## Identidade

Normalizar sem destruir o valor bruto:

- email_raw / email_normalized;
- phone_raw / phone_e164;
- gclid / gbraid / wbraid / msclkid / fbclid;
- fbp / fbc;
- platform_lead_id;
- contact_id / lead_id / customer_id.

## Datas

Guardar UTC para processamento e timezone local para exibicao. Nao converter timestamps sem registrar timezone de origem.

## Valores

Separar:

- deal_value;
- recurring_monthly_value;
- contracted_revenue;
- realized_revenue;
- currency;
- value_source;
- value_confidence.
