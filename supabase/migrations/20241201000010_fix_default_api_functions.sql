-- Fix Default API Functions
-- This migration fixes the UPDATE statements that were missing WHERE clauses

-- Fix the ensure_single_default_api function
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

-- Fix the set_default_api function
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
    
    -- Update API configurations - only update rows that are currently default
    UPDATE api_configurations 
    SET is_default = false
    WHERE is_default = true;
    
    UPDATE api_configurations 
    SET is_default = true 
    WHERE api_configurations.api_name = set_default_api.api_name;
    
    RETURN true;
END;
$$;

-- Comments
COMMENT ON FUNCTION ensure_single_default_api() IS 'Trigger function to ensure only one API can be default at a time';
COMMENT ON FUNCTION set_default_api(TEXT) IS 'Sets the default API for food searches (admin only) - fixed version';