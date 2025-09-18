-- Analytics functions for admin dashboard

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

-- Grant execute permission to authenticated users (admin check will be done in the API)
grant execute on function public.get_top_foods_analytics(integer) to authenticated;