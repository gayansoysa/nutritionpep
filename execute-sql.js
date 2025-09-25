const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const supabaseUrl = "https://utlurbqiknfctyfngjfl.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bHVyYnFpa25mY3R5Zm5namZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAyMjM2NywiZXhwIjoyMDcyNTk4MzY3fQ.Q-hxi9WCiMdY3gA7y3M7I8J6JrEeMjpXBhXtmzobR9s";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSql(sql) {
  try {
    // Split SQL into individual statements
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    console.log(`Executing ${statements.length} SQL statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.length > 0) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);

        const { data, error } = await supabase
          .from("_temp")
          .select("*")
          .limit(0); // This will fail, but we'll use the connection

        // Try using the raw query method
        const { error: execError } = await supabase.rpc("exec", {
          sql: statement,
        });

        if (execError) {
          console.error(`Error in statement ${i + 1}:`, execError);
          console.error(`Statement: ${statement.substring(0, 100)}...`);
        } else {
          console.log(`✓ Statement ${i + 1} executed successfully`);
        }
      }
    }
  } catch (err) {
    console.error("Exception:", err);
  }
}

// Test with a simple CREATE TABLE statement first
const testSql = `
-- Create recipe visibility enum
DO $$ BEGIN
    CREATE TYPE public.recipe_visibility AS ENUM ('private','public','shared');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Create recipe difficulty enum  
DO $$ BEGIN
    CREATE TYPE public.recipe_difficulty AS ENUM ('easy','medium','hard');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Main recipes table
CREATE TABLE IF NOT EXISTS public.recipes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    instructions text,
    prep_time_minutes integer,
    cook_time_minutes integer,
    total_time_minutes integer GENERATED ALWAYS AS (prep_time_minutes + cook_time_minutes) STORED,
    servings integer NOT NULL DEFAULT 1,
    difficulty public.recipe_difficulty DEFAULT 'easy',
    visibility public.recipe_visibility NOT NULL DEFAULT 'private',
    image_url text,
    tags text[] DEFAULT '{}',
    category text,
    cuisine text,
    calories_per_serving numeric,
    protein_per_serving numeric,
    carbs_per_serving numeric,
    fat_per_serving numeric,
    fiber_per_serving numeric,
    calories_per_100g numeric,
    protein_per_100g numeric,
    carbs_per_100g numeric,
    fat_per_100g numeric,
    fiber_per_100g numeric,
    total_weight_g numeric,
    average_rating numeric DEFAULT 0,
    rating_count integer DEFAULT 0,
    times_made integer DEFAULT 0,
    times_favorited integer DEFAULT 0,
    source_url text,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
`;

executeSql(testSql);
