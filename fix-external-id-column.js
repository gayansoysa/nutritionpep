/**
 * Script to add external_id column to foods table using direct SQL execution
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addExternalIdColumn() {
  console.log("🔧 Adding external_id column to foods table...");

  try {
    // First, let's check if we can query the foods table structure
    const { data: testData, error: testError } = await supabase
      .from("foods")
      .select("id")
      .limit(1);

    if (testError) {
      console.error("Error accessing foods table:", testError);
      return false;
    }

    console.log("✅ Successfully connected to foods table");

    // Now let's try to execute the SQL to add the column
    // We'll use a PostgreSQL function approach
    const sql = `
      DO $$ 
      BEGIN
        -- Add external_id column if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'foods' 
          AND column_name = 'external_id'
          AND table_schema = 'public'
        ) THEN
          ALTER TABLE public.foods ADD COLUMN external_id TEXT;
          
          -- Add index for performance
          CREATE INDEX idx_foods_external_id ON public.foods(external_id);
          
          -- Add unique constraint to prevent duplicate external foods
          CREATE UNIQUE INDEX idx_foods_external_id_unique 
          ON public.foods(external_id) 
          WHERE external_id IS NOT NULL;
          
          -- Add comment for documentation
          COMMENT ON COLUMN public.foods.external_id IS 'External API identifier for foods imported from USDA, OpenFoodFacts, etc.';
          
          RAISE NOTICE 'external_id column added successfully';
        ELSE
          RAISE NOTICE 'external_id column already exists';
        END IF;
      END $$;
    `;

    // Try to execute using rpc if available
    const { data, error } = await supabase.rpc("exec_sql", { sql });

    if (error) {
      console.log("RPC approach failed, trying alternative...");
      console.log("Error:", error);

      // Alternative: try to insert a test record to see what happens
      console.log("Testing current table structure...");

      const testInsert = {
        name: "Test Food",
        source: "curated",
        verified: false,
        nutrients_per_100g: {},
        serving_sizes: [],
      };

      const { data: insertData, error: insertError } = await supabase
        .from("foods")
        .insert(testInsert)
        .select();

      if (insertError) {
        console.log("Current table structure test failed:", insertError);
      } else {
        console.log("✅ Test insert successful, cleaning up...");
        // Clean up test record
        if (insertData && insertData[0]) {
          await supabase.from("foods").delete().eq("id", insertData[0].id);
        }
      }

      return false;
    }

    console.log("✅ SQL executed successfully");
    console.log("Result:", data);
    return true;
  } catch (error) {
    console.error("Error executing SQL:", error);
    return false;
  }
}

async function main() {
  console.log("🔧 Fixing database schema for external food integration...\n");

  const success = await addExternalIdColumn();

  if (!success) {
    console.log("\n❌ Could not automatically add the column.");
    console.log("The SQL that needs to be run manually:");
    console.log(`
-- Add external_id column to foods table
ALTER TABLE public.foods 
ADD COLUMN IF NOT EXISTS external_id TEXT;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_foods_external_id ON public.foods(external_id);

-- Add unique constraint to prevent duplicate external foods
CREATE UNIQUE INDEX IF NOT EXISTS idx_foods_external_id_unique 
ON public.foods(external_id) 
WHERE external_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.foods.external_id IS 'External API identifier for foods imported from USDA, OpenFoodFacts, etc.';
    `);
    console.log("\nPlease run this SQL in your Supabase SQL editor:");
    console.log(
      "https://supabase.com/dashboard/project/utlurbqiknfctyfngjfl/sql"
    );
  } else {
    console.log("\n✅ Database schema updated successfully!");
    console.log("The external_id column has been added to the foods table.");
  }
}

main().catch(console.error);
