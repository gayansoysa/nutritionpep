#!/usr/bin/env node

/**
 * Script to check authentication status and diagnose issues
 */

const { createClient } = require("@supabase/supabase-js");

// Load environment variables
require("dotenv").config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkAuthStatus() {
  console.log("🔍 Checking authentication status...\n");

  try {
    // Check 1: Count auth users
    const { data: authUsers, error: authError } =
      await supabase.auth.admin.listUsers();

    if (authError) {
      console.error("❌ Error fetching auth users:", authError.message);
      return;
    }

    console.log(`👥 Auth users found: ${authUsers.users.length}`);

    if (authUsers.users.length > 0) {
      console.log("📋 Auth users:");
      authUsers.users.forEach((user, index) => {
        console.log(
          `  ${index + 1}. ${user.email} (ID: ${user.id.substring(0, 8)}...)`
        );
        console.log(
          `     Created: ${new Date(user.created_at).toLocaleString()}`
        );
        console.log(
          `     Confirmed: ${user.email_confirmed_at ? "Yes" : "No"}`
        );
      });
    }

    // Check 2: Count profiles
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("*");

    if (profileError) {
      console.error("❌ Error fetching profiles:", profileError.message);
      return;
    }

    console.log(`\n👤 Profiles found: ${profiles.length}`);

    if (profiles.length > 0) {
      console.log("📋 Profiles:");
      profiles.forEach((profile, index) => {
        console.log(
          `  ${index + 1}. ${profile.full_name || "No name"} (${profile.role})`
        );
        console.log(`     ID: ${profile.id.substring(0, 8)}...`);
      });
    }

    // Check 3: Find users without profiles
    const usersWithoutProfiles = authUsers.users.filter(
      (user) => !profiles.some((profile) => profile.id === user.id)
    );

    if (usersWithoutProfiles.length > 0) {
      console.log(
        `\n⚠️  Users without profiles: ${usersWithoutProfiles.length}`
      );
      usersWithoutProfiles.forEach((user, index) => {
        console.log(
          `  ${index + 1}. ${user.email} (ID: ${user.id.substring(0, 8)}...)`
        );
      });
      console.log(
        "\n🔧 These users need profiles created. Run the auth fix migration!"
      );
    } else {
      console.log("\n✅ All auth users have corresponding profiles!");
    }

    // Check 4: Check for admin users
    const adminUsers = profiles.filter((profile) => profile.role === "admin");
    console.log(`\n👑 Admin users: ${adminUsers.length}`);

    if (adminUsers.length === 0) {
      console.log(
        "⚠️  No admin users found. You may need to promote a user to admin."
      );
    } else {
      adminUsers.forEach((admin, index) => {
        console.log(
          `  ${index + 1}. ${
            admin.full_name || "No name"
          } (ID: ${admin.id.substring(0, 8)}...)`
        );
      });
    }

    // Check 5: Test RPC functions
    console.log("\n🔧 Testing RPC functions...");

    try {
      const { error: syncError } = await supabase.rpc(
        "sync_existing_auth_users"
      );
      if (syncError) {
        console.log(
          "❌ sync_existing_auth_users function not available:",
          syncError.message
        );
      } else {
        console.log("✅ sync_existing_auth_users function is available");
      }
    } catch (e) {
      console.log("❌ sync_existing_auth_users function error:", e.message);
    }

    try {
      // Test promote function with a dummy email (will fail but shows if function exists)
      const { error: promoteError } = await supabase.rpc(
        "promote_user_to_admin",
        {
          user_email: "test@example.com",
        }
      );
      if (promoteError && promoteError.message.includes("not found")) {
        console.log("✅ promote_user_to_admin function is available");
      } else if (promoteError) {
        console.log(
          "❌ promote_user_to_admin function error:",
          promoteError.message
        );
      }
    } catch (e) {
      console.log(
        "❌ promote_user_to_admin function not available:",
        e.message
      );
    }
  } catch (error) {
    console.error("❌ Error checking auth status:", error.message);
  }
}

checkAuthStatus();
