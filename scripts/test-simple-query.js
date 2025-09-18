#!/usr/bin/env node

/**
 * Simple test to check if we can query the profiles table
 */

const { createClient } = require("@supabase/supabase-js");

// Load environment variables
require("dotenv").config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSimpleQuery() {
  console.log("🧪 Testing simple profile query...\n");

  try {
    // Test with count first (simpler query)
    console.log("1️⃣ Testing count query...");
    const { count, error: countError } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.log("❌ Count query failed:", countError.message);
      console.log("Error details:", countError);
      return;
    }
    console.log(`✅ Count query successful: ${count} profiles found`);

    // Test simple select
    console.log("\n2️⃣ Testing simple select...");
    const { data, error } = await supabase
      .from("profiles")
      .select("id, role")
      .limit(1);

    if (error) {
      console.log("❌ Select query failed:", error.message);
      console.log("Error details:", error);
      return;
    }
    console.log("✅ Select query successful:", data);

    // Test auth status
    console.log("\n3️⃣ Testing auth status...");
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.log("⚠️  Auth error:", userError.message);
    } else if (userData.user) {
      console.log("✅ User authenticated:", userData.user.email);
    } else {
      console.log("ℹ️  No authenticated user (expected)");
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error("Stack trace:", error.stack);
  }
}

testSimpleQuery();
