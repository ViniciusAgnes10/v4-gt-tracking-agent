# Modelo Operacional do GT de Tracking

## Principio central

O GT deve operar como um sistema de decisao e implementacao auditavel, nao como uma colecao de tags. A cadeia completa precisa ligar aquisicao, identidade, CRM, receita e retorno para midia.

## Gates

| Gate | Objetivo | Saida minima | Bloqueio de avancar |
|---|---|---|---|
| 1 | Entender ambiente e arquitetura | inventario, mapa, riscos, acessos | fonte da verdade e funil desconhecidos |
| 2 | Formalizar dados e eventos | dicionario, stages, aliases, matriz | MQL/SQL/venda nao aprovados |
| 3 | Construir base confiavel | ingestao, upsert, status, erros | contagem nao reconciliada |
| 4 | Criar historico imutavel | eventos unicos e visao atual | duplicidade ou timestamp incoerente |
| 5 | Integrar midia em teste | payloads, test events, Data Manager | teste nao validado |
| 6 | Atribuir e criar publicos | hub, confianca, audiencias | identidade ou regras inseguras |
| 7 | Operar e governar | dashboard, runbook, QA, ownership | falhas criticas ou rollback ausente |

## Classificacao de prioridade

- P0: bloqueia coleta, receita, seguranca ou go-live.
- P1: reduz fortemente atribuicao, match rate ou confiabilidade.
- P2: melhora analise, segmentacao ou eficiencia operacional.
- P3: refinamento, conveniencia ou escala futura.

## Entregavel por gate

Sempre registrar:

1. fatos verificados;
2. premissas;
3. desconhecidos;
4. decisoes;
5. riscos;
6. dependencias;
7. tarefas com dono e prazo;
8. evidencias;
9. aprovacao;
10. criterio de aceite.

## Regra de mudanca

Antes de qualquer mudanca externa:

- capturar estado anterior;
- descrever mudanca;
- informar impacto e risco;
- definir validacao;
- definir rollback;
- solicitar aprovacao quando sensivel;
- executar;
- fazer leitura de confirmacao;
- registrar evidencia.
