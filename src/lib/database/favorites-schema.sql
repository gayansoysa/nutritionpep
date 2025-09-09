-- User Favorites Table
-- Stores user's favorite foods for quick access

CREATE TABLE user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_id UUID NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
  
  -- User's preferred serving size for this favorite
  preferred_quantity DECIMAL(10,2) DEFAULT 100,
  preferred_unit TEXT DEFAULT 'g',
  
  -- Metadata
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  use_count INTEGER DEFAULT 1,
  
  -- Constraints
  UNIQUE(user_id, food_id)
);

-- Indexes for performance
CREATE INDEX idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX idx_user_favorites_last_used ON user_favorites(user_id, last_used_at DESC);
CREATE INDEX idx_user_favorites_use_count ON user_favorites(user_id, use_count DESC);

-- RLS Policies
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Users can only see their own favorites
CREATE POLICY "Users can view own favorites" ON user_favorites
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own favorites
CREATE POLICY "Users can insert own favorites" ON user_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own favorites
CREATE POLICY "Users can update own favorites" ON user_favorites
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own favorites
CREATE POLICY "Users can delete own favorites" ON user_favorites
  FOR DELETE USING (auth.uid() = user_id);

-- Recent Foods View
-- This view combines recent diary entries with food information
-- for quick access to recently logged foods

CREATE OR REPLACE VIEW user_recent_foods AS
SELECT DISTINCT ON (de.user_id, de.food_id)
  de.user_id,
  de.food_id,
  f.name,
  f.brand,
  f.image_url,
  f.calories_per_100g,
  f.protein_per_100g,
  f.carbs_per_100g,
  f.fat_per_100g,
  de.quantity as last_quantity,
  de.unit as last_unit,
  de.created_at as last_used_at,
  COUNT(*) OVER (PARTITION BY de.user_id, de.food_id) as use_count
FROM diary_entries de
JOIN foods f ON f.id = de.food_id
WHERE de.created_at >= NOW() - INTERVAL '30 days'
ORDER BY de.user_id, de.food_id, de.created_at DESC;

-- Function to get user's favorite foods with food details
CREATE OR REPLACE FUNCTION get_user_favorites(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  food_id UUID,
  name TEXT,
  brand TEXT,
  image_url TEXT,
  calories_per_100g DECIMAL,
  protein_per_100g DECIMAL,
  carbs_per_100g DECIMAL,
  fat_per_100g DECIMAL,
  preferred_quantity DECIMAL,
  preferred_unit TEXT,
  use_count INTEGER,
  last_used_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    uf.id,
    uf.food_id,
    f.name,
    f.brand,
    f.image_url,
    f.calories_per_100g,
    f.protein_per_100g,
    f.carbs_per_100g,
    f.fat_per_100g,
    uf.preferred_quantity,
    uf.preferred_unit,
    uf.use_count,
    uf.last_used_at
  FROM user_favorites uf
  JOIN foods f ON f.id = uf.food_id
  WHERE uf.user_id = user_uuid
  ORDER BY uf.last_used_at DESC;
$$;

-- Function to get user's recent foods (not favorites)
CREATE OR REPLACE FUNCTION get_user_recent_foods(user_uuid UUID, limit_count INTEGER DEFAULT 20)
RETURNS TABLE (
  food_id UUID,
  name TEXT,
  brand TEXT,
  image_url TEXT,
  calories_per_100g DECIMAL,
  protein_per_100g DECIMAL,
  carbs_per_100g DECIMAL,
  fat_per_100g DECIMAL,
  last_quantity DECIMAL,
  last_unit TEXT,
  use_count BIGINT,
  last_used_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    urf.food_id,
    urf.name,
    urf.brand,
    urf.image_url,
    urf.calories_per_100g,
    urf.protein_per_100g,
    urf.carbs_per_100g,
    urf.fat_per_100g,
    urf.last_quantity,
    urf.last_unit,
    urf.use_count,
    urf.last_used_at
  FROM user_recent_foods urf
  WHERE urf.user_id = user_uuid
    AND urf.food_id NOT IN (
      SELECT food_id FROM user_favorites WHERE user_id = user_uuid
    )
  ORDER BY urf.last_used_at DESC
  LIMIT limit_count;
$$;

-- Function to toggle favorite status
CREATE OR REPLACE FUNCTION toggle_favorite(user_uuid UUID, food_uuid UUID, quantity DECIMAL DEFAULT 100, unit_name TEXT DEFAULT 'g')
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_favorite BOOLEAN;
BEGIN
  -- Check if already favorite
  SELECT EXISTS(
    SELECT 1 FROM user_favorites 
    WHERE user_id = user_uuid AND food_id = food_uuid
  ) INTO is_favorite;
  
  IF is_favorite THEN
    -- Remove from favorites
    DELETE FROM user_favorites 
    WHERE user_id = user_uuid AND food_id = food_uuid;
    RETURN FALSE;
  ELSE
    -- Add to favorites
    INSERT INTO user_favorites (user_id, food_id, preferred_quantity, preferred_unit)
    VALUES (user_uuid, food_uuid, quantity, unit_name)
    ON CONFLICT (user_id, food_id) DO UPDATE SET
      last_used_at = NOW(),
      use_count = user_favorites.use_count + 1;
    RETURN TRUE;
  END IF;
END;
$$;

-- Function to update favorite usage
CREATE OR REPLACE FUNCTION update_favorite_usage(user_uuid UUID, food_uuid UUID)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE user_favorites 
  SET 
    last_used_at = NOW(),
    use_count = use_count + 1
  WHERE user_id = user_uuid AND food_id = food_uuid;
$$;