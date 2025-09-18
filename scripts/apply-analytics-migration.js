const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function applyMigration() {
  try {
    console.log("Creating analytics function...");

    // Create the function directly
    const { data, error } = await supabase.rpc("exec", {
      sql: `
        -- Function to get top foods from diary entries
        create or replace function public.get_top_foods_analytics(days_back integer default 7)
        returns table (
          food_id uuid,
          food_name text,
          usage_count bigint
        )
        language plpgsql
        security definer
        as $$
        begin
          return query
          select 
            (item->>'food_id')::uuid as food_id,
            coalesce(f.name, item->>'name') as food_name,
            count(*) as usage_count
          from public.diary_entries de,
               jsonb_array_elements(de.items) as item
          left join public.foods f on f.id = (item->>'food_id')::uuid
          where de.date >= current_date - interval '1 day' * days_back
            and item->>'food_id' is not null
          group by (item->>'food_id')::uuid, f.name, item->>'name'
          order by usage_count desc
          limit 10;
        end;
        $$;

        -- Grant execute permission to authenticated users
        grant execute on function public.get_top_foods_analytics(integer) to authenticated;
      `,
    });

    if (error) {
      console.error("Function creation failed:", error);

      // Try alternative approach - direct query execution
      console.log("Trying alternative approach...");

      const { error: altError } = await supabase
        .from("_supabase_migrations")
        .insert({
          version: "20241201000007",
          name: "analytics_functions",
          statements: [
            `
            create or replace function public.get_top_foods_analytics(days_back integer default 7)
            returns table (
              food_id uuid,
              food_name text,
              usage_count bigint
            )
            language plpgsql
            security definer
            as $$
            begin
              return query
              select 
                (item->>'food_id')::uuid as food_id,
                coalesce(f.name, item->>'name') as food_name,
                count(*) as usage_count
              from public.diary_entries de,
                   jsonb_array_elements(de.items) as item
              left join public.foods f on f.id = (item->>'food_id')::uuid
              where de.date >= current_date - interval '1 day' * days_back
                and item->>'food_id' is not null
              group by (item->>'food_id')::uuid, f.name, item->>'name'
              order by usage_count desc
              limit 10;
            end;
            $$;
            grant execute on function public.get_top_foods_analytics(integer) to authenticated;
          `,
          ],
        });

      if (altError) {
        console.error("Alternative approach also failed:", altError);
        process.exit(1);
      }
    }

    console.log("Analytics function created successfully!");
  } catch (err) {
    console.error("Error creating function:", err);
    process.exit(1);
  }
}

applyMigration();
