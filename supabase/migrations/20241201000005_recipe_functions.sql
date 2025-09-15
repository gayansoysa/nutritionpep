-- Recipe Management System Functions
-- Migration: 20241201000005_recipe_functions.sql

-- Function to calculate recipe nutrition from ingredients
create or replace function public.calculate_recipe_nutrition(recipe_id_param uuid)
returns void
language plpgsql
security definer
as $$
declare
    total_calories numeric := 0;
    total_protein numeric := 0;
    total_carbs numeric := 0;
    total_fat numeric := 0;
    total_fiber numeric := 0;
    total_weight numeric := 0;
    recipe_servings integer;
begin
    -- Get recipe servings
    select servings into recipe_servings
    from public.recipes
    where id = recipe_id_param;
    
    if recipe_servings is null then
        raise exception 'Recipe not found';
    end if;
    
    -- Sum up nutrition from all ingredients
    select 
        coalesce(sum(ri.calories), 0),
        coalesce(sum(ri.protein), 0),
        coalesce(sum(ri.carbs), 0),
        coalesce(sum(ri.fat), 0),
        coalesce(sum(ri.fiber), 0),
        coalesce(sum(ri.grams), 0)
    into 
        total_calories,
        total_protein,
        total_carbs,
        total_fat,
        total_fiber,
        total_weight
    from public.recipe_ingredients ri
    where ri.recipe_id = recipe_id_param;
    
    -- Update recipe with calculated nutrition
    update public.recipes
    set 
        calories_per_serving = case when recipe_servings > 0 then total_calories / recipe_servings else 0 end,
        protein_per_serving = case when recipe_servings > 0 then total_protein / recipe_servings else 0 end,
        carbs_per_serving = case when recipe_servings > 0 then total_carbs / recipe_servings else 0 end,
        fat_per_serving = case when recipe_servings > 0 then total_fat / recipe_servings else 0 end,
        fiber_per_serving = case when recipe_servings > 0 then total_fiber / recipe_servings else 0 end,
        calories_per_100g = case when total_weight > 0 then (total_calories * 100) / total_weight else 0 end,
        protein_per_100g = case when total_weight > 0 then (total_protein * 100) / total_weight else 0 end,
        carbs_per_100g = case when total_weight > 0 then (total_carbs * 100) / total_weight else 0 end,
        fat_per_100g = case when total_weight > 0 then (total_fat * 100) / total_weight else 0 end,
        fiber_per_100g = case when total_weight > 0 then (total_fiber * 100) / total_weight else 0 end,
        total_weight_g = total_weight,
        updated_at = now()
    where id = recipe_id_param;
end;
$$;

-- Function to add ingredient to recipe with nutrition calculation
create or replace function public.add_recipe_ingredient(
    recipe_id_param uuid,
    food_id_param uuid,
    name_param text,
    amount_param numeric,
    unit_param text,
    grams_param numeric,
    preparation_param text default null,
    notes_param text default null,
    optional_param boolean default false,
    sort_order_param integer default 0
)
returns uuid
language plpgsql
security definer
as $$
declare
    ingredient_id uuid;
    food_nutrition jsonb;
    calculated_calories numeric := 0;
    calculated_protein numeric := 0;
    calculated_carbs numeric := 0;
    calculated_fat numeric := 0;
    calculated_fiber numeric := 0;
begin
    -- Get nutrition from food if food_id is provided
    if food_id_param is not null then
        select nutrients_per_100g into food_nutrition
        from public.foods
        where id = food_id_param;
        
        if food_nutrition is not null then
            calculated_calories := coalesce((food_nutrition->>'calories')::numeric, 0) * grams_param / 100;
            calculated_protein := coalesce((food_nutrition->>'protein')::numeric, 0) * grams_param / 100;
            calculated_carbs := coalesce((food_nutrition->>'carbs')::numeric, 0) * grams_param / 100;
            calculated_fat := coalesce((food_nutrition->>'fat')::numeric, 0) * grams_param / 100;
            calculated_fiber := coalesce((food_nutrition->>'fiber')::numeric, 0) * grams_param / 100;
        end if;
    end if;
    
    -- Insert ingredient
    insert into public.recipe_ingredients (
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
    ) values (
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
    ) returning id into ingredient_id;
    
    -- Recalculate recipe nutrition
    perform public.calculate_recipe_nutrition(recipe_id_param);
    
    return ingredient_id;
end;
$$;

-- Function to update recipe ingredient
create or replace function public.update_recipe_ingredient(
    ingredient_id_param uuid,
    amount_param numeric default null,
    unit_param text default null,
    grams_param numeric default null,
    preparation_param text default null,
    notes_param text default null,
    optional_param boolean default null,
    sort_order_param integer default null
)
returns void
language plpgsql
security definer
as $$
declare
    recipe_id_var uuid;
    food_id_var uuid;
    food_nutrition jsonb;
    new_grams numeric;
    calculated_calories numeric := 0;
    calculated_protein numeric := 0;
    calculated_carbs numeric := 0;
    calculated_fat numeric := 0;
    calculated_fiber numeric := 0;
begin
    -- Get current ingredient info
    select recipe_id, food_id, 
           case when grams_param is not null then grams_param else grams end
    into recipe_id_var, food_id_var, new_grams
    from public.recipe_ingredients
    where id = ingredient_id_param;
    
    if recipe_id_var is null then
        raise exception 'Ingredient not found';
    end if;
    
    -- Recalculate nutrition if grams changed and food_id exists
    if food_id_var is not null and grams_param is not null then
        select nutrients_per_100g into food_nutrition
        from public.foods
        where id = food_id_var;
        
        if food_nutrition is not null then
            calculated_calories := coalesce((food_nutrition->>'calories')::numeric, 0) * new_grams / 100;
            calculated_protein := coalesce((food_nutrition->>'protein')::numeric, 0) * new_grams / 100;
            calculated_carbs := coalesce((food_nutrition->>'carbs')::numeric, 0) * new_grams / 100;
            calculated_fat := coalesce((food_nutrition->>'fat')::numeric, 0) * new_grams / 100;
            calculated_fiber := coalesce((food_nutrition->>'fiber')::numeric, 0) * new_grams / 100;
        end if;
    end if;
    
    -- Update ingredient
    update public.recipe_ingredients
    set 
        amount = coalesce(amount_param, amount),
        unit = coalesce(unit_param, unit),
        grams = coalesce(grams_param, grams),
        preparation = coalesce(preparation_param, preparation),
        notes = coalesce(notes_param, notes),
        optional = coalesce(optional_param, optional),
        sort_order = coalesce(sort_order_param, sort_order),
        calories = case when grams_param is not null and food_id_var is not null then calculated_calories else calories end,
        protein = case when grams_param is not null and food_id_var is not null then calculated_protein else protein end,
        carbs = case when grams_param is not null and food_id_var is not null then calculated_carbs else carbs end,
        fat = case when grams_param is not null and food_id_var is not null then calculated_fat else fat end,
        fiber = case when grams_param is not null and food_id_var is not null then calculated_fiber else fiber end,
        updated_at = now()
    where id = ingredient_id_param;
    
    -- Recalculate recipe nutrition
    perform public.calculate_recipe_nutrition(recipe_id_var);
end;
$$;

-- Function to remove recipe ingredient
create or replace function public.remove_recipe_ingredient(ingredient_id_param uuid)
returns void
language plpgsql
security definer
as $$
declare
    recipe_id_var uuid;
begin
    -- Get recipe_id before deleting
    select recipe_id into recipe_id_var
    from public.recipe_ingredients
    where id = ingredient_id_param;
    
    if recipe_id_var is null then
        raise exception 'Ingredient not found';
    end if;
    
    -- Delete ingredient
    delete from public.recipe_ingredients
    where id = ingredient_id_param;
    
    -- Recalculate recipe nutrition
    perform public.calculate_recipe_nutrition(recipe_id_var);
end;
$$;

-- Function to update recipe rating statistics
create or replace function public.update_recipe_rating_stats(recipe_id_param uuid)
returns void
language plpgsql
security definer
as $$
declare
    avg_rating numeric;
    rating_count_var integer;
begin
    -- Calculate average rating and count
    select 
        coalesce(avg(rating), 0),
        count(*)
    into avg_rating, rating_count_var
    from public.recipe_ratings
    where recipe_id = recipe_id_param;
    
    -- Update recipe stats
    update public.recipes
    set 
        average_rating = avg_rating,
        rating_count = rating_count_var,
        updated_at = now()
    where id = recipe_id_param;
end;
$$;

-- Function to search recipes
create or replace function public.search_recipes(
    search_query text default '',
    category_filter text default null,
    cuisine_filter text default null,
    difficulty_filter public.recipe_difficulty default null,
    max_time_minutes integer default null,
    min_rating numeric default null,
    tags_filter text[] default null,
    visibility_filter public.recipe_visibility default null,
    user_id_filter uuid default null,
    limit_param integer default 20,
    offset_param integer default 0
)
returns table (
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
language plpgsql
security definer
as $$
begin
    return query
    select 
        r.id,
        r.name,
        r.description,
        r.user_id,
        p.full_name as user_name,
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
        case when rf.id is not null then true else false end as is_favorited
    from public.recipes r
    left join public.profiles p on r.user_id = p.id
    left join public.recipe_favorites rf on r.id = rf.recipe_id and rf.user_id = auth.uid()
    where 
        -- Visibility check
        (r.user_id = auth.uid() or r.visibility = 'public' or (r.visibility = 'shared' and auth.uid() is not null))
        -- Search query
        and (search_query = '' or r.name ilike '%' || search_query || '%' or r.description ilike '%' || search_query || '%')
        -- Filters
        and (category_filter is null or r.category = category_filter)
        and (cuisine_filter is null or r.cuisine = cuisine_filter)
        and (difficulty_filter is null or r.difficulty = difficulty_filter)
        and (max_time_minutes is null or r.total_time_minutes <= max_time_minutes)
        and (min_rating is null or r.average_rating >= min_rating)
        and (tags_filter is null or r.tags && tags_filter)
        and (visibility_filter is null or r.visibility = visibility_filter)
        and (user_id_filter is null or r.user_id = user_id_filter)
    order by 
        case when search_query != '' then 
            ts_rank(to_tsvector('simple', r.name), plainto_tsquery('simple', search_query))
        else 0 end desc,
        r.average_rating desc,
        r.created_at desc
    limit limit_param
    offset offset_param;
end;
$$;

-- Function to get recipe with ingredients
create or replace function public.get_recipe_with_ingredients(recipe_id_param uuid)
returns table (
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
language plpgsql
security definer
as $$
begin
    return query
    select 
        r.id,
        r.name,
        r.description,
        r.instructions,
        r.user_id,
        p.full_name as user_name,
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
        r.total_weight_g,
        r.average_rating,
        r.rating_count,
        r.times_made,
        r.times_favorited,
        r.source_url,
        r.notes,
        r.created_at,
        r.updated_at,
        case when rf.id is not null then true else false end as is_favorited,
        coalesce(
            (
                select jsonb_agg(
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
                        'fiber', ri.fiber
                    ) order by ri.sort_order, ri.created_at
                )
                from public.recipe_ingredients ri
                where ri.recipe_id = r.id
            ),
            '[]'::jsonb
        ) as ingredients
    from public.recipes r
    left join public.profiles p on r.user_id = p.id
    left join public.recipe_favorites rf on r.id = rf.recipe_id and rf.user_id = auth.uid()
    where r.id = recipe_id_param
    and (r.user_id = auth.uid() or r.visibility = 'public' or (r.visibility = 'shared' and auth.uid() is not null));
end;
$$;

-- Function to toggle recipe favorite
create or replace function public.toggle_recipe_favorite(recipe_id_param uuid)
returns boolean
language plpgsql
security definer
as $$
declare
    is_favorited boolean := false;
    favorite_count integer;
begin
    -- Check if already favorited
    select count(*) into favorite_count
    from public.recipe_favorites
    where user_id = auth.uid() and recipe_id = recipe_id_param;
    
    if favorite_count > 0 then
        -- Remove favorite
        delete from public.recipe_favorites
        where user_id = auth.uid() and recipe_id = recipe_id_param;
        is_favorited := false;
    else
        -- Add favorite
        insert into public.recipe_favorites (user_id, recipe_id)
        values (auth.uid(), recipe_id_param);
        is_favorited := true;
    end if;
    
    -- Update recipe favorite count
    select count(*) into favorite_count
    from public.recipe_favorites
    where recipe_id = recipe_id_param;
    
    update public.recipes
    set 
        times_favorited = favorite_count,
        updated_at = now()
    where id = recipe_id_param;
    
    return is_favorited;
end;
$$;

-- Trigger to update recipe nutrition when ingredients change
create or replace function public.trigger_update_recipe_nutrition()
returns trigger
language plpgsql
as $$
begin
    if TG_OP = 'DELETE' then
        perform public.calculate_recipe_nutrition(OLD.recipe_id);
        return OLD;
    else
        perform public.calculate_recipe_nutrition(NEW.recipe_id);
        return NEW;
    end if;
end;
$$;

-- Create triggers
drop trigger if exists recipe_ingredients_nutrition_trigger on public.recipe_ingredients;
create trigger recipe_ingredients_nutrition_trigger
    after insert or update or delete on public.recipe_ingredients
    for each row execute function public.trigger_update_recipe_nutrition();

-- Trigger to update recipe rating stats when ratings change
create or replace function public.trigger_update_recipe_rating_stats()
returns trigger
language plpgsql
as $$
begin
    if TG_OP = 'DELETE' then
        perform public.update_recipe_rating_stats(OLD.recipe_id);
        return OLD;
    else
        perform public.update_recipe_rating_stats(NEW.recipe_id);
        return NEW;
    end if;
end;
$$;

-- Create rating trigger
drop trigger if exists recipe_ratings_stats_trigger on public.recipe_ratings;
create trigger recipe_ratings_stats_trigger
    after insert or update or delete on public.recipe_ratings
    for each row execute function public.trigger_update_recipe_rating_stats();