-- External API Integration Database Schema
-- This migration adds tables for API caching and search analytics

-- API Food Cache Table
-- Stores cached results from external APIs to reduce API calls and improve performance
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
-- Tracks search queries, API usage, and performance metrics
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
-- Tracks API rate limits and usage patterns
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

-- API Configuration Table
-- Stores API keys and configuration (encrypted)
CREATE TABLE IF NOT EXISTS api_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_name TEXT NOT NULL UNIQUE,
    is_enabled BOOLEAN DEFAULT false,
    api_key_encrypted TEXT, -- Store encrypted API keys
    additional_config JSONB, -- Store additional config like client_id, etc.
    rate_limit_per_hour INTEGER,
    rate_limit_per_day INTEGER,
    rate_limit_per_month INTEGER,
    last_rate_limit_reset TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_food_cache_search_query ON api_food_cache(search_query);
CREATE INDEX IF NOT EXISTS idx_api_food_cache_expires_at ON api_food_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_api_food_cache_api_source ON api_food_cache(api_source);
CREATE INDEX IF NOT EXISTS idx_api_food_cache_external_id ON api_food_cache(external_id);

CREATE INDEX IF NOT EXISTS idx_search_analytics_search_query ON search_analytics(search_query);
CREATE INDEX IF NOT EXISTS idx_search_analytics_api_used ON search_analytics(api_used);
CREATE INDEX IF NOT EXISTS idx_search_analytics_timestamp ON search_analytics(search_timestamp);
CREATE INDEX IF NOT EXISTS idx_search_analytics_user_id ON search_analytics(user_id);

CREATE INDEX IF NOT EXISTS idx_api_usage_stats_api_name ON api_usage_stats(api_name);
CREATE INDEX IF NOT EXISTS idx_api_usage_stats_date ON api_usage_stats(date);

-- Row Level Security (RLS) Policies

-- API Food Cache - Public read access for caching efficiency
ALTER TABLE api_food_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read cached food data" ON api_food_cache
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage cache" ON api_food_cache
    FOR ALL USING (auth.role() = 'service_role');

-- Search Analytics - Users can only see their own analytics, admins see all
ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own search analytics" ON search_analytics
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "Service role can insert search analytics" ON search_analytics
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins can manage search analytics" ON search_analytics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- API Usage Stats - Admin only
ALTER TABLE api_usage_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage API usage stats" ON api_usage_stats
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- API Configurations - Admin only
ALTER TABLE api_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage API configurations" ON api_configurations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Functions for automatic cleanup and maintenance

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM api_food_cache 
    WHERE expires_at < NOW();
END;
$$;

-- Function to update API usage statistics
CREATE OR REPLACE FUNCTION update_api_usage_stats(
    p_api_name TEXT,
    p_success BOOLEAN DEFAULT true,
    p_response_time_ms INTEGER DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO api_usage_stats (
        api_name, 
        date, 
        requests_count, 
        successful_requests, 
        failed_requests,
        average_response_time_ms
    )
    VALUES (
        p_api_name,
        CURRENT_DATE,
        1,
        CASE WHEN p_success THEN 1 ELSE 0 END,
        CASE WHEN p_success THEN 0 ELSE 1 END,
        p_response_time_ms
    )
    ON CONFLICT (api_name, date)
    DO UPDATE SET
        requests_count = api_usage_stats.requests_count + 1,
        successful_requests = api_usage_stats.successful_requests + CASE WHEN p_success THEN 1 ELSE 0 END,
        failed_requests = api_usage_stats.failed_requests + CASE WHEN p_success THEN 0 ELSE 1 END,
        average_response_time_ms = CASE 
            WHEN p_response_time_ms IS NOT NULL THEN
                COALESCE(
                    (api_usage_stats.average_response_time_ms * (api_usage_stats.requests_count - 1) + p_response_time_ms) / api_usage_stats.requests_count,
                    p_response_time_ms
                )
            ELSE api_usage_stats.average_response_time_ms
        END,
        updated_at = NOW();
END;
$$;

-- Trigger to automatically update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_api_food_cache_updated_at 
    BEFORE UPDATE ON api_food_cache 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_usage_stats_updated_at 
    BEFORE UPDATE ON api_usage_stats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_configurations_updated_at 
    BEFORE UPDATE ON api_configurations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default API configurations
INSERT INTO api_configurations (api_name, is_enabled, rate_limit_per_hour, rate_limit_per_day, rate_limit_per_month) VALUES
('USDA', false, 1000, 24000, 720000),
('FatSecret', false, null, 10000, 300000),
('OpenFoodFacts', true, null, null, null)
ON CONFLICT (api_name) DO NOTHING;

-- Create a view for easy API statistics
CREATE OR REPLACE VIEW api_statistics AS
SELECT 
    aus.api_name,
    ac.is_enabled,
    aus.date,
    aus.requests_count,
    aus.successful_requests,
    aus.failed_requests,
    ROUND((aus.successful_requests::decimal / NULLIF(aus.requests_count, 0)) * 100, 2) as success_rate_percent,
    aus.average_response_time_ms,
    ac.rate_limit_per_hour,
    ac.rate_limit_per_day,
    ac.rate_limit_per_month
FROM api_usage_stats aus
LEFT JOIN api_configurations ac ON aus.api_name = ac.api_name
ORDER BY aus.date DESC, aus.api_name;

-- Create a view for search analytics summary
CREATE OR REPLACE VIEW search_analytics_summary AS
SELECT 
    DATE(search_timestamp) as date,
    api_used,
    COUNT(*) as total_searches,
    COUNT(CASE WHEN results_count > 0 THEN 1 END) as successful_searches,
    COUNT(CASE WHEN results_count = 0 THEN 1 END) as failed_searches,
    AVG(results_count) as avg_results_per_search,
    AVG(response_time_ms) as avg_response_time_ms,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT search_query) as unique_queries
FROM search_analytics
WHERE search_timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(search_timestamp), api_used
ORDER BY date DESC, api_used;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON api_food_cache TO anon, authenticated;
GRANT SELECT ON search_analytics TO authenticated;
GRANT SELECT ON api_statistics TO authenticated;
GRANT SELECT ON search_analytics_summary TO authenticated;

-- Comments for documentation
COMMENT ON TABLE api_food_cache IS 'Caches food data from external APIs to reduce API calls and improve performance';
COMMENT ON TABLE search_analytics IS 'Tracks search queries and API usage for analytics and optimization';
COMMENT ON TABLE api_usage_stats IS 'Daily statistics for API usage and rate limiting';
COMMENT ON TABLE api_configurations IS 'Configuration and credentials for external APIs';

COMMENT ON FUNCTION cleanup_expired_cache() IS 'Removes expired cache entries to keep the cache table clean';
COMMENT ON FUNCTION update_api_usage_stats(TEXT, BOOLEAN, INTEGER) IS 'Updates daily API usage statistics';

COMMENT ON VIEW api_statistics IS 'Combined view of API usage statistics and configuration';
COMMENT ON VIEW search_analytics_summary IS 'Daily summary of search analytics grouped by API';