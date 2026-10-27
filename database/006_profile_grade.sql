-- Existing profiles choose a grade on their next profile visit.
alter table public.profiles add column if not exists grade integer;
alter table public.profiles drop constraint if exists profiles_grade_range;
alter table public.profiles
  add constraint profiles_grade_range check (grade between 1 and 12);
grant insert (grade), update (grade) on public.profiles to authenticated;

comment on column public.profiles.grade is
  'Current Israeli school grade, from 1 through 12.';
