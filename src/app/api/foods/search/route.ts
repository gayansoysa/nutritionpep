import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
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
    const { searchParams } = new URL(request.url)
    
    const query = searchParams.get('q') || ''
    const page = parseInt(searchParams.get('page') || '0')
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20'), 50) // Max 50 items per page
    const category = searchParams.get('category')
    const sortBy = searchParams.get('sortBy') || 'relevance' // relevance, name, calories
    const sortOrder = searchParams.get('sortOrder') || 'asc'

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!query.trim()) {
      return NextResponse.json({ 
        data: [], 
        hasMore: false, 
        total: 0,
        page,
        pageSize 
      })
    }

    const offset = page * pageSize

    // Build the search query
    let searchQuery = supabase
      .from('foods')
      .select('*', { count: 'exact' })
      .range(offset, offset + pageSize - 1)

    // Check if query looks like a barcode (all digits)
    if (/^\d+$/.test(query)) {
      searchQuery = searchQuery.eq('barcode', query)
    } else {
      // Text search using full-text search or ilike
      searchQuery = searchQuery.or(`name.ilike.%${query}%,brand.ilike.%${query}%`)
    }

    // Add category filter if specified
    if (category) {
      searchQuery = searchQuery.eq('category', category)
    }

    // Add sorting
    switch (sortBy) {
      case 'name':
        searchQuery = searchQuery.order('name', { ascending: sortOrder === 'asc' })
        break
      case 'calories':
        searchQuery = searchQuery.order("nutrients_per_100g->>'calories_kcal'", { ascending: sortOrder === 'asc' })
        break
      case 'relevance':
      default:
        // For relevance, we'll order by name for now
        // In a production app, you might want to implement proper relevance scoring
        searchQuery = searchQuery.order('name', { ascending: true })
        break
    }

    const { data, error, count } = await searchQuery

    if (error) {
      console.error('Search error:', error)
      return NextResponse.json({ error: 'Search failed' }, { status: 500 })
    }

    const total = count || 0
    const hasMore = offset + pageSize < total

    // Transform data to match expected format
    const transformedData = (data || []).map(food => {
      const nutrients = food.nutrients_per_100g || {}
      return {
        id: food.id,
        name: food.name,
        brand: food.brand,
        category: food.category,
        barcode: food.barcode,
        image_url: food.image_path, // Note: using image_path from schema
        serving_sizes: food.serving_sizes || [{ name: "100g", grams: 100 }],
        nutrients_per_100g: {
          calories_kcal: nutrients.calories_kcal || 0,
          protein_g: nutrients.protein_g || 0,
          carbs_g: nutrients.carbs_g || 0,
          fat_g: nutrients.fat_g || 0,
          fiber_g: nutrients.fiber_g || 0,
        }
      }
    })

    return NextResponse.json({
      data: transformedData,
      hasMore,
      total,
      page,
      pageSize,
      query
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Get popular/trending foods
export async function POST(request: NextRequest) {
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
    const { type = 'popular', limit = 20 } = await request.json()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let query = supabase
      .from('foods')
      .select('*')
      .limit(limit)

    switch (type) {
      case 'popular':
        // Order by some popularity metric (you might want to add a popularity field)
        query = query.order('created_at', { ascending: false })
        break
      case 'recent':
        query = query.order('created_at', { ascending: false })
        break
      case 'trending':
        // For now, just return recent foods
        // In production, you might track usage statistics
        query = query.order('updated_at', { ascending: false })
        break
      default:
        query = query.order('name', { ascending: true })
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching foods:', error)
      return NextResponse.json({ error: 'Failed to fetch foods' }, { status: 500 })
    }

    // Transform data
    const transformedData = (data || []).map(food => {
      const nutrients = food.nutrients_per_100g || {}
      return {
        id: food.id,
        name: food.name,
        brand: food.brand,
        category: food.category,
        barcode: food.barcode,
        image_url: food.image_path, // Note: using image_path from schema
        serving_sizes: food.serving_sizes || [{ name: "100g", grams: 100 }],
        nutrients_per_100g: {
          calories_kcal: nutrients.calories_kcal || 0,
          protein_g: nutrients.protein_g || 0,
          carbs_g: nutrients.carbs_g || 0,
          fat_g: nutrients.fat_g || 0,
          fiber_g: nutrients.fiber_g || 0,
        }
      }
    })

    return NextResponse.json({ data: transformedData })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}