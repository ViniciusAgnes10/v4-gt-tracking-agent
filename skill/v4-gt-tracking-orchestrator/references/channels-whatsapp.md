# WhatsApp e Canais de Conversa

## Fontes possiveis

- WhatsApp Cloud API;
- Twilio WhatsApp;
- BSPs;
- Evolution API;
- chat da Kommo;
- plataformas de atendimento;
- links `wa.me` e Click-to-WhatsApp Ads.

## Tracking minimo

- conversation/message ID;
- phone normalized;
- first inbound timestamp;
- source/integration;
- campaign/ad identifiers quando fornecidos;
- referral metadata de Click-to-WhatsApp;
- consent/opt-in;
- contact/lead/deal IDs;
- handoff e owner;
- outcome.

## Regras

- telefone nao prova origem de campanha;
- guardar referral metadata no primeiro evento;
- evitar duplicar lead a cada nova mensagem;
- definir janela de agrupamento e chave de conversa;
- separar suporte, comercial, onboarding e reativacao;
- respeitar templates, janelas, opt-in e politicas do provedor;
- nao enviar mensagem externa sem aprovacao quando sensivel.
