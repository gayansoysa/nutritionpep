#!/usr/bin/env node

/**
 * Apply Database Migration Script
 *
 * This script applies the external_id column migration to the foods table
 * using the Supabase service role key for admin access.
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

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
    // Read the migration SQL file
    const migrationPath = path.join(
      __dirname,
      "..",
      "supabase",
      "migrations",
      "20241201000011_add_external_id_to_foods.sql"
    );
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    console.log("📄 Migration SQL:");
    console.log(migrationSQL);
    console.log("\n" + "=".repeat(50) + "\n");

    // Execute the migration
    console.log("⚡ Executing migration...");
    const { data, error } = await supabase.rpc("exec_sql", {
      sql: migrationSQL,
    });

    if (error) {
      console.error("❌ Migration failed:", error);

      // Try alternative approach - execute each statement separately
      console.log(
        "\n🔄 Trying alternative approach - executing statements separately..."
      );

      const statements = migrationSQL
        .split(";")
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

      for (const statement of statements) {
        if (statement.includes("DO $$")) {
          // Handle DO blocks specially
          const doBlock = migrationSQL.substring(
            migrationSQL.indexOf("DO $$"),
            migrationSQL.indexOf("END $$;") + 7
          );
          console.log("Executing DO block...");
          const { error: doError } = await supabase.rpc("exec_sql", {
            sql: doBlock,
          });
          if (doError) {
            console.warn("DO block warning:", doError);
          }
          break;
        } else {
          console.log(`Executing: ${statement.substring(0, 50)}...`);
          const { error: stmtError } = await supabase.rpc("exec_sql", {
            sql: statement + ";",
          });
          if (stmtError) {
            console.warn("Statement warning:", stmtError);
          }
        }
      }
    } else {
      console.log("✅ Migration executed successfully!");
      if (data) {
        console.log("Result:", data);
      }
    }

    // Verify the migration worked by checking if the column exists
    console.log("\n🔍 Verifying migration...");
    const { data: columnCheck, error: checkError } = await supabase
      .from("information_schema.columns")
      .select("column_name")
      .eq("table_name", "foods")
      .eq("column_name", "external_id");

    if (checkError) {
      console.error("❌ Verification failed:", checkError);
    } else if (columnCheck && columnCheck.length > 0) {
      console.log("✅ Migration verified! external_id column exists.");
    } else {
      console.log("⚠️  Column not found in verification check.");
    }
  } catch (error) {
    console.error("❌ Script error:", error);
  }

  console.log("\n🏁 Migration script completed.");
}

// Run the migration
applyMigration().catch(console.error);
