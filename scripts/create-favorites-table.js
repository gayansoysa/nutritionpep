const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createFavoritesTable() {
  console.log("Checking user_favorites table...");

  try {
    // Test if table exists by trying to query it
    const { data, error } = await supabase
      .from("user_favorites")
      .select("*")
      .limit(1);

    if (error && error.code === "42P01") {
      console.log("❌ Table doesn't exist. Please create it manually.");
      console.log(
        "\n📋 Copy and paste this SQL into your Supabase SQL Editor:"
      );
      console.log("=" * 60);
      console.log(`
-- Create user_favorites table
CREATE TABLE user_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_id UUID NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, food_id)
);

-- Create indexes
CREATE INDEX idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX idx_user_favorites_food_id ON user_favorites(food_id);
CREATE INDEX idx_user_favorites_created_at ON user_favorites(created_at);

-- Enable RLS
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own favorites" ON user_favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites" ON user_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" ON user_favorites
  FOR DELETE USING (auth.uid() = user_id);
      `);
      console.log("=" * 60);
      console.log(
        "\n🔗 Go to: https://supabase.com/dashboard/project/[your-project]/sql"
      );
      return;
    }

    if (error) {
      console.error("❌ Error checking table:", error);
      return;
    }

    console.log("✅ user_favorites table exists and is accessible!");
    console.log("🎉 Favorites feature is ready to use!");
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

createFavoritesTable();
