# V4 GT Tracking Agent App

ChatGPT App interna para operar a Skill `v4-gt-tracking-orchestrator` com uma interface visual dentro da conversa.

## Arquétipo

`interactive-decoupled`, privado/interno. O modelo usa ferramentas de dados e operação; `render_tracking_console` abre o widget visual.

## Recursos

- Workspaces por cliente.
- Sete gates de implementação.
- Cadastro de integrações e acessos.
- Fila de aprovação com risco, reversibilidade e rollback.
- Execução via webhook n8n/Make em modo `dry_run` ou `live`.
- Evidências de documentação oficial.
- QA, logs, pausa e estado operacional.
- Interface responsiva com visão executiva, gates, integrações, aprovações, documentação, QA e logs.
- Ferramentas MCP `search` e `fetch` para conhecimento local.

## Executar localmente

```bash
cp .env.example .env
npm install
npm run check
npm run seed
npm start
```

Endpoint MCP: `http://127.0.0.1:2091/mcp`

Exponha com HTTPS durante o desenvolvimento:

```bash
ngrok http 2091
```

No ChatGPT Work, habilite Developer Mode e crie um app apontando para `https://SEU-DOMINIO/mcp`.

## Segurança

- `EXECUTION_MODE=dry_run` por padrão.
- Nenhuma credencial no repositório ou estado.
- Ações externas exigem registro aprovado.
- Ações de risco alto sem reversibilidade são bloqueadas.
- O executor chama somente o webhook configurado em variável de ambiente.
- Opera/Computer Use continuam sendo ferramentas separadas do ChatGPT e devem registrar evidência no workspace.

## Limite operacional

O app não herda automaticamente sessões do Opera nem credenciais dos plugins. O modelo coordena as ferramentas disponíveis na conversa; o app mantém o estado, a interface e a governança.
