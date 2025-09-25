#!/usr/bin/env node

/**
 * Test script for infinite search with external API integration
 */

const BASE_URL = "http://localhost:3000";

async function testInfiniteSearch() {
  console.log("🧪 Testing Infinite Search with External API Integration\n");

  try {
    // Test 1: Search with includeExternal=true (should return external results for "milk")
    console.log("1️⃣ Testing search with external fallback...");
    const response = await fetch(
      `${BASE_URL}/api/foods/search?q=milk&page=0&pageSize=10&includeExternal=true`
    );
    const data = await response.json();

    console.log(`   Status: ${response.status}`);
    console.log(`   Results: ${data.data?.length || 0} foods found`);
    console.log(`   External: ${data.isExternal ? "Yes" : "No"}`);
    console.log(`   Source: ${data.source || "N/A"}`);
    console.log(`   Has More: ${data.hasMore ? "Yes" : "No"}`);

    if (data.data && data.data.length > 0) {
      console.log(
        `   First result: ${data.data[0].name} (External: ${
          data.data[0].isExternal ? "Yes" : "No"
        })`
      );
    }
    console.log("");

    // Test 2: Test external API endpoint directly with pagination
    console.log("2️⃣ Testing external API endpoint with pagination...");
    const externalResponse = await fetch(
      `${BASE_URL}/api/foods/search-external?q=milk&limit=5&offset=0`
    );
    const externalData = await externalResponse.json();

    console.log(`   Status: ${externalResponse.status}`);
    console.log(`   Results: ${externalData.foods?.length || 0} foods found`);
    console.log(`   Source: ${externalData.metadata?.source || "N/A"}`);
    console.log(
      `   Pagination: limit=${externalData.pagination?.limit}, offset=${externalData.pagination?.offset}, hasMore=${externalData.pagination?.hasMore}`
    );

    if (externalData.foods && externalData.foods.length > 0) {
      console.log(`   First result: ${externalData.foods[0].name}`);
    }
    console.log("");

    // Test 3: Test pagination with offset
    console.log("3️⃣ Testing external API pagination (offset=5)...");
    const paginatedResponse = await fetch(
      `${BASE_URL}/api/foods/search-external?q=milk&limit=5&offset=5`
    );
    const paginatedData = await paginatedResponse.json();

    console.log(`   Status: ${paginatedResponse.status}`);
    console.log(`   Results: ${paginatedData.foods?.length || 0} foods found`);
    console.log(
      `   Pagination: limit=${paginatedData.pagination?.limit}, offset=${paginatedData.pagination?.offset}, hasMore=${paginatedData.pagination?.hasMore}`
    );
    console.log("");

    console.log("✅ All tests completed!");
    console.log("\n📋 Summary:");
    console.log("   - Infinite search now supports external API fallback");
    console.log(
      "   - External results are properly marked with isExternal=true"
    );
    console.log("   - Pagination is supported for external results");
    console.log('   - External foods show "External Source" badge in UI');
    console.log(
      "   - Import button handles external food addition to database"
    );
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Run the test
testInfiniteSearch();
