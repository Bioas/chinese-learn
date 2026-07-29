-- ============================================================================
-- Cross-device sync schema for Chinese Learn app
-- ----------------------------------------------------------------------------
-- Run this in Supabase SQL Editor (https://app.supabase.com → SQL Editor)
-- after creating your project. This file is idempotent so re-running is safe.
--
-- What it does:
--   1. Creates `public.user_progress` — a JSONB blob keyed by Supabase auth id
--   2. Enables Row Level Security so users can ONLY read/write their own row
--   3. Adds the table to the `supabase_realtime` publication so other devices
--      receive a postgres-changes event whenever this row is updated
--   4. Keeps an `updated_at` timestamp so clients can implement smarter
--      conflict resolution later (e.g. last-write-wins using `updated_at`)
-- ============================================================================

-- 1. Table ------------------------------------------------------------------
create table if not exists public.user_progress (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists user_progress_updated_at_idx
  on public.user_progress (updated_at desc);

-- Trigger to keep updated_at fresh
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_user_progress_touch on public.user_progress;
create trigger trg_user_progress_touch
  before update on public.user_progress
  for each row execute function public.touch_updated_at();

-- 2. Row Level Security ------------------------------------------------------
alter table public.user_progress enable row level security;

-- Drop old policies if they exist so this file stays idempotent
drop policy if exists "Users can view own progress"   on public.user_progress;
drop policy if exists "Users can insert own progress" on public.user_progress;
drop policy if exists "Users can update own progress" on public.user_progress;
drop policy if exists "Users can delete own progress" on public.user_progress;

create policy "Users can view own progress"
  on public.user_progress
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own progress"
  on public.user_progress
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own progress"
  on public.user_progress
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own progress"
  on public.user_progress
  for delete
  using (auth.uid() = user_id);

-- 3. Realtime ---------------------------------------------------------------
-- Add the table to the supabase_realtime publication so the client can
-- subscribe to updates and propagate changes to other open devices.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'user_progress'
  ) then
    execute 'alter publication supabase_realtime add table public.user_progress';
  end if;
end;
$$;
