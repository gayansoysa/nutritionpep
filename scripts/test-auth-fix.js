#!/usr/bin/env node

/**
 * Script to test authentication after fixing the deprecated auth helpers
 */

const { createClient } = require("@supabase/supabase-js");

// Load environment variables
require("dotenv").config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("❌ Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAuth() {
  console.log("🧪 Testing authentication after fixes...\n");

  try {
    // Test 1: Check if we can connect to Supabase
    console.log("1️⃣ Testing Supabase connection...");
    const { data, error } = await supabase
      .from("profiles")
      .select("count")
      .limit(1);
    if (error) {
      console.log("❌ Connection failed:", error.message);
      return;
    }
    console.log("✅ Supabase connection successful");

    // Test 2: Test auth functions
    console.log("\n2️⃣ Testing auth functions...");

    // Test getUser (should work without authentication)
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.log(
        "⚠️  getUser() returned error (expected if not signed in):",
        userError.message
      );
    } else if (userData.user) {
      console.log("✅ getUser() returned user:", userData.user.email);
    } else {
      console.log("ℹ️  getUser() returned no user (not signed in)");
    }

    // Test 3: Check RPC functions are available
    console.log("\n3️⃣ Testing RPC functions...");

    try {
      const { error: syncError } = await supabase.rpc(
        "sync_existing_auth_users"
      );
      if (syncError && syncError.message.includes("permission denied")) {
        console.log(
          "✅ sync_existing_auth_users function exists (permission denied expected)"
        );
      } else if (syncError) {
        console.log("⚠️  sync_existing_auth_users error:", syncError.message);
      } else {
        console.log(
          "✅ sync_existing_auth_users function executed successfully"
        );
      }
    } catch (e) {
      console.log(
        "❌ sync_existing_auth_users function not available:",
        e.message
      );
    }

    // Test 4: Check profiles table structure
    console.log("\n4️⃣ Testing profiles table...");
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, role, created_at")
      .limit(5);

    if (profileError) {
      console.log("❌ Profiles table error:", profileError.message);
    } else {
      console.log(
        `✅ Profiles table accessible, found ${profiles.length} profiles`
      );
      if (profiles.length > 0) {
        console.log("📋 Sample profiles:");
        profiles.forEach((profile, index) => {
          console.log(
            `  ${index + 1}. ${profile.full_name || "No name"} (${
              profile.role
            }) - ID: ${profile.id.substring(0, 8)}...`
          );
        });
      }
    }

    console.log("\n🎉 Authentication system test completed!");
    console.log("\n📝 Next steps:");
    console.log("1. Start your app: npm run dev");
    console.log("2. Go to http://localhost:3000/login");
    console.log("3. Sign in with: emailziggi@gmail.com");
    console.log("4. Test /debug-auth page");
    console.log("5. Test /admin/users page");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testAuth();
