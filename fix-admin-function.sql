-- Fix the is_admin function to avoid circular RLS dependency
-- Run this in your Supabase SQL Editor

-- Replace the existing function (CREATE OR REPLACE doesn't require dropping)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Use SECURITY DEFINER to bypass RLS and avoid circular dependency
  RETURN EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.role IN ('admin', 'moderator')
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Test the function
SELECT public.is_admin() as is_current_user_admin;