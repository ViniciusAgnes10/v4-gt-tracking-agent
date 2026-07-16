# Google Ads

## Recursos

- conversion actions;
- offline click conversions;
- Enhanced Conversions for Leads;
- Google Ads Data Manager;
- Customer Match;
- Google Ads API;
- GCLID, GBRAID, WBRAID;
- Click View e Search Terms quando acessiveis.

## Conversoes

Mapear MQL, SQL, Oportunidade e Venda. Para cada acao definir:

- nome exato;
- categoria;
- primary/secondary;
- valor e moeda;
- janela;
- inclusion in optimization;
- origem do timestamp;
- identificadores aceitos.

## Upload

Campos tipicos:

- order_id/event_id;
- conversion_action;
- conversion_date_time com timezone;
- value;
- currency;
- gclid/gbraid/wbraid quando aplicavel;
- email/phone normalizados para enhanced conversions;
- lead_id e internal_event para auditoria interna.

## Regras

- nao exportar antes do go-live;
- nao exportar evento ja aceito;
- usar Order ID unico e estavel;
- ignorar evento sem acao definida;
- registrar partial failures;
- tratar ajustes/retractions apenas com processo aprovado;
- nao inventar keyword/search term sem ligacao defensavel.

## Atribuicao

- GCLID individual: match exato;
- campanha exata sem click ID: preencher apenas campanha;
- sinais de Google sem identificador: marcar como Google sem detalhamento;
- search term sem vinculo individual: classificar como provavel e explicar metodo.
