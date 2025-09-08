-- Seed a few common foods for testing search and logging

insert into public.foods (name, brand, category, barcode, image_path, serving_sizes, nutrients_per_100g, nutrients_per_serving, source, verified)
values
  (
    'Chicken Breast, skinless, raw', null, 'meat', null, null,
    '[{"name":"100 g","grams":100}]'::jsonb,
    '{"calories_kcal":165, "protein_g":31, "carbs_g":0, "fat_g":3.6, "fiber_g":0}'::jsonb,
    null, 'curated', true
  ),
  (
    'Rice, white, cooked', null, 'grains', null, null,
    '[{"name":"100 g","grams":100}, {"name":"1 cup","grams":158}]'::jsonb,
    '{"calories_kcal":130, "protein_g":2.7, "carbs_g":28, "fat_g":0.3, "fiber_g":0.4}'::jsonb,
    null, 'curated', true
  ),
  (
    'Apple, raw, with skin', null, 'fruit', '0000000000000', null,
    '[{"name":"100 g","grams":100}, {"name":"1 medium","grams":182}]'::jsonb,
    '{"calories_kcal":52, "protein_g":0.3, "carbs_g":14, "fat_g":0.2, "fiber_g":2.4}'::jsonb,
    null, 'curated', true
  ),
  (
    'Olive Oil, extra virgin', null, 'fats', null, null,
    '[{"name":"100 g","grams":100}, {"name":"1 tbsp","grams":13.5}]'::jsonb,
    '{"calories_kcal":884, "protein_g":0, "carbs_g":0, "fat_g":100, "fiber_g":0}'::jsonb,
    null, 'curated', true
  ),
  (
    'Whey Protein Powder, unflavored', 'Generic', 'supplements', null, null,
    '[{"name":"100 g","grams":100}, {"name":"1 scoop","grams":30}]'::jsonb,
    '{"calories_kcal":400, "protein_g":80, "carbs_g":10, "fat_g":6, "fiber_g":0}'::jsonb,
    null, 'curated', true
  )
;

