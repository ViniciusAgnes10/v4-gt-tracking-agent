# Google Sheets, BigQuery e Supabase

## Escolha

### Google Sheets

Usar para baixo/medio volume, operacao visivel e prototipos. Implementar escrita em lote, locks, aba de status, protecao de formulas e limites de tamanho.

### BigQuery

Usar para grande volume, historico, joins, attribution hub e BI. Particionar por data, clusterizar por IDs relevantes, controlar custos e usar tabelas raw/staging/marts.

### Supabase/Postgres

Usar para estado operacional, APIs, filas leves, row-level security e aplicacoes. Criar migrations, constraints, unique keys, indexes, audit columns e backups.

## Camadas

- raw: payload original sanitizado;
- staging: tipos e normalizacao;
- core: entidades e eventos;
- marts: funil, atribuicao, publicos e dashboard.

## Regras

- unique constraint para `lead_id + internal_event`;
- upsert por ID nativo;
- timestamps UTC;
- schema version;
- lineage e owner;
- retencao e PII separadas;
- views para consumidores;
- testes de qualidade e reconciliacao.
