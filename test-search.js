const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://utlurbqiknfctyfngjfl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bHVyYnFpa25mY3R5Zm5namZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMjIzNjcsImV4cCI6MjA3MjU5ODM2N30.6Ca3CpUmDiEagJizK0_PW6iHEXTriUqy-P-Y5XrlK4w"
);

async function testSearchFlow() {
  try {
    console.log("Testing search flow...");

    // Test local search first
    console.log('\n1. Testing local search for "milk"...');
    const { data: localData, error: localError } = await supabase.rpc(
      "search_foods",
      {
        q: "milk",
        max_results: 10,
      }
    );

    console.log("Local search results:", localData?.length || 0, "foods");
    console.log("Local search error:", localError);

    // Test external API directly
    console.log("\n2. Testing external API...");
    const response = await fetch(
      "http://localhost:3000/api/foods/search-external?q=milk&limit=5"
    );
    const externalData = await response.json();

    console.log("External API status:", response.status);
    console.log(
      "External API results:",
      externalData.foods?.length || 0,
      "foods"
    );

    if (externalData.foods && externalData.foods.length > 0) {
      console.log("First external food:", externalData.foods[0].name);
    }

    if (!response.ok) {
      console.log("External API error:", externalData.error);
    }
  } catch (error) {
    console.error("Test error:", error);
  }
}

testSearchFlow();
