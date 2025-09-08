import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// This is a one-time setup endpoint to create the favorites table
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseRouteHandlerClient();

    // Check if user is authenticated (optional for setup)
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Create the table using raw SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create user_favorites table
        CREATE TABLE IF NOT EXISTS user_favorites (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          food_id UUID NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          
          -- Ensure a user can't favorite the same food twice
          UNIQUE(user_id, food_id)
        );

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_favorites_food_id ON user_favorites(food_id);
        CREATE INDEX IF NOT EXISTS idx_user_favorites_created_at ON user_favorites(created_at);

        -- Enable RLS
        ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Users can view their own favorites" ON user_favorites;
        DROP POLICY IF EXISTS "Users can insert their own favorites" ON user_favorites;
        DROP POLICY IF EXISTS "Users can delete their own favorites" ON user_favorites;

        -- Create RLS policies
        CREATE POLICY "Users can view their own favorites" ON user_favorites
          FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert their own favorites" ON user_favorites
          FOR INSERT WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can delete their own favorites" ON user_favorites
          FOR DELETE USING (auth.uid() = user_id);
      `
    });

    if (error) {
      console.error('Error creating favorites table:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Favorites table created successfully' 
    });

  } catch (error) {
    console.error('Error in setup-favorites:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}