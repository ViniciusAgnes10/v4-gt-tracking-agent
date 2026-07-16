# Google Tag Manager e GA4

## Auditoria GTM

Inventariar containers, environments, tags, triggers, variables, templates, consent settings, workspaces, versions e owners. Exportar backup antes de mudancas.

## DataLayer recomendado

Definir eventos com contrato versionado:

```javascript
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({
  event: 'lead_submit',
  event_id: '[STABLE_EVENT_ID]',
  form_id: '[FORM_ID]',
  lead_source: '[SOURCE]',
  utm_source: '[UTM_SOURCE]',
  gclid: '[GCLID]',
  fbclid: '[FBCLID]'
});
```

Nao inserir PII em dataLayer ou GA4 sem avaliacao de politica e privacidade.

## Captura de origem

- query params de UTM;
- gclid, gbraid, wbraid, fbclid, msclkid;
- referrer e landing page;
- first touch imutavel;
- last touch atualizado;
- hidden fields em formularios;
- cookies/first-party storage com consentimento;
- propagacao para CRM.

## GA4

Definir eventos, parametros, key events/conversions, user properties permitidas, cross-domain, referral exclusions, data retention, internal traffic e debug. Validar em DebugView/Realtime e nos relatorios posteriores.

## GTM QA

1. backup/export;
2. workspace isolado;
3. Preview/Tag Assistant;
4. validar triggers e variables;
5. validar consentimento;
6. validar network requests;
7. validar duplicidade;
8. aprovar;
9. publicar com nome e descricao;
10. monitorar e ter rollback de versao.

## Server-side

Usar quando houver tese clara de controle, privacidade, resiliencia ou qualidade. Definir custos, hosting, first-party domain, clients, tags, transformations, logs e observabilidade.
