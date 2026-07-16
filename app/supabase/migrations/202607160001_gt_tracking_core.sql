create extension if not exists pgcrypto with schema extensions;

create or replace function public.gt_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.gt_tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status text not null default 'active' check (status in ('active','paused','archived')),
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.gt_memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.gt_tenants(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  email text,
  role text not null default 'analyst' check (role in ('owner','admin','approver','analyst','viewer','agent')),
  status text not null default 'active' check (status in ('active','invited','disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, user_id),
  check (user_id is not null or email is not null)
);

create table public.gt_clients (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.gt_tenants(id) on delete cascade,
  name text not null,
  slug text not null,
  legal_name text,
  website_url text,
  business_model text,
  timezone text not null default 'America/Sao_Paulo',
  currency char(3) not null default 'BRL',
  status text not null default 'discovery' check (status in ('discovery','implementation','monitoring','paused','archived')),
  current_gate smallint not null default 1 check (current_gate between 1 and 7),
  execution_mode text not null default 'dry_run' check (execution_mode in ('read_only','dry_run','live')),
  paused boolean not null default false,
  pause_reason text,
  profile jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, slug)
);

create table public.gt_integrations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.gt_tenants(id) on delete cascade,
  client_id uuid not null references public.gt_clients(id) on delete cascade,
  platform text not null,
  category text not null,
  adapter text,
  access_mode text not null default 'unknown' check (access_mode in ('unknown','api','mcp','oauth','browser','webhook','manual','hybrid')),
  status text not null default 'planned' check (status in ('planned','requested','connected','configured','degraded','blocked','disconnected')),
  external_account_id text,
  owner_name text,
  credential_reference text,
  config jsonb not null default '{}'::jsonb,
  capabilities jsonb not null default '{}'::jsonb,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, platform, coalesce(external_account_id, 'default'))
);

create table public.gt_gates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.gt_tenants(id) on delete cascade,
  client_id uuid not null references public.gt_clients(id) on delete cascade,
  gate_number smallint not null check (gate_number between 1 and 7),
  name text not null,
  status text not null default 'pending' check (status in ('pending','in_progress','completed','blocked','waived')),
  summary text,
  findings jsonb not null default '[]'::jsonb,
  risks jsonb not null default '[]'::jsonb,
  dependencies jsonb not null default '[]'::jsonb,
  acceptance_criteria jsonb not null default '[]'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, gate_number)
);

create table public.gt_sources (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.gt_tenants(id) on delete cascade,
  client_id uuid not null references public.gt_clients(id) on delete cascade,
  integration_id uuid references public.gt_integrations(id) on delete set null,
  name text not null,
  source_type text not null,
  system_of_record boolean not null default false,
  grain text,
  primary_key_definition text,
  freshness_sla_minutes integer,
  status text not null default 'unknown' check (status in ('unknown','healthy','warning','stale','broken','disabled')),
  metadata jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.gt_field_mappings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.gt_tenants(id) on delete cascade,
  client_id uuid not null references public.gt_clients(id) on delete cascade,
  source_integration_id uuid references public.gt_integrations(id) on delete set null,
  destination_integration_id uuid references public.gt_integrations(id) on delete set null,
  business_entity text not null,
  source_field text not null,
  canonical_field text not null,
  destination_field text,
  data_type text,
  transformation_rule text,
  required boolean not null default false,
  pii_classification text not null default 'none' check (pii_classification in ('none','personal','sensitive','financial','health')),
  status text not null default 'draft' check (status in ('draft','validated','active','deprecated','blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.gt_event_definitions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.gt_tenants(id) on delete cascade,
  client_id uuid not null references public.gt_clients(id) on delete cascade,
  event_name text not null,
  business_stage text,
  event_type text not null check (event_type in ('web','crm','sales','revenue','lifecycle','consent','operational','custom')),
  trigger_description text not null,
  source_system text,
  destinations jsonb not null default '[]'::jsonb,
  required_parameters jsonb not null default '[]'::jsonb,
  optional_parameters jsonb not null default '[]'::jsonb,
  deduplication_key text,
  identity_strategy jsonb not null default '{}'::jsonb,
  value_rule text,
  consent_rule text,
  active boolean not null default true,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, event_name, version)
);

create table public.gt_event_observations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.gt_tenants(id) on delete cascade,
  client_id uuid not null references public.gt_clients(id) on delete cascade,
  event_definition_id uuid references public.gt_event_definitions(id) on delete set null,
  event_id text not null,
  occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  source_system text not null,
  entity_type text,
  entity_id text,
  payload jsonb not null default '{}'::jsonb,
  validation_status text not null default 'pending' check (validation_status in ('pending','valid','warning','invalid','duplicate')),
  validation_errors jsonb not null default '[]'::jsonb,
  test_event boolean not null default false,
  unique (client_id, source_system, event_id)
);

create table public.gt_documentation_evidence (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.gt_tenants(id) on delete cascade,
  client_id uuid references public.gt_clients(id) on delete cascade,
  platform text not null,
  title text not null,
  url text not null,
  domain text not null,
  version text,
  published_at timestamptz,
  verified_at timestamptz not null default now(),
  verified_by text,
  summary text,
  impact text,
  evidence_hash text,
  status text not null default 'current' check (status in ('current','superseded','deprecated','unverified')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.gt_approvals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.gt_tenants(id) on delete cascade,
  client_id uuid not null references public.gt_clients(id) on delete cascade,
  integration_id uuid references public.gt_integrations(id) on delete set null,
  title text not null,
  description text,
  platform text not null,
  adapter text,
  action_type text not null,
  risk_level text not null default 'medium' check (risk_level in ('low','medium','high','critical')),
  reversible boolean not null default true,
  rollback_plan text,
  requested_payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','approved','rejected','expired','cancelled','executed','execution_error')),
  requested_by text,
  reviewed_by text,
  review_note text,
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  expires_at timestamptz,
  executed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.gt_executions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.gt_tenants(id) on delete cascade,
  client_id uuid not null references public.gt_clients(id) on delete cascade,
  approval_id uuid references public.gt_approvals(id) on delete set null,
  integration_id uuid references public.gt_integrations(id) on delete set null,
  execution_mode text not null default 'dry_run' check (execution_mode in ('read_only','dry_run','live')),
  executor_type text not null check (executor_type in ('api','mcp','browser','opera','n8n','make','webhook','manual','internal')),
  action_name text not null,
  idempotency_key text not null,
  status text not null default 'queued' check (status in ('queued','running','succeeded','failed','cancelled','blocked','simulated')),
  request_payload jsonb not null default '{}'::jsonb,
  response_payload jsonb not null default '{}'::jsonb,
  error_code text,
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  duration_ms integer,
  created_at timestamptz not null default now(),
  unique (client_id, idempotency_key)
);

create table public.gt_qa_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.gt_tenants(id) on delete cascade,
  client_id uuid not null references public.gt_clients(id) on delete cascade,
  integration_id uuid references public.gt_integrations(id) on delete set null,
  execution_id uuid references public.gt_executions(id) on delete set null,
  scope text not null,
  status text not null default 'running' check (status in ('running','pass','warning','fail','blocked')),
  checks jsonb not null default '[]'::jsonb,
  passed_count integer not null default 0,
  warning_count integer not null default 0,
  failed_count integer not null default 0,
  evidence jsonb not null default '[]'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.gt_audit_logs (
  id bigint generated always as identity primary key,
  tenant_id uuid references public.gt_tenants(id) on delete set null,
  client_id uuid references public.gt_clients(id) on delete set null,
  actor_type text not null default 'system' check (actor_type in ('user','agent','system','integration')),
  actor_id text,
  level text not null default 'info' check (level in ('debug','info','warning','error','critical')),
  category text not null,
  action text not null,
  message text not null,
  object_type text,
  object_id text,
  correlation_id text,
  before_state jsonb,
  after_state jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.gt_sync_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.gt_tenants(id) on delete cascade,
  client_id uuid not null references public.gt_clients(id) on delete cascade,
  integration_id uuid references public.gt_integrations(id) on delete set null,
  sync_type text not null check (sync_type in ('full','incremental','backfill','webhook','reconciliation')),
  direction text not null check (direction in ('inbound','outbound','bidirectional','internal')),
  status text not null default 'queued' check (status in ('queued','running','succeeded','partial','failed','cancelled')),
  cursor_before text,
  cursor_after text,
  records_read integer not null default 0,
  records_written integer not null default 0,
  records_skipped integer not null default 0,
  records_failed integer not null default 0,
  error_summary jsonb not null default '[]'::jsonb,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.gt_secrets_registry (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.gt_tenants(id) on delete cascade,
  client_id uuid references public.gt_clients(id) on delete cascade,
  integration_id uuid references public.gt_integrations(id) on delete cascade,
  secret_name text not null,
  provider text not null,
  external_reference text not null,
  scopes jsonb not null default '[]'::jsonb,
  status text not null default 'active' check (status in ('active','rotating','expired','revoked','missing')),
  last_validated_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, secret_name, provider)
);

create index gt_memberships_tenant_user_idx on public.gt_memberships(tenant_id, user_id);
create index gt_clients_tenant_status_idx on public.gt_clients(tenant_id, status);
create index gt_integrations_client_status_idx on public.gt_integrations(client_id, status);
create index gt_gates_client_gate_idx on public.gt_gates(client_id, gate_number);
create index gt_sources_client_status_idx on public.gt_sources(client_id, status);
create index gt_field_mappings_client_entity_idx on public.gt_field_mappings(client_id, business_entity);
create index gt_event_definitions_client_active_idx on public.gt_event_definitions(client_id, active);
create index gt_event_observations_client_occurred_idx on public.gt_event_observations(client_id, occurred_at desc);
create index gt_documentation_client_platform_idx on public.gt_documentation_evidence(client_id, platform, verified_at desc);
create index gt_approvals_client_status_idx on public.gt_approvals(client_id, status, requested_at desc);
create index gt_executions_client_status_idx on public.gt_executions(client_id, status, created_at desc);
create index gt_qa_runs_client_created_idx on public.gt_qa_runs(client_id, created_at desc);
create index gt_audit_logs_client_created_idx on public.gt_audit_logs(client_id, created_at desc);
create index gt_sync_runs_client_created_idx on public.gt_sync_runs(client_id, created_at desc);

create trigger gt_tenants_updated_at before update on public.gt_tenants for each row execute function public.gt_set_updated_at();
create trigger gt_memberships_updated_at before update on public.gt_memberships for each row execute function public.gt_set_updated_at();
create trigger gt_clients_updated_at before update on public.gt_clients for each row execute function public.gt_set_updated_at();
create trigger gt_integrations_updated_at before update on public.gt_integrations for each row execute function public.gt_set_updated_at();
create trigger gt_gates_updated_at before update on public.gt_gates for each row execute function public.gt_set_updated_at();
create trigger gt_sources_updated_at before update on public.gt_sources for each row execute function public.gt_set_updated_at();
create trigger gt_field_mappings_updated_at before update on public.gt_field_mappings for each row execute function public.gt_set_updated_at();
create trigger gt_event_definitions_updated_at before update on public.gt_event_definitions for each row execute function public.gt_set_updated_at();
create trigger gt_approvals_updated_at before update on public.gt_approvals for each row execute function public.gt_set_updated_at();
create trigger gt_secrets_registry_updated_at before update on public.gt_secrets_registry for each row execute function public.gt_set_updated_at();

create or replace function public.gt_is_tenant_member(target_tenant_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.gt_memberships m
    where m.tenant_id = target_tenant_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
  );
$$;

create or replace function public.gt_has_tenant_role(target_tenant_id uuid, allowed_roles text[])
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.gt_memberships m
    where m.tenant_id = target_tenant_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and m.role = any(allowed_roles)
  );
$$;

revoke all on function public.gt_is_tenant_member(uuid) from public;
revoke all on function public.gt_has_tenant_role(uuid, text[]) from public;
grant execute on function public.gt_is_tenant_member(uuid) to authenticated, service_role;
grant execute on function public.gt_has_tenant_role(uuid, text[]) to authenticated, service_role;

alter table public.gt_tenants enable row level security;
alter table public.gt_memberships enable row level security;
alter table public.gt_clients enable row level security;
alter table public.gt_integrations enable row level security;
alter table public.gt_gates enable row level security;
alter table public.gt_sources enable row level security;
alter table public.gt_field_mappings enable row level security;
alter table public.gt_event_definitions enable row level security;
alter table public.gt_event_observations enable row level security;
alter table public.gt_documentation_evidence enable row level security;
alter table public.gt_approvals enable row level security;
alter table public.gt_executions enable row level security;
alter table public.gt_qa_runs enable row level security;
alter table public.gt_audit_logs enable row level security;
alter table public.gt_sync_runs enable row level security;
alter table public.gt_secrets_registry enable row level security;

create policy gt_tenants_select on public.gt_tenants for select to authenticated using (public.gt_is_tenant_member(id));
create policy gt_tenants_update on public.gt_tenants for update to authenticated using (public.gt_has_tenant_role(id, array['owner','admin'])) with check (public.gt_has_tenant_role(id, array['owner','admin']));

create policy gt_memberships_select on public.gt_memberships for select to authenticated using (public.gt_is_tenant_member(tenant_id));
create policy gt_memberships_insert on public.gt_memberships for insert to authenticated with check (public.gt_has_tenant_role(tenant_id, array['owner','admin']));
create policy gt_memberships_update on public.gt_memberships for update to authenticated using (public.gt_has_tenant_role(tenant_id, array['owner','admin'])) with check (public.gt_has_tenant_role(tenant_id, array['owner','admin']));
create policy gt_memberships_delete on public.gt_memberships for delete to authenticated using (public.gt_has_tenant_role(tenant_id, array['owner','admin']));

create policy gt_clients_select on public.gt_clients for select to authenticated using (public.gt_is_tenant_member(tenant_id));
create policy gt_clients_insert on public.gt_clients for insert to authenticated with check (public.gt_has_tenant_role(tenant_id, array['owner','admin','analyst','agent']));
create policy gt_clients_update on public.gt_clients for update to authenticated using (public.gt_has_tenant_role(tenant_id, array['owner','admin','analyst','agent'])) with check (public.gt_has_tenant_role(tenant_id, array['owner','admin','analyst','agent']));
create policy gt_clients_delete on public.gt_clients for delete to authenticated using (public.gt_has_tenant_role(tenant_id, array['owner','admin']));

create policy gt_integrations_select on public.gt_integrations for select to authenticated using (public.gt_is_tenant_member(tenant_id));
create policy gt_integrations_insert on public.gt_integrations for insert to authenticated with check (public.gt_has_tenant_role(tenant_id, array['owner','admin','analyst','agent']));
create policy gt_integrations_update on public.gt_integrations for update to authenticated using (public.gt_has_tenant_role(tenant_id, array['owner','admin','analyst','agent'])) with check (public.gt_has_tenant_role(tenant_id, array['owner','admin','analyst','agent']));
create policy gt_integrations_delete on public.gt_integrations for delete to authenticated using (public.gt_has_tenant_role(tenant_id, array['owner','admin']));

create policy gt_gates_select on public.gt_gates for select to authenticated using (public.gt_is_tenant_member(tenant_id));
create policy gt_gates_insert on public.gt_gates for insert to authenticated with check (public.gt_has_tenant_role(tenant_id, array['owner','admin','analyst','agent']));
create policy gt_gates_update on public.gt_gates for update to authenticated using (public.gt_has_tenant_role(tenant_id, array['owner','admin','analyst','agent'])) with check (public.gt_has_tenant_role(tenant_id, array['owner','admin','analyst','agent']));
create policy gt_gates_delete on public.gt_gates for delete to authenticated using (public.gt_has_tenant_role(tenant_id, array['owner','admin']));

create policy gt_sources_select on public.gt_sources for select to authenticated using (public.gt_is_tenant_member(tenant_id));
create policy gt_sources_write on public.gt_sources for all to authenticated using (public.gt_has_tenant_role(tenant_id, array['owner','admin','analyst','agent'])) with check (public.gt_has_tenant_role(tenant_id, array['owner','admin','analyst','agent']));

create policy gt_field_mappings_select on public.gt_field_mappings for select to authenticated using (public.gt_is_tenant_member(tenant_id));
create policy gt_field_mappings_write on public.gt_field_mappings for all to authenticated using (public.gt_has_tenant_role(tenant_id, array['owner','admin','analyst','agent'])) with check (public.gt_has_tenant_role(tenant_id, array['owner','admin','analyst','agent']));

create policy gt_event_definitions_select on public.gt_event_definitions for select to authenticated using (public.gt_is_tenant_member(tenant_id));
create policy gt_event_definitions_write on public.gt_event_definitions for all to authenticated using (public.gt_has_tenant_role(tenant_id, array['owner','admin','analyst','agent'])) with check (public.gt_has_tenant_role(tenant_id, array['owner','admin','analyst','agent']));

create policy gt_event_observations_select on public.gt_event_observations for select to authenticated using (public.gt_is_tenant_member(tenant_id));
create policy gt_event_observations_insert on public.gt_event_observations for insert to authenticated with check (public.gt_has_tenant_role(tenant_id, array['owner','admin','analyst','agent']));

create policy gt_docs_select on public.gt_documentation_evidence for select to authenticated using (client_id is null or public.gt_is_tenant_member(tenant_id));
create policy gt_docs_write on public.gt_documentation_evidence for all to authenticated using (public.gt_has_tenant_role(tenant_id, array['owner','admin','analyst','agent'])) with check (public.gt_has_tenant_role(tenant_id, array['owner','admin','analyst','agent']));

create policy gt_approvals_select on public.gt_approvals for select to authenticated using (public.gt_is_tenant_member(tenant_id));
create policy gt_approvals_insert on public.gt_approvals for insert to authenticated with check (public.gt_has_tenant_role(tenant_id, array['owner','admin','analyst','agent']));
create policy gt_approvals_update on public.gt_approvals for update to authenticated using (public.gt_has_tenant_role(tenant_id, array['owner','admin','approver'])) with check (public.gt_has_tenant_role(tenant_id, array['owner','admin','approver']));

create policy gt_executions_select on public.gt_executions for select to authenticated using (public.gt_is_tenant_member(tenant_id));
create policy gt_executions_insert on public.gt_executions for insert to authenticated with check (public.gt_has_tenant_role(tenant_id, array['owner','admin','agent']));
create policy gt_executions_update on public.gt_executions for update to authenticated using (public.gt_has_tenant_role(tenant_id, array['owner','admin','agent'])) with check (public.gt_has_tenant_role(tenant_id, array['owner','admin','agent']));

create policy gt_qa_runs_select on public.gt_qa_runs for select to authenticated using (public.gt_is_tenant_member(tenant_id));
create policy gt_qa_runs_write on public.gt_qa_runs for all to authenticated using (public.gt_has_tenant_role(tenant_id, array['owner','admin','analyst','agent'])) with check (public.gt_has_tenant_role(tenant_id, array['owner','admin','analyst','agent']));

create policy gt_audit_logs_select on public.gt_audit_logs for select to authenticated using (public.gt_is_tenant_member(tenant_id));
create policy gt_audit_logs_insert on public.gt_audit_logs for insert to authenticated with check (public.gt_has_tenant_role(tenant_id, array['owner','admin','analyst','approver','agent']));

create policy gt_sync_runs_select on public.gt_sync_runs for select to authenticated using (public.gt_is_tenant_member(tenant_id));
create policy gt_sync_runs_write on public.gt_sync_runs for all to authenticated using (public.gt_has_tenant_role(tenant_id, array['owner','admin','agent'])) with check (public.gt_has_tenant_role(tenant_id, array['owner','admin','agent']));

create policy gt_secrets_registry_select on public.gt_secrets_registry for select to authenticated using (public.gt_has_tenant_role(tenant_id, array['owner','admin','agent']));
create policy gt_secrets_registry_write on public.gt_secrets_registry for all to authenticated using (public.gt_has_tenant_role(tenant_id, array['owner','admin'])) with check (public.gt_has_tenant_role(tenant_id, array['owner','admin']));

revoke all on all tables in schema public from anon;
grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated, service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;

insert into public.gt_tenants (name, slug, settings)
values ('V4 GT Tracking Agent', 'v4-gt-tracking-agent', jsonb_build_object('default_execution_mode','dry_run','timezone','America/Sao_Paulo'));

with tenant as (
  select id from public.gt_tenants where slug = 'v4-gt-tracking-agent'
), demo_client as (
  insert into public.gt_clients (tenant_id, name, slug, status, current_gate, execution_mode, profile)
  select id, 'Ambiente de Validação', 'ambiente-validacao', 'discovery', 1, 'dry_run', jsonb_build_object('purpose','Validação técnica do agente')
  from tenant
  returning id, tenant_id
)
insert into public.gt_gates (tenant_id, client_id, gate_number, name, status, acceptance_criteria)
select dc.tenant_id, dc.id, g.n, g.name, case when g.n = 1 then 'in_progress' else 'pending' end,
       jsonb_build_array('Evidências registradas','Riscos classificados','Dependências identificadas','Aprovação quando aplicável')
from demo_client dc
cross join (values
  (1,'Diagnóstico e inventário'),
  (2,'Arquitetura de dados'),
  (3,'CRM e jornada comercial'),
  (4,'Eventos e identidade'),
  (5,'Mídia e devolução de conversões'),
  (6,'Atribuição e dashboards'),
  (7,'QA, governança e go-live')
) as g(n,name);

insert into public.gt_audit_logs (tenant_id, client_id, actor_type, actor_id, level, category, action, message)
select t.id, c.id, 'system', 'migration', 'info', 'database', 'initialize', 'Estrutura inicial do V4 GT Tracking Agent criada em modo dry_run.'
from public.gt_tenants t
join public.gt_clients c on c.tenant_id = t.id
where t.slug = 'v4-gt-tracking-agent' and c.slug = 'ambiente-validacao';
