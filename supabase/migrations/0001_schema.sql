-- nutritionpep initial schema and RLS
-- Run in Supabase SQL editor or via Supabase CLI migrations

create schema if not exists public;
create extension if not exists pgcrypto;

-- Enums
do $$ begin
    create type public.user_role as enum ('user','moderator','admin');
exception when duplicate_object then null; end $$;

do $$ begin
    create type public.activity_level as enum ('sedentary','light','moderate','active','very_active');
exception when duplicate_object then null; end $$;

do $$ begin
    create type public.goal_type as enum ('lose','maintain','gain');
exception when duplicate_object then null; end $$;

do $$ begin
    create type public.meal_type as enum ('breakfast','lunch','dinner','snack');
exception when duplicate_object then null; end $$;

do $$ begin
    create type public.food_source as enum ('curated','usda','openfoodfacts');
exception when duplicate_object then null; end $$;

-- Tables
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text,
    avatar_url text,
    role public.user_role not null default 'user',
    units text check (units in ('metric','imperial')) default 'metric',
    locale text,
    timezone text,
    accepted_privacy_at timestamptz,
    accepted_terms_version text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Helper function to check admin or moderator role (after profiles exist)
drop function if exists public.is_admin();
create function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin','moderator')
  );
$$;

create table if not exists public.biometrics (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    ts timestamptz not null default now(),
    weight_kg numeric,
    height_cm numeric,
    body_fat_pct numeric,
    measurements jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index if not exists biometrics_user_ts_idx on public.biometrics(user_id, ts desc);

create table if not exists public.goals (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    activity_level public.activity_level not null default 'sedentary',
    goal_type public.goal_type not null default 'maintain',
    pace numeric, -- kcal/day adj or percent per PRD tuning
    protein_strategy text, -- e.g., g_per_kg or custom
    protein_g_per_kg numeric,
    fat_g_per_kg numeric,
    carb_strategy text,
    carb_g numeric,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index if not exists goals_user_idx on public.goals(user_id);

create table if not exists public.targets (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    date date not null,
    calories_kcal numeric,
    protein_g numeric,
    carbs_g numeric,
    fat_g numeric,
    fiber_g numeric,
    method text,
    meta jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (user_id, date)
);
create index if not exists targets_user_date_idx on public.targets(user_id, date);

create table if not exists public.foods (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    brand text,
    category text,
    barcode text,
    image_path text,
    serving_sizes jsonb,
    nutrients_per_100g jsonb,
    nutrients_per_serving jsonb,
    source public.food_source not null default 'curated',
    verified boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index if not exists foods_barcode_idx on public.foods(barcode);
create index if not exists foods_name_brand_fts on public.foods using gin (
  to_tsvector('simple', coalesce(name,'') || ' ' || coalesce(brand,''))
);

create table if not exists public.diary_entries (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    date date not null,
    meal_type public.meal_type not null,
    items jsonb not null, -- array of {food_id?, name, grams, nutrients_snapshot}
    totals jsonb, -- computed per entry
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index if not exists diary_user_date_idx on public.diary_entries(user_id, date);

create table if not exists public.analytics_events (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete set null,
    name text not null,
    props jsonb,
    ts timestamptz not null default now()
);
create index if not exists analytics_name_ts_idx on public.analytics_events(name, ts desc);

-- RLS
alter table public.profiles enable row level security;
alter table public.biometrics enable row level security;
alter table public.goals enable row level security;
alter table public.targets enable row level security;
alter table public.foods enable row level security;
alter table public.diary_entries enable row level security;
alter table public.analytics_events enable row level security;

-- Profiles policies
drop policy if exists profiles_self_rw on public.profiles;
create policy profiles_self_rw on public.profiles
for select using (id = auth.uid());

drop policy if exists profiles_self_insert on public.profiles;
create policy profiles_self_insert on public.profiles
for insert with check (id = auth.uid());

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles
for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists profiles_admin_select on public.profiles;
create policy profiles_admin_select on public.profiles
for select using (public.is_admin());

drop policy if exists profiles_admin_insert on public.profiles;
create policy profiles_admin_insert on public.profiles
for insert with check (public.is_admin());

drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_admin_update on public.profiles
for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists profiles_admin_delete on public.profiles;
create policy profiles_admin_delete on public.profiles
for delete using (public.is_admin());

-- Biometrics policies: owner full, admin read
drop policy if exists biometrics_owner_select on public.biometrics;
create policy biometrics_owner_select on public.biometrics
for select using (user_id = auth.uid());

drop policy if exists biometrics_owner_insert on public.biometrics;
create policy biometrics_owner_insert on public.biometrics
for insert with check (user_id = auth.uid());

drop policy if exists biometrics_owner_update on public.biometrics;
create policy biometrics_owner_update on public.biometrics
for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists biometrics_owner_delete on public.biometrics;
create policy biometrics_owner_delete on public.biometrics
for delete using (user_id = auth.uid());

drop policy if exists biometrics_admin_r on public.biometrics;
create policy biometrics_admin_r on public.biometrics
for select using (public.is_admin());

-- Goals policies: owner full, admin read
drop policy if exists goals_owner_select on public.goals;
create policy goals_owner_select on public.goals
for select using (user_id = auth.uid());

drop policy if exists goals_owner_insert on public.goals;
create policy goals_owner_insert on public.goals
for insert with check (user_id = auth.uid());

drop policy if exists goals_owner_update on public.goals;
create policy goals_owner_update on public.goals
for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists goals_owner_delete on public.goals;
create policy goals_owner_delete on public.goals
for delete using (user_id = auth.uid());

drop policy if exists goals_admin_r on public.goals;
create policy goals_admin_r on public.goals
for select using (public.is_admin());

-- Targets policies: owner full, admin read
drop policy if exists targets_owner_select on public.targets;
create policy targets_owner_select on public.targets
for select using (user_id = auth.uid());

drop policy if exists targets_owner_insert on public.targets;
create policy targets_owner_insert on public.targets
for insert with check (user_id = auth.uid());

drop policy if exists targets_owner_update on public.targets;
create policy targets_owner_update on public.targets
for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists targets_owner_delete on public.targets;
create policy targets_owner_delete on public.targets
for delete using (user_id = auth.uid());

drop policy if exists targets_admin_r on public.targets;
create policy targets_admin_r on public.targets
for select using (public.is_admin());

-- Foods policies: public read, admin write
drop policy if exists foods_public_r on public.foods;
create policy foods_public_r on public.foods
for select using (true);

drop policy if exists foods_admin_w on public.foods;
create policy foods_admin_w on public.foods
for insert with check (public.is_admin());

drop policy if exists foods_admin_u on public.foods;
create policy foods_admin_u on public.foods
for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists foods_admin_d on public.foods;
create policy foods_admin_d on public.foods
for delete using (public.is_admin());

-- Diary entries: owner full, admin read
drop policy if exists diary_owner_select on public.diary_entries;
create policy diary_owner_select on public.diary_entries
for select using (user_id = auth.uid());

drop policy if exists diary_owner_insert on public.diary_entries;
create policy diary_owner_insert on public.diary_entries
for insert with check (user_id = auth.uid());

drop policy if exists diary_owner_update on public.diary_entries;
create policy diary_owner_update on public.diary_entries
for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists diary_owner_delete on public.diary_entries;
create policy diary_owner_delete on public.diary_entries
for delete using (user_id = auth.uid());

drop policy if exists diary_admin_r on public.diary_entries;
create policy diary_admin_r on public.diary_entries
for select using (public.is_admin());

-- Analytics events: service role insert; admin read
drop policy if exists analytics_service_insert on public.analytics_events;
create policy analytics_service_insert on public.analytics_events
for insert with check (auth.role() = 'service_role');

drop policy if exists analytics_admin_r on public.analytics_events;
create policy analytics_admin_r on public.analytics_events
for select using (public.is_admin());

-- Updated_at simple trigger (optional)
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

do $$ begin
  create trigger touch_profiles before update on public.profiles
  for each row execute procedure public.touch_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger touch_biometrics before update on public.biometrics
  for each row execute procedure public.touch_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger touch_goals before update on public.goals
  for each row execute procedure public.touch_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger touch_targets before update on public.targets
  for each row execute procedure public.touch_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger touch_foods before update on public.foods
  for each row execute procedure public.touch_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger touch_diary before update on public.diary_entries
  for each row execute procedure public.touch_updated_at();
exception when duplicate_object then null; end $$;

