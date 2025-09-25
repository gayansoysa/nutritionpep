#!/usr/bin/env node

/**
 * Test Add External Food
 *
 * This script tests the add external food functionality
 * to verify that foods can be added to the database.
 */

const http = require("http");

async function testAddExternal() {
  console.log("🧪 Testing Add External Food Functionality\n");

  // Sample food data from the search results
  const testFood = {
    id: "usda_2709215",
    name: "Apple, raw",
    category: "Apples",
    serving_sizes: [
      {
        name: "100g",
        grams: 100,
      },
    ],
    nutrients_per_100g: {
      calories_kcal: 61,
      protein_g: 0.17,
      carbs_g: 14.8,
      fat_g: 0.15,
      fiber_g: 2.1,
      sugar_g: 12.08,
      sodium_mg: 0,
      saturated_fat_g: 0.028,
      cholesterol_mg: 0,
      calcium_mg: 5,
      iron_mg: 0.03,
      vitamin_c_mg: 4.6,
    },
    source: "USDA",
    external_id: "2709215",
    verified: true,
  };

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ food: testFood });

    const options = {
      hostname: "localhost",
      port: 3000,
      path: "/api/foods/add-external",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
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

          if (res.statusCode === 200 || res.statusCode === 201) {
            console.log(`✅ Add external food successful!`);
            if (result.food_id) {
              console.log(`🆔 Food ID: ${result.food_id}`);
            }
          } else if (res.statusCode === 401) {
            console.log(`🔐 Authentication required (expected for this test)`);
          } else {
            console.log(
              `❌ Add external food failed with status ${res.statusCode}`
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

    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log("🚀 Starting Add External Food Test\n");

  // Wait a moment for the server to be ready
  console.log("⏳ Waiting for server to be ready...");
  await new Promise((resolve) => setTimeout(resolve, 2000));

  await testAddExternal();

  console.log("\n🏁 Test completed");
  console.log(
    "\n📝 Note: Authentication errors are expected since we're not providing auth cookies."
  );
  console.log(
    "   The important thing is that we don't see database schema errors."
  );
}

main().catch(console.error);
