/**
 * Admin Food Import Route
 * 
 * This route allows admins to import foods from external APIs into the database.
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { NormalizedFood } from "@/lib/services/external-apis";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { foods }: { foods: NormalizedFood[] } = body;

    if (!foods || !Array.isArray(foods) || foods.length === 0) {
      return NextResponse.json(
        { error: "No foods provided for import" },
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

    // Check if user is authenticated and is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "admin" && profile.role !== "moderator")) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const importResults = {
      imported: 0,
      skipped: 0,
      errors: 0,
      details: [] as Array<{ food: string; status: string; message?: string }>
    };

    // Process each food
    for (const food of foods) {
      try {
        // Check if food already exists by external_id or barcode
        let existingFood = null;
        
        if (food.barcode) {
          const { data } = await supabase
            .from("foods")
            .select("id, name")
            .eq("barcode", food.barcode)
            .single();
          existingFood = data;
        }

        if (!existingFood && food.external_id) {
          // Check by external_id in a custom field or by name+source combination
          const { data } = await supabase
            .from("foods")
            .select("id, name")
            .eq("name", food.name)
            .eq("source", food.source.toLowerCase())
            .single();
          existingFood = data;
        }

        if (existingFood) {
          importResults.skipped++;
          importResults.details.push({
            food: food.name,
            status: "skipped",
            message: "Food already exists in database"
          });
          continue;
        }

        // Calculate nutrients per serving for the first serving size
        const firstServing = food.serving_sizes[0];
        const nutrientsPerServing = {
          calories_kcal: (food.nutrients_per_100g.calories_kcal * firstServing.grams) / 100,
          protein_g: (food.nutrients_per_100g.protein_g * firstServing.grams) / 100,
          carbs_g: (food.nutrients_per_100g.carbs_g * firstServing.grams) / 100,
          fat_g: (food.nutrients_per_100g.fat_g * firstServing.grams) / 100,
          fiber_g: food.nutrients_per_100g.fiber_g ? (food.nutrients_per_100g.fiber_g * firstServing.grams) / 100 : undefined,
          sugar_g: food.nutrients_per_100g.sugar_g ? (food.nutrients_per_100g.sugar_g * firstServing.grams) / 100 : undefined,
          sodium_mg: food.nutrients_per_100g.sodium_mg ? (food.nutrients_per_100g.sodium_mg * firstServing.grams) / 100 : undefined,
        };

        // Insert the food
        const { error } = await supabase.from("foods").insert({
          name: food.name,
          brand: food.brand || null,
          category: food.category || null,
          barcode: food.barcode || null,
          source: food.source.toLowerCase(),
          verified: food.verified || false,
          serving_sizes: food.serving_sizes,
          nutrients_per_100g: food.nutrients_per_100g,
          nutrients_per_serving: nutrientsPerServing,
          // Store external_id in a metadata field if needed
          // external_metadata: { external_id: food.external_id, api_source: food.source }
        });

        if (error) {
          throw error;
        }

        importResults.imported++;
        importResults.details.push({
          food: food.name,
          status: "imported",
          message: `Successfully imported from ${food.source}`
        });

      } catch (error: any) {
        console.error(`Error importing food ${food.name}:`, error);
        importResults.errors++;
        importResults.details.push({
          food: food.name,
          status: "error",
          message: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      results: importResults
    });

  } catch (error: any) {
    console.error("Food import error:", error);
    return NextResponse.json(
      { error: "Import failed", message: error.message },
      { status: 500 }
    );
  }
}