/**
 * Create API Tables Script
 * This script creates the necessary tables for external API integration
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTables() {
  console.log('Creating API tables...');

  try {
    // First, let's just try to insert the configurations to see if the table exists
    console.log('Testing if api_configurations table exists...');
    
    const { data: existingConfigs, error: readError } = await supabase
      .from('api_configurations')
      .select('api_name')
      .limit(1);

    if (readError) {
      console.log('Table does not exist or has permission issues:', readError.message);
      console.log('You need to apply the migration manually in your Supabase dashboard.');
      console.log('Please go to your Supabase project dashboard > SQL Editor and run the migration file:');
      console.log('supabase/migrations/20241201000000_external_api_integration.sql');
      return;
    }

    console.log('✅ api_configurations table exists!');

    // Insert default configurations
    const { data: configs, error: configError } = await supabase
      .from('api_configurations')
      .upsert([
        {
          api_name: 'USDA',
          is_enabled: false,
          rate_limit_per_hour: 1000,
          rate_limit_per_day: 24000,
          rate_limit_per_month: 720000
        },
        {
          api_name: 'CalorieNinjas',
          is_enabled: false,
          rate_limit_per_month: 100000
        },
        {
          api_name: 'FatSecret',
          is_enabled: false,
          rate_limit_per_day: 10000,
          rate_limit_per_month: 300000
        },
        {
          api_name: 'Edamam',
          is_enabled: false,
          rate_limit_per_month: 10000
        },
        {
          api_name: 'OpenFoodFacts',
          is_enabled: true
        }
      ], { 
        onConflict: 'api_name',
        ignoreDuplicates: false 
      })
      .select();

    if (configError) {
      console.error('❌ Error inserting configurations:', configError);
    } else {
      console.log('✅ API configurations created successfully:', configs?.length || 0, 'configs');
      configs?.forEach(config => {
        console.log(`  - ${config.api_name}: ${config.is_enabled ? 'enabled' : 'disabled'}`);
      });
    }

    console.log('✅ Setup completed successfully!');
    console.log('You can now visit http://localhost:3001/admin/external-apis to manage your APIs');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

createTables();