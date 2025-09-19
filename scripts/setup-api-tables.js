/**
 * Setup API Tables Script
 * This script manually creates the API tables if they don't exist
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupTables() {
  console.log("Setting up API tables...");

  try {
    // Check if tables exist
    const { data: tables, error: tablesError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .in("table_name", [
        "api_configurations",
        "api_usage_stats",
        "api_food_cache",
        "search_analytics",
      ]);

    if (tablesError) {
      console.error("Error checking tables:", tablesError);
      return;
    }

    const existingTables = tables.map((t) => t.table_name);
    console.log("Existing tables:", existingTables);

    // Insert default API configurations
    const { data: configs, error: configError } = await supabase
      .from("api_configurations")
      .upsert(
        [
          {
            api_name: "USDA",
            is_enabled: false,
            rate_limit_per_hour: 1000,
            rate_limit_per_day: 24000,
            rate_limit_per_month: 720000,
          },
          {
            api_name: "FatSecret",
            is_enabled: false,
            rate_limit_per_day: 10000,
            rate_limit_per_month: 300000,
          },
          {
            api_name: "OpenFoodFacts",
            is_enabled: true,
          },
        ],
        {
          onConflict: "api_name",
          ignoreDuplicates: false,
        }
      )
      .select();

    if (configError) {
      console.error("Error inserting configurations:", configError);
    } else {
      console.log("API configurations set up successfully:", configs);
    }

    // Test reading configurations
    const { data: testConfigs, error: testError } = await supabase
      .from("api_configurations")
      .select("*");

    if (testError) {
      console.error("Error reading configurations:", testError);
    } else {
      console.log("Current configurations:", testConfigs);
    }
  } catch (error) {
    console.error("Setup failed:", error);
  }
}

setupTables();
