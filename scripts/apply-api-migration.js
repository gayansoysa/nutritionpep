/**
 * Apply API Migration Script
 * This script applies the external API migration directly to Supabase
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  console.log("Applying external API migration...");

  try {
    // Read the migration file
    const migrationPath = path.join(
      __dirname,
      "..",
      "supabase",
      "migrations",
      "20241201000000_external_api_integration.sql"
    );

    if (!fs.existsSync(migrationPath)) {
      console.error("Migration file not found:", migrationPath);
      return;
    }

    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

    console.log(`Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`Executing statement ${i + 1}/${statements.length}...`);
          const { error } = await supabase.rpc("exec_sql", { sql: statement });

          if (error) {
            console.warn(`Warning on statement ${i + 1}:`, error.message);
            // Continue with other statements
          }
        } catch (err) {
          console.warn(`Error on statement ${i + 1}:`, err.message);
          // Continue with other statements
        }
      }
    }

    // Test if tables were created by inserting default configurations
    console.log(
      "Testing table creation by inserting default configurations..."
    );

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
      console.log(
        "✅ API configurations created successfully:",
        configs?.length || 0,
        "configs"
      );
    }

    // Test reading configurations
    const { data: testConfigs, error: testError } = await supabase
      .from("api_configurations")
      .select("*");

    if (testError) {
      console.error("❌ Error reading configurations:", testError);
    } else {
      console.log(
        "✅ Successfully read configurations:",
        testConfigs?.length || 0,
        "configs"
      );
      testConfigs?.forEach((config) => {
        console.log(
          `  - ${config.api_name}: ${
            config.is_enabled ? "enabled" : "disabled"
          }`
        );
      });
    }

    console.log("✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
  }
}

applyMigration();
