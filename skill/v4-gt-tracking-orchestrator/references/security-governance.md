# Seguranca e Governanca

## Segredos

- armazenar em cofre/secret manager ou credencial do conector;
- usar placeholders em arquivos;
- nunca logar Authorization, cookies, tokens, hashes de usuarios ou payloads completos com PII;
- rotacionar credenciais e revogar acessos antigos;
- usar escopo minimo e contas de servico quando possivel.

## LGPD e privacidade

- mapear finalidade, base legal, controlador, operador, retencao e compartilhamento;
- coletar somente o necessario;
- separar dados de identificacao de dados analiticos;
- respeitar consentimento e opt-out;
- definir exclusao, anonimização e atendimento de titulares;
- validar com juridico quando houver dado sensivel, criancas, saude ou alto risco.

## Mudancas

Toda mudanca deve possuir before/after, owner, aprovador, janela, teste, rollback e evidencia. Produzir readback depois da escrita.

## Logs

Sanitizar mensagens. Guardar codigo, endpoint logico, request_id, status, attempts e timestamps, nao o segredo.

## Resiliencia

- idempotencia;
- retries com exponential backoff e jitter;
- dead-letter queue;
- lock de concorrencia;
- circuit breaker para falhas repetidas;
- pausa global e por conector;
- full replay interno controlado;
- health checks.
