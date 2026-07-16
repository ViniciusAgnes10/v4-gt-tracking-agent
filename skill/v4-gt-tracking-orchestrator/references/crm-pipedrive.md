# Pipedrive

## Objetos

Mapear deals, persons, organizations, users, pipelines, stages, activities, notes, custom fields, products, sources, lost reasons e webhooks.

## Regras

- usar IDs de deal/person/organization;
- consultar schemas de custom fields;
- separar status `open`, `won`, `lost`, `deleted` de stage;
- mapear won_time, lost_time, update_time e add_time;
- registrar mudancas de stage por webhook ou snapshots;
- tratar paginacao, rate limits e registros arquivados/deletados.

## Auditoria

- deals abertos em stage incorreto;
- perdas sem lost_reason;
- deals sem person/email/phone;
- valor sem currency;
- atividades vencidas e sem proximo passo;
- campos de origem nao padronizados.
