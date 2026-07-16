# Funil e Eventos

## Eventos nucleares

| Marco | Evento interno | Meta sugerido | Google sugerido | Timestamp preferencial |
|---|---|---|---|---|
| Lead | lead_created | Lead | secundario/observacao | created_at |
| MQL | mql_created | QualifiedLead | CRM - MQL | entrada na etapa |
| SQL | sql_created | QualifiedLead | CRM - SQL | entrada na etapa |
| Oportunidade | opportunity_created | custom/qualificado | CRM - Oportunidade | entrada na etapa |
| Venda | purchase_won | Purchase | CRM - Venda Ganha | closed_won_at |
| Perda | deal_lost | normalmente nao enviar | normalmente nao enviar | closed_lost_at |

Adaptar nomes e recursos a documentacao da plataforma e ao modelo de negocio.

## Regras

- Separar marco historico de stage atual.
- Priorizar stage atual sobre tags antigas para publicos ativos.
- Registrar maior etapa atingida para perdas.
- Nao emitir duas vezes o mesmo evento interno.
- Manter `event_id` estavel em retries.
- Nao usar updated_at como timestamp do evento quando existir data real de entrada na etapa.
- Se a data exata nao existir, registrar `timestamp_method` e confianca.

## Campos do evento

- event_id;
- event_time;
- event_time_unix;
- lead_id/contact_id;
- name/email/phone;
- value/currency;
- source/channel/campaign/adset/ad;
- UTMs e click IDs;
- previous_stage/current_stage;
- internal_event;
- platform_event_names;
- audience_in/audience_out;
- send_status/attempts/error;
- go_live_eligible.
