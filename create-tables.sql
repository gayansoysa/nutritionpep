-- Create recipe visibility enum
DO $$ BEGIN
    CREATE TYPE public.recipe_visibility AS ENUM ('private','public','shared');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Create recipe difficulty enum  
DO $$ BEGIN
    CREATE TYPE public.recipe_difficulty AS ENUM ('easy','medium','hard');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Main recipes table
CREATE TABLE IF NOT EXISTS public.recipes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    instructions text,
    prep_time_minutes integer,
    cook_time_minutes integer,
    total_time_minutes integer GENERATED ALWAYS AS (prep_time_minutes + cook_time_minutes) STORED,
    servings integer NOT NULL DEFAULT 1,
    difficulty public.recipe_difficulty DEFAULT 'easy',
    visibility public.recipe_visibility NOT NULL DEFAULT 'private',
    image_url text,
    tags text[] DEFAULT '{}',
    category text,
    cuisine text,
    calories_per_serving numeric,
    protein_per_serving numeric,
    carbs_per_serving numeric,
    fat_per_serving numeric,
    fiber_per_serving numeric,
    calories_per_100g numeric,
    protein_per_100g numeric,
    carbs_per_100g numeric,
    fat_per_100g numeric,
    fiber_per_100g numeric,
    total_weight_g numeric,
    average_rating numeric DEFAULT 0,
    rating_count integer DEFAULT 0,
    times_made integer DEFAULT 0,
    times_favorited integer DEFAULT 0,
    source_url text,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Recipe ingredients table
CREATE TABLE IF NOT EXISTS public.recipe_ingredients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    food_id uuid REFERENCES public.foods(id) ON DELETE SET NULL,
    name text NOT NULL,
    amount numeric NOT NULL,
    unit text NOT NULL,
    grams numeric NOT NULL,
    preparation text,
    notes text,
    optional boolean DEFAULT false,
    calories numeric,
    protein numeric,
    carbs numeric,
    fat numeric,
    fiber numeric,
    sort_order integer DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Recipe ratings table
CREATE TABLE IF NOT EXISTS public.recipe_ratings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (recipe_id, user_id)
);

-- Recipe favorites table
CREATE TABLE IF NOT EXISTS public.recipe_favorites (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipe_id uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, recipe_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS recipes_user_id_idx ON public.recipes(user_id);
CREATE INDEX IF NOT EXISTS recipes_visibility_idx ON public.recipes(visibility);
CREATE INDEX IF NOT EXISTS recipes_category_idx ON public.recipes(category);
CREATE INDEX IF NOT EXISTS recipes_cuisine_idx ON public.recipes(cuisine);
CREATE INDEX IF NOT EXISTS recipes_difficulty_idx ON public.recipes(difficulty);
CREATE INDEX IF NOT EXISTS recipes_rating_idx ON public.recipes(average_rating DESC);
CREATE INDEX IF NOT EXISTS recipes_created_idx ON public.recipes(created_at DESC);
CREATE INDEX IF NOT EXISTS recipes_name_fts ON public.recipes USING gin (to_tsvector('simple', name));
CREATE INDEX IF NOT EXISTS recipes_tags_idx ON public.recipes USING gin (tags);

CREATE INDEX IF NOT EXISTS recipe_ingredients_recipe_idx ON public.recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS recipe_ingredients_food_idx ON public.recipe_ingredients(food_id);
CREATE INDEX IF NOT EXISTS recipe_ingredients_sort_idx ON public.recipe_ingredients(recipe_id, sort_order);

CREATE INDEX IF NOT EXISTS recipe_ratings_recipe_idx ON public.recipe_ratings(recipe_id);
CREATE INDEX IF NOT EXISTS recipe_ratings_user_idx ON public.recipe_ratings(user_id);

CREATE INDEX IF NOT EXISTS recipe_favorites_user_idx ON public.recipe_favorites(user_id);
CREATE INDEX IF NOT EXISTS recipe_favorites_recipe_idx ON public.recipe_favorites(recipe_id);

-- Enable RLS
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recipes
DROP POLICY IF EXISTS recipes_select_policy ON public.recipes;
CREATE POLICY recipes_select_policy ON public.recipes
FOR SELECT USING (
    user_id = auth.uid() OR 
    visibility = 'public' OR 
    (visibility = 'shared' AND auth.uid() IS NOT NULL)
);

DROP POLICY IF EXISTS recipes_insert_policy ON public.recipes;
CREATE POLICY recipes_insert_policy ON public.recipes
FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS recipes_update_policy ON public.recipes;
CREATE POLICY recipes_update_policy ON public.recipes
FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS recipes_delete_policy ON public.recipes;
CREATE POLICY recipes_delete_policy ON public.recipes
FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for recipe_ingredients
DROP POLICY IF EXISTS recipe_ingredients_select_policy ON public.recipe_ingredients;
CREATE POLICY recipe_ingredients_select_policy ON public.recipe_ingredients
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.recipes r 
        WHERE r.id = recipe_id AND (
            r.user_id = auth.uid() OR 
            r.visibility = 'public' OR 
            (r.visibility = 'shared' AND auth.uid() IS NOT NULL)
        )
    )
);

DROP POLICY IF EXISTS recipe_ingredients_insert_policy ON public.recipe_ingredients;
CREATE POLICY recipe_ingredients_insert_policy ON public.recipe_ingredients
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.recipes r 
        WHERE r.id = recipe_id AND r.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS recipe_ingredients_update_policy ON public.recipe_ingredients;
CREATE POLICY recipe_ingredients_update_policy ON public.recipe_ingredients
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.recipes r 
        WHERE r.id = recipe_id AND r.user_id = auth.uid()
    )
) WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.recipes r 
        WHERE r.id = recipe_id AND r.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS recipe_ingredients_delete_policy ON public.recipe_ingredients;
CREATE POLICY recipe_ingredients_delete_policy ON public.recipe_ingredients
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.recipes r 
        WHERE r.id = recipe_id AND r.user_id = auth.uid()
    )
);

-- RLS Policies for recipe_ratings
DROP POLICY IF EXISTS recipe_ratings_select_policy ON public.recipe_ratings;
CREATE POLICY recipe_ratings_select_policy ON public.recipe_ratings
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.recipes r 
        WHERE r.id = recipe_id AND (
            r.user_id = auth.uid() OR 
            r.visibility = 'public' OR 
            (r.visibility = 'shared' AND auth.uid() IS NOT NULL)
        )
    )
);

DROP POLICY IF EXISTS recipe_ratings_insert_policy ON public.recipe_ratings;
CREATE POLICY recipe_ratings_insert_policy ON public.recipe_ratings
FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM public.recipes r 
        WHERE r.id = recipe_id AND r.user_id != auth.uid() AND (
            r.visibility = 'public' OR 
            (r.visibility = 'shared' AND auth.uid() IS NOT NULL)
        )
    )
);

DROP POLICY IF EXISTS recipe_ratings_update_policy ON public.recipe_ratings;
CREATE POLICY recipe_ratings_update_policy ON public.recipe_ratings
FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS recipe_ratings_delete_policy ON public.recipe_ratings;
CREATE POLICY recipe_ratings_delete_policy ON public.recipe_ratings
FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for recipe_favorites
DROP POLICY IF EXISTS recipe_favorites_select_policy ON public.recipe_favorites;
CREATE POLICY recipe_favorites_select_policy ON public.recipe_favorites
FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS recipe_favorites_insert_policy ON public.recipe_favorites;
CREATE POLICY recipe_favorites_insert_policy ON public.recipe_favorites
FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM public.recipes r 
        WHERE r.id = recipe_id AND (
            r.user_id = auth.uid() OR 
            r.visibility = 'public' OR 
            (r.visibility = 'shared' AND auth.uid() IS NOT NULL)
        )
    )
);

DROP POLICY IF EXISTS recipe_favorites_delete_policy ON public.recipe_favorites;
CREATE POLICY recipe_favorites_delete_policy ON public.recipe_favorites
FOR DELETE USING (user_id = auth.uid());