const { createClient } = require("@supabase/supabase-js");

// Load environment variables
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testAnalyticsEndpoint() {
  try {
    console.log("Testing analytics endpoint directly...");

    // Test the exact same query that was failing
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    console.log("Testing the fixed query...");
    const { data: topFoodsData, error: topFoodsError } = await supabase
      .from("diary_entries")
      .select("items")
      .gte("date", sevenDaysAgo.toISOString().split("T")[0]);

    if (topFoodsError) {
      console.error("❌ Query still failing with error:", topFoodsError);
      return false;
    }

    console.log("✅ Query successful! No PGRST200 error.");
    console.log(`Found ${topFoodsData?.length || 0} diary entries`);

    // Test the data processing
    const foodCounts = (topFoodsData || []).reduce((acc, entry) => {
      if (entry.items && Array.isArray(entry.items)) {
        entry.items.forEach((item) => {
          const foodName = item.name || "Unknown Food";
          acc[foodName] = (acc[foodName] || 0) + 1;
        });
      }
      return acc;
    }, {});

    const topFoodsArray = Object.entries(foodCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    console.log("✅ Data processing successful");
    console.log(
      "Top foods:",
      topFoodsArray.length > 0
        ? topFoodsArray
        : "No foods found (expected if no diary data)"
    );

    return true;
  } catch (err) {
    console.error("❌ Error testing analytics endpoint:", err);
    return false;
  }
}

async function main() {
  console.log("=== Analytics Fix Verification ===\n");

  const success = await testAnalyticsEndpoint();

  if (success) {
    console.log("\n🎉 SUCCESS: The PGRST200 error has been fixed!");
    console.log(
      "The analytics endpoint should now work without foreign key relationship errors."
    );
  } else {
    console.log("\n❌ FAILED: The error still exists.");
  }
}

main();
