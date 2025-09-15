import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/recipes - Search and list recipes
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseRouteHandlerClient();

    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Session error:", sessionError);
      return NextResponse.json({ error: "Authentication error" }, { status: 401 });
    }

    if (!session) {
      console.log("No session found in GET /api/recipes");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category");
    const cuisine = searchParams.get("cuisine");
    const difficulty = searchParams.get("difficulty");
    const maxTime = searchParams.get("maxTime") ? parseInt(searchParams.get("maxTime")!) : null;
    const minRating = searchParams.get("minRating") ? parseFloat(searchParams.get("minRating")!) : null;
    const tags = searchParams.get("tags")?.split(",").filter(Boolean);
    const visibility = searchParams.get("visibility");
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    console.log("GET recipes - Session found for user:", session.user.id);

    const { data: recipes, error } = await supabase.rpc("search_recipes", {
      search_query: search,
      category_filter: category,
      cuisine_filter: cuisine,
      difficulty_filter: difficulty,
      max_time_minutes: maxTime,
      min_rating: minRating,
      tags_filter: tags,
      visibility_filter: visibility,
      user_id_filter: userId,
      limit_param: limit,
      offset_param: offset
    });

    if (error) {
      console.error("Error fetching recipes:", error);
      // If function doesn't exist, return empty array
      if (error.code === "42883") {
        return NextResponse.json({ recipes: [] });
      }
      return NextResponse.json({ error: "Failed to fetch recipes" }, { status: 500 });
    }

    return NextResponse.json({ recipes: recipes || [] });
  } catch (error) {
    console.error("Error in recipes GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/recipes - Create new recipe
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseRouteHandlerClient();

    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Session error:", sessionError);
      return NextResponse.json({ error: "Authentication error" }, { status: 401 });
    }

    if (!session) {
      console.log("No session found in POST /api/recipes");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("POST recipes - Session found for user:", session.user.id);

    const body = await request.json();
    const {
      name,
      description,
      instructions,
      prep_time_minutes,
      cook_time_minutes,
      servings,
      difficulty,
      visibility,
      image_url,
      tags,
      category,
      cuisine,
      source_url,
      notes,
      ingredients
    } = body;

    // Validate required fields
    if (!name || !servings) {
      return NextResponse.json({ 
        error: "Name and servings are required" 
      }, { status: 400 });
    }

    // Create recipe
    const { data: recipe, error: recipeError } = await supabase
      .from("recipes")
      .insert({
        user_id: session.user.id,
        name,
        description,
        instructions,
        prep_time_minutes,
        cook_time_minutes,
        servings,
        difficulty: difficulty || "easy",
        visibility: visibility || "private",
        image_url,
        tags: tags || [],
        category,
        cuisine,
        source_url,
        notes
      })
      .select()
      .single();

    if (recipeError) {
      console.error("Error creating recipe:", recipeError);
      return NextResponse.json({ error: "Failed to create recipe" }, { status: 500 });
    }

    // Add ingredients if provided
    if (ingredients && Array.isArray(ingredients) && ingredients.length > 0) {
      for (let i = 0; i < ingredients.length; i++) {
        const ingredient = ingredients[i];
        
        try {
          await supabase.rpc("add_recipe_ingredient", {
            recipe_id_param: recipe.id,
            food_id_param: ingredient.food_id || null,
            name_param: ingredient.name,
            amount_param: ingredient.amount,
            unit_param: ingredient.unit,
            grams_param: ingredient.grams,
            preparation_param: ingredient.preparation || null,
            notes_param: ingredient.notes || null,
            optional_param: ingredient.optional || false,
            sort_order_param: i
          });
        } catch (ingredientError) {
          console.error("Error adding ingredient:", ingredientError);
          // Continue with other ingredients
        }
      }
    }

    // Fetch the complete recipe with ingredients
    const { data: completeRecipe, error: fetchError } = await supabase.rpc(
      "get_recipe_with_ingredients",
      { recipe_id_param: recipe.id }
    );

    if (fetchError) {
      console.error("Error fetching complete recipe:", fetchError);
      return NextResponse.json({ recipe });
    }

    return NextResponse.json({ recipe: completeRecipe[0] || recipe });
  } catch (error) {
    console.error("Error in recipes POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}