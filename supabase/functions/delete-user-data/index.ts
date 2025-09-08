import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DeleteRequest {
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

    const { user_id }: DeleteRequest = await req.json()

    if (!user_id) {
      throw new Error('User ID is required')
    }

    // Log the deletion event before deleting
    await supabaseClient
      .from('analytics_events')
      .insert({
        user_id,
        name: 'account_deletion_requested',
        props: { timestamp: new Date().toISOString() },
        ts: new Date().toISOString()
      })

    // Delete user data in order (respecting foreign key constraints)
    
    // 1. Delete diary entries
    const { error: diaryError } = await supabaseClient
      .from('diary_entries')
      .delete()
      .eq('user_id', user_id)

    if (diaryError) {
      console.error('Error deleting diary entries:', diaryError)
    }

    // 2. Delete targets
    const { error: targetsError } = await supabaseClient
      .from('targets')
      .delete()
      .eq('user_id', user_id)

    if (targetsError) {
      console.error('Error deleting targets:', targetsError)
    }

    // 3. Delete goals
    const { error: goalsError } = await supabaseClient
      .from('goals')
      .delete()
      .eq('user_id', user_id)

    if (goalsError) {
      console.error('Error deleting goals:', goalsError)
    }

    // 4. Delete biometrics
    const { error: biometricsError } = await supabaseClient
      .from('biometrics')
      .delete()
      .eq('user_id', user_id)

    if (biometricsError) {
      console.error('Error deleting biometrics:', biometricsError)
    }

    // 5. Anonymize analytics events (keep for aggregate stats)
    const { error: analyticsError } = await supabaseClient
      .from('analytics_events')
      .update({ user_id: null })
      .eq('user_id', user_id)

    if (analyticsError) {
      console.error('Error anonymizing analytics:', analyticsError)
    }

    // 6. Delete profile
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .delete()
      .eq('id', user_id)

    if (profileError) {
      console.error('Error deleting profile:', profileError)
    }

    // 7. Delete any export files from storage
    try {
      const { data: files } = await supabaseClient.storage
        .from('exports')
        .list(user_id)

      if (files && files.length > 0) {
        const filePaths = files.map(file => `${user_id}/${file.name}`)
        await supabaseClient.storage
          .from('exports')
          .remove(filePaths)
      }
    } catch (storageError) {
      console.error('Error deleting export files:', storageError)
    }

    // 8. Delete the user from auth (this will cascade to any remaining data)
    const { error: authError } = await supabaseClient.auth.admin.deleteUser(user_id)

    if (authError) {
      console.error('Error deleting auth user:', authError)
      // Don't throw here as the data deletion was successful
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User data deleted successfully',
        deleted_at: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error deleting user data:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})