-- Function to search recipes
CREATE OR REPLACE FUNCTION public.search_recipes(
    search_query text DEFAULT '',
    category_filter text DEFAULT NULL,
    cuisine_filter text DEFAULT NULL,
    difficulty_filter public.recipe_difficulty DEFAULT NULL,
    max_time_minutes integer DEFAULT NULL,
    min_rating numeric DEFAULT NULL,
    tags_filter text[] DEFAULT NULL,
    visibility_filter public.recipe_visibility DEFAULT NULL,
    user_id_filter uuid DEFAULT NULL,
    limit_param integer DEFAULT 20,
    offset_param integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    name text,
    description text,
    user_id uuid,
    user_name text,
    prep_time_minutes integer,
    cook_time_minutes integer,
    total_time_minutes integer,
    servings integer,
    difficulty public.recipe_difficulty,
    visibility public.recipe_visibility,
    image_url text,
    tags text[],
    category text,
    cuisine text,
    calories_per_serving numeric,
    protein_per_serving numeric,
    carbs_per_serving numeric,
    fat_per_serving numeric,
    fiber_per_serving numeric,
    average_rating numeric,
    rating_count integer,
    times_made integer,
    times_favorited integer,
    created_at timestamptz,
    is_favorited boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.name,
        r.description,
        r.user_id,
        COALESCE(p.full_name, 'Anonymous') as user_name,
        r.prep_time_minutes,
        r.cook_time_minutes,
        r.total_time_minutes,
        r.servings,
        r.difficulty,
        r.visibility,
        r.image_url,
        r.tags,
        r.category,
        r.cuisine,
        r.calories_per_serving,
        r.protein_per_serving,
        r.carbs_per_serving,
        r.fat_per_serving,
        r.fiber_per_serving,
        r.average_rating,
        r.rating_count,
        r.times_made,
        r.times_favorited,
        r.created_at,
        CASE WHEN rf.id IS NOT NULL THEN true ELSE false END as is_favorited
    FROM public.recipes r
    LEFT JOIN public.profiles p ON r.user_id = p.id
    LEFT JOIN public.recipe_favorites rf ON r.id = rf.recipe_id AND rf.user_id = auth.uid()
    WHERE 
        -- Visibility check
        (r.user_id = auth.uid() OR r.visibility = 'public' OR (r.visibility = 'shared' AND auth.uid() IS NOT NULL))
        -- Search query
        AND (search_query = '' OR r.name ILIKE '%' || search_query || '%' OR r.description ILIKE '%' || search_query || '%')
        -- Filters
        AND (category_filter IS NULL OR r.category = category_filter)
        AND (cuisine_filter IS NULL OR r.cuisine = cuisine_filter)
        AND (difficulty_filter IS NULL OR r.difficulty = difficulty_filter)
        AND (max_time_minutes IS NULL OR r.total_time_minutes <= max_time_minutes)
        AND (min_rating IS NULL OR r.average_rating >= min_rating)
        AND (tags_filter IS NULL OR r.tags && tags_filter)
        AND (visibility_filter IS NULL OR r.visibility = visibility_filter)
        AND (user_id_filter IS NULL OR r.user_id = user_id_filter)
    ORDER BY 
        CASE WHEN search_query != '' THEN 
            ts_rank(to_tsvector('simple', r.name), plainto_tsquery('simple', search_query))
        ELSE 0 END DESC,
        r.average_rating DESC,
        r.created_at DESC
    LIMIT limit_param
    OFFSET offset_param;
END;
$$;

-- Function to get recipe with ingredients
CREATE OR REPLACE FUNCTION public.get_recipe_with_ingredients(recipe_id_param uuid)
RETURNS TABLE (
    -- Recipe fields
    id uuid,
    name text,
    description text,
    instructions text,
    user_id uuid,
    user_name text,
    prep_time_minutes integer,
    cook_time_minutes integer,
    total_time_minutes integer,
    servings integer,
    difficulty public.recipe_difficulty,
    visibility public.recipe_visibility,
    image_url text,
    tags text[],
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
    average_rating numeric,
    rating_count integer,
    times_made integer,
    times_favorited integer,
    source_url text,
    notes text,
    created_at timestamptz,
    updated_at timestamptz,
    is_favorited boolean,
    -- Ingredients as JSON
    ingredients jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.name,
        r.description,
        r.instructions,
        r.user_id,
        COALESCE(p.full_name, 'Anonymous') as user_name,
        r.prep_time_minutes,
        r.cook_time_minutes,
        r.total_time_minutes,
        r.servings,
        r.difficulty,
        r.visibility,
        r.image_url,
        r.tags,
        r.category,
        r.cuisine,
        r.calories_per_serving,
        r.protein_per_serving,
        r.carbs_per_serving,
        r.fat_per_serving,
        r.fiber_per_serving,
        r.calories_per_100g,
        r.protein_per_100g,
        r.carbs_per_100g,
        r.fat_per_100g,
        r.fiber_per_100g,
        r.total_weight_g,
        r.average_rating,
        r.rating_count,
        r.times_made,
        r.times_favorited,
        r.source_url,
        r.notes,
        r.created_at,
        r.updated_at,
        CASE WHEN rf.id IS NOT NULL THEN true ELSE false END as is_favorited,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', ri.id,
                    'food_id', ri.food_id,
                    'name', ri.name,
                    'amount', ri.amount,
                    'unit', ri.unit,
                    'grams', ri.grams,
                    'preparation', ri.preparation,
                    'notes', ri.notes,
                    'optional', ri.optional,
                    'sort_order', ri.sort_order,
                    'calories', ri.calories,
                    'protein', ri.protein,
                    'carbs', ri.carbs,
                    'fat', ri.fat,
                    'fiber', ri.fiber,
                    'foods', CASE WHEN f.id IS NOT NULL THEN
                        jsonb_build_object(
                            'id', f.id,
                            'name', f.name,
                            'brand', f.brand,
                            'category', f.category,
                            'nutrients_per_100g', f.nutrients_per_100g
                        )
                    ELSE NULL END
                ) ORDER BY ri.sort_order
            ) FILTER (WHERE ri.id IS NOT NULL),
            '[]'::jsonb
        ) as ingredients
    FROM public.recipes r
    LEFT JOIN public.profiles p ON r.user_id = p.id
    LEFT JOIN public.recipe_favorites rf ON r.id = rf.recipe_id AND rf.user_id = auth.uid()
    LEFT JOIN public.recipe_ingredients ri ON r.id = ri.recipe_id
    LEFT JOIN public.foods f ON ri.food_id = f.id
    WHERE r.id = recipe_id_param
        AND (r.user_id = auth.uid() OR r.visibility = 'public' OR (r.visibility = 'shared' AND auth.uid() IS NOT NULL))
    GROUP BY r.id, p.full_name, rf.id;
END;
$$;

-- Function to add ingredient to recipe with nutrition calculation
CREATE OR REPLACE FUNCTION public.add_recipe_ingredient(
    recipe_id_param uuid,
    food_id_param uuid,
    name_param text,
    amount_param numeric,
    unit_param text,
    grams_param numeric,
    preparation_param text DEFAULT NULL,
    notes_param text DEFAULT NULL,
    optional_param boolean DEFAULT false,
    sort_order_param integer DEFAULT 0
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    ingredient_id uuid;
    food_nutrition jsonb;
    calculated_calories numeric := 0;
    calculated_protein numeric := 0;
    calculated_carbs numeric := 0;
    calculated_fat numeric := 0;
    calculated_fiber numeric := 0;
BEGIN
    -- Get nutrition from food if food_id is provided
    IF food_id_param IS NOT NULL THEN
        SELECT nutrients_per_100g INTO food_nutrition
        FROM public.foods
        WHERE id = food_id_param;
        
        IF food_nutrition IS NOT NULL THEN
            calculated_calories := COALESCE((food_nutrition->>'calories')::numeric, 0) * grams_param / 100;
            calculated_protein := COALESCE((food_nutrition->>'protein')::numeric, 0) * grams_param / 100;
            calculated_carbs := COALESCE((food_nutrition->>'carbs')::numeric, 0) * grams_param / 100;
            calculated_fat := COALESCE((food_nutrition->>'fat')::numeric, 0) * grams_param / 100;
            calculated_fiber := COALESCE((food_nutrition->>'fiber')::numeric, 0) * grams_param / 100;
        END IF;
    END IF;
    
    -- Insert ingredient
    INSERT INTO public.recipe_ingredients (
        recipe_id,
        food_id,
        name,
        amount,
        unit,
        grams,
        preparation,
        notes,
        optional,
        sort_order,
        calories,
        protein,
        carbs,
        fat,
        fiber
    ) VALUES (
        recipe_id_param,
        food_id_param,
        name_param,
        amount_param,
        unit_param,
        grams_param,
        preparation_param,
        notes_param,
        optional_param,
        sort_order_param,
        calculated_calories,
        calculated_protein,
        calculated_carbs,
        calculated_fat,
        calculated_fiber
    ) RETURNING id INTO ingredient_id;
    
    RETURN ingredient_id;
END;
$$;