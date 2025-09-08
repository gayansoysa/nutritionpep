import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExportRequest {
  user_id: string;
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

    const { user_id }: ExportRequest = await req.json()

    if (!user_id) {
      throw new Error('User ID is required')
    }

    // Collect all user data
    const userData: any = {
      export_date: new Date().toISOString(),
      user_id,
      data: {}
    }

    // Get profile
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single()

    if (profile) {
      userData.data.profile = profile
    }

    // Get biometrics
    const { data: biometrics } = await supabaseClient
      .from('biometrics')
      .select('*')
      .eq('user_id', user_id)
      .order('ts', { ascending: false })

    if (biometrics) {
      userData.data.biometrics = biometrics
    }

    // Get goals
    const { data: goals } = await supabaseClient
      .from('goals')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })

    if (goals) {
      userData.data.goals = goals
    }

    // Get targets
    const { data: targets } = await supabaseClient
      .from('targets')
      .select('*')
      .eq('user_id', user_id)
      .order('date', { ascending: false })

    if (targets) {
      userData.data.targets = targets
    }

    // Get diary entries
    const { data: diaryEntries } = await supabaseClient
      .from('diary_entries')
      .select('*')
      .eq('user_id', user_id)
      .order('date', { ascending: false })

    if (diaryEntries) {
      userData.data.diary_entries = diaryEntries
    }

    // Get analytics events (anonymized)
    const { data: analyticsEvents } = await supabaseClient
      .from('analytics_events')
      .select('name, props, ts')
      .eq('user_id', user_id)
      .order('ts', { ascending: false })

    if (analyticsEvents) {
      userData.data.analytics_events = analyticsEvents
    }

    // Create JSON file
    const jsonData = JSON.stringify(userData, null, 2)
    const fileName = `nutritionpep-data-export-${user_id}-${new Date().toISOString().slice(0, 10)}.json`

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('exports')
      .upload(`${user_id}/${fileName}`, jsonData, {
        contentType: 'application/json',
        upsert: true
      })

    if (uploadError) {
      throw uploadError
    }

    // Create signed URL (valid for 24 hours)
    const { data: signedUrlData, error: signedUrlError } = await supabaseClient.storage
      .from('exports')
      .createSignedUrl(`${user_id}/${fileName}`, 86400)

    if (signedUrlError) {
      throw signedUrlError
    }

    // Log the export event
    await supabaseClient
      .from('analytics_events')
      .insert({
        user_id,
        name: 'data_export_requested',
        props: { file_name: fileName, file_size: jsonData.length },
        ts: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        download_url: signedUrlData.signedUrl,
        file_name: fileName,
        file_size: jsonData.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error exporting user data:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})