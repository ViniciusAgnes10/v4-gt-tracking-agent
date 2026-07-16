# Regras de Atribuicao

## Hierarquia de evidencia

1. Identificador individual exato: GCLID, GBRAID, WBRAID, MSCLKID, platform lead ID, FBCLID/FBC quando defensavel.
2. UTMs completas e persistidas.
3. Source nativo da integracao.
4. Campo estruturado de origem/campanha.
5. Tags ou texto como fallback fraco.
6. Nao identificado.

## First e last touch

Nunca sobrescrever first touch. Atualizar last touch somente com nova interacao valida. Guardar timestamp, landing page, referrer, source, medium, campaign, content, term e click ID.

## Hub de atribuicao

Campos minimos:

- lead_id;
- touch_type;
- platform;
- campaign/adgroup/ad/keyword/search_term;
- match_method;
- evidence;
- confidence;
- matched_at;
- source_timestamp;
- revenue;
- stage.

## Confianca sugerida

- 100: click ID individual exato e valido.
- 90: platform lead ID ou integracao nativa individual.
- 80: UTM completa e persistida desde a sessao de entrada.
- 70: campanha exata sem identificador individual.
- 40: source/canal estruturado sem campanha.
- 25: sinais de plataforma sem identificador.
- 0: sem evidencia.

Nao preencher detalhes mais granulares que a evidencia. Match por campanha nao autoriza preencher ad, keyword ou search term.

## Multitoque

Registrar influencias separadas. Nao apagar first touch para forcar last click. Permitir modelos de relatorio, mas manter a camada de fatos intacta.
