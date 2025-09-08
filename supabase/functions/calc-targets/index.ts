import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CalculateTargetsRequest {
  user_id: string;
  date?: string;
}

interface BiometricsData {
  weight_kg: number;
  height_cm: number;
  body_fat_pct?: number;
  age?: number;
  gender?: 'male' | 'female';
}

interface GoalsData {
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal_type: 'lose' | 'maintain' | 'gain';
  pace: 'slow' | 'moderate' | 'fast';
  protein_g_per_kg: number;
  fat_g_per_kg: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { user_id, date = new Date().toISOString().slice(0, 10) }: CalculateTargetsRequest = await req.json()

    // Get latest biometrics
    const { data: biometrics, error: biometricsError } = await supabaseClient
      .from('biometrics')
      .select('*')
      .eq('user_id', user_id)
      .order('ts', { ascending: false })
      .limit(1)
      .single()

    if (biometricsError || !biometrics) {
      throw new Error('No biometrics data found')
    }

    // Get goals
    const { data: goals, error: goalsError } = await supabaseClient
      .from('goals')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (goalsError || !goals) {
      throw new Error('No goals data found')
    }

    // Get profile for age/gender if available
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('full_name, created_at')
      .eq('id', user_id)
      .single()

    // Calculate age from profile creation (rough estimate)
    const age = profile?.created_at ? 
      Math.max(18, new Date().getFullYear() - new Date(profile.created_at).getFullYear()) : 25

    // Assume gender based on name or default to male for higher BMR
    const gender: 'male' | 'female' = 'male' // Could be enhanced with profile data

    const targets = calculateTargets(biometrics, goals, age, gender)

    // Insert or update targets
    const { error: targetsError } = await supabaseClient
      .from('targets')
      .upsert({
        user_id,
        date,
        ...targets,
        method: targets.method,
        meta: targets.meta
      })

    if (targetsError) {
      throw targetsError
    }

    return new Response(
      JSON.stringify({ success: true, targets }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error calculating targets:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})

function calculateTargets(biometrics: BiometricsData, goals: GoalsData, age: number, gender: 'male' | 'female') {
  const { weight_kg, height_cm, body_fat_pct } = biometrics
  const { activity_level, goal_type, pace, protein_g_per_kg, fat_g_per_kg } = goals

  // Calculate BMR
  let bmr: number
  let method: string

  if (body_fat_pct && body_fat_pct > 0) {
    // Katch-McArdle (more accurate with body fat)
    const leanMass = weight_kg * (1 - body_fat_pct / 100)
    bmr = 370 + (21.6 * leanMass)
    method = 'katch_mcardle'
  } else {
    // Mifflin-St Jeor
    if (gender === 'male') {
      bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age) + 5
    } else {
      bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age) - 161
    }
    method = 'mifflin_st_jeor'
  }

  // Activity multipliers
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  }

  const tdee = bmr * activityMultipliers[activity_level]

  // Goal adjustments
  let goalAdjustment = 0
  if (goal_type === 'lose') {
    goalAdjustment = pace === 'slow' ? -0.1 : pace === 'moderate' ? -0.2 : -0.25
  } else if (goal_type === 'gain') {
    goalAdjustment = pace === 'slow' ? 0.05 : pace === 'moderate' ? 0.15 : 0.2
  }

  const targetCalories = Math.round(tdee * (1 + goalAdjustment))

  // Calculate macros
  const proteinG = Math.round(weight_kg * protein_g_per_kg)
  const fatG = Math.round(weight_kg * fat_g_per_kg)
  
  // Carbs from remaining calories
  const proteinCals = proteinG * 4
  const fatCals = fatG * 9
  const remainingCals = targetCalories - proteinCals - fatCals
  const carbsG = Math.max(0, Math.round(remainingCals / 4))

  // Fiber target: 14g per 1000 kcal
  const fiberG = Math.round((targetCalories / 1000) * 14)

  return {
    calories_kcal: targetCalories,
    protein_g: proteinG,
    carbs_g: carbsG,
    fat_g: fatG,
    fiber_g: fiberG,
    method,
    meta: {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      activity_multiplier: activityMultipliers[activity_level],
      goal_adjustment: goalAdjustment,
      age,
      gender
    }
  }
}