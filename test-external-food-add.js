/**
 * Test script to verify external food addition works without external_id column
 */

const https = require("https");
const http = require("http");

async function testExternalFoodAdd() {
  console.log("🧪 Testing external food addition...");

  const testFood = {
    name: "Test Eggs, Grade A, Large",
    brand: null,
    category: "Dairy and Egg Products",
    barcode: null,
    image_path: null,
    serving_sizes: [
      {
        name: "100g",
        grams: 100,
      },
    ],
    nutrients_per_100g: {
      calories_kcal: 148,
      protein_g: 12.4,
      carbs_g: 0.96,
      fat_g: 9.96,
      fiber_g: 0,
      sugar_g: 0,
      sodium_mg: 129,
      saturated_fat_g: 3.2,
      cholesterol_mg: 411,
      calcium_mg: 48,
      iron_mg: 1.67,
      vitamin_c_mg: 0,
    },
    source: "usda",
    verified: true,
    external_id: "748967",
    id: "748967",
  };

  try {
    const postData = JSON.stringify({ food: testFood });

    const options = {
      hostname: "localhost",
      port: 3001,
      path: "/api/foods/add-external",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const response = await new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          try {
            const result = JSON.parse(data);
            resolve({ status: res.statusCode, data: result });
          } catch (e) {
            resolve({ status: res.statusCode, data: data });
          }
        });
      });

      req.on("error", (error) => {
        reject(error);
      });

      req.write(postData);
      req.end();
    });

    console.log("Response status:", response.status);
    console.log("Response body:", JSON.stringify(response.data, null, 2));

    if (response.status === 200) {
      console.log("✅ Test passed! External food addition works.");
    } else {
      console.log("❌ Test failed:", response.data.error || response.data);
    }
  } catch (error) {
    console.error("❌ Test error:", error.message);
  }
}

testExternalFoodAdd();
