import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: "", ...options })
          },
        },
      }
    )

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'Food ID is required' }, { status: 400 })
    }

    // Fetch the food by ID
    const { data: food, error } = await supabase
      .from('foods')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching food:', error)
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Food not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to fetch food' }, { status: 500 })
    }

    // Transform data to match expected format
    const nutrients = food.nutrients_per_100g || {}
    const transformedFood = {
      id: food.id,
      name: food.name,
      brand: food.brand,
      category: food.category,
      barcode: food.barcode,
      image_url: food.image_path,
      serving_sizes: food.serving_sizes || [{ name: "100g", grams: 100 }],
      nutrients_per_100g: {
        calories_kcal: nutrients.calories_kcal || 0,
        protein_g: nutrients.protein_g || 0,
        carbs_g: nutrients.carbs_g || 0,
        fat_g: nutrients.fat_g || 0,
        fiber_g: nutrients.fiber_g || 0,
      }
    }

    return NextResponse.json({ food: transformedFood })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}