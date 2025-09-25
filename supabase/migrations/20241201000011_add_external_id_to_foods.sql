-- Add external_id column to foods table for external API integration
-- This allows us to track which foods came from external APIs and avoid duplicates

-- Add the external_id column
ALTER TABLE public.foods 
ADD COLUMN IF NOT EXISTS external_id TEXT;

-- Add an index for performance when looking up external foods
CREATE INDEX IF NOT EXISTS idx_foods_external_id ON public.foods(external_id);

-- Add a unique constraint to prevent duplicate external foods
-- We use a partial unique index to allow multiple NULL values
CREATE UNIQUE INDEX IF NOT EXISTS idx_foods_external_id_unique 
ON public.foods(external_id) 
WHERE external_id IS NOT NULL;

-- Update the food_source enum to include the new external sources
-- First, add the new enum values if they don't exist
DO $$ 
BEGIN
    -- Add 'usda' if it doesn't exist (it should already exist from the original schema)
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'usda' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'food_source')) THEN
        ALTER TYPE public.food_source ADD VALUE 'usda';
    END IF;
    
    -- Add 'openfoodfacts' if it doesn't exist (it should already exist from the original schema)  
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'openfoodfacts' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'food_source')) THEN
        ALTER TYPE public.food_source ADD VALUE 'openfoodfacts';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Add a comment to document the new column
COMMENT ON COLUMN public.foods.external_id IS 'External API identifier for foods imported from USDA, OpenFoodFacts, etc. Used to prevent duplicate imports and track source.';