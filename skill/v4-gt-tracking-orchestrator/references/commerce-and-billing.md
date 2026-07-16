# Commerce, Contratos e Billing

## Plataformas comuns

- Shopify e WooCommerce;
- Stripe e gateways;
- ERP e sistemas de contrato;
- plataformas de assinatura;
- sistemas de instalacao/ativacao.

## Fonte da verdade

Definir separadamente:

- pedido criado;
- pagamento aprovado;
- contrato assinado;
- instalacao concluida;
- ativacao;
- receita reconhecida;
- cancelamento/reembolso/chargeback;
- MRR/ARR.

Nao tratar `deal won` como receita realizada sem validar o modelo do negocio. Vincular order/customer/subscription IDs ao lead/contact/deal.

## Eventos

Criar eventos distintos quando necessario: `order_created`, `payment_succeeded`, `contract_signed`, `activated`, `subscription_started`, `refund`, `cancellation` e `churn`.
