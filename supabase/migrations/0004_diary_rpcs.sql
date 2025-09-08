-- Diary RPCs: add and remove item while maintaining totals

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
begin
  select de.id into v_entry_id
  from public.diary_entries de
  where de.user_id = auth.uid() and de.date = p_date and de.meal_type = p_meal
  limit 1;

  if v_entry_id is null then
    insert into public.diary_entries (user_id, date, meal_type, items, totals)
    values (auth.uid(), p_date, p_meal, jsonb_build_array(p_item), p_totals)
    returning id into v_entry_id;
  else
    update public.diary_entries
    set items = coalesce(items, '[]'::jsonb) || jsonb_build_array(p_item),
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

create or replace function public.remove_diary_item(
  p_entry_id uuid,
  p_item_id uuid
)
returns table (removed jsonb)
language plpgsql
as $$
declare
  v_idx int;
  v_item jsonb;
begin
  -- find index and item
  select i.ord - 1, i.elem into v_idx, v_item
  from (
    select elem, ord
    from jsonb_array_elements((select items from public.diary_entries where id = p_entry_id and user_id = auth.uid())) with ordinality as t(elem, ord)
  ) i
  where (i.elem->>'item_id')::uuid = p_item_id
  limit 1;

  if v_idx is null then
    return;
  end if;

  update public.diary_entries de
  set items = (de.items - v_idx),
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

