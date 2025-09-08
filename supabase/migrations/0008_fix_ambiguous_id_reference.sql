-- Fix ambiguous 'id' reference in add_diary_item function

CREATE OR REPLACE FUNCTION public.add_diary_item(
  p_date date,
  p_meal public.meal_type,
  p_item jsonb,
  p_totals jsonb
)
RETURNS TABLE (id uuid)
LANGUAGE plpgsql
AS $$
DECLARE
  v_entry_id uuid;
  v_item jsonb;
BEGIN
  -- Ensure item has an item_id
  IF (p_item->>'item_id') IS NULL THEN
    v_item = jsonb_set(p_item, '{item_id}', to_jsonb(gen_random_uuid()::text));
  ELSE
    v_item = p_item;
  END IF;

  SELECT de.id INTO v_entry_id
  FROM public.diary_entries de
  WHERE de.user_id = auth.uid() AND de.date = p_date AND de.meal_type = p_meal
  LIMIT 1;

  IF v_entry_id IS NULL THEN
    INSERT INTO public.diary_entries (user_id, date, meal_type, items, totals)
    VALUES (auth.uid(), p_date, p_meal, jsonb_build_array(v_item), p_totals)
    RETURNING diary_entries.id INTO v_entry_id;
  ELSE
    UPDATE public.diary_entries
    SET items = coalesce(items, '[]'::jsonb) || jsonb_build_array(v_item),
        totals = jsonb_build_object(
          'calories_kcal', coalesce((totals->>'calories_kcal')::numeric, 0) + coalesce((p_totals->>'calories_kcal')::numeric, 0),
          'protein_g',     coalesce((totals->>'protein_g')::numeric, 0) + coalesce((p_totals->>'protein_g')::numeric, 0),
          'carbs_g',       coalesce((totals->>'carbs_g')::numeric, 0) + coalesce((p_totals->>'carbs_g')::numeric, 0),
          'fat_g',         coalesce((totals->>'fat_g')::numeric, 0) + coalesce((p_totals->>'fat_g')::numeric, 0),
          'fiber_g',       coalesce((totals->>'fiber_g')::numeric, 0) + coalesce((p_totals->>'fiber_g')::numeric, 0)
        ),
        updated_at = now()
    WHERE diary_entries.id = v_entry_id
    RETURNING diary_entries.id INTO v_entry_id;
  END IF;

  RETURN QUERY SELECT v_entry_id;
END;
$$;