import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  
  if (!code) {
    return NextResponse.json({ error: "Barcode code required" }, { status: 400 });
  }
  
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  try {
    // First, check if the food exists in our database
    const { data: localFood, error: localError } = await supabase
      .from("foods")
      .select("*")
      .eq("barcode", code)
      .limit(1)
      .single();
    
    if (localFood) {
      return NextResponse.json({ food: localFood, source: "local" });
    }
    
    // If not found locally, fetch from Open Food Facts API
    try {
      const offResponse = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
      const offData = await offResponse.json();
      
      if (offData.status === 1 && offData.product) {
        const product = offData.product;
        
        // Normalize Open Food Facts data to our format
        const normalizedFood = {
          id: "off_" + code,
          name: product.product_name || product.product_name_en || "Unknown Product",
          brand: product.brands || null,
          barcode: code,
          category: product.categories_tags?.[0]?.replace("en:", "") || null,
          serving_sizes: [
            { name: "100g", grams: 100 },
            ...(product.serving_size ? [{ name: `Serving (${product.serving_size})`, grams: parseFloat(product.serving_size) || 100 }] : [])
          ],
          nutrients_per_100g: {
            calories_kcal: parseFloat(product.nutriments?.["energy-kcal_100g"]) || 0,
            protein_g: parseFloat(product.nutriments?.["proteins_100g"]) || 0,
            carbs_g: parseFloat(product.nutriments?.["carbohydrates_100g"]) || 0,
            fat_g: parseFloat(product.nutriments?.["fat_100g"]) || 0,
            fiber_g: parseFloat(product.nutriments?.["fiber_100g"]) || null
          },
          source: "openfoodfacts",
          verified: false
        };
        
        // Insert into our database for future lookups
        const { data: insertedFood, error: insertError } = await supabase
          .from("foods")
          .insert(normalizedFood)
          .select()
          .single();
        
        if (insertError) {
          console.warn("Failed to cache OFF food:", insertError);
          // Return the normalized food even if we couldn't cache it
          return NextResponse.json({ food: normalizedFood, source: "openfoodfacts" });
        }
        
        return NextResponse.json({ food: insertedFood, source: "openfoodfacts" });
      }
    } catch (offError) {
      console.error("Error fetching from Open Food Facts:", offError);
    }
    
    // If not found in OFF either, return an error
    return NextResponse.json({ error: "Food not found" }, { status: 404 });
  } catch (error: any) {
    console.error("Error looking up barcode:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}