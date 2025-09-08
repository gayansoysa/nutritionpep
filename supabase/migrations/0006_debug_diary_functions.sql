-- Improved diary functions with better debugging and error handling

-- Add item function with better error handling
create or replace function public.add_diary_item(
  p_date date,
  p_meal public.meal_type,
  p_item jsonb,
  p_totals jsonb
)
returns table (id uuid)
language plpgsql
as $$
declare
  v_entry_id uuid;
  v_item jsonb;
begin
  -- Ensure item has an item_id
  if (p_item->>'item_id') is null then
    v_item = jsonb_set(p_item, '{item_id}', to_jsonb(gen_random_uuid()::text));
  else
    v_item = p_item;
  end if;

  select de.id into v_entry_id
  from public.diary_entries de
  where de.user_id = auth.uid() and de.date = p_date and de.meal_type = p_meal
  limit 1;

  if v_entry_id is null then
    insert into public.diary_entries (user_id, date, meal_type, items, totals)
    values (auth.uid(), p_date, p_meal, jsonb_build_array(v_item), p_totals)
    returning id into v_entry_id;
  else
    update public.diary_entries
    set items = coalesce(items, '[]'::jsonb) || jsonb_build_array(v_item),
        totals = jsonb_build_object(
          'calories_kcal', coalesce((totals->>'calories_kcal')::numeric, 0) + coalesce((p_totals->>'calories_kcal')::numeric, 0),
          'protein_g',     coalesce((totals->>'protein_g')::numeric, 0) + coalesce((p_totals->>'protein_g')::numeric, 0),
          'carbs_g',       coalesce((totals->>'carbs_g')::numeric, 0) + coalesce((p_totals->>'carbs_g')::numeric, 0),
          'fat_g',         coalesce((totals->>'fat_g')::numeric, 0) + coalesce((p_totals->>'fat_g')::numeric, 0),
          'fiber_g',       coalesce((totals->>'fiber_g')::numeric, 0) + coalesce((p_totals->>'fiber_g')::numeric, 0)
        ),
        updated_at = now()
    where id = v_entry_id
    returning id into v_entry_id;
  end if;

  return query select v_entry_id;
end;
$$;

-- Completely rewritten remove function that works with string UUIDs as well
create or replace function public.remove_diary_item(
  p_entry_id uuid,
  p_item_id text
)
returns table (removed jsonb)
language plpgsql
as $$
declare
  v_items jsonb;
  v_item jsonb;
  v_filtered_items jsonb;
begin
  -- Get the current items array
  select items into v_items 
  from public.diary_entries 
  where id = p_entry_id and user_id = auth.uid();
  
  if v_items is null or jsonb_array_length(v_items) = 0 then
    raise notice 'No items found in entry %', p_entry_id;
    return;
  end if;
  
  -- Find the item to remove
  select elem into v_item
  from jsonb_array_elements(v_items) elem
  where elem->>'item_id' = p_item_id
  limit 1;
  
  if v_item is null then
    raise notice 'Item % not found in entry %', p_item_id, p_entry_id;
    return;
  end if;
  
  -- Filter out the item to remove
  select jsonb_agg(elem)
  into v_filtered_items
  from jsonb_array_elements(v_items) elem
  where elem->>'item_id' != p_item_id;
  
  -- If all items were removed, use empty array
  if v_filtered_items is null then
    v_filtered_items := '[]'::jsonb;
  end if;
  
  -- Update the entry
  update public.diary_entries de
  set items = v_filtered_items,
      totals = jsonb_build_object(
        'calories_kcal', greatest(0, coalesce((de.totals->>'calories_kcal')::numeric, 0) - coalesce((v_item->'nutrients_snapshot'->>'calories_kcal')::numeric, 0)),
        'protein_g',     greatest(0, coalesce((de.totals->>'protein_g')::numeric, 0) - coalesce((v_item->'nutrients_snapshot'->>'protein_g')::numeric, 0)),
        'carbs_g',       greatest(0, coalesce((de.totals->>'carbs_g')::numeric, 0) - coalesce((v_item->'nutrients_snapshot'->>'carbs_g')::numeric, 0)),
        'fat_g',         greatest(0, coalesce((de.totals->>'fat_g')::numeric, 0) - coalesce((v_item->'nutrients_snapshot'->>'fat_g')::numeric, 0)),
        'fiber_g',       greatest(0, coalesce((de.totals->>'fiber_g')::numeric, 0) - coalesce((v_item->'nutrients_snapshot'->>'fiber_g')::numeric, 0))
      ),
      updated_at = now()
  where de.id = p_entry_id and de.user_id = auth.uid();
  
  return query select v_item;
end;
$$;