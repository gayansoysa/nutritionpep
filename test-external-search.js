#!/usr/bin/env node

/**
 * Test External Food Search
 *
 * This script tests the external food search functionality
 * to verify that the API credentials fallback is working.
 */

const http = require("http");

async function testExternalSearch() {
  console.log("🧪 Testing External Food Search Functionality\n");

  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 3000,
      path: "/api/foods/search-external?q=apple&limit=5&offset=0",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    };

    const req = http.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        console.log(`📊 Response Status: ${res.statusCode}`);
        console.log(`📋 Response Headers:`, res.headers);

        try {
          const result = JSON.parse(data);
          console.log(`📦 Response Data:`, JSON.stringify(result, null, 2));

          if (
            res.statusCode === 200 &&
            result.foods &&
            result.foods.length > 0
          ) {
            console.log(
              `✅ External search successful! Found ${result.foods.length} foods.`
            );
            console.log(`🔍 First food:`, result.foods[0]);
          } else if (
            res.statusCode === 200 &&
            result.foods &&
            result.foods.length === 0
          ) {
            console.log(
              `⚠️  External search returned no results, but API is working.`
            );
          } else {
            console.log(
              `❌ External search failed with status ${res.statusCode}`
            );
          }
        } catch (error) {
          console.log(`❌ Failed to parse response:`, error.message);
          console.log(`📄 Raw response:`, data);
        }

        resolve();
      });
    });

    req.on("error", (error) => {
      console.error(`❌ Request failed:`, error.message);
      resolve();
    });

    req.setTimeout(10000, () => {
      console.error(`❌ Request timed out`);
      req.destroy();
      resolve();
    });

    req.end();
  });
}

async function main() {
  console.log("🚀 Starting External Food Search Test\n");

  // Wait a moment for the server to be ready
  console.log("⏳ Waiting for server to be ready...");
  await new Promise((resolve) => setTimeout(resolve, 2000));

  await testExternalSearch();

  console.log("\n🏁 Test completed");
}

main().catch(console.error);
