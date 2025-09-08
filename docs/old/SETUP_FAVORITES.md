# Setting Up the Favorites Feature 🔧

The favorites feature requires a database table to be created. Here are three ways to set it up:

## Method 1: Using the Setup Page (Recommended)

1. Navigate to `http://localhost:3000/setup` in your browser
2. Click "Create Favorites Table" button
3. Wait for the success message
4. Go to the food search page and start favoriting foods!

## Method 2: Using Supabase Dashboard (Manual)

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the SQL from `sql/create_favorites_table.sql`
4. Run the SQL query
5. The favorites feature will be ready!

## Method 3: Using the API Endpoint

Make a POST request to `/api/setup-favorites` (this may require admin permissions)

## Troubleshooting

### 401 Unauthorized Error

- Make sure you're logged in to the app
- Check that your session is valid
- Try refreshing the page and logging in again

### Table Already Exists Error

- This is normal if you've already run the setup
- The favorites feature should work normally

### 503 Service Unavailable

- The favorites table hasn't been created yet
- Use one of the setup methods above

## What the Setup Creates

The setup process creates:

1. **`user_favorites` table** - Stores user's favorite foods
2. **Indexes** - For better query performance
3. **Row Level Security (RLS)** - Ensures users can only see their own favorites
4. **Policies** - Proper permissions for select, insert, and delete operations
5. **Triggers** - Automatic timestamp updates

## Testing the Feature

Once set up, you can:

1. **Add favorites**: Click the heart icon on any food item
2. **View favorites**: Visit `/dashboard/favorites`
3. **Quick add**: Use the "Quick Add to Diary" button on favorites
4. **Remove favorites**: Click the filled heart icon to unfavorite

## Database Schema

```sql
CREATE TABLE user_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_id UUID NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, food_id)
);
```

The table ensures:

- Each user can only favorite a food once (UNIQUE constraint)
- Favorites are automatically deleted if the user or food is deleted (CASCADE)
- Proper timestamps for tracking when favorites were added
- Row-level security so users only see their own favorites
