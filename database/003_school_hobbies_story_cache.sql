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

