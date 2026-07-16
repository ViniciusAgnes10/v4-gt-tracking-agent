# Microsoft Advertising

## Escopo

Mapear UET, offline conversions, Enhanced Conversions quando disponivel, Customer Match/audiences, Microsoft Click ID `MSCLKID` e API/importe.

## Processo

- capturar e persistir MSCLKID;
- definir conversion goals;
- preparar timestamp, value, currency e identificador unico;
- validar timezone e janela;
- testar antes da producao;
- registrar aceites, erros e retries.

## Regras

Nao assumir que recursos e campos sao identicos aos do Google Ads. Consultar documentacao oficial e elegibilidade da conta. Sem MSCLKID ou identificador suportado, classificar a atribuicao com menor confianca.
