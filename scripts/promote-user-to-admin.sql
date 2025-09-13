-- Script to promote a user to admin role
-- Run this in your Supabase SQL Editor

-- First, let's see the current user data
SELECT 
    au.email,
    p.id,
    p.full_name,
    p.role,
    p.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE au.email = 'emailziggi@gmail.com';

-- If the user exists but doesn't have a profile, create one
INSERT INTO public.profiles (id, role, full_name)
SELECT 
    au.id,
    'admin'::public.user_role,
    COALESCE(au.raw_user_meta_data->>'full_name', 'Admin User')
FROM auth.users au
WHERE au.email = 'emailziggi@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = au.id);

-- Update existing profile to admin role
UPDATE public.profiles 
SET role = 'admin'::public.user_role,
    updated_at = NOW()
WHERE id = (
    SELECT au.id 
    FROM auth.users au 
    WHERE au.email = 'emailziggi@gmail.com'
);

-- Verify the update
SELECT 
    au.email,
    p.id,
    p.full_name,
    p.role,
    p.updated_at
FROM auth.users au
JOIN public.profiles p ON au.id = p.id
WHERE au.email = 'emailziggi@gmail.com';