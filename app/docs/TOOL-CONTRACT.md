# Contrato de ferramentas

## Leitura

- `list_tracking_clients`
- `get_tracking_dashboard`
- `render_tracking_console`
- `search`
- `fetch`

## Escrita local e reversível

- `create_tracking_client`
- `update_tracking_profile`
- `register_tracking_integration`
- `run_tracking_gate`
- `queue_tracking_action`
- `review_tracking_action`
- `record_tracking_docs_evidence`
- `record_tracking_qa`
- `set_tracking_agent_pause`

## Escrita externa

- `execute_tracking_action`: exige aprovação prévia e executor configurado. Opera em `dry_run` por padrão.
