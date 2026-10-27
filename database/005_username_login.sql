-- Existing project: run after database/setup.sql from the previous release.
-- New project: this migration is included in the updated database/setup.sql.
-- Existing accounts choose a username at their next onboarding visit.
alter table public.profiles add column if not exists username text;
alter table public.profiles drop constraint if exists profiles_username_format;
alter table public.profiles add constraint profiles_username_format
 check (username is null or username ~ '^[a-z][a-z0-9_]{2,29}$');
create unique index if not exists profiles_username_unique on public.profiles(username);
grant insert (username), update (username) on public.profiles to authenticated;

-- No public username-to-email lookup. Only the server may resolve identifiers.
create or replace function public.resolve_login_email(p_username text)
returns text language sql stable security definer set search_path = '' as $$
 select u.email from public.profiles p join auth.users u on u.id=p.id
 where p.username=lower(trim(p_username)) and u.email_confirmed_at is not null
 limit 1;
$$;
revoke all on function public.resolve_login_email(text) from public,anon,authenticated;
grant execute on function public.resolve_login_email(text) to service_role;

-- HMAC keys only: no raw email, username, IP address or password is stored here.
create table if not exists public.password_login_limits (
 key_hash text primary key check (key_hash ~ '^[a-f0-9]{64}$'),
 window_start timestamptz not null, attempts integer not null
);
alter table public.password_login_limits enable row level security;
revoke all on public.password_login_limits from public,anon,authenticated;
grant all on public.password_login_limits to service_role;
create or replace function public.consume_password_login_limit(p_key text,p_scope text)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare v_count integer; v_limit integer; v_now timestamptz := clock_timestamp();
begin
 v_limit := case p_scope when 'identifier' then 10 when 'network' then 100 else 0 end;
 if v_limit=0 then raise exception 'Invalid limit scope'; end if;
 delete from public.password_login_limits where window_start < v_now-interval '1 day';
 insert into public.password_login_limits as limits(key_hash,window_start,attempts)
 values(p_key,v_now,1) on conflict(key_hash) do update set
   attempts=case when limits.window_start < v_now-interval '15 minutes' then 1 else least(limits.attempts+1,v_limit+1) end,
   window_start=case when limits.window_start < v_now-interval '15 minutes' then v_now else limits.window_start end
 returning attempts into v_count;
 return v_count<=v_limit;
end $$;
revoke all on function public.consume_password_login_limit(text,text) from public,anon,authenticated;
grant execute on function public.consume_password_login_limit(text,text) to service_role;
