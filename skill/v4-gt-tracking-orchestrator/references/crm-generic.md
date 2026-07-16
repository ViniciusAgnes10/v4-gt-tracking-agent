# Adaptador de CRM Generico

## Descoberta

Mapear autenticacao, base URL, versao, objetos, IDs, paginacao, filtros por updated_at, webhooks, rate limits, custom fields, owners, pipelines, stages, loss reasons e associations.

## Interface minima do adaptador

- `health_check()`
- `list_users()`
- `list_pipelines()`
- `list_stages()`
- `list_custom_fields()`
- `list_loss_reasons()`
- `list_records(updated_since, cursor)`
- `get_contacts(record_ids)`
- `normalize_record(raw)`
- `full_sync()`
- `incremental_sync()`
- `diagnose()`

## Regras

- usar IDs como fonte primaria e nomes como aliases;
- manter raw payload separado da camada normalizada quando viavel;
- fazer upsert por ID nativo;
- usar overlap de 15 minutos;
- tratar delecoes/arquivamentos;
- cachear metadados pouco variaveis;
- reconciliar contagens por stage e periodo;
- nao escrever antes da aprovacao.

## Mapeamento

Criar arquivo `crm-field-map.json` com:

- logical_name;
- object_type;
- field_id;
- exact_name;
- aliases;
- data_type;
- transform;
- required;
- source_priority;
- last_verified_at.
