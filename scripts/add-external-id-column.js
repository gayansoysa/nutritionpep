/**
 * Script to add external_id column to foods table
 * This fixes the database schema issue for external food integration
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
  console.log("Adding external_id column to foods table...");

  try {
    // Add the external_id column
    const { error: alterError } = await supabase.rpc("exec_sql", {
      sql: `
        -- Add external_id column if it doesn't exist
        ALTER TABLE public.foods 
        ADD COLUMN IF NOT EXISTS external_id TEXT;
        
        -- Add index for performance
        CREATE INDEX IF NOT EXISTS idx_foods_external_id ON public.foods(external_id);
        
        -- Add unique constraint to prevent duplicate external foods
        CREATE UNIQUE INDEX IF NOT EXISTS idx_foods_external_id_unique 
        ON public.foods(external_id) 
        WHERE external_id IS NOT NULL;
      `,
    });

    if (alterError) {
      console.error("Error adding external_id column:", alterError);
      return false;
    }

    console.log("✅ Successfully added external_id column to foods table");
    return true;
  } catch (error) {
    console.error("Error executing SQL:", error);
    return false;
  }
}

// Alternative approach using direct SQL execution
async function addExternalIdColumnDirect() {
  console.log("Adding external_id column to foods table (direct approach)...");

  try {
    // Check if column already exists
    const { data: columns, error: checkError } = await supabase
      .from("information_schema.columns")
      .select("column_name")
      .eq("table_name", "foods")
      .eq("column_name", "external_id");

    if (checkError) {
      console.error("Error checking column existence:", checkError);
      return false;
    }

    if (columns && columns.length > 0) {
      console.log("✅ external_id column already exists");
      return true;
    }

    // Try to add the column using a simple approach
    console.log("Column does not exist, attempting to add...");

    // We'll need to use a different approach since we can't execute DDL directly
    console.log("⚠️  Cannot add column directly via Supabase client.");
    console.log("Please run the following SQL in your Supabase SQL editor:");
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

    return false;
  } catch (error) {
    console.error("Error:", error);
    return false;
  }
}

async function main() {
  console.log("🔧 Fixing database schema for external food integration...\n");

  const success = await addExternalIdColumnDirect();

  if (!success) {
    console.log("\n❌ Could not automatically add the column.");
    console.log(
      "Please manually run the SQL provided above in your Supabase dashboard."
    );
    console.log(
      "Go to: https://supabase.com/dashboard/project/[your-project]/sql"
    );
  }
}

main().catch(console.error);
