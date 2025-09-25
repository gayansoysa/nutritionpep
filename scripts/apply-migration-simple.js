#!/usr/bin/env node

/**
 * Simple Database Migration Script
 *
 * This script applies the external_id column migration to the foods table
 * by executing individual SQL statements through Supabase client.
 */

const { createClient } = require("@supabase/supabase-js");

// Load environment variables
require("dotenv").config({ path: ".env.local" });

async function applyMigration() {
  console.log("🚀 Applying database migration...\n");

  // Create Supabase client with service role key for admin access
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  try {
    // First, let's check if the column already exists
    console.log("🔍 Checking if external_id column already exists...");

    // Try to select from foods table with external_id to see if it exists
    const { data: testData, error: testError } = await supabase
      .from("foods")
      .select("external_id")
      .limit(1);

    if (!testError) {
      console.log("✅ external_id column already exists!");
      console.log("🏁 Migration not needed.");
      return;
    }

    if (testError.code === "42703") {
      console.log(
        "📝 external_id column does not exist. Proceeding with migration..."
      );
    } else {
      console.error("❌ Unexpected error checking column:", testError);
      return;
    }

    // Since we can't execute DDL directly through Supabase client,
    // let's provide instructions for manual execution
    console.log("\n📋 MANUAL MIGRATION REQUIRED");
    console.log("=".repeat(50));
    console.log(
      "The external_id column needs to be added manually through the Supabase dashboard."
    );
    console.log("\nPlease follow these steps:");
    console.log(
      "1. Go to your Supabase dashboard: https://supabase.com/dashboard"
    );
    console.log("2. Navigate to your project: utlurbqiknfctyfngjfl");
    console.log("3. Go to SQL Editor");
    console.log("4. Execute the following SQL:");
    console.log("\n" + "-".repeat(50));
    console.log(`
-- Add external_id column to foods table
ALTER TABLE public.foods 
ADD COLUMN IF NOT EXISTS external_id TEXT;

-- Add an index for performance
CREATE INDEX IF NOT EXISTS idx_foods_external_id ON public.foods(external_id);

-- Add a unique constraint to prevent duplicate external foods
CREATE UNIQUE INDEX IF NOT EXISTS idx_foods_external_id_unique 
ON public.foods(external_id) 
WHERE external_id IS NOT NULL;

-- Add a comment to document the new column
COMMENT ON COLUMN public.foods.external_id IS 'External API identifier for foods imported from USDA, OpenFoodFacts, etc. Used to prevent duplicate imports and track source.';
`);
    console.log("-".repeat(50));
    console.log('\n5. Click "Run" to execute the SQL');
    console.log("6. Verify the migration by running this script again");

    console.log(
      "\n⚠️  Alternative: The application will continue to work without this column,"
    );
    console.log(
      "   but external food duplicate detection will be less efficient."
    );
  } catch (error) {
    console.error("❌ Script error:", error);
  }

  console.log("\n🏁 Migration script completed.");
}

// Run the migration
applyMigration().catch(console.error);
