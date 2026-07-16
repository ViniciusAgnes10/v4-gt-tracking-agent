# Execucao por Navegador

## Papel do navegador

Usar navegador para inspecionar configuracoes, capturar evidencia, validar interfaces e operar lacunas sem API. Nao fazer dele a primeira opcao para processos recorrentes.

## Opera Connector

Capacidades tipicas expostas:

- listar abas;
- navegar para URL;
- ler arvore de acessibilidade;
- pesquisar na arvore;
- capturar screenshot;
- consultar historico recente;
- fechar aba.

Nao presumir clique, digitacao, upload, download ou execucao JavaScript se a sessao nao expuser essas ferramentas.

## Fluxo seguro

1. listar abas;
2. identificar conta e ambiente;
3. ler conteudo da pagina;
4. capturar evidencia;
5. comparar com plano;
6. preparar acao;
7. pedir aprovacao quando sensivel;
8. usar ferramenta de interacao suportada;
9. fazer readback;
10. registrar screenshot e resultado.

## Quando abortar

- conta ou cliente ambiguo;
- tela diferente da documentacao;
- risco de publicar/alterar sem preview;
- captcha, MFA ou consentimento que exige humano;
- ferramenta sem capacidade de interacao;
- dados sensiveis expostos.
