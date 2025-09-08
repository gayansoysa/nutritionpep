-- Improve remove_diary_item to remove by item_id regardless of array index

create or replace function public.remove_diary_item(
  p_entry_id uuid,
  p_item_id uuid
)
returns table (removed jsonb)
language plpgsql
as $$
declare
  v_items jsonb;
  v_item jsonb;
begin
  select items into v_items from public.diary_entries where id = p_entry_id and user_id = auth.uid();
  if v_items is null then
    return;
  end if;

  -- find the item to remove
  select elem into v_item
  from jsonb_array_elements(v_items) elem
  where (elem->>'item_id')::uuid = p_item_id
  limit 1;

  if v_item is null then
    return;
  end if;

  update public.diary_entries de
  set items = coalesce(
          (
            select jsonb_agg(elem)
            from jsonb_array_elements(de.items) elem
            where (elem->>'item_id')::uuid is distinct from p_item_id
          ), '[]'::jsonb
        ),
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

