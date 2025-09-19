-- Add Default API System
-- This migration adds support for setting a default API that will be used first in searches

-- Add default_api field to api_configurations table
ALTER TABLE api_configurations 
ADD COLUMN is_default BOOLEAN DEFAULT false;

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
CREATE TRIGGER ensure_single_default_api_trigger
    BEFORE UPDATE ON api_configurations
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_default_api();

-- Add RLS policy for system_settings (admin only)
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

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

-- Update the updated_at trigger for system_settings
CREATE TRIGGER update_system_settings_updated_at 
    BEFORE UPDATE ON system_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE system_settings IS 'Global system configuration settings';
COMMENT ON COLUMN api_configurations.is_default IS 'Whether this API is set as the default for searches';
COMMENT ON FUNCTION get_default_api() IS 'Returns the currently configured default API name';
COMMENT ON FUNCTION set_default_api(TEXT) IS 'Sets the default API for food searches (admin only)';
COMMENT ON VIEW api_configurations_with_default IS 'API configurations with computed default status';