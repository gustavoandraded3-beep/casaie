-- ============================================================
-- CasaIE — Supabase Schema (sem autenticação)
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ─── Properties ─────────────────────────────────────────────
create table if not exists properties (
  id         uuid primary key default gen_random_uuid(),
  data       jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── Developments ───────────────────────────────────────────
create table if not exists developments (
  id         uuid primary key default gen_random_uuid(),
  data       jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── Financial config (single row, upserted) ─────────────────
create table if not exists financial_config (
  id         uuid primary key default gen_random_uuid(),
  singleton  text unique default 'main',  -- always one row
  data       jsonb not null,
  updated_at timestamptz default now()
);

-- ─── Affordable Applications ─────────────────────────────────
create table if not exists affordable_applications (
  id         uuid primary key default gen_random_uuid(),
  data       jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── Allow full public access (no auth) ──────────────────────
-- Since there's no login, we allow anon key to read/write everything.
-- The data is only accessible to people who have the site URL.

alter table properties            enable row level security;
alter table developments          enable row level security;
alter table financial_config      enable row level security;
alter table affordable_applications enable row level security;

create policy "public_all" on properties            for all using (true) with check (true);
create policy "public_all" on developments          for all using (true) with check (true);
create policy "public_all" on financial_config      for all using (true) with check (true);
create policy "public_all" on affordable_applications for all using (true) with check (true);
