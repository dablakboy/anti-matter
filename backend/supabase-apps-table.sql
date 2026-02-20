-- Run this in Supabase Dashboard → SQL Editor to create the apps table for developer portal submissions.
--
-- Also create a Storage bucket named "app-assets" (Dashboard → Storage → New bucket) for app icons.
-- Keep it private; the backend generates signed URLs when needed.

create table if not exists public.apps (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  developer_name text not null,
  version text not null,
  category text not null,
  ipa_path text not null,
  device text not null default 'both',
  icon_path text,
  social_twitter text,
  social_website text,
  app_store_link text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  uploaded_by_device_id text
);

-- Backend uses Supabase service role, which has full access to the table.

-- If table already exists, add columns:
-- alter table public.apps add column if not exists uploaded_by_device_id text;
-- alter table public.apps add column if not exists device text not null default 'both';

-- Push notification tokens (for "new app" alerts)
create table if not exists public.push_tokens (
  token text primary key,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
