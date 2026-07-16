# Meta Ads, Pixel e Conversions API

## Camadas

- Pixel/browser;
- Conversions API/server;
- Dataset/Pixel;
- Test Events;
- diagnostics e Event Match Quality;
- Custom Audiences.

## Evento server-side

Validar na documentacao atual:

- event_name;
- event_time;
- event_id;
- action_source;
- event_source_url quando aplicavel;
- user_data normalizado e hasheado conforme regra;
- custom_data com value/currency quando aplicavel;
- fbp/fbc e identificadores da plataforma;
- test_event_code no ambiente de teste.

## Deduplicacao

Para o mesmo evento browser/server, usar o mesmo `event_name` e `event_id`. Manter event_id estavel em retries. Nao gerar novo ID para a mesma conversao.

## Go-live

1. validar Pixel e dominio;
2. preparar eventos;
3. enviar Test Event;
4. confirmar payload e match;
5. definir `GO_LIVE_AT`;
6. ativar producao;
7. monitorar diagnostics, latencia e duplicidade.

## Regras de negocio

- Lead nao deve necessariamente ser o principal objetivo se MQL, oportunidade ou venda representam qualidade;
- nao enviar eventos anteriores ao go-live automaticamente;
- usar value/currency com fonte explicita;
- nao enviar PII sem normalizacao, base legal e controles;
- registrar resposta, request ID, erro e tentativas.

## Publicos

Criar somente com regras aprovadas e identidades validas. Excluir clientes de prospeccao quando a estrategia exigir. Separar sem viabilidade de perdas recuperaveis.
