# GrowthOps Social Intelligence

Sistema de acompanhamento de conteúdo, posicionamento e concorrência para duas frentes independentes:

1. **Marca pessoal de Vinicius Eduardo Agnes** — Instagram `@vinicius_agnes` e LinkedIn.
2. **Marca corporativa da ST1 Internet** — Instagram `@st1internet` e concorrentes relevantes de São Luís/MA e do mercado regional.

## Responsável

**Vinicius Eduardo Agnes**  
Gerente de Estratégia — **ST1 Strategy Command Center**

## Objetivos

### Marca pessoal

- Construir autoridade em Estratégia, GrowthOps, Receita, CRM, Automação, IA e Telecom.
- Medir a evolução de Instagram e LinkedIn por série histórica, não por percepção.
- Usar referências executivas como **Tallis Gomes**, Alfredo Soares, Bruno Nardon e João Kepler sem copiar identidade ou opinião.
- Transformar experiência operacional real em conteúdo para decisores.

### ST1 Internet

- Monitorar formatos, temas, ofertas, provas, campanhas e funis dos concorrentes.
- Separar concorrentes locais diretos, regionais de escala e referências nacionais.
- Identificar outliers por perfil e formato.
- Priorizar oportunidades que combinem score alto, alcance não baixo e intenção comercial.

## Perfis-base

| Frente | Perfil |
|---|---|
| Marca pessoal | `@vinicius_agnes` |
| Marca corporativa | `@st1internet` |

## Concorrentes e referências

### ST1 — núcleo competitivo

- `@estrelasinternet`
- `@brisanet.oficial`
- `@g3telecompi`
- `@sejamaxx`
- `@fixtellnordeste`
- `@idealnetfibra`
- `@wiki_telecom`
- `@idnet_telecom`
- `@clicktelecom_ma`
- `@netmaniainternet`
- `@orbttelecom`
- `@speednetslz`

### Marca pessoal — referências

- `@tallisgomes`
- `@alfredosoares`
- `@bruno.nardon`
- `@joaokepler`

## Metodologia

- Últimos **12 posts por perfil**, ou os posts da última semana, o que for maior.
- Medianas calculadas **separadamente por perfil e formato**.
- Peso padrão: salvamento/compartilhamento = 3; comentário = 2; like = 1.
- Outlier Score = engajamento ponderado ÷ mediana do mesmo formato e perfil.
- Posts com menos de 48 horas ficam fora do ranking principal.
- Dados ausentes são marcados como `faltante`; nunca são estimados.
- Frequência operacional: **semanal**.

## Estrutura

```text
docs/social-intelligence/
├── README.md
├── config/
│   └── project-config.json
├── data/
│   ├── baseline-2026-07-21.json
│   └── st1-competitors.json
├── prompts/
│   ├── instagram-content-analyst-original.md
│   └── growthops-social-intelligence-runner.md
└── reports/
    └── 2026-07-21-baseline.md
```

## Governança de dados

Este diretório aceita apenas dados públicos ou métricas autorizadas pelo proprietário das contas. Não devem ser publicados e-mails privados, credenciais, tokens, dados financeiros pessoais, mensagens privadas, dados de clientes ou informações estratégicas internas da ST1.

## Próxima rodada

Repetir semanalmente com os mesmos perfis e a mesma janela de coleta para preservar comparabilidade. Registrar deltas de seguidores, cadência, temas, formatos, outliers, alcance e comment-gates.
