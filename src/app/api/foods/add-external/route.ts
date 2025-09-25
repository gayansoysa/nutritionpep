/**
 * Add External Food to Database Route
 * 
 * This route adds foods from external APIs to the local foods table
 * when users select them from search results.
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { NormalizedFood } from "@/lib/services/external-apis-enhanced";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { food }: { food: any } = body;



    if (!food || !food.name) {
      return NextResponse.json(
        { error: "Invalid food data provided - missing name" },
        { status: 400 }
      );
    }

    // For external foods, we need external_id and source, but let's be more flexible
    if (food.isExternal && (!food.external_id && !food.id)) {

      return NextResponse.json(
        { error: "External food must have external_id or id" },
        { status: 400 }
      );
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

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if food already exists in our database
    // First try to check by external_id if the column exists, then fall back to name/brand matching
    let existingFood = null;
    let checkError = null;
    let hasExternalIdColumn = false;
    
    // Use external_id if available, otherwise use the food's id as external_id
    const externalId = food.external_id || food.id;
    
    try {
      // First, try to check by external_id (preferred method)
      const { data: externalIdData, error: externalIdError } = await supabase
        .from('foods')
        .select('id')
        .eq('external_id', externalId)
        .limit(1)
        .single();
      
      if (!externalIdError) {
        existingFood = externalIdData;
        hasExternalIdColumn = true;
      } else if (externalIdError.code === 'PGRST204' || externalIdError.message?.includes("Could not find the 'external_id' column")) {
        // Column doesn't exist yet, fall back to name/brand matching
        console.log('external_id column not available, using name/brand matching');
        hasExternalIdColumn = false;
        
        const query = supabase
          .from('foods')
          .select('id')
          .eq('name', food.name);
        
        if (food.brand) {
          query.eq('brand', food.brand);
        }
        
        if (food.barcode) {
          query.eq('barcode', food.barcode);
        }
        
        const { data, error } = await query.limit(1).single();
        existingFood = data;
        checkError = error;
      } else if (externalIdError.code !== 'PGRST116') {
        // Some other error occurred
        checkError = externalIdError;
      }
    } catch (error) {
      console.error("Error checking existing food:", error);
      checkError = error;
    }

    if (checkError && (checkError as any).code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error("Error checking existing food:", checkError);
      return NextResponse.json(
        { error: "Database error" },
        { status: 500 }
      );
    }

    // If food already exists, return the existing food
    if (existingFood) {
      return NextResponse.json({
        success: true,
        food_id: existingFood.id,
        message: "Food already exists in database"
      });
    }

    // Map source to valid enum values
    let sourceValue: 'curated' | 'usda' | 'openfoodfacts' = 'curated';
    if (food.source) {
      const lowerSource = food.source.toLowerCase();
      if (lowerSource === 'usda') {
        sourceValue = 'usda';
      } else if (lowerSource === 'openfoodfacts' || lowerSource === 'off') {
        sourceValue = 'openfoodfacts';
      } else {
        sourceValue = 'curated'; // Default for external sources
      }
    }

    // Ensure nutrients_per_100g has the required structure
    const nutrients = food.nutrients_per_100g || {};
    const normalizedNutrients = {
      calories_kcal: nutrients.calories_kcal || 0,
      protein_g: nutrients.protein_g || 0,
      carbs_g: nutrients.carbs_g || 0,
      fat_g: nutrients.fat_g || 0,
      fiber_g: nutrients.fiber_g || 0,
      sugar_g: nutrients.sugar_g || 0,
      sodium_mg: nutrients.sodium_mg || 0,
      saturated_fat_g: nutrients.saturated_fat_g || 0,
      cholesterol_mg: nutrients.cholesterol_mg || 0,
      calcium_mg: nutrients.calcium_mg || 0,
      iron_mg: nutrients.iron_mg || 0,
      vitamin_c_mg: nutrients.vitamin_c_mg || 0
    };

    // Prepare food data for insertion
    const foodData: any = {
      name: food.name,
      brand: food.brand || null,
      category: food.category || null,
      barcode: food.barcode || null,
      image_path: food.image_url || null,
      serving_sizes: food.serving_sizes || [{ name: "100g", grams: 100 }],
      nutrients_per_100g: normalizedNutrients,
      source: sourceValue,
      verified: food.verified || false
    };

    // Add external_id only if the column is available (detected during the existence check)
    if (hasExternalIdColumn) {
      foodData.external_id = externalId;
    }

    // Insert the food into our database
    const { data: insertedFood, error: insertError } = await supabase
      .from('foods')
      .insert(foodData)
      .select('id')
      .single();

    if (insertError) {
      console.error("Error inserting food:", insertError);
      console.error("Food data that failed to insert:", JSON.stringify(foodData, null, 2));
      return NextResponse.json(
        { error: `Failed to add food to database: ${insertError.message}` },
        { status: 500 }
      );
    }

    // Track the addition for analytics
    try {
      await supabase
        .from('search_analytics')
        .insert({
          user_id: user.id,
          search_query: 'external_food_added',
          api_used: food.source || 'external',
          results_count: 1,
          selected_food_id: insertedFood.id,
          search_timestamp: new Date().toISOString()
        });
    } catch (analyticsError) {
      console.warn("Failed to track food addition analytics:", analyticsError);
      // Don't fail the main operation for analytics
    }

    return NextResponse.json({
      success: true,
      food_id: insertedFood.id,
      message: "Food added to database successfully"
    });

  } catch (error: any) {
    console.error("Add external food error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}