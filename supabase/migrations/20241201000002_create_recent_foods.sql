-- Create recent_foods table for tracking recently used foods
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_recent_foods_user_id ON public.recent_foods(user_id);
CREATE INDEX IF NOT EXISTS idx_recent_foods_last_used ON public.recent_foods(user_id, last_used_at DESC);
CREATE INDEX IF NOT EXISTS idx_recent_foods_usage_count ON public.recent_foods(user_id, usage_count DESC);

-- Enable RLS
ALTER TABLE public.recent_foods ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own recent foods" ON public.recent_foods
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recent foods" ON public.recent_foods
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recent foods" ON public.recent_foods
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recent foods" ON public.recent_foods
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update recent foods
CREATE OR REPLACE FUNCTION public.update_recent_food(
    p_food_id UUID
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert or update recent food entry
    INSERT INTO public.recent_foods (user_id, food_id, last_used_at, usage_count)
    VALUES (auth.uid(), p_food_id, NOW(), 1)
    ON CONFLICT (user_id, food_id)
    DO UPDATE SET
        last_used_at = NOW(),
        usage_count = recent_foods.usage_count + 1,
        updated_at = NOW();
END;
$$;

-- Create function to get recent foods with food details
CREATE OR REPLACE FUNCTION public.get_recent_foods(
    p_limit INTEGER DEFAULT 10
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
    fiber_per_100g DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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
        COALESCE((f.nutrients_per_100g->>'fiber_g')::DECIMAL, 0) as fiber_per_100g
    FROM public.recent_foods rf
    JOIN public.foods f ON rf.food_id = f.id
    WHERE rf.user_id = auth.uid()
    ORDER BY rf.last_used_at DESC
    LIMIT p_limit;
END;
$$;

-- Create function to get smart suggestions based on time and meal
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.update_recent_food(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_recent_foods(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_smart_food_suggestions(TEXT, INTEGER, INTEGER) TO authenticated;