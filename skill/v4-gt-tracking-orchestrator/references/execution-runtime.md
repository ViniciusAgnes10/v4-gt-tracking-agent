# Runtime de execução e governança

## Camadas

1. Skill: raciocínio, gates, regras, referências e scripts.
2. ChatGPT App: interface, estado, aprovações e ferramentas MCP.
3. Executor: n8n, Make, API própria ou worker seguro.
4. Conectores: CRM, mídia, analytics, dados e comunicação.
5. Navegador: inspeção, fallback e evidência.

## Estados de ação

- `draft`: proposta ainda não enviada à aprovação.
- `pending`: aguardando decisão humana.
- `approved`: autorizada, ainda não executada.
- `rejected`: rejeitada.
- `executed`: execução confirmada.
- `execution_error`: tentativa falhou.
- `dry_run`: simulação sem escrita externa.

## Requisitos de uma ação externa

- cliente e plataforma;
- título e objetivo;
- adapter;
- risco;
- reversibilidade;
- payload sem segredo;
- plano de rollback;
- evidências esperadas;
- aprovação no mesmo workspace;
- resultado e timestamp.

## Bloqueios

Bloquear execução quando:

- o agente estiver pausado;
- a ação não estiver aprovada;
- faltar rollback para alteração relevante;
- houver risco alto ou crítico sem reversibilidade;
- o executor não estiver configurado;
- o adapter não estiver allowlisted;
- o payload contiver padrão de segredo;
- a documentação oficial necessária não tiver sido validada;
- o gate anterior estiver bloqueado.

## Produção

- armazenar segredos em Secret Manager;
- usar autenticação entre app e executor;
- assinar requisições ou usar bearer token rotacionável;
- limitar domínios e ações por allowlist;
- registrar tool call ID, latência, status e erro;
- aplicar idempotency key por ação;
- implementar retries com backoff apenas para falhas transitórias;
- manter dead-letter queue;
- testar em `dry_run` antes de `live`.
