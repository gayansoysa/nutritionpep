#!/usr/bin/env node

/**
 * Debug Authentication Script
 *
 * This script helps debug authentication issues by checking:
 * - Current user session
 * - User profile in database
 * - Role assignments
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase environment variables");
  console.error(
    "Make sure you have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugAuth() {
  console.log("🔍 Authentication Debug Report\n");

  try {
    // Check all users in auth.users
    console.log("📋 All Users in auth.users:");
    const { data: authUsers, error: authError } =
      await supabase.auth.admin.listUsers();

    if (authError) {
      console.error("❌ Error fetching auth users:", authError);
      return;
    }

    if (!authUsers.users || authUsers.users.length === 0) {
      console.log("⚠️  No users found in auth.users table");
      return;
    }

    console.log(`Found ${authUsers.users.length} user(s):\n`);

    for (const user of authUsers.users) {
      console.log(`👤 User: ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Created: ${user.created_at}`);
      console.log(`   Last Sign In: ${user.last_sign_in_at || "Never"}`);
      console.log(`   Confirmed: ${user.email_confirmed_at ? "Yes" : "No"}`);

      // Check corresponding profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.log(`   ❌ Profile Error: ${profileError.message}`);
        if (profileError.code === "PGRST116") {
          console.log(
            "   💡 Profile not found - user needs to complete onboarding"
          );
        }
      } else {
        console.log(`   📝 Profile Found:`);
        console.log(`      Name: ${profile.full_name || "Not set"}`);
        console.log(`      Role: ${profile.role || "user"}`);
        console.log(`      Created: ${profile.created_at}`);
        console.log(`      Updated: ${profile.updated_at}`);
      }

      console.log(""); // Empty line for readability
    }

    // Check profiles table directly
    console.log("📊 All Profiles in profiles table:");
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profilesError) {
      console.error("❌ Error fetching profiles:", profilesError);
    } else {
      console.log(`Found ${profiles.length} profile(s):\n`);

      for (const profile of profiles) {
        console.log(`👤 Profile ID: ${profile.id}`);
        console.log(`   Name: ${profile.full_name || "Not set"}`);
        console.log(`   Role: ${profile.role || "user"}`);
        console.log(`   Created: ${profile.created_at}`);
        console.log("");
      }
    }
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

// Run the debug function
debugAuth()
  .then(() => {
    console.log("✅ Debug complete");
  })
  .catch((error) => {
    console.error("❌ Debug failed:", error);
  });
