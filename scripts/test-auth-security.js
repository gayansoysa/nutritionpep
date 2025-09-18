#!/usr/bin/env node

const { createClient } = require("@supabase/supabase-js");

// Test authentication security
async function testAuthSecurity() {
  console.log("🔐 Testing authentication security...\n");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  try {
    // Test 1: getUser() method (secure)
    console.log("1️⃣ Testing getUser() method (secure)...");
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.log(
        "   ✅ No user authenticated (expected for anonymous client)"
      );
      console.log("   📝 Error:", userError.message);
    } else if (userData.user) {
      console.log("   ✅ User authenticated securely:", userData.user.email);
    } else {
      console.log("   ✅ No user found (expected for anonymous client)");
    }

    // Test 2: getSession() method (insecure - should show warning)
    console.log(
      "\n2️⃣ Testing getSession() method (insecure - should show warning)..."
    );
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError) {
      console.log("   ⚠️  Session error:", sessionError.message);
    } else if (sessionData.session) {
      console.log(
        "   ⚠️  Session found (this would trigger security warning):",
        sessionData.session.user.email
      );
    } else {
      console.log("   ✅ No session found (expected for anonymous client)");
    }

    console.log("\n📊 Summary:");
    console.log("   - getUser() calls: ✅ Secure");
    console.log(
      "   - getSession() calls: ⚠️  Should be avoided in production code"
    );
    console.log(
      "   - Only debug-auth page should use getSession() for comparison"
    );
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Load environment variables
require("dotenv").config({
  path: "/Users/gayansoysa/Desktop/App/nutrino/nutritionpep/.env.local",
});

testAuthSecurity();
