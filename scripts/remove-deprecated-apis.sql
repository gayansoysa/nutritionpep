-- Remove deprecated API configurations (CalorieNinjas and Edamam)
-- This script cleans up existing data after removing these APIs from the codebase

-- Remove API configurations for deprecated APIs (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'api_configurations') THEN
        DELETE FROM api_configurations 
        WHERE api_name IN ('CalorieNinjas', 'Edamam');
        RAISE NOTICE 'Removed deprecated API configurations';
    ELSE
        RAISE NOTICE 'Table api_configurations does not exist, skipping';
    END IF;
END $$;

-- Remove any cached data from deprecated APIs (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'api_food_cache') THEN
        DELETE FROM api_food_cache 
        WHERE api_source IN ('CalorieNinjas', 'Edamam');
        RAISE NOTICE 'Removed deprecated API cache data';
    ELSE
        RAISE NOTICE 'Table api_food_cache does not exist, skipping';
    END IF;
END $$;

-- Remove usage statistics for deprecated APIs (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'api_usage_stats') THEN
        DELETE FROM api_usage_stats 
        WHERE api_name IN ('CalorieNinjas', 'Edamam');
        RAISE NOTICE 'Removed deprecated API usage statistics';
    ELSE
        RAISE NOTICE 'Table api_usage_stats does not exist, skipping';
    END IF;
END $$;

-- Remove search analytics for deprecated APIs (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'search_analytics') THEN
        DELETE FROM search_analytics 
        WHERE api_used IN ('CalorieNinjas', 'Edamam');
        RAISE NOTICE 'Removed deprecated API search analytics';
    ELSE
        RAISE NOTICE 'Table search_analytics does not exist, skipping';
    END IF;
END $$;

-- Update the api_source constraint to only include active APIs (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'api_food_cache') THEN
        ALTER TABLE api_food_cache 
        DROP CONSTRAINT IF EXISTS api_food_cache_api_source_check;
        
        ALTER TABLE api_food_cache 
        ADD CONSTRAINT api_food_cache_api_source_check 
        CHECK (api_source IN ('USDA', 'FatSecret', 'OpenFoodFacts'));
        
        RAISE NOTICE 'Updated api_food_cache constraints';
    ELSE
        RAISE NOTICE 'Table api_food_cache does not exist, skipping constraint update';
    END IF;
END $$;