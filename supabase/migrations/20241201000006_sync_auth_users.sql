-- Sync existing auth users with profiles table
-- This migration creates profiles for existing auth users and sets up automatic profile creation

-- Function to create profile for auth user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'user',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to sync existing auth users (run once)
CREATE OR REPLACE FUNCTION public.sync_existing_auth_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  auth_user RECORD;
BEGIN
  -- Loop through all auth users and create profiles if they don't exist
  FOR auth_user IN 
    SELECT id, email, raw_user_meta_data, created_at
    FROM auth.users
  LOOP
    INSERT INTO public.profiles (id, full_name, role, created_at, updated_at)
    VALUES (
      auth_user.id,
      COALESCE(
        auth_user.raw_user_meta_data->>'full_name', 
        auth_user.raw_user_meta_data->>'name', 
        split_part(auth_user.email, '@', 1)
      ),
      'user',
      auth_user.created_at,
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
  
  RAISE NOTICE 'Synced existing auth users with profiles table';
END;
$$;

-- Run the sync function once
SELECT public.sync_existing_auth_users();

-- Function to promote user to admin (for manual admin creation)
CREATE OR REPLACE FUNCTION public.promote_user_to_admin(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id uuid;
BEGIN
  -- Find user by email
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = user_email;
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  -- Update profile role to admin
  UPDATE public.profiles
  SET role = 'admin', updated_at = NOW()
  WHERE id = user_id;
  
  IF NOT FOUND THEN
    -- Create profile if it doesn't exist
    INSERT INTO public.profiles (id, full_name, role, created_at, updated_at)
    VALUES (
      user_id,
      (SELECT COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1)) FROM auth.users WHERE id = user_id),
      'admin',
      NOW(),
      NOW()
    );
  END IF;
  
  RAISE NOTICE 'User % promoted to admin', user_email;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_existing_auth_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.promote_user_to_admin(text) TO authenticated;