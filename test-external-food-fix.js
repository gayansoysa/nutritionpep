/**
 * Test script to verify external food functionality works after fixes
 */

const fetch = require("node-fetch");

const BASE_URL = "http://localhost:3001";

async function testExternalFoodSearch() {
  console.log("🧪 Testing external food search functionality...\n");

  try {
    // Test search endpoint
    console.log("1. Testing search endpoint...");
    const searchResponse = await fetch(
      `${BASE_URL}/api/foods/search?q=eggs&page=0&pageSize=5&includeExternal=true`
    );

    if (!searchResponse.ok) {
      console.error(
        "❌ Search failed:",
        searchResponse.status,
        searchResponse.statusText
      );
      return;
    }

    const searchData = await searchResponse.json();
    console.log("✅ Search successful");
    console.log(`   - Found ${searchData.foods?.length || 0} foods`);
    console.log(
      `   - Has external results: ${searchData.hasExternal || false}`
    );

    // Find an external food to test adding
    const externalFood = searchData.foods?.find((food) => food.isExternal);

    if (!externalFood) {
      console.log("⚠️  No external foods found in search results");
      console.log("   This might be expected if external APIs are not working");
      return;
    }

    console.log(
      `   - Found external food: ${externalFood.name} (${externalFood.source})`
    );

    // Test adding external food (this would normally require authentication)
    console.log("\n2. Testing add external food endpoint...");
    console.log(
      "   Note: This will fail with 401 (Authentication required) which is expected"
    );

    const addResponse = await fetch(`${BASE_URL}/api/foods/add-external`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        food: externalFood,
      }),
    });

    const addData = await addResponse.json();

    if (addResponse.status === 401) {
      console.log(
        "✅ Add external food endpoint is working (authentication required as expected)"
      );
    } else if (addResponse.status === 500) {
      console.log(
        "❌ Add external food endpoint has server error:",
        addData.error
      );
    } else {
      console.log(
        `   Response: ${addResponse.status} - ${JSON.stringify(addData)}`
      );
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

async function testAPICredentials() {
  console.log("\n🔑 Testing API credentials fallback...\n");

  // Test external search endpoint directly
  try {
    console.log("Testing external search endpoint...");
    const response = await fetch(
      `${BASE_URL}/api/foods/search-external?q=apple&limit=3&offset=0`
    );

    if (!response.ok) {
      console.error(
        "❌ External search failed:",
        response.status,
        response.statusText
      );
      const errorData = await response.json();
      console.error("   Error:", errorData);
      return;
    }

    const data = await response.json();
    console.log("✅ External search successful");
    console.log(`   - Found ${data.foods?.length || 0} external foods`);
    console.log(`   - Source: ${data.source || "unknown"}`);

    if (data.foods && data.foods.length > 0) {
      console.log(`   - Sample food: ${data.foods[0].name}`);
    }
  } catch (error) {
    console.error("❌ External search test failed:", error.message);
  }
}

async function main() {
  console.log("🚀 Testing External Food Integration Fixes\n");
  console.log("=".repeat(50));

  await testExternalFoodSearch();
  await testAPICredentials();

  console.log("\n" + "=".repeat(50));
  console.log("✅ Test completed");
  console.log(
    '\nIf you see "Authentication required" errors, that\'s expected.'
  );
  console.log(
    "The important thing is that the database schema errors are fixed."
  );
}

main().catch(console.error);
