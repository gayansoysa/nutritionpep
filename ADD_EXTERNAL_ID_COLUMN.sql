-- Add external_id column to foods table for external API integration
-- This SQL should be run in your Supabase SQL editor to fix the database schema

-- Add the external_id column
ALTER TABLE public.foods 
ADD COLUMN IF NOT EXISTS external_id TEXT;

-- Add index for performance when looking up external foods
CREATE INDEX IF NOT EXISTS idx_foods_external_id ON public.foods(external_id);

-- Add unique constraint to prevent duplicate external foods
-- We use a partial unique index to allow multiple NULL values
CREATE UNIQUE INDEX IF NOT EXISTS idx_foods_external_id_unique 
ON public.foods(external_id) 
WHERE external_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.foods.external_id IS 'External API identifier for foods imported from USDA, OpenFoodFacts, etc. Used to prevent duplicate imports and track source.';

-- Verify the column was added successfully
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'foods' 
AND table_schema = 'public' 
AND column_name = 'external_id';