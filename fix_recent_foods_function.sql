-- Manual fix for get_user_recent_foods function
-- Run this in your Supabase SQL editor

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
  -- Check if user_uuid is valid
  IF user_uuid IS NULL THEN
    RAISE EXCEPTION 'user_uuid cannot be null';
  END IF;

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
    COALESCE((item->>'quantity')::DECIMAL, 100.0) as last_quantity,
    COALESCE(item->>'serving', 'g') as last_unit,
    COUNT(*) OVER (PARTITION BY f.id) as use_count,
    MAX(de.created_at) OVER (PARTITION BY f.id) as last_used_at
  FROM public.diary_entries de
  CROSS JOIN LATERAL jsonb_array_elements(de.items) as item
  JOIN public.foods f ON (item->>'food_id')::UUID = f.id
  WHERE de.user_id = user_uuid
    AND de.created_at >= NOW() - INTERVAL '30 days'
    AND item->>'food_id' IS NOT NULL
    AND f.id NOT IN (
      SELECT food_id FROM public.user_favorites WHERE user_id = user_uuid
    )
  ORDER BY f.id, last_used_at DESC
  LIMIT limit_count;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error and return empty result
    RAISE WARNING 'Error in get_user_recent_foods for user %: %', user_uuid, SQLERRM;
    RETURN;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_recent_foods(UUID, INTEGER) TO authenticated;