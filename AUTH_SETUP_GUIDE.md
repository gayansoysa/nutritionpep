# Authentication Setup Guide

## Current Issue

- Users exist in Supabase Auth but don't have corresponding profiles in the `profiles` table
- This causes authentication to fail and users not to show up in admin panel

## Step-by-Step Fix

### 1. Apply Database Migration

Copy and run the SQL from `/scripts/apply-auth-fix.sql` in your Supabase SQL Editor:

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy the entire content from `scripts/apply-auth-fix.sql`
4. Run the SQL script

This will:

- Create a trigger to automatically create profiles for new users
- Create functions to sync existing users and promote users to admin
- Sync all existing auth users with the profiles table

### 2. Test Authentication

1. Go to `/debug-auth` in your app
2. If you see "No user found", you need to sign in first
3. Go to `/login` and sign in with an existing account or create a new one
4. Return to `/debug-auth` to verify authentication is working

### 3. Create First Admin User

Once you're signed in and can see your user info on `/debug-auth`:

**Option A: Use the Debug Page**

1. On `/debug-auth`, click "Promote to Admin" button
2. This will promote your current user to admin role

**Option B: Use SQL (if you know the email)**

```sql
SELECT public.promote_user_to_admin('your-email@example.com');
```

### 4. Verify Admin Access

1. After promotion, refresh `/debug-auth`
2. You should see "✅ You have admin access!"
3. Click "Go to Admin Panel" or navigate to `/admin/users`
4. You should now see users in the admin panel

## Troubleshooting

### If users still don't show up:

1. Check browser console for errors
2. Verify the SQL migration ran successfully
3. Try the "Sync Auth Users" button on `/debug-auth`

### If you can't sign in:

1. Check your Supabase project settings
2. Verify email confirmation is not required (or check your email)
3. Try creating a new account

### If profile creation fails:

1. Check RLS policies in Supabase
2. Verify the trigger was created successfully
3. Try manually running: `SELECT public.sync_existing_auth_users();`

## What Was Fixed

1. **Automatic Profile Creation**: New users now automatically get profiles created
2. **Existing User Sync**: All existing auth users now have profiles
3. **Better Error Handling**: Auth components now handle missing profiles gracefully
4. **Admin Promotion**: Easy way to promote users to admin role
5. **Debug Tools**: Enhanced debug page with sync and promotion tools

## Files Modified

- `src/app/debug-auth/page.tsx` - Enhanced with sync and promotion tools
- `src/app/login/page.tsx` - Better signup handling
- `src/lib/auth/auth-helpers.ts` - New auth helper functions
- `src/components/auth/AuthStatus.tsx` - New auth status component
- `supabase/migrations/20241201000006_sync_auth_users.sql` - Database migration
- `scripts/apply-auth-fix.sql` - Manual SQL script for immediate fix

## Next Steps

After authentication is working:

1. Test creating new users to verify automatic profile creation
2. Test admin functionality in `/admin/users`
3. Consider adding email confirmation if needed
4. Set up proper user onboarding flow
