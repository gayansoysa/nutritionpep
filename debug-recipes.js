const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://utlurbqiknfctyfngjfl.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bHVyYnFpa25mY3R5Zm5namZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMjIzNjcsImV4cCI6MjA3MjU5ODM2N30.6Ca3CpUmDiEagJizK0_PW6iHEXTriUqy-P-Y5XrlK4w";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRecipeFunction() {
  console.log("Testing search_recipes function...");

  try {
    const { data, error } = await supabase.rpc("search_recipes", {
      search_query: "",
      limit_param: 5,
      offset_param: 0,
    });

    if (error) {
      console.error("Error calling search_recipes:", error);
    } else {
      console.log("Success! Found recipes:", data?.length || 0);
      console.log("Sample data:", data?.[0] || "No recipes found");
    }
  } catch (err) {
    console.error("Exception:", err);
  }
}

async function testRecipesTable() {
  console.log("Testing recipes table access...");

  try {
    const { data, error } = await supabase.from("recipes").select("*").limit(5);

    if (error) {
      console.error("Error accessing recipes table:", error);
    } else {
      console.log("Success! Found recipes in table:", data?.length || 0);
    }
  } catch (err) {
    console.error("Exception:", err);
  }
}

async function main() {
  await testRecipesTable();
  await testRecipeFunction();
}

main();
