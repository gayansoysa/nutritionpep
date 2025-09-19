-- Complete Migration Script
-- This script applies all necessary migrations for the default API system
-- Run this in your Supabase Dashboard SQL Editor

-- Step 1: Create External API Integration Tables
-- API Food Cache Table
CREATE TABLE IF NOT EXISTS api_food_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_source TEXT NOT NULL CHECK (api_source IN ('USDA', 'FatSecret', 'OpenFoodFacts')),
    external_id TEXT NOT NULL,
    search_query TEXT,
    food_data JSONB NOT NULL,
    cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(api_source, external_id)
);

-- Search Analytics Table
CREATE TABLE IF NOT EXISTS search_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    search_query TEXT NOT NULL,
    results_count INTEGER DEFAULT 0,
    api_used TEXT,
    response_time_ms INTEGER,
    search_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    selected_food_id UUID REFERENCES foods(id) ON DELETE SET NULL,
    error_message TEXT,
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API Usage Statistics Table
CREATE TABLE IF NOT EXISTS api_usage_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_name TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    requests_count INTEGER DEFAULT 0,
    successful_requests INTEGER DEFAULT 0,
    failed_requests INTEGER DEFAULT 0,
    average_response_time_ms DECIMAL(10,2),
    rate_limit_hits INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(api_name, date)
);

-- API Configurations Table
CREATE TABLE IF NOT EXISTS api_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_name TEXT NOT NULL UNIQUE,
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if they don't exist
ALTER TABLE api_configurations 
ADD COLUMN IF NOT EXISTS rate_limit_per_minute INTEGER DEFAULT 60;

ALTER TABLE api_configurations 
ADD COLUMN IF NOT EXISTS timeout_seconds INTEGER DEFAULT 30;

ALTER TABLE api_configurations 
ADD COLUMN IF NOT EXISTS api_key_encrypted TEXT;

ALTER TABLE api_configurations 
ADD COLUMN IF NOT EXISTS base_url TEXT;

ALTER TABLE api_configurations 
ADD COLUMN IF NOT EXISTS additional_config JSONB DEFAULT '{}';

-- Create update trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers (drop first if they exist)
DROP TRIGGER IF EXISTS update_api_food_cache_updated_at ON api_food_cache;
CREATE TRIGGER update_api_food_cache_updated_at 
    BEFORE UPDATE ON api_food_cache 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_api_usage_stats_updated_at ON api_usage_stats;
CREATE TRIGGER update_api_usage_stats_updated_at 
    BEFORE UPDATE ON api_usage_stats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_api_configurations_updated_at ON api_configurations;
CREATE TRIGGER update_api_configurations_updated_at 
    BEFORE UPDATE ON api_configurations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default API configurations
INSERT INTO api_configurations (api_name, is_enabled, rate_limit_per_minute, timeout_seconds, base_url) VALUES
('USDA', true, 1000, 30, 'https://api.nal.usda.gov/fdc/v1/'),
('FatSecret', true, 1000, 30, 'https://platform.fatsecret.com/rest/server.api'),
('OpenFoodFacts', true, 100, 30, 'https://world.openfoodfacts.org/api/v0/')
ON CONFLICT (api_name) DO NOTHING;

-- Step 2: Add Default API System

-- Add default_api field to api_configurations table
ALTER TABLE api_configurations 
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;

-- Create system_settings table for global configuration
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT NOT NULL UNIQUE,
    setting_value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default API setting
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('default_api', '"USDA"', 'Default API to use for food searches')
ON CONFLICT (setting_key) DO NOTHING;

-- Set USDA as the default API in configurations
UPDATE api_configurations 
SET is_default = true 
WHERE api_name = 'USDA';

-- Ensure only one API can be default at a time
CREATE OR REPLACE FUNCTION ensure_single_default_api()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting this API as default, unset all others
    IF NEW.is_default = true THEN
        UPDATE api_configurations 
        SET is_default = false 
        WHERE api_name != NEW.api_name AND is_default = true;
        
        -- Also update the system setting
        UPDATE system_settings 
        SET setting_value = to_jsonb(NEW.api_name::text),
            updated_at = NOW()
        WHERE setting_key = 'default_api';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to ensure only one default API
DROP TRIGGER IF EXISTS ensure_single_default_api_trigger ON api_configurations;
CREATE TRIGGER ensure_single_default_api_trigger
    BEFORE UPDATE ON api_configurations
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_default_api();

-- Add RLS policy for system_settings (admin only)
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage system settings" ON system_settings;
CREATE POLICY "Admins can manage system settings" ON system_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Create function to get default API
CREATE OR REPLACE FUNCTION get_default_api()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    default_api_name TEXT;
BEGIN
    SELECT (setting_value #>> '{}')::TEXT
    INTO default_api_name
    FROM system_settings
    WHERE setting_key = 'default_api';
    
    -- Fallback to USDA if not set
    RETURN COALESCE(default_api_name, 'USDA');
END;
$$;

-- Create function to set default API
CREATE OR REPLACE FUNCTION set_default_api(api_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can set default API';
    END IF;
    
    -- Check if API exists and is enabled
    IF NOT EXISTS (
        SELECT 1 FROM api_configurations 
        WHERE api_configurations.api_name = set_default_api.api_name 
        AND is_enabled = true
    ) THEN
        RAISE EXCEPTION 'API % does not exist or is not enabled', api_name;
    END IF;
    
    -- Update system setting
    UPDATE system_settings 
    SET setting_value = to_jsonb(api_name::text),
        updated_at = NOW()
    WHERE setting_key = 'default_api';
    
    -- Update API configurations
    UPDATE api_configurations 
    SET is_default = false
    WHERE is_default = true;
    
    UPDATE api_configurations 
    SET is_default = true 
    WHERE api_configurations.api_name = set_default_api.api_name;
    
    RETURN true;
END;
$$;

-- Create view for API configurations with default status
CREATE OR REPLACE VIEW api_configurations_with_default AS
SELECT 
    ac.*,
    CASE 
        WHEN ac.is_default THEN true
        WHEN ac.api_name = get_default_api() THEN true
        ELSE false
    END as is_system_default
FROM api_configurations ac
ORDER BY ac.is_default DESC, ac.api_name;

-- Grant permissions
GRANT SELECT ON system_settings TO authenticated;
GRANT SELECT ON api_configurations_with_default TO authenticated;
GRANT EXECUTE ON FUNCTION get_default_api() TO authenticated;
GRANT EXECUTE ON FUNCTION set_default_api(TEXT) TO authenticated;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_api_configurations_default ON api_configurations(is_default);
CREATE INDEX IF NOT EXISTS idx_api_food_cache_source_id ON api_food_cache(api_source, external_id);
CREATE INDEX IF NOT EXISTS idx_search_analytics_timestamp ON search_analytics(search_timestamp);
CREATE INDEX IF NOT EXISTS idx_api_usage_stats_date ON api_usage_stats(api_name, date);

-- Update the updated_at trigger for system_settings
DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;
CREATE TRIGGER update_system_settings_updated_at 
    BEFORE UPDATE ON system_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on other tables
ALTER TABLE api_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_food_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_stats ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Admins can manage API configurations" ON api_configurations;
CREATE POLICY "Admins can manage API configurations" ON api_configurations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Users can view enabled API configurations" ON api_configurations;
CREATE POLICY "Users can view enabled API configurations" ON api_configurations
    FOR SELECT USING (is_enabled = true);

DROP POLICY IF EXISTS "Admins can manage API cache" ON api_food_cache;
CREATE POLICY "Admins can manage API cache" ON api_food_cache
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can view search analytics" ON search_analytics;
CREATE POLICY "Admins can view search analytics" ON search_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can view API usage stats" ON api_usage_stats;
CREATE POLICY "Admins can view API usage stats" ON api_usage_stats
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Step 3: Clean up deprecated APIs
-- Remove deprecated API configurations (if they exist)
DELETE FROM api_configurations 
WHERE api_name IN ('CalorieNinjas', 'Edamam');

-- Remove any cached data from deprecated APIs
DELETE FROM api_food_cache 
WHERE api_source IN ('CalorieNinjas', 'Edamam');

-- Remove usage statistics for deprecated APIs
DELETE FROM api_usage_stats 
WHERE api_name IN ('CalorieNinjas', 'Edamam');

-- Remove search analytics for deprecated APIs
DELETE FROM search_analytics 
WHERE api_used IN ('CalorieNinjas', 'Edamam');

-- Comments
COMMENT ON TABLE system_settings IS 'Global system configuration settings';
COMMENT ON COLUMN api_configurations.is_default IS 'Whether this API is set as the default for searches';
COMMENT ON FUNCTION get_default_api() IS 'Returns the currently configured default API name';
COMMENT ON FUNCTION set_default_api(TEXT) IS 'Sets the default API for food searches (admin only)';
COMMENT ON VIEW api_configurations_with_default IS 'API configurations with computed default status';

-- Final verification
SELECT 'Migration completed successfully. USDA is set as default API.' as status;