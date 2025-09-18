#!/usr/bin/env node

/**
 * Script to apply the auth fix migration using Supabase CLI
 * This will help sync existing auth users with profiles
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing Supabase environment variables");
  console.error(
    "Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local"
  );
  process.exit(1);
}

console.log("🔧 Applying auth fix migration...");
console.log(`📍 Supabase URL: ${SUPABASE_URL}`);

try {
  // Read the migration file
  const migrationPath = path.join(
    __dirname,
    "../supabase/migrations/20241201000006_sync_auth_users.sql"
  );

  if (!fs.existsSync(migrationPath)) {
    console.error("❌ Migration file not found:", migrationPath);
    process.exit(1);
  }

  const migrationSQL = fs.readFileSync(migrationPath, "utf8");
  console.log("📄 Migration file loaded successfully");

  // Extract project reference from URL
  const projectRef = SUPABASE_URL.replace("https://", "").replace(
    ".supabase.co",
    ""
  );

  console.log(`🚀 Applying migration to project: ${projectRef}`);

  // Apply the migration using Supabase CLI
  // Note: This requires the user to be logged in to Supabase CLI
  try {
    execSync(`npx supabase db push --project-ref ${projectRef}`, {
      stdio: "inherit",
      env: { ...process.env, SUPABASE_ACCESS_TOKEN: SUPABASE_SERVICE_KEY },
    });
    console.log("✅ Migration applied successfully!");
  } catch (error) {
    console.log("⚠️  CLI push failed, trying alternative method...");

    // Alternative: Create a temporary SQL file and suggest manual application
    const tempSQLPath = path.join(__dirname, "temp-auth-fix.sql");
    fs.writeFileSync(tempSQLPath, migrationSQL);

    console.log("📋 Manual application required:");
    console.log(
      "1. Go to your Supabase Dashboard: https://supabase.com/dashboard"
    );
    console.log(`2. Select your project: ${projectRef}`);
    console.log("3. Go to SQL Editor");
    console.log(`4. Copy and run the SQL from: ${tempSQLPath}`);
    console.log("");
    console.log("🔍 Or run this command to see the SQL:");
    console.log(`cat "${tempSQLPath}"`);
  }
} catch (error) {
  console.error("❌ Error applying migration:", error.message);
  process.exit(1);
}
