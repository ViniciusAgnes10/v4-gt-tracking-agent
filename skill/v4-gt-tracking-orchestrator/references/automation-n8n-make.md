# n8n e Make

## Padrao de workflow

Trigger -> Validate -> Normalize -> Idempotency -> Enrich -> Route -> Write -> Readback -> Log -> Alert.

## Regras

- separar ambientes e credenciais;
- usar nomes com cliente, sistema, fluxo e versao;
- salvar event_id/idempotency key;
- tratar retries e erros por etapa;
- criar dead-letter path;
- limitar concorrencia;
- controlar paginacao e rate limit;
- nao misturar sync de CRM com envio de midia no mesmo bloco monolitico;
- criar health check e pausa;
- documentar inputs, outputs e owners.

## n8n

Preferir subworkflows reutilizaveis para auth, normalizacao, logs, retries e notificacoes. Usar static data/banco com cuidado para cursores e locks.

## Make

Usar data stores ou banco para idempotencia e cursores. Monitorar operations, incomplete executions e error handlers. Evitar loops sem limite e cenarios que reenviam historico.

## Evidencia

Exportar JSON/blueprint sanitizado e gerar diagrama do fluxo. Nunca incluir credenciais no export compartilhado.
