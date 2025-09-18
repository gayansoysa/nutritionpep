-- Fix the is_admin function to avoid circular RLS dependency
-- This fixes the "stack depth limit exceeded" error when updating foods

-- Replace the existing function with SECURITY DEFINER to bypass RLS
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

-- Revoke from public for security
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM public;