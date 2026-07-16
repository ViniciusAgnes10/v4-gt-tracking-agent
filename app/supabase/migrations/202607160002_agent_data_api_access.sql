-- Applied to project qcwefiyfqhxyfexsseuw.
-- The stored value below is a SHA-256 hash; the plaintext key is never committed.
create extension if not exists pgcrypto with schema extensions;

create or replace function public.gt_agent_request_authorized()
returns boolean
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select encode(
    extensions.digest(
      coalesce((current_setting('request.headers', true)::jsonb ->> 'x-agent-key'), ''),
      'sha256'
    ),
    'hex'
  ) = '93f9f1e0f423e654a657c7024710b2bebac9d1b1d201449a8a1ba24d052b32b4';
$$;

revoke all on function public.gt_agent_request_authorized() from public;
grant execute on function public.gt_agent_request_authorized() to anon, authenticated, service_role;

-- Grants and RLS policies are intentionally limited to the GT Tracking tables.
-- See the project migration history for the fully applied policy statements.
