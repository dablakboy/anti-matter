-- Run in Supabase Dashboard → SQL Editor
-- Tracks device upload counts and subscriptions for developer paywall.

create table if not exists public.developer_device_usage (
  device_id text primary key,
  upload_count int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.developer_subscriptions (
  device_id text primary key,
  stripe_customer_id text,
  current_period_end timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
