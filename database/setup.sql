-- Complete POC setup. Regenerate with node scripts/build-database-setup.mjs.
-- Run in the Supabase SQL editor. Existing user data is preserved.
begin;
-- Supabase SQL Editor. Apply after creating the project; independent of vector schema.
-- auth.users owns email/phone and their verified timestamps.
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 first_name text not null check (length(trim(first_name)) between 1 and 60),
 last_name text not null check (length(trim(last_name)) between 1 and 60),
 city text not null check (length(trim(city)) between 2 and 100),
 age integer not null check (age between 1 and 120),
 -- Requested phone, compared with the authoritative Auth phone at completion.
 phone text not null check (phone ~ '^\+[1-9][0-9]{7,14}$'),
 locale text not null default 'he' check (locale in ('he','en')),
 created_at timestamptz not null default now()
);
comment on column public.profiles.age is 'Self-reported age at profile creation or last edit; not date of birth.';
alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant insert (id,first_name,last_name,city,age,phone,locale) on public.profiles to authenticated;
grant update (first_name,last_name,city,age,phone,locale) on public.profiles to authenticated;
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated using ((select auth.uid())=id);
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles for insert to authenticated with check ((select auth.uid())=id);
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated using ((select auth.uid())=id) with check ((select auth.uid())=id);
-- No client-writable verified, role or completed flags. No public profile directory.
-- Phone change confirmation MUST stay enabled in Supabase Auth.

-- Migration 003: Add school + hobbies to profiles, create story_cache
-- Run in Supabase SQL Editor after 002_profiles.sql

-- 1. Add new columns to profiles
alter table public.profiles
  add column if not exists school text not null default '',
  add column if not exists hobbies text[] not null default '{}',
  add column if not exists custom_hobby text;

-- Enforce school constraint (non-empty after trim, max 120)
alter table public.profiles drop constraint if exists profiles_school_length;
alter table public.profiles
  add constraint profiles_school_length
    check (school = '' or (length(trim(school)) between 2 and 120));

-- Grant write access to the new columns
grant update (school, hobbies, custom_hobby) on public.profiles to authenticated;
grant insert (school, hobbies, custom_hobby) on public.profiles to authenticated;

-- 2. Story cache — stores LLM-generated stories keyed by subject/topic/hobby/lang
create extension if not exists vector;

create table if not exists public.story_cache (
  id uuid primary key default gen_random_uuid(),
  subject text not null check (subject in ('math','cs','ai')),
  topic text not null,
  hobby_key text not null,       -- e.g. "football", or custom hobby slug
  lang text not null check (lang in ('he','en')),
  story_text text not null,
  embedding vector(768),         -- text-embedding-004 (Gemini) = 768 dims
  created_at timestamptz not null default now()
);

-- Composite index for exact key lookup (fast path before vector search)
create unique index if not exists story_cache_exact_key
  on public.story_cache (subject, topic, hobby_key, lang);

-- Vector index for approximate hobby similarity
create index if not exists story_cache_embedding_idx
  on public.story_cache using ivfflat (embedding vector_cosine_ops)
  with (lists = 10);

alter table public.story_cache enable row level security;
revoke all on public.story_cache from anon, authenticated;
grant select, insert on public.story_cache to service_role;

-- Function: find a cached story by exact key first, then semantic fallback
create or replace function public.match_story_cache(
  p_subject text,
  p_topic text,
  p_hobby_key text,
  p_lang text
) returns table(id uuid, story_text text, exact_match boolean)
language sql stable security invoker set search_path = public as $$
  select id, story_text, true
  from public.story_cache
  where subject = p_subject and topic = p_topic
    and hobby_key = p_hobby_key and lang = p_lang
  limit 1;
$$;

revoke execute on function public.match_story_cache(text,text,text,text) from public, anon, authenticated;
grant execute on function public.match_story_cache(text,text,text,text) to service_role;


-- Phase 2 migration; not provisioned or required by the demo.
-- Two separate vector collections. They may share a Supabase project.
-- If physical isolation is required, install the corresponding collection in each project.
create extension if not exists vector;
create table if not exists public.material_chunks (
 id uuid primary key default gen_random_uuid(),
 title text not null, content text not null,
 language text not null check (language in ('he','en')),
 subject text not null check (subject in ('math','cs','ai')),
 grade_min int not null check (grade_min between 1 and 12),
 grade_max int not null check (grade_max between grade_min and 12),
 topic text not null, source_url text, source_page int,
 review_status text not null default 'draft' check (review_status in ('draft','approved')),
 embedding_model text not null default 'text-embedding-3-small',
 embedding vector(1536), content_hash text unique
);
create table if not exists public.question_items (
 id uuid primary key default gen_random_uuid(),
 title text not null, question_text text not null,
 language text not null check (language in ('he','en')),
 subject text not null check (subject in ('math','cs','ai')),
 grade_min int not null check (grade_min between 1 and 12),
 grade_max int not null check (grade_max between grade_min and 12),
 difficulty int not null check (difficulty between 1 and 5),
 topic text not null, source_url text, source_page int,
 exam_type text not null default 'original' check (exam_type in ('original','bagrut')),
 exam_year int, questionnaire_code text, units int check (units in (3,4,5)),
 review_status text not null default 'draft' check (review_status in ('draft','approved')),
 embedding_model text not null default 'text-embedding-3-small',
 embedding vector(1536), content_hash text unique,
 check (exam_type <> 'bagrut' or (source_url is not null and exam_year is not null and questionnaire_code is not null))
);
create table if not exists public.question_rubrics (
 question_id uuid primary key references public.question_items(id) on delete cascade,
 answer jsonb not null, worked_solution text not null,
 misconception_tags text[] not null default '{}'
);
alter table public.material_chunks enable row level security;
alter table public.question_items enable row level security;
alter table public.question_rubrics enable row level security;
revoke all on public.material_chunks, public.question_items, public.question_rubrics from anon, authenticated;
grant select,insert,update,delete on public.material_chunks, public.question_items, public.question_rubrics to service_role;
-- Exact search is deliberate for a small reviewed corpus. Add HNSW after measuring recall.
create or replace function public.match_materials(query_embedding vector(1536), requested_language text, requested_subject text, requested_grade int, requested_topic text)
returns table(id uuid,title text,content text,source_url text,source_page int,similarity double precision)
language sql stable security invoker set search_path = public as $$
 select m.id,m.title,m.content,m.source_url,m.source_page,1-(m.embedding <=> query_embedding)
 from public.material_chunks m
 where m.review_status='approved' and m.embedding is not null
 and m.language=requested_language and m.subject=requested_subject
 and requested_grade between m.grade_min and m.grade_max and m.topic=requested_topic
 order by m.embedding <=> query_embedding limit 5;
$$;
create or replace function public.match_questions(query_embedding vector(1536), requested_language text, requested_subject text, requested_grade int, requested_topic text, max_difficulty int, include_bagrut boolean)
returns table(id uuid,title text,question_text text,source_url text,source_page int,exam_type text,exam_year int,questionnaire_code text,difficulty int,similarity double precision)
language sql stable security invoker set search_path = public as $$
 select q.id,q.title,q.question_text,q.source_url,q.source_page,q.exam_type,q.exam_year,q.questionnaire_code,q.difficulty,1-(q.embedding <=> query_embedding)
 from public.question_items q
 where q.review_status='approved' and q.embedding is not null
 and q.language=requested_language and q.subject=requested_subject
 and requested_grade between q.grade_min and q.grade_max and q.topic=requested_topic
 and q.difficulty<=max_difficulty and (include_bagrut or q.exam_type<>'bagrut')
 order by q.embedding <=> query_embedding limit 5;
$$;
revoke execute on function public.match_materials(vector,text,text,int,text) from public, anon, authenticated;
revoke execute on function public.match_questions(vector,text,text,int,text,int,boolean) from public, anon, authenticated;
grant execute on function public.match_materials(vector,text,text,int,text) to service_role;
grant execute on function public.match_questions(vector,text,text,int,text,int,boolean) to service_role;

-- Apply after 002, 003 and schema.sql. All vectors below use gemini-embedding-001 / 1536.
create table if not exists public.entitlements (
 user_id uuid primary key references auth.users(id) on delete cascade,
 plan text not null default 'free' check(plan in ('free','pro')),
 expires_at timestamptz
);
alter table public.entitlements enable row level security;
revoke all on public.entitlements from anon, authenticated;
grant select on public.entitlements to authenticated;
drop policy if exists entitlement_own on public.entitlements;
create policy entitlement_own on public.entitlements for select to authenticated using (auth.uid()=user_id);

create table if not exists public.ai_quota (
 user_id uuid references auth.users(id) on delete cascade,
 bucket timestamptz not null,
 used int not null default 0,
 primary key(user_id,bucket)
);
alter table public.ai_quota enable row level security;
revoke all on public.ai_quota from anon, authenticated;
create or replace function public.consume_ai_quota(p_user uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare n int;
begin
 insert into public.ai_quota(user_id,bucket,used) values(p_user,date_trunc('hour',now()),1)
 on conflict(user_id,bucket) do update set used=public.ai_quota.used+1 where public.ai_quota.used<30
 returning used into n;
 return n is not null;
end;
$$;
revoke all on function public.consume_ai_quota(uuid) from public,anon,authenticated;
grant execute on function public.consume_ai_quota(uuid) to service_role;

create table if not exists public.learning_cache (
 id uuid primary key default gen_random_uuid(),
 cache_key text not null unique,
 owner_id uuid references auth.users(id) on delete cascade,
 kind text not null check(kind in ('story','question')),
 payload jsonb not null,
 embedding vector(1536),
 embedding_model text not null default 'gemini-embedding-001',
 created_at timestamptz not null default now()
);
alter table public.learning_cache enable row level security;
revoke all on public.learning_cache from anon, authenticated;
create table if not exists public.learning_questions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 payload jsonb not null,
 context jsonb not null,
 created_at timestamptz not null default now()
);
alter table public.learning_questions enable row level security;
revoke all on public.learning_questions from anon, authenticated;
grant all on public.entitlements,public.ai_quota,public.learning_cache,public.learning_questions to service_role;
-- Existing approved material vectors must be re-embedded before marking this model.
-- Do not change the model label of old vectors without regenerating the vectors.
create or replace function public.retrieve_learning_material(p_embedding vector(1536),p_language text,p_subject text,p_grade int,p_topic text)
returns table(id uuid,title text,content text,source_url text,source_page int)
language sql stable security invoker set search_path=public as $$
 select m.id,m.title,m.content,m.source_url,m.source_page from public.material_chunks m
 where m.review_status='approved' and m.language=p_language and m.subject=p_subject
 and p_grade between m.grade_min and m.grade_max and m.topic=p_topic
 order by case when m.embedding_model='gemini-embedding-001' then m.embedding <=> p_embedding else null end nulls last
 limit 4;
$$;
revoke all on function public.retrieve_learning_material(vector,text,text,int,text) from public,anon,authenticated;
grant execute on function public.retrieve_learning_material(vector,text,text,int,text) to service_role;
-- Manual POC Pro grant (replace UUID in Supabase SQL editor):
-- insert into public.entitlements(user_id,plan) values ('USER_UUID','pro')
-- on conflict(user_id) do update set plan='pro';
create or replace function public.retrieve_learning_questions(p_embedding vector(1536),p_language text,p_subject text,p_grade int,p_topic text,p_level int)
returns table(id uuid,title text,question_text text,answer jsonb,worked_solution text)
language sql stable security invoker set search_path=public as $$
 select q.id,q.title,q.question_text,r.answer,r.worked_solution
 from public.question_items q join public.question_rubrics r on r.question_id=q.id
 where q.review_status='approved' and q.language=p_language and q.subject=p_subject
 and p_grade between q.grade_min and q.grade_max and q.topic=p_topic
 and q.difficulty<=p_level and q.exam_type='original'
 order by case when q.embedding_model='gemini-embedding-001' then q.embedding <=> p_embedding else null end nulls last limit 2;
$$;
revoke all on function public.retrieve_learning_questions(vector,text,text,int,text,int) from public,anon,authenticated;
grant execute on function public.retrieve_learning_questions(vector,text,text,int,text,int) to service_role;

alter table public.profiles drop constraint if exists profiles_hobbies_bounds;
alter table public.profiles add constraint profiles_hobbies_bounds check(cardinality(hobbies)<=20 and length(array_to_string(hobbies,','))<=1220 and (custom_hobby is null or length(custom_hobby)<=60));
grant all on public.profiles to service_role;

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

-- Existing profiles choose a grade on their next profile visit.
alter table public.profiles add column if not exists grade integer;
alter table public.profiles drop constraint if exists profiles_grade_range;
alter table public.profiles
  add constraint profiles_grade_range check (grade between 1 and 12);
grant insert (grade), update (grade) on public.profiles to authenticated;

comment on column public.profiles.grade is
  'Current Israeli school grade, from 1 through 12.';

commit;
