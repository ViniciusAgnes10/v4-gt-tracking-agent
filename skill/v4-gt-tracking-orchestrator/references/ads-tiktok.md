# TikTok Ads

## Escopo

Mapear Pixel, Events API, Instant Forms/Lead Generation, Events Manager, offline events, audiences e identificadores suportados pela conta e regiao.

## Processo

- consultar documentacao oficial atual;
- identificar pixel/event source e access token;
- mapear eventos padrao/custom;
- implementar deduplicacao browser/server;
- normalizar e proteger user data;
- validar ambiente de teste/diagnostics;
- registrar go-live e respostas.

## CRM e leads

Persistir identificador do lead de formulario, UTMs, click ID quando fornecido, ad/campaign metadata, timestamp e consentimento. Reconciliar lead nativo com CRM por ID individual antes de usar email/telefone como fallback.

## Regras

Nao assumir paridade com Meta ou Google. Confirmar nomes de eventos, campos obrigatorios, janelas, hashing, limites e recursos elegiveis na documentacao e na conta.
