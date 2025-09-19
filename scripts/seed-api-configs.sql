-- Seed API Configurations
-- This script ensures all API configurations are properly initialized

-- Insert or update API configurations with proper defaults
INSERT INTO api_configurations (
    api_name, 
    is_enabled, 
    rate_limit_per_hour, 
    rate_limit_per_day, 
    rate_limit_per_month
) VALUES
    ('USDA', false, 1000, 24000, 720000),
    ('FatSecret', false, null, 10000, 300000),
    ('OpenFoodFacts', true, null, null, null)
ON CONFLICT (api_name) DO UPDATE SET
    rate_limit_per_hour = EXCLUDED.rate_limit_per_hour,
    rate_limit_per_day = EXCLUDED.rate_limit_per_day,
    rate_limit_per_month = EXCLUDED.rate_limit_per_month,
    updated_at = NOW();

-- Add a computed column to check if credentials exist
ALTER TABLE api_configurations 
ADD COLUMN IF NOT EXISTS has_credentials BOOLEAN 
GENERATED ALWAYS AS (
    CASE 
        WHEN api_name = 'OpenFoodFacts' THEN true
        WHEN api_name = 'USDA' THEN api_key_encrypted IS NOT NULL
        WHEN api_name = 'FatSecret' THEN (
            additional_config IS NOT NULL AND 
            additional_config ? 'client_id' AND 
            additional_config ? 'client_secret'
        )
        ELSE false
    END
) STORED;