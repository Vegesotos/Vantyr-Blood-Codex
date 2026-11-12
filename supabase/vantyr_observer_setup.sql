-- VANTYR DM Observer — run in the Supabase SQL Editor.
-- REQUIRED: replace CHANGE_TO_YOUR_EMAIL@example.com below with the email
-- you will use for the OWNER magic-link sign-in in the Blood Codex app.
-- No DM account is needed. This file contains no credentials.
--
-- SECURITY MODEL:
--  - tables have RLS on AND no direct browser grants;
--  - OWNER writes via Supabase Auth (a verified email magic link);
--  - DM reads only via a 256-bit secret link, checked server-side by RPC;
--  - the DM cannot write, even with the browser developer tools.
--
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.vantyr_observer_config (
  id integer primary key default 1 check (id = 1),
  owner_email text not null,
  owner_user_id uuid,
  viewer_token_sha256 text,
  updated_at timestamptz not null default now()
);

create table if not exists public.vantyr_observer_state (
  id integer primary key default 1 check (id = 1),
  snapshot jsonb not null default '{}'::jsonb,
  revision bigint not null default 0,
  updated_at timestamptz
);

alter table public.vantyr_observer_config enable row level security;
alter table public.vantyr_observer_state enable row level security;
revoke all on table public.vantyr_observer_config from public, anon, authenticated;
revoke all on table public.vantyr_observer_state from public, anon, authenticated;

insert into public.vantyr_observer_config (id, owner_email)
values (1, lower(trim('CHANGE_TO_YOUR_EMAIL@example.com')))
on conflict (id) do update
  set owner_email = excluded.owner_email;
insert into public.vantyr_observer_state(id) values (1) on conflict(id) do nothing;

-- Claim access to the single owner slot. Only the configured email can claim.
create or replace function public.vantyr_observer_claim()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid;
  v_email text;
begin
  if auth.uid() is null then
    raise exception 'Sign in to your player account first';
  end if;
  v_email := lower(trim(coalesce(auth.jwt()->>'email', '')));
  select owner_user_id into v_owner
  from public.vantyr_observer_config
  where id = 1 and owner_email = v_email
  for update;
  if not found then
    raise exception 'Email is not authorized as VANTYR owner';
  end if;
  if v_owner is not null and v_owner <> auth.uid() then
    raise exception 'VANTYR already has a different owner account';
  end if;
  update public.vantyr_observer_config
  set owner_user_id = auth.uid(), updated_at = now()
  where id = 1;
  return true;
end;
$$;

create or replace function public.vantyr_observer_push(p_snapshot jsonb)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_revision bigint;
begin
  if auth.uid() is null or not exists (
    select 1 from public.vantyr_observer_config c
    where c.id = 1 and c.owner_user_id = auth.uid()
  ) then
    raise exception 'Only the VANTYR owner can publish status';
  end if;
  if p_snapshot is null
     or jsonb_typeof(p_snapshot) <> 'object'
     or pg_catalog.octet_length(p_snapshot::text) > 30000 then
    raise exception 'Invalid or oversized character snapshot';
  end if;
  update public.vantyr_observer_state
     set snapshot = p_snapshot,
         revision = revision + 1,
         updated_at = clock_timestamp()
   where id = 1 returning revision into v_revision;
  return v_revision;
end;
$$;

-- The browser generates 32 cryptographically random bytes and sends ONLY
-- their SHA256 hash to this RPC. The raw token stays in the DM link.
create or replace function public.vantyr_observer_rotate(p_token_sha256 text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.vantyr_observer_config c
    where c.id = 1 and c.owner_user_id = auth.uid()
  ) then
    raise exception 'Only the VANTYR owner may issue a viewer link';
  end if;
  if p_token_sha256 !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid token hash';
  end if;
  update public.vantyr_observer_config
    set viewer_token_sha256 = p_token_sha256,
        updated_at = clock_timestamp()
    where id = 1;
  return true;
end;
$$;

create or replace function public.vantyr_observer_revoke()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.vantyr_observer_config c
    where c.id = 1 and c.owner_user_id = auth.uid()
  ) then
    raise exception 'Only the VANTYR owner may revoke a viewer link';
  end if;
  update public.vantyr_observer_config
    set viewer_token_sha256 = null,
        updated_at = clock_timestamp()
    where id = 1;
  return true;
end;
$$;

-- This is the ONLY publicly callable function. It returns a snapshot
-- strictly when the complete, unpredictable 256-bit link token is supplied.
create or replace function public.vantyr_observer_read(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_expected text;
  v_snapshot jsonb;
  v_revision bigint;
  v_updated timestamptz;
begin
  if p_token is null or p_token !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid or revoked viewer link';
  end if;
  select viewer_token_sha256 into v_expected
  from public.vantyr_observer_config where id = 1;
  if v_expected is null
     or v_expected <> pg_catalog.encode(extensions.digest(p_token, 'sha256'), 'hex') then
    raise exception 'Invalid or revoked viewer link';
  end if;
  select snapshot, revision, updated_at into v_snapshot, v_revision, v_updated
  from public.vantyr_observer_state where id = 1;
  return jsonb_build_object(
    'snapshot', coalesce(v_snapshot,'{}'::jsonb),
    'revision', coalesce(v_revision,0),
    'updated_at', v_updated
  );
end;
$$;

-- Restrict function execution explicitly (security-definer functions otherwise
-- default to PUBLIC execute permissions).
revoke execute on function public.vantyr_observer_claim() from public, anon, authenticated;
revoke execute on function public.vantyr_observer_push(jsonb) from public, anon, authenticated;
revoke execute on function public.vantyr_observer_rotate(text) from public, anon, authenticated;
revoke execute on function public.vantyr_observer_revoke() from public, anon, authenticated;
revoke execute on function public.vantyr_observer_read(text) from public, anon, authenticated;
grant execute on function public.vantyr_observer_claim() to authenticated;
grant execute on function public.vantyr_observer_push(jsonb) to authenticated;
grant execute on function public.vantyr_observer_rotate(text) to authenticated;
grant execute on function public.vantyr_observer_revoke() to authenticated;
grant execute on function public.vantyr_observer_read(text) to anon, authenticated;
