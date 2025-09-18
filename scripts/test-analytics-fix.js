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

async function testAnalyticsFix() {
  try {
    console.log("Testing analytics query fix...");

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Test the fixed query - get diary entries with items
    console.log("Testing diary entries query...");
    const { data: topFoodsData, error: topFoodsError } = await supabase
      .from("diary_entries")
      .select("items")
      .gte("date", sevenDaysAgo.toISOString().split("T")[0]);

    if (topFoodsError) {
      console.error("Query still failing:", topFoodsError);
      return;
    }

    console.log(
      "Query successful! Found",
      topFoodsData?.length || 0,
      "diary entries"
    );

    // Test processing the data
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

    console.log("Top foods processed successfully:");
    console.log(topFoodsArray);

    console.log("✅ Analytics fix is working correctly!");
  } catch (err) {
    console.error("Error testing analytics fix:", err);
  }
}

testAnalyticsFix();
