-- Recipe Management System Database Schema
-- Migration: 20241201000004_create_recipes_system.sql

-- Create recipe visibility enum
do $$ begin
    create type public.recipe_visibility as enum ('private','public','shared');
exception when duplicate_object then null; end $$;

-- Create recipe difficulty enum
do $$ begin
    create type public.recipe_difficulty as enum ('easy','medium','hard');
exception when duplicate_object then null; end $$;

-- Main recipes table
create table if not exists public.recipes (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name text not null,
    description text,
    instructions text,
    prep_time_minutes integer,
    cook_time_minutes integer,
    total_time_minutes integer generated always as (prep_time_minutes + cook_time_minutes) stored,
    servings integer not null default 1,
    difficulty public.recipe_difficulty default 'easy',
    visibility public.recipe_visibility not null default 'private',
    image_url text,
    tags text[] default '{}',
    category text,
    cuisine text,
    
    -- Nutrition per serving (calculated from ingredients)
    calories_per_serving numeric,
    protein_per_serving numeric,
    carbs_per_serving numeric,
    fat_per_serving numeric,
    fiber_per_serving numeric,
    
    -- Nutrition per 100g (for consistency with foods table)
    calories_per_100g numeric,
    protein_per_100g numeric,
    carbs_per_100g numeric,
    fat_per_100g numeric,
    fiber_per_100g numeric,
    
    -- Total recipe weight in grams (calculated from ingredients)
    total_weight_g numeric,
    
    -- Rating and usage stats
    average_rating numeric default 0,
    rating_count integer default 0,
    times_made integer default 0,
    times_favorited integer default 0,
    
    -- Metadata
    source_url text,
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Recipe ingredients table (junction table between recipes and foods)
create table if not exists public.recipe_ingredients (
    id uuid primary key default gen_random_uuid(),
    recipe_id uuid not null references public.recipes(id) on delete cascade,
    food_id uuid references public.foods(id) on delete set null,
    
    -- Ingredient details
    name text not null, -- Store name in case food is deleted
    amount numeric not null,
    unit text not null, -- grams, cups, tbsp, etc.
    grams numeric not null, -- normalized amount in grams for calculations
    
    -- Optional details
    preparation text, -- "chopped", "diced", "cooked", etc.
    notes text,
    optional boolean default false,
    
    -- Nutrition snapshot (calculated at time of adding)
    calories numeric,
    protein numeric,
    carbs numeric,
    fat numeric,
    fiber numeric,
    
    -- Order for display
    sort_order integer default 0,
    
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Recipe ratings table
create table if not exists public.recipe_ratings (
    id uuid primary key default gen_random_uuid(),
    recipe_id uuid not null references public.recipes(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    rating integer not null check (rating >= 1 and rating <= 5),
    review text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (recipe_id, user_id)
);

-- Recipe collections/cookbooks table
create table if not exists public.recipe_collections (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name text not null,
    description text,
    image_url text,
    visibility public.recipe_visibility not null default 'private',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Junction table for recipes in collections
create table if not exists public.recipe_collection_items (
    id uuid primary key default gen_random_uuid(),
    collection_id uuid not null references public.recipe_collections(id) on delete cascade,
    recipe_id uuid not null references public.recipes(id) on delete cascade,
    added_at timestamptz not null default now(),
    unique (collection_id, recipe_id)
);

-- Recipe favorites table
create table if not exists public.recipe_favorites (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    recipe_id uuid not null references public.recipes(id) on delete cascade,
    created_at timestamptz not null default now(),
    unique (user_id, recipe_id)
);

-- Indexes for performance
create index if not exists recipes_user_id_idx on public.recipes(user_id);
create index if not exists recipes_visibility_idx on public.recipes(visibility);
create index if not exists recipes_category_idx on public.recipes(category);
create index if not exists recipes_cuisine_idx on public.recipes(cuisine);
create index if not exists recipes_difficulty_idx on public.recipes(difficulty);
create index if not exists recipes_rating_idx on public.recipes(average_rating desc);
create index if not exists recipes_created_idx on public.recipes(created_at desc);
create index if not exists recipes_name_fts on public.recipes using gin (to_tsvector('simple', name));
create index if not exists recipes_tags_idx on public.recipes using gin (tags);

create index if not exists recipe_ingredients_recipe_idx on public.recipe_ingredients(recipe_id);
create index if not exists recipe_ingredients_food_idx on public.recipe_ingredients(food_id);
create index if not exists recipe_ingredients_sort_idx on public.recipe_ingredients(recipe_id, sort_order);

create index if not exists recipe_ratings_recipe_idx on public.recipe_ratings(recipe_id);
create index if not exists recipe_ratings_user_idx on public.recipe_ratings(user_id);

create index if not exists recipe_collections_user_idx on public.recipe_collections(user_id);
create index if not exists recipe_collection_items_collection_idx on public.recipe_collection_items(collection_id);
create index if not exists recipe_collection_items_recipe_idx on public.recipe_collection_items(recipe_id);

create index if not exists recipe_favorites_user_idx on public.recipe_favorites(user_id);
create index if not exists recipe_favorites_recipe_idx on public.recipe_favorites(recipe_id);

-- Enable RLS
alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.recipe_ratings enable row level security;
alter table public.recipe_collections enable row level security;
alter table public.recipe_collection_items enable row level security;
alter table public.recipe_favorites enable row level security;

-- RLS Policies for recipes
-- Users can see their own recipes, public recipes, and shared recipes
drop policy if exists recipes_select_policy on public.recipes;
create policy recipes_select_policy on public.recipes
for select using (
    user_id = auth.uid() or 
    visibility = 'public' or 
    (visibility = 'shared' and auth.uid() is not null)
);

-- Users can only insert their own recipes
drop policy if exists recipes_insert_policy on public.recipes;
create policy recipes_insert_policy on public.recipes
for insert with check (user_id = auth.uid());

-- Users can only update their own recipes
drop policy if exists recipes_update_policy on public.recipes;
create policy recipes_update_policy on public.recipes
for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Users can only delete their own recipes
drop policy if exists recipes_delete_policy on public.recipes;
create policy recipes_delete_policy on public.recipes
for delete using (user_id = auth.uid());

-- RLS Policies for recipe_ingredients
-- Users can see ingredients for recipes they can see
drop policy if exists recipe_ingredients_select_policy on public.recipe_ingredients;
create policy recipe_ingredients_select_policy on public.recipe_ingredients
for select using (
    exists (
        select 1 from public.recipes r 
        where r.id = recipe_id and (
            r.user_id = auth.uid() or 
            r.visibility = 'public' or 
            (r.visibility = 'shared' and auth.uid() is not null)
        )
    )
);

-- Users can only modify ingredients for their own recipes
drop policy if exists recipe_ingredients_insert_policy on public.recipe_ingredients;
create policy recipe_ingredients_insert_policy on public.recipe_ingredients
for insert with check (
    exists (
        select 1 from public.recipes r 
        where r.id = recipe_id and r.user_id = auth.uid()
    )
);

drop policy if exists recipe_ingredients_update_policy on public.recipe_ingredients;
create policy recipe_ingredients_update_policy on public.recipe_ingredients
for update using (
    exists (
        select 1 from public.recipes r 
        where r.id = recipe_id and r.user_id = auth.uid()
    )
) with check (
    exists (
        select 1 from public.recipes r 
        where r.id = recipe_id and r.user_id = auth.uid()
    )
);

drop policy if exists recipe_ingredients_delete_policy on public.recipe_ingredients;
create policy recipe_ingredients_delete_policy on public.recipe_ingredients
for delete using (
    exists (
        select 1 from public.recipes r 
        where r.id = recipe_id and r.user_id = auth.uid()
    )
);

-- RLS Policies for recipe_ratings
-- Users can see all ratings for recipes they can see
drop policy if exists recipe_ratings_select_policy on public.recipe_ratings;
create policy recipe_ratings_select_policy on public.recipe_ratings
for select using (
    exists (
        select 1 from public.recipes r 
        where r.id = recipe_id and (
            r.user_id = auth.uid() or 
            r.visibility = 'public' or 
            (r.visibility = 'shared' and auth.uid() is not null)
        )
    )
);

-- Users can only rate recipes they can see (not their own)
drop policy if exists recipe_ratings_insert_policy on public.recipe_ratings;
create policy recipe_ratings_insert_policy on public.recipe_ratings
for insert with check (
    user_id = auth.uid() and
    exists (
        select 1 from public.recipes r 
        where r.id = recipe_id and r.user_id != auth.uid() and (
            r.visibility = 'public' or 
            (r.visibility = 'shared' and auth.uid() is not null)
        )
    )
);

-- Users can only update their own ratings
drop policy if exists recipe_ratings_update_policy on public.recipe_ratings;
create policy recipe_ratings_update_policy on public.recipe_ratings
for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Users can only delete their own ratings
drop policy if exists recipe_ratings_delete_policy on public.recipe_ratings;
create policy recipe_ratings_delete_policy on public.recipe_ratings
for delete using (user_id = auth.uid());

-- RLS Policies for recipe_collections
-- Users can see their own collections and public collections
drop policy if exists recipe_collections_select_policy on public.recipe_collections;
create policy recipe_collections_select_policy on public.recipe_collections
for select using (
    user_id = auth.uid() or 
    visibility = 'public' or 
    (visibility = 'shared' and auth.uid() is not null)
);

-- Users can only create their own collections
drop policy if exists recipe_collections_insert_policy on public.recipe_collections;
create policy recipe_collections_insert_policy on public.recipe_collections
for insert with check (user_id = auth.uid());

-- Users can only update their own collections
drop policy if exists recipe_collections_update_policy on public.recipe_collections;
create policy recipe_collections_update_policy on public.recipe_collections
for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Users can only delete their own collections
drop policy if exists recipe_collections_delete_policy on public.recipe_collections;
create policy recipe_collections_delete_policy on public.recipe_collections
for delete using (user_id = auth.uid());

-- RLS Policies for recipe_collection_items
-- Users can see items in collections they can see
drop policy if exists recipe_collection_items_select_policy on public.recipe_collection_items;
create policy recipe_collection_items_select_policy on public.recipe_collection_items
for select using (
    exists (
        select 1 from public.recipe_collections c 
        where c.id = collection_id and (
            c.user_id = auth.uid() or 
            c.visibility = 'public' or 
            (c.visibility = 'shared' and auth.uid() is not null)
        )
    )
);

-- Users can only add items to their own collections
drop policy if exists recipe_collection_items_insert_policy on public.recipe_collection_items;
create policy recipe_collection_items_insert_policy on public.recipe_collection_items
for insert with check (
    exists (
        select 1 from public.recipe_collections c 
        where c.id = collection_id and c.user_id = auth.uid()
    )
);

-- Users can only remove items from their own collections
drop policy if exists recipe_collection_items_delete_policy on public.recipe_collection_items;
create policy recipe_collection_items_delete_policy on public.recipe_collection_items
for delete using (
    exists (
        select 1 from public.recipe_collections c 
        where c.id = collection_id and c.user_id = auth.uid()
    )
);

-- RLS Policies for recipe_favorites
-- Users can see their own favorites
drop policy if exists recipe_favorites_select_policy on public.recipe_favorites;
create policy recipe_favorites_select_policy on public.recipe_favorites
for select using (user_id = auth.uid());

-- Users can only favorite recipes they can see
drop policy if exists recipe_favorites_insert_policy on public.recipe_favorites;
create policy recipe_favorites_insert_policy on public.recipe_favorites
for insert with check (
    user_id = auth.uid() and
    exists (
        select 1 from public.recipes r 
        where r.id = recipe_id and (
            r.user_id = auth.uid() or 
            r.visibility = 'public' or 
            (r.visibility = 'shared' and auth.uid() is not null)
        )
    )
);

-- Users can only remove their own favorites
drop policy if exists recipe_favorites_delete_policy on public.recipe_favorites;
create policy recipe_favorites_delete_policy on public.recipe_favorites
for delete using (user_id = auth.uid());

-- Admin policies for all recipe tables
drop policy if exists recipes_admin_all on public.recipes;
create policy recipes_admin_all on public.recipes
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists recipe_ingredients_admin_all on public.recipe_ingredients;
create policy recipe_ingredients_admin_all on public.recipe_ingredients
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists recipe_ratings_admin_all on public.recipe_ratings;
create policy recipe_ratings_admin_all on public.recipe_ratings
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists recipe_collections_admin_all on public.recipe_collections;
create policy recipe_collections_admin_all on public.recipe_collections
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists recipe_collection_items_admin_all on public.recipe_collection_items;
create policy recipe_collection_items_admin_all on public.recipe_collection_items
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists recipe_favorites_admin_all on public.recipe_favorites;
create policy recipe_favorites_admin_all on public.recipe_favorites
for all using (public.is_admin()) with check (public.is_admin());