# V4 GT Tracking Orchestrator

Skill e ChatGPT App para diagnosticar, implementar, auditar e governar tracking, CRM, RevOps, atribuição, conversões de mídia, públicos e dashboards.

## Dois componentes

1. `SKILL.md`: cérebro operacional, gates, regras, referências, scripts e adaptadores.
2. `assets/chatgpt-app/`: aplicação MCP com console visual dentro do ChatGPT.

## Interface

O console possui:

- visão executiva;
- sete gates;
- integrações e acessos;
- fila de aprovações;
- documentação oficial;
- QA;
- logs;
- pausa e retomada;
- execução via n8n/Make em dry-run ou produção.

## Início rápido da Skill

1. Instalar `skill.zip`.
2. Pedir: `Execute o Gate 1 do GT de Tracking para o cliente X.`
3. Manter a primeira fase em leitura.
4. Aprovar ações externas gate a gate.

## Início rápido da interface

Copiar `assets/chatgpt-app/` para um repositório próprio e seguir o README interno. Hospedar o endpoint `/mcp` em HTTPS e conectar como app em Developer Mode.
