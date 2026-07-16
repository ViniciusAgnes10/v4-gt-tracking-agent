# Intake do Cliente

## Dados de negocio

- nome, segmento e modelo de negocio;
- produto, oferta e conversao principal;
- ticket, margem, recorrencia, contrato e ciclo;
- ativacao, instalacao, onboarding, cancelamento e churn;
- cobertura, viabilidade e regras de qualificacao;
- principais motivos de perda;
- metas de leads, MQL, SQL, oportunidades, vendas e receita.

## Aquisição

- canais pagos, organicos, indicacao, parceiros e listas;
- contas, business managers e owners;
- paginas, landing pages, formularios, chat, telefone e WhatsApp;
- UTMs, click IDs, cookies, first/last touch e consentimento;
- investimento e objetivo de otimizacao por plataforma.

## CRM e operacao

- CRM, pipelines, etapas e responsaveis;
- quem move etapas e quais automacoes fazem isso;
- campos obrigatorios, tags, origens, motivos e valores;
- duplicidades, negocios sem contato, sem owner, sem valor ou sem motivo;
- SLA, tempo de resposta, proximo passo e tempo por etapa.

## Dados e infraestrutura

- Sheets, GrowthPack, BigQuery, Supabase, ERP, billing e contratos;
- APIs, webhooks, n8n, Make, GTM, GA4, pixels e server-side;
- timezone, moeda, volume, frequencia e retencao;
- ambiente de teste, cofre de segredos e owners tecnicos.

## Acessos minimos

Solicitar o menor privilegio possivel. Preferir viewer/read-only no Gate 1. Mapear:

- plataforma;
- conta/propriedade;
- tipo de acesso;
- owner;
- validade;
- status;
- dependencia;
- risco.

## Saida do intake

Criar:

- `client-profile.json`;
- inventario de fontes;
- mapa de sistemas;
- mapa de responsaveis;
- mapa de lacunas;
- lista de acessos;
- perguntas bloqueadoras;
- score de prontidao de 0 a 100.
