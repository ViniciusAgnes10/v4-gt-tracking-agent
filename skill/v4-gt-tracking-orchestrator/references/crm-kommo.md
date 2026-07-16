# Kommo

## Objetos e pontos de auditoria

Mapear leads, contacts, companies, users, pipelines, statuses, custom fields, sources, tags, tasks, notes, loss reasons, webhooks e Salesbot/automações.

## Regras de integracao

- usar OAuth e subdominio por cliente;
- paginar e respeitar limites da API;
- buscar por updated_at quando suportado;
- expandir ou consultar contatos vinculados;
- resolver custom fields por ID;
- diferenciar status de pipeline de tags historicas;
- validar leads duplicados e leads sem contato;
- registrar eventos de mudanca de stage por webhook ou snapshots comparados.

## Auditoria operacional

- leads sem responsavel;
- etapas sem criterio;
- perda sem motivo;
- venda sem valor;
- campos de origem vazios;
- automacoes que movem etapas;
- bots que criam registros duplicados;
- fontes de chat/WhatsApp sem UTMs;
- campos nao persistentes entre contato e lead.

## GTM Kommo chat button

O asset `assets/gtm/kommo-chat-button/template.tpl` instala o botao de chat da Kommo. Ele nao implementa UTMs, click IDs, dataLayer, GA4, CAPI ou conversoes offline. Tratar como componente de entrada e adicionar captura de origem separadamente.

## Evidencia

Consultar a documentacao oficial atual da Kommo antes de definir endpoints, filtros, webhooks ou limites.
