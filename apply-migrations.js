const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const supabaseUrl = "https://utlurbqiknfctyfngjfl.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bHVyYnFpa25mY3R5Zm5namZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAyMjM2NywiZXhwIjoyMDcyNTk4MzY3fQ.Q-hxi9WCiMdY3gA7y3M7I8J6JrEeMjpXBhXtmzobR9s";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration(filePath) {
  console.log(`Applying migration: ${path.basename(filePath)}`);

  try {
    const sql = fs.readFileSync(filePath, "utf8");
    const { data, error } = await supabase.rpc("exec_sql", { sql });

    if (error) {
      console.error(`Error applying ${path.basename(filePath)}:`, error);
      return false;
    } else {
      console.log(`✓ Successfully applied ${path.basename(filePath)}`);
      return true;
    }
  } catch (err) {
    console.error(`Exception applying ${path.basename(filePath)}:`, err);
    return false;
  }
}

async function main() {
  const migrationsDir = path.join(__dirname, "supabase", "migrations");

  // Apply specific recipe-related migrations
  const recipeMigrations = [
    "20241201000004_create_recipes_system.sql",
    "20241201000005_recipe_functions.sql",
  ];

  for (const migration of recipeMigrations) {
    const filePath = path.join(migrationsDir, migration);
    if (fs.existsSync(filePath)) {
      await applyMigration(filePath);
    } else {
      console.log(`Migration file not found: ${migration}`);
    }
  }
}

main();
