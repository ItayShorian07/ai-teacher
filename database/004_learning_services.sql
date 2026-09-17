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
