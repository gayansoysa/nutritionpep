-- Database Optimization Scripts for NutritionPep
-- These scripts improve query performance and add useful indexes

-- 1. PERFORMANCE INDEXES
-- =====================

-- Foods table indexes for search performance
CREATE INDEX IF NOT EXISTS idx_foods_name_gin ON public.foods USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_foods_brand_gin ON public.foods USING gin(to_tsvector('english', brand));
CREATE INDEX IF NOT EXISTS idx_foods_category ON public.foods(category);
CREATE INDEX IF NOT EXISTS idx_foods_barcode ON public.foods(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_foods_verified ON public.foods(verified);
CREATE INDEX IF NOT EXISTS idx_foods_created_at ON public.foods(created_at DESC);

-- Composite index for common food searches
CREATE INDEX IF NOT EXISTS idx_foods_search_composite ON public.foods(verified, category, created_at DESC);

-- Diary entries indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_diary_entries_user_date ON public.diary_entries(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_diary_entries_user_created ON public.diary_entries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_diary_entries_date_range ON public.diary_entries(user_id, date) WHERE date >= CURRENT_DATE - INTERVAL '30 days';

-- User favorites indexes
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_food_id ON public.user_favorites(food_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_last_used ON public.user_favorites(user_id, last_used_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_favorites_use_count ON public.user_favorites(user_id, use_count DESC);

-- Profiles indexes for admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- 2. OPTIMIZED SEARCH FUNCTIONS
-- =============================

-- Enhanced food search with ranking
CREATE OR REPLACE FUNCTION public.search_foods_optimized(
    search_query TEXT,
    category_filter TEXT DEFAULT NULL,
    verified_only BOOLEAN DEFAULT FALSE,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    brand TEXT,
    category TEXT,
    barcode TEXT,
    image_url TEXT,
    calories_per_100g DECIMAL,
    protein_per_100g DECIMAL,
    carbs_per_100g DECIMAL,
    fat_per_100g DECIMAL,
    fiber_per_100g DECIMAL,
    sugar_per_100g DECIMAL,
    sodium_per_100g DECIMAL,
    verified BOOLEAN,
    source TEXT,
    search_rank REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.name,
        f.brand,
        f.category,
        f.barcode,
        f.image_path as image_url,
        COALESCE((f.nutrients_per_100g->>'calories_kcal')::DECIMAL, 0) as calories_per_100g,
        COALESCE((f.nutrients_per_100g->>'protein_g')::DECIMAL, 0) as protein_per_100g,
        COALESCE((f.nutrients_per_100g->>'carbs_g')::DECIMAL, 0) as carbs_per_100g,
        COALESCE((f.nutrients_per_100g->>'fat_g')::DECIMAL, 0) as fat_per_100g,
        COALESCE((f.nutrients_per_100g->>'fiber_g')::DECIMAL, 0) as fiber_per_100g,
        COALESCE((f.nutrients_per_100g->>'sugar_g')::DECIMAL, 0) as sugar_per_100g,
        COALESCE((f.nutrients_per_100g->>'sodium_mg')::DECIMAL, 0) as sodium_per_100g,
        f.verified,
        f.source,
        -- Ranking based on text similarity and verification status
        (
            ts_rank(to_tsvector('english', f.name || ' ' || COALESCE(f.brand, '')), plainto_tsquery('english', search_query)) * 
            CASE WHEN f.verified THEN 1.5 ELSE 1.0 END *
            CASE WHEN f.name ILIKE '%' || search_query || '%' THEN 2.0 ELSE 1.0 END
        ) as search_rank
    FROM public.foods f
    WHERE 
        (
            to_tsvector('english', f.name || ' ' || COALESCE(f.brand, '')) @@ plainto_tsquery('english', search_query)
            OR f.name ILIKE '%' || search_query || '%'
            OR f.brand ILIKE '%' || search_query || '%'
        )
        AND (category_filter IS NULL OR f.category = category_filter)
        AND (NOT verified_only OR f.verified = TRUE)
    ORDER BY search_rank DESC, f.verified DESC, f.name ASC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$;

-- Optimized diary analytics function
CREATE OR REPLACE FUNCTION public.get_user_nutrition_analytics(
    user_uuid UUID,
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '7 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    date DATE,
    total_calories DECIMAL,
    total_protein DECIMAL,
    total_carbs DECIMAL,
    total_fat DECIMAL,
    total_fiber DECIMAL,
    meal_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH daily_nutrition AS (
        SELECT 
            de.date,
            SUM(
                CASE 
                    WHEN (item->>'unit') = 'g' THEN
                        (item->>'quantity')::DECIMAL * COALESCE((f.nutrients_per_100g->>'calories_kcal')::DECIMAL, 0) / 100.0
                    ELSE
                        (item->>'quantity')::DECIMAL * COALESCE((f.nutrients_per_100g->>'calories_kcal')::DECIMAL, 0) / 100.0
                END
            ) as calories,
            SUM(
                CASE 
                    WHEN (item->>'unit') = 'g' THEN
                        (item->>'quantity')::DECIMAL * COALESCE((f.nutrients_per_100g->>'protein_g')::DECIMAL, 0) / 100.0
                    ELSE
                        (item->>'quantity')::DECIMAL * COALESCE((f.nutrients_per_100g->>'protein_g')::DECIMAL, 0) / 100.0
                END
            ) as protein,
            SUM(
                CASE 
                    WHEN (item->>'unit') = 'g' THEN
                        (item->>'quantity')::DECIMAL * COALESCE((f.nutrients_per_100g->>'carbs_g')::DECIMAL, 0) / 100.0
                    ELSE
                        (item->>'quantity')::DECIMAL * COALESCE((f.nutrients_per_100g->>'carbs_g')::DECIMAL, 0) / 100.0
                END
            ) as carbs,
            SUM(
                CASE 
                    WHEN (item->>'unit') = 'g' THEN
                        (item->>'quantity')::DECIMAL * COALESCE((f.nutrients_per_100g->>'fat_g')::DECIMAL, 0) / 100.0
                    ELSE
                        (item->>'quantity')::DECIMAL * COALESCE((f.nutrients_per_100g->>'fat_g')::DECIMAL, 0) / 100.0
                END
            ) as fat,
            SUM(
                CASE 
                    WHEN (item->>'unit') = 'g' THEN
                        (item->>'quantity')::DECIMAL * COALESCE((f.nutrients_per_100g->>'fiber_g')::DECIMAL, 0) / 100.0
                    ELSE
                        (item->>'quantity')::DECIMAL * COALESCE((f.nutrients_per_100g->>'fiber_g')::DECIMAL, 0) / 100.0
                END
            ) as fiber,
            COUNT(DISTINCT de.meal_type) as meal_count
        FROM public.diary_entries de,
             jsonb_array_elements(de.items) as item,
             public.foods f
        WHERE de.user_id = user_uuid
          AND de.date BETWEEN start_date AND end_date
          AND (item->>'food_id')::UUID = f.id
        GROUP BY de.date
    )
    SELECT 
        dn.date,
        COALESCE(dn.calories, 0) as total_calories,
        COALESCE(dn.protein, 0) as total_protein,
        COALESCE(dn.carbs, 0) as total_carbs,
        COALESCE(dn.fat, 0) as total_fat,
        COALESCE(dn.fiber, 0) as total_fiber,
        COALESCE(dn.meal_count, 0) as meal_count
    FROM daily_nutrition dn
    ORDER BY dn.date DESC;
END;
$$;

-- 3. MATERIALIZED VIEWS FOR ANALYTICS
-- ===================================

-- Popular foods view (refreshed daily)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.popular_foods_mv AS
SELECT 
    f.id,
    f.name,
    f.brand,
    f.category,
    f.image_path,
    COUNT(DISTINCT de.user_id) as unique_users,
    COUNT(*) as total_uses,
    AVG(COALESCE((f.nutrients_per_100g->>'calories_kcal')::DECIMAL, 0)) as avg_calories,
    MAX(de.created_at) as last_used_at
FROM public.foods f
JOIN (
    SELECT 
        de.user_id,
        de.created_at,
        (item->>'food_id')::UUID as food_id
    FROM public.diary_entries de,
         jsonb_array_elements(de.items) as item
    WHERE de.created_at >= CURRENT_DATE - INTERVAL '30 days'
) de ON f.id = de.food_id
GROUP BY f.id, f.name, f.brand, f.category, f.image_path
HAVING COUNT(*) >= 5
ORDER BY total_uses DESC, unique_users DESC;

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_popular_foods_mv_id ON public.popular_foods_mv(id);

-- User activity summary view
CREATE MATERIALIZED VIEW IF NOT EXISTS public.user_activity_summary_mv AS
SELECT 
    p.id as user_id,
    p.full_name,
    p.created_at as joined_at,
    COUNT(DISTINCT de.date) as active_days,
    COUNT(de.id) as total_entries,
    MAX(de.created_at) as last_activity,
    AVG(
        CASE 
            WHEN de.items IS NOT NULL THEN jsonb_array_length(de.items)
            ELSE 0
        END
    ) as avg_items_per_entry
FROM public.profiles p
LEFT JOIN public.diary_entries de ON p.id = de.user_id 
    AND de.created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY p.id, p.full_name, p.created_at
ORDER BY last_activity DESC NULLS LAST;

-- Create unique index on user activity view
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_activity_summary_mv_user_id ON public.user_activity_summary_mv(user_id);

-- 4. REFRESH FUNCTIONS FOR MATERIALIZED VIEWS
-- ===========================================

-- Function to refresh popular foods view
CREATE OR REPLACE FUNCTION public.refresh_popular_foods()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.popular_foods_mv;
    
    -- Log the refresh
    INSERT INTO public.system_logs (event_type, message, created_at)
    VALUES ('materialized_view_refresh', 'popular_foods_mv refreshed', NOW())
    ON CONFLICT DO NOTHING;
END;
$$;

-- Function to refresh user activity summary
CREATE OR REPLACE FUNCTION public.refresh_user_activity_summary()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_activity_summary_mv;
    
    -- Log the refresh
    INSERT INTO public.system_logs (event_type, message, created_at)
    VALUES ('materialized_view_refresh', 'user_activity_summary_mv refreshed', NOW())
    ON CONFLICT DO NOTHING;
END;
$$;

-- 5. CLEANUP AND MAINTENANCE FUNCTIONS
-- ====================================

-- Function to clean up old diary entries (optional, for data retention)
CREATE OR REPLACE FUNCTION public.cleanup_old_diary_entries(
    retention_days INTEGER DEFAULT 365
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.diary_entries 
    WHERE created_at < CURRENT_DATE - INTERVAL '1 day' * retention_days;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log the cleanup
    INSERT INTO public.system_logs (event_type, message, created_at)
    VALUES ('data_cleanup', format('Deleted %s old diary entries', deleted_count), NOW());
    
    RETURN deleted_count;
END;
$$;

-- Function to update food popularity scores
CREATE OR REPLACE FUNCTION public.update_food_popularity_scores()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update popularity scores based on recent usage
    UPDATE public.foods 
    SET popularity_score = subquery.score
    FROM (
        SELECT 
            f.id,
            COALESCE(
                LOG(1 + COUNT(DISTINCT de.user_id)) * 0.4 +
                LOG(1 + COUNT(*)) * 0.3 +
                CASE 
                    WHEN MAX(de.created_at) > CURRENT_DATE - INTERVAL '7 days' THEN 0.3
                    WHEN MAX(de.created_at) > CURRENT_DATE - INTERVAL '30 days' THEN 0.2
                    ELSE 0.1
                END,
                0
            ) as score
        FROM public.foods f
        LEFT JOIN (
            SELECT 
                de.user_id,
                de.created_at,
                (item->>'food_id')::UUID as food_id
            FROM public.diary_entries de,
                 jsonb_array_elements(de.items) as item
            WHERE de.created_at >= CURRENT_DATE - INTERVAL '90 days'
        ) de ON f.id = de.food_id
        GROUP BY f.id
    ) subquery
    WHERE foods.id = subquery.id;
    
    -- Log the update
    INSERT INTO public.system_logs (event_type, message, created_at)
    VALUES ('popularity_update', 'Food popularity scores updated', NOW());
END;
$$;

-- 6. GRANT PERMISSIONS
-- ===================

GRANT EXECUTE ON FUNCTION public.search_foods_optimized(TEXT, TEXT, BOOLEAN, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_nutrition_analytics(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_popular_foods() TO service_role;
GRANT EXECUTE ON FUNCTION public.refresh_user_activity_summary() TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_diary_entries(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_food_popularity_scores() TO service_role;

GRANT SELECT ON public.popular_foods_mv TO authenticated;
GRANT SELECT ON public.user_activity_summary_mv TO authenticated;

-- 7. CREATE SYSTEM LOGS TABLE (if not exists)
-- ===========================================

CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_logs_event_type ON public.system_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON public.system_logs(created_at DESC);

-- Enable RLS on system logs
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Only service role can access system logs
CREATE POLICY "Service role can manage system logs" ON public.system_logs
    FOR ALL USING (auth.role() = 'service_role');