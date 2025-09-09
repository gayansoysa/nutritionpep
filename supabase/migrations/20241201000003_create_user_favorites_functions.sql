-- Create user favorites functions that are missing from the database

-- Function to get user's favorite foods with food details
CREATE OR REPLACE FUNCTION public.get_user_favorites(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  food_id UUID,
  name TEXT,
  brand TEXT,
  image_url TEXT,
  calories_per_100g DECIMAL,
  protein_per_100g DECIMAL,
  carbs_per_100g DECIMAL,
  fat_per_100g DECIMAL,
  preferred_quantity DECIMAL,
  preferred_unit TEXT,
  use_count INTEGER,
  last_used_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    uf.id,
    uf.food_id,
    f.name,
    f.brand,
    f.image_path as image_url,
    COALESCE((f.nutrients_per_100g->>'calories_kcal')::DECIMAL, 0) as calories_per_100g,
    COALESCE((f.nutrients_per_100g->>'protein_g')::DECIMAL, 0) as protein_per_100g,
    COALESCE((f.nutrients_per_100g->>'carbs_g')::DECIMAL, 0) as carbs_per_100g,
    COALESCE((f.nutrients_per_100g->>'fat_g')::DECIMAL, 0) as fat_per_100g,
    uf.preferred_quantity,
    uf.preferred_unit,
    uf.use_count,
    uf.last_used_at
  FROM public.user_favorites uf
  JOIN public.foods f ON f.id = uf.food_id
  WHERE uf.user_id = user_uuid
  ORDER BY uf.last_used_at DESC;
$$;

-- Function to get user's recent foods (from diary entries)
CREATE OR REPLACE FUNCTION public.get_user_recent_foods(user_uuid UUID, limit_count INTEGER DEFAULT 20)
RETURNS TABLE (
  food_id UUID,
  name TEXT,
  brand TEXT,
  image_url TEXT,
  calories_per_100g DECIMAL,
  protein_per_100g DECIMAL,
  carbs_per_100g DECIMAL,
  fat_per_100g DECIMAL,
  last_quantity DECIMAL,
  last_unit TEXT,
  use_count BIGINT,
  last_used_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (f.id)
    f.id as food_id,
    f.name,
    f.brand,
    f.image_path as image_url,
    COALESCE((f.nutrients_per_100g->>'calories_kcal')::DECIMAL, 0) as calories_per_100g,
    COALESCE((f.nutrients_per_100g->>'protein_g')::DECIMAL, 0) as protein_per_100g,
    COALESCE((f.nutrients_per_100g->>'carbs_g')::DECIMAL, 0) as carbs_per_100g,
    COALESCE((f.nutrients_per_100g->>'fat_g')::DECIMAL, 0) as fat_per_100g,
    100.0 as last_quantity, -- Default quantity since we don't have individual item quantities in current schema
    'g' as last_unit,
    COUNT(*) OVER (PARTITION BY f.id) as use_count,
    MAX(de.created_at) OVER (PARTITION BY f.id) as last_used_at
  FROM public.diary_entries de,
       jsonb_array_elements(de.items) as item,
       public.foods f
  WHERE de.user_id = user_uuid
    AND (item->>'food_id')::UUID = f.id
    AND de.created_at >= NOW() - INTERVAL '30 days'
    AND f.id NOT IN (
      SELECT food_id FROM public.user_favorites WHERE user_id = user_uuid
    )
  ORDER BY f.id, last_used_at DESC
  LIMIT limit_count;
END;
$$;

-- Function to toggle favorite status
CREATE OR REPLACE FUNCTION public.toggle_favorite(user_uuid UUID, food_uuid UUID, quantity DECIMAL DEFAULT 100, unit_name TEXT DEFAULT 'g')
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_favorite BOOLEAN;
BEGIN
  -- Check if already favorite
  SELECT EXISTS(
    SELECT 1 FROM public.user_favorites 
    WHERE user_id = user_uuid AND food_id = food_uuid
  ) INTO is_favorite;
  
  IF is_favorite THEN
    -- Remove from favorites
    DELETE FROM public.user_favorites 
    WHERE user_id = user_uuid AND food_id = food_uuid;
    RETURN FALSE;
  ELSE
    -- Add to favorites
    INSERT INTO public.user_favorites (user_id, food_id, preferred_quantity, preferred_unit)
    VALUES (user_uuid, food_uuid, quantity, unit_name)
    ON CONFLICT (user_id, food_id) DO UPDATE SET
      last_used_at = NOW(),
      use_count = user_favorites.use_count + 1;
    RETURN TRUE;
  END IF;
END;
$$;

-- Function to update favorite usage
CREATE OR REPLACE FUNCTION public.update_favorite_usage(user_uuid UUID, food_uuid UUID)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.user_favorites 
  SET 
    last_used_at = NOW(),
    use_count = use_count + 1
  WHERE user_id = user_uuid AND food_id = food_uuid;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_favorites(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_recent_foods(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_favorite(UUID, UUID, DECIMAL, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_favorite_usage(UUID, UUID) TO authenticated;