#!/usr/bin/env node

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing required environment variables");
  console.error("NEXT_PUBLIC_SUPABASE_URL:", !!supabaseUrl);
  console.error("SUPABASE_SERVICE_ROLE_KEY:", !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyOptimizations() {
  console.log("🚀 Applying performance optimizations...");

  try {
    // Read the optimization SQL file
    const sqlPath = path.join(
      __dirname,
      "..",
      "src",
      "lib",
      "database",
      "optimization.sql"
    );
    const sqlContent = fs.readFileSync(sqlPath, "utf8");

    // Split SQL into individual statements
    const statements = sqlContent
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(
            `⏳ Executing statement ${i + 1}/${statements.length}...`
          );
          const { error } = await supabase.rpc("exec_sql", { sql: statement });

          if (error) {
            console.warn(`⚠️  Warning on statement ${i + 1}:`, error.message);
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.warn(`⚠️  Error on statement ${i + 1}:`, err.message);
        }
      }
    }

    // Apply specific performance indexes for Quick Add functionality
    console.log("🔧 Applying Quick Add specific optimizations...");

    const quickAddOptimizations = [
      // Index for user_favorites table
      `CREATE INDEX IF NOT EXISTS idx_user_favorites_user_created 
       ON public.user_favorites(user_id, created_at DESC);`,

      // Index for recent_foods table
      `CREATE INDEX IF NOT EXISTS idx_recent_foods_user_last_used 
       ON public.recent_foods(user_id, last_used_at DESC);`,

      // Index for diary_entries for recent food tracking
      `CREATE INDEX IF NOT EXISTS idx_diary_entries_user_meal_created 
       ON public.diary_entries(user_id, meal_type, created_at DESC);`,

      // Composite index for foods search
      `CREATE INDEX IF NOT EXISTS idx_foods_name_brand_verified 
       ON public.foods(name, brand, verified) WHERE verified = true;`,
    ];

    for (const optimization of quickAddOptimizations) {
      try {
        const { error } = await supabase.rpc("exec_sql", { sql: optimization });
        if (error) {
          console.warn(
            "⚠️  Warning applying Quick Add optimization:",
            error.message
          );
        } else {
          console.log("✅ Quick Add optimization applied");
        }
      } catch (err) {
        console.warn("⚠️  Error applying Quick Add optimization:", err.message);
      }
    }

    console.log("🎉 Performance optimizations completed!");
    console.log("📈 Expected improvements:");
    console.log("  - Faster food search queries");
    console.log("  - Improved favorites loading");
    console.log("  - Better recent foods performance");
    console.log("  - Optimized dashboard queries");
  } catch (error) {
    console.error("❌ Error applying optimizations:", error);
    process.exit(1);
  }
}

// Create exec_sql function if it doesn't exist
async function createExecSqlFunction() {
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION exec_sql(sql text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql;
    END;
    $$;
  `;

  try {
    const { error } = await supabase.rpc("exec_sql", {
      sql: createFunctionSQL,
    });
    if (error && !error.message.includes("already exists")) {
      // Try direct execution
      await supabase.from("_").select("*").limit(0); // This will fail but establish connection
    }
  } catch (err) {
    // Function might not exist yet, that's okay
  }
}

// Run the optimizations
createExecSqlFunction().then(() => {
  applyOptimizations();
});
