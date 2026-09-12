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
