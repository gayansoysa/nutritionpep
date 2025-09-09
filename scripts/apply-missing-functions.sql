-- Apply missing database functions to fix API errors
-- Run this in your Supabase SQL editor

-- 1. Create user favorites functions (fixes 404 error on get_user_favorites)
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

-- 2. Create recent foods functions (fixes 500 error on recent-foods API)
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
    100.0 as last_quantity,
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

-- 3. Create smart food suggestions function (already exists in migration but ensure it's applied)
CREATE OR REPLACE FUNCTION public.get_smart_food_suggestions(
    p_meal_type TEXT DEFAULT NULL,
    p_time_of_day INTEGER DEFAULT NULL,
    p_limit INTEGER DEFAULT 5
) RETURNS TABLE (
    id UUID,
    food_id UUID,
    name TEXT,
    brand TEXT,
    barcode TEXT,
    image_url TEXT,
    last_used_at TIMESTAMP WITH TIME ZONE,
    usage_count INTEGER,
    calories_per_100g DECIMAL,
    protein_per_100g DECIMAL,
    carbs_per_100g DECIMAL,
    fat_per_100g DECIMAL,
    fiber_per_100g DECIMAL,
    suggestion_score DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_hour INTEGER := EXTRACT(HOUR FROM NOW());
    time_weight DECIMAL := 1.0;
BEGIN
    -- Adjust time weight based on current time vs historical usage
    IF p_time_of_day IS NOT NULL THEN
        time_weight := CASE 
            WHEN ABS(current_hour - p_time_of_day) <= 2 THEN 2.0
            WHEN ABS(current_hour - p_time_of_day) <= 4 THEN 1.5
            ELSE 1.0
        END;
    END IF;

    RETURN QUERY
    SELECT 
        rf.id,
        rf.food_id,
        f.name,
        f.brand,
        f.barcode,
        f.image_path,
        rf.last_used_at,
        rf.usage_count,
        COALESCE((f.nutrients_per_100g->>'calories_kcal')::DECIMAL, 0) as calories_per_100g,
        COALESCE((f.nutrients_per_100g->>'protein_g')::DECIMAL, 0) as protein_per_100g,
        COALESCE((f.nutrients_per_100g->>'carbs_g')::DECIMAL, 0) as carbs_per_100g,
        COALESCE((f.nutrients_per_100g->>'fat_g')::DECIMAL, 0) as fat_per_100g,
        COALESCE((f.nutrients_per_100g->>'fiber_g')::DECIMAL, 0) as fiber_per_100g,
        -- Calculate suggestion score based on usage frequency, recency, and time matching
        (
            (rf.usage_count::DECIMAL * 0.4) + 
            (EXTRACT(EPOCH FROM (NOW() - rf.last_used_at)) / -86400.0 * 0.3) + -- More recent = higher score
            (time_weight * 0.3)
        ) as suggestion_score
    FROM public.recent_foods rf
    JOIN public.foods f ON rf.food_id = f.id
    WHERE rf.user_id = auth.uid()
    ORDER BY suggestion_score DESC, rf.last_used_at DESC
    LIMIT p_limit;
END;
$$;

-- 4. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_favorites(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_recent_foods(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_smart_food_suggestions(TEXT, INTEGER, INTEGER) TO authenticated;

-- 5. Ensure recent_foods table exists (if not already created)
CREATE TABLE IF NOT EXISTS public.recent_foods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    food_id UUID NOT NULL REFERENCES public.foods(id) ON DELETE CASCADE,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    usage_count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, food_id)
);

-- 6. Create indexes for performance (if not already created)
CREATE INDEX IF NOT EXISTS idx_recent_foods_user_id ON public.recent_foods(user_id);
CREATE INDEX IF NOT EXISTS idx_recent_foods_last_used ON public.recent_foods(user_id, last_used_at DESC);
CREATE INDEX IF NOT EXISTS idx_recent_foods_usage_count ON public.recent_foods(user_id, usage_count DESC);

-- 7. Enable RLS on recent_foods (if not already enabled)
ALTER TABLE public.recent_foods ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for recent_foods (if not already created)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'recent_foods' AND policyname = 'Users can view their own recent foods') THEN
        CREATE POLICY "Users can view their own recent foods" ON public.recent_foods
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'recent_foods' AND policyname = 'Users can insert their own recent foods') THEN
        CREATE POLICY "Users can insert their own recent foods" ON public.recent_foods
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'recent_foods' AND policyname = 'Users can update their own recent foods') THEN
        CREATE POLICY "Users can update their own recent foods" ON public.recent_foods
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'recent_foods' AND policyname = 'Users can delete their own recent foods') THEN
        CREATE POLICY "Users can delete their own recent foods" ON public.recent_foods
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END
$$;