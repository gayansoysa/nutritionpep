-- Fix function conflict by dropping both versions and creating just one
DROP FUNCTION IF EXISTS public.remove_diary_item(uuid, uuid);
DROP FUNCTION IF EXISTS public.remove_diary_item(uuid, text);

-- Create a single version that works with text item_id
CREATE OR REPLACE FUNCTION public.remove_diary_item(
  p_entry_id uuid,
  p_item_id text
)
RETURNS TABLE (removed jsonb)
LANGUAGE plpgsql
AS $$
DECLARE
  v_items jsonb;
  v_item jsonb;
  v_filtered_items jsonb;
BEGIN
  -- Get the current items array
  SELECT items INTO v_items 
  FROM public.diary_entries 
  WHERE id = p_entry_id AND user_id = auth.uid();
  
  IF v_items IS NULL OR jsonb_array_length(v_items) = 0 THEN
    RAISE NOTICE 'No items found in entry %', p_entry_id;
    RETURN;
  END IF;
  
  -- Find the item to remove and its index
  SELECT elem INTO v_item
  FROM jsonb_array_elements(v_items) elem
  WHERE elem->>'item_id' = p_item_id
  LIMIT 1;
  
  IF v_item IS NULL THEN
    -- Try to find item without item_id (legacy data)
    RAISE NOTICE 'Item % not found by ID in entry %, checking array items', p_item_id, p_entry_id;
    
    -- Log all items for debugging
    FOR i IN 0..jsonb_array_length(v_items)-1 LOOP
      RAISE NOTICE 'Item %: %', i, v_items->i;
    END LOOP;
    
    RETURN;
  END IF;
  
  -- Filter out the item to remove
  SELECT jsonb_agg(elem)
  INTO v_filtered_items
  FROM jsonb_array_elements(v_items) elem
  WHERE elem->>'item_id' != p_item_id;
  
  -- If all items were removed, use empty array
  IF v_filtered_items IS NULL THEN
    v_filtered_items := '[]'::jsonb;
  END IF;
  
  -- Update the entry
  UPDATE public.diary_entries de
  SET items = v_filtered_items,
      totals = jsonb_build_object(
        'calories_kcal', GREATEST(0, COALESCE((de.totals->>'calories_kcal')::numeric, 0) - COALESCE((v_item->'nutrients_snapshot'->>'calories_kcal')::numeric, 0)),
        'protein_g',     GREATEST(0, COALESCE((de.totals->>'protein_g')::numeric, 0) - COALESCE((v_item->'nutrients_snapshot'->>'protein_g')::numeric, 0)),
        'carbs_g',       GREATEST(0, COALESCE((de.totals->>'carbs_g')::numeric, 0) - COALESCE((v_item->'nutrients_snapshot'->>'carbs_g')::numeric, 0)),
        'fat_g',         GREATEST(0, COALESCE((de.totals->>'fat_g')::numeric, 0) - COALESCE((v_item->'nutrients_snapshot'->>'fat_g')::numeric, 0)),
        'fiber_g',       GREATEST(0, COALESCE((de.totals->>'fiber_g')::numeric, 0) - COALESCE((v_item->'nutrients_snapshot'->>'fiber_g')::numeric, 0))
      ),
      updated_at = now()
  WHERE de.id = p_entry_id AND de.user_id = auth.uid();
  
  RETURN QUERY SELECT v_item;
END;
$$;