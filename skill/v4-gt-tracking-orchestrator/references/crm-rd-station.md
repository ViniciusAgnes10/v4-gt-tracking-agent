# RD Station CRM e Marketing

## Separar produtos

Nao confundir RD Station CRM com RD Station Marketing. Mapear contas, autenticacao, objetos e IDs de cada produto.

## CRM

Auditar deals, contacts, organizations, users, pipelines, deal stages, sources, custom fields, loss reasons, activities e webhooks/automacoes disponiveis.

## Marketing

Auditar conversoes, identificadores de lead, campos, lifecycle, segmentacoes, automacoes, eventos, UTMs, origem, landing pages, formularios e integracoes.

## Reconciliacao

Definir chave entre Marketing e CRM: email, contact ID, conversion identifier ou outra chave persistente. Nao assumir que nomes ou telefones sao unicos.

## Pontos criticos

- duplicidade de contatos;
- conversoes repetidas;
- troca de lifecycle sem historico;
- origem sobrescrita;
- deals sem contato;
- inconsistencias entre funil de marketing e vendas;
- webhooks sem idempotencia.
