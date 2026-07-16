# HubSpot

## Objetos

Mapear contacts, companies, deals, owners, pipelines, stages, properties, associations, engagements, forms, marketing events e subscriptions/webhooks.

## Regras

- consultar properties e internal names antes do mapeamento;
- usar object IDs e association types;
- tratar archived records;
- paginar com cursor;
- usar updatedAt para incremental com overlap;
- observar limites de apps privados/OAuth;
- mapear lifecycle stage separadamente de deal stage;
- nao depender apenas de `hs_analytics_source` para atribuicao completa.

## Auditoria

- propriedades first/last touch;
- original source drill-down;
- deals sem contact/company;
- valor, moeda e close date;
- stage history quando disponivel;
- workflows que alteram lifecycle/stage;
- formulários e hidden fields;
- consentimento e subscriptions.
