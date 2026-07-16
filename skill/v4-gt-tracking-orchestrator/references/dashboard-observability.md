# Dashboard e Observabilidade

## Camadas do dashboard

1. Executivo: receita, vendas, CAC, ROAS, pipeline e forecast.
2. Growth: investimento, leads reais, CPL real, conversao e qualidade.
3. Comercial: SLA, aging, owner, perdas, velocidade e produtividade.
4. Tracking: cobertura de IDs, UTMs, match rate, duplicidade, erros e frescor.
5. Operacao: jobs, duracao, filas, retries, ultima sincronizacao e pendencias.

## Estados obrigatorios

- atualizado;
- atrasado;
- parcial;
- sem dados;
- erro;
- em manutencao;
- aguardando aprovacao.

Nunca mostrar zero quando a realidade for dado ausente.

## Metricas de qualidade

- % com source;
- % com UTM completa;
- % com GCLID/FBCLID/MSCLKID;
- % com telefone/email valido;
- % com motivo de perda e valor;
- match exato/fallback/nao identificado;
- eventos duplicados;
- falhas por conector;
- lag de ingestao;
- sucesso de envio;
- Event Match Quality quando disponivel.

## Cadencia

- operacional: 5-15 min;
- tracking QA: diario;
- funil e midia: diario/semanal;
- auditoria de governanca: semanal/mensal;
- revisao de documentacao e APIs: mensal ou antes de mudancas.
