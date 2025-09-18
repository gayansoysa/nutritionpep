-- Create meal templates table
create table if not exists public.meal_templates (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name text not null,
    description text,
    items jsonb not null, -- array of food items (same structure as diary_entries.items)
    totals jsonb, -- computed nutrition totals
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Create indexes
create index if not exists meal_templates_user_id_idx on public.meal_templates(user_id);
create index if not exists meal_templates_name_idx on public.meal_templates(user_id, name);

-- Enable RLS
alter table public.meal_templates enable row level security;

-- RLS policies
create policy "Users can view their own meal templates"
    on public.meal_templates for select
    using (auth.uid() = user_id);

create policy "Users can insert their own meal templates"
    on public.meal_templates for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own meal templates"
    on public.meal_templates for update
    using (auth.uid() = user_id);

create policy "Users can delete their own meal templates"
    on public.meal_templates for delete
    using (auth.uid() = user_id);

-- Add updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger handle_meal_templates_updated_at
    before update on public.meal_templates
    for each row execute procedure public.handle_updated_at();