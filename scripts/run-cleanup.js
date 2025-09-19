/**
 * Run Database Cleanup Script
 * This script removes deprecated API data from the database
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runCleanup() {
  console.log("🧹 Starting database cleanup for deprecated APIs...");

  try {
    // Step 1: Remove API configurations for deprecated APIs
    console.log("1. Removing deprecated API configurations...");
    const { error: configError } = await supabase
      .from("api_configurations")
      .delete()
      .in("api_name", ["CalorieNinjas", "Edamam"]);

    if (configError) {
      console.warn("Warning removing configurations:", configError.message);
    } else {
      console.log("✅ Removed deprecated API configurations");
    }

    // Step 2: Remove cached data from deprecated APIs
    console.log("2. Removing cached data from deprecated APIs...");
    const { error: cacheError } = await supabase
      .from("api_food_cache")
      .delete()
      .in("api_source", ["CalorieNinjas", "Edamam"]);

    if (cacheError) {
      console.warn("Warning removing cache:", cacheError.message);
    } else {
      console.log("✅ Removed deprecated API cache data");
    }

    // Step 3: Remove usage statistics for deprecated APIs
    console.log("3. Removing usage statistics for deprecated APIs...");
    const { error: statsError } = await supabase
      .from("api_usage_stats")
      .delete()
      .in("api_name", ["CalorieNinjas", "Edamam"]);

    if (statsError) {
      console.warn("Warning removing stats:", statsError.message);
    } else {
      console.log("✅ Removed deprecated API usage statistics");
    }

    // Step 4: Remove search analytics for deprecated APIs
    console.log("4. Removing search analytics for deprecated APIs...");
    const { error: analyticsError } = await supabase
      .from("search_analytics")
      .delete()
      .in("api_used", ["CalorieNinjas", "Edamam"]);

    if (analyticsError) {
      console.warn("Warning removing analytics:", analyticsError.message);
    } else {
      console.log("✅ Removed deprecated API search analytics");
    }

    // Step 5: Verify cleanup
    console.log("5. Verifying cleanup...");

    const { data: remainingConfigs, error: verifyError } = await supabase
      .from("api_configurations")
      .select("api_name")
      .in("api_name", ["CalorieNinjas", "Edamam"]);

    if (verifyError) {
      console.warn("Warning during verification:", verifyError.message);
    } else if (remainingConfigs && remainingConfigs.length > 0) {
      console.warn(
        "⚠️  Some deprecated configurations still exist:",
        remainingConfigs
      );
    } else {
      console.log("✅ Verification passed - no deprecated APIs found");
    }

    // Step 6: Show current API configurations
    console.log("6. Current API configurations:");
    const { data: currentConfigs, error: currentError } = await supabase
      .from("api_configurations")
      .select("api_name, is_enabled")
      .order("api_name");

    if (currentError) {
      console.error("Error fetching current configs:", currentError.message);
    } else if (currentConfigs) {
      currentConfigs.forEach((config) => {
        console.log(
          `  - ${config.api_name}: ${
            config.is_enabled ? "enabled" : "disabled"
          }`
        );
      });
    }

    console.log("\n🎉 Database cleanup completed successfully!");
    console.log(
      "You can now refresh the admin external APIs page to see the changes."
    );
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
  }
}

runCleanup();
