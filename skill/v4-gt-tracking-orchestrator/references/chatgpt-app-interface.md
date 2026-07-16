# ChatGPT App e interface operacional

## Objetivo

Usar a ChatGPT App `V4 GT Tracking Agent` como plano de controle visual da Skill. A Skill continua sendo o cérebro de raciocínio e processo; o app mantém estado por cliente, exibe gates, integrações, aprovações, documentação, QA, logs e despacha ações aprovadas.

## Arquétipo

`interactive-decoupled`, de uso interno/privado.

- Ferramentas de dados retornam `structuredContent` reutilizável.
- `render_tracking_console` abre o widget.
- A interface chama ferramentas aprovadas por `window.openai.callTool`.
- A interface pode solicitar fullscreen com `window.openai.requestDisplayMode`.
- O servidor usa MCP e registra o widget como `text/html;profile=mcp-app`.

## Fluxo obrigatório

1. Chamar `list_tracking_clients`.
2. Criar workspace com `create_tracking_client` quando necessário.
3. Carregar `get_tracking_dashboard`.
4. Renderizar `render_tracking_console`.
5. Registrar o diagnóstico com `run_tracking_gate`.
6. Para qualquer escrita externa, usar `queue_tracking_action`.
7. Aguardar aprovação explícita.
8. Registrar decisão com `review_tracking_action`.
9. Executar somente com `execute_tracking_action` e executor configurado.
10. Registrar documentação e QA.

## Ferramentas

### Leitura

- `list_tracking_clients`
- `get_tracking_dashboard`
- `render_tracking_console`
- `search`
- `fetch`

### Escrita local e reversível

- `create_tracking_client`
- `update_tracking_profile`
- `register_tracking_integration`
- `run_tracking_gate`
- `queue_tracking_action`
- `review_tracking_action`
- `record_tracking_docs_evidence`
- `record_tracking_qa`
- `set_tracking_agent_pause`

### Escrita externa

- `execute_tracking_action`

O executor deve iniciar com `EXECUTION_MODE=dry_run`. Em produção, enviar ações aprovadas para um webhook n8n/Make ou serviço próprio. Nunca colocar tokens no payload visível ao modelo ou widget.

## Opera e Computer Use

A ChatGPT App não herda automaticamente sessão, cookies ou ferramentas do Opera. O modelo coordena o app e o Opera na mesma conversa:

- usar Opera para navegação, leitura, screenshot e evidência;
- usar Computer Use quando houver clique e digitação disponíveis;
- usar API/conector para ações determinísticas;
- registrar a evidência no app;
- não marcar execução como concluída sem verificação objetiva.
