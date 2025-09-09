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
    const limit = parseInt(searchParams.get('limit') || '10')
    const type = searchParams.get('type') || 'recent' // 'recent' or 'smart'
    const mealType = searchParams.get('meal_type')
    const timeOfDay = searchParams.get('time_of_day')

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let data, error

    if (type === 'smart') {
      // Try to use the stored procedure first, fallback to direct query
      const { data: smartData, error: smartError } = await supabase.rpc('get_smart_food_suggestions', {
        p_meal_type: mealType,
        p_time_of_day: timeOfDay ? parseInt(timeOfDay) : null,
        p_limit: limit
      })
      
      if (smartError && smartError.code === '42883') {
        // Function doesn't exist, use direct query as fallback
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('recent_foods')
          .select(`
            id,
            food_id,
            last_used_at,
            usage_count,
            foods (
              name,
              brand,
              barcode,
              image_path,
              nutrients_per_100g
            )
          `)
          .eq('user_id', user.id)
          .order('last_used_at', { ascending: false })
          .limit(limit)
        
        if (fallbackError) {
          // If recent_foods table doesn't exist, return empty array
          if (fallbackError.code === '42P01') {
            data = []
            error = null
          } else {
            data = fallbackData
            error = fallbackError
          }
        } else {
          // Transform the data to match expected format
          data = fallbackData?.map(item => {
            const food = Array.isArray(item.foods) ? item.foods[0] : item.foods
            const nutrients = food?.nutrients_per_100g || {}
            return {
              id: item.id,
              food_id: item.food_id,
              name: food?.name,
              brand: food?.brand,
              barcode: food?.barcode,
              image_url: food?.image_path,
              last_used_at: item.last_used_at,
              usage_count: item.usage_count,
              calories_per_100g: nutrients.calories_kcal || 0,
              protein_per_100g: nutrients.protein_g || 0,
              carbs_per_100g: nutrients.carbs_g || 0,
              fat_per_100g: nutrients.fat_g || 0,
              fiber_per_100g: nutrients.fiber_g || 0,
              suggestion_score: item.usage_count * 0.4 + Math.random() * 0.6 // Simple scoring
            }
          }) || []
          error = null
        }
      } else {
        data = smartData
        error = smartError
      }
    } else {
      // Try to use the stored procedure first, fallback to direct query
      const { data: recentData, error: recentError } = await supabase.rpc('get_recent_foods', {
        p_limit: limit
      })
      
      if (recentError && recentError.code === '42883') {
        // Function doesn't exist, use direct query as fallback
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('recent_foods')
          .select(`
            id,
            food_id,
            last_used_at,
            usage_count,
            foods (
              name,
              brand,
              barcode,
              image_path,
              nutrients_per_100g
            )
          `)
          .eq('user_id', user.id)
          .order('last_used_at', { ascending: false })
          .limit(limit)
        
        if (fallbackError) {
          // If recent_foods table doesn't exist, return empty array
          if (fallbackError.code === '42P01') {
            data = []
            error = null
          } else {
            data = fallbackData
            error = fallbackError
          }
        } else {
          // Transform the data to match expected format
          data = fallbackData?.map(item => {
            const food = Array.isArray(item.foods) ? item.foods[0] : item.foods
            const nutrients = food?.nutrients_per_100g || {}
            return {
              id: item.id,
              food_id: item.food_id,
              name: food?.name,
              brand: food?.brand,
              barcode: food?.barcode,
              image_url: food?.image_path,
              last_used_at: item.last_used_at,
              usage_count: item.usage_count,
              calories_per_100g: nutrients.calories_kcal || 0,
              protein_per_100g: nutrients.protein_g || 0,
              carbs_per_100g: nutrients.carbs_g || 0,
              fat_per_100g: nutrients.fat_g || 0,
              fiber_per_100g: nutrients.fiber_g || 0
            }
          }) || []
          error = null
        }
      } else {
        data = recentData
        error = recentError
      }
    }

    if (error) {
      console.error('Error fetching recent foods:', error)
      return NextResponse.json({ error: 'Failed to fetch recent foods' }, { status: 500 })
    }

    return NextResponse.json({ data: data || [] })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
    const { food_id } = await request.json()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!food_id) {
      return NextResponse.json({ error: 'food_id is required' }, { status: 400 })
    }

    // Try to use the stored procedure first, fallback to direct query
    const { error: rpcError } = await supabase.rpc('update_recent_food', {
      p_food_id: food_id
    })

    if (rpcError && rpcError.code === '42883') {
      // Function doesn't exist, use direct upsert as fallback
      const { error: upsertError } = await supabase
        .from('recent_foods')
        .upsert({
          user_id: user.id,
          food_id: food_id,
          last_used_at: new Date().toISOString(),
          usage_count: 1
        }, {
          onConflict: 'user_id,food_id',
          ignoreDuplicates: false
        })

      if (upsertError) {
        // If recent_foods table doesn't exist, just return success for now
        if (upsertError.code === '42P01') {
          console.warn('recent_foods table does not exist yet')
          return NextResponse.json({ success: true, warning: 'Recent foods tracking not available yet' })
        }
        console.error('Error updating recent food (fallback):', upsertError)
        return NextResponse.json({ error: 'Failed to update recent food' }, { status: 500 })
      }
    } else if (rpcError) {
      console.error('Error updating recent food:', rpcError)
      return NextResponse.json({ error: 'Failed to update recent food' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}