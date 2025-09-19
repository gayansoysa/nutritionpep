-- Quick Setup for External API Management
-- Run this in your Supabase SQL Editor

-- Create API Configurations Table
CREATE TABLE IF NOT EXISTS api_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_name TEXT NOT NULL UNIQUE,
    is_enabled BOOLEAN DEFAULT false,
    api_key_encrypted TEXT,
    additional_config JSONB,
    rate_limit_per_hour INTEGER,
    rate_limit_per_day INTEGER,
    rate_limit_per_month INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE api_configurations ENABLE ROW LEVEL SECURITY;

-- Admin-only access policy
CREATE POLICY "Admins can manage API configurations" ON api_configurations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Insert default configurations
INSERT INTO api_configurations (api_name, is_enabled, rate_limit_per_hour, rate_limit_per_day, rate_limit_per_month) VALUES
('USDA', false, 1000, 24000, 720000),
('FatSecret', false, null, 10000, 300000),
('OpenFoodFacts', true, null, null, null)
ON CONFLICT (api_name) DO NOTHING;

-- Create basic API usage stats table
CREATE TABLE IF NOT EXISTS api_usage_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_name TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    requests_count INTEGER DEFAULT 0,
    successful_requests INTEGER DEFAULT 0,
    failed_requests INTEGER DEFAULT 0,
    average_response_time_ms DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(api_name, date)
);

-- Enable RLS for stats
ALTER TABLE api_usage_stats ENABLE ROW LEVEL SECURITY;

-- Admin-only access policy for stats
CREATE POLICY "Admins can manage API usage stats" ON api_usage_stats
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON api_configurations TO authenticated;
GRANT SELECT ON api_usage_stats TO authenticated;