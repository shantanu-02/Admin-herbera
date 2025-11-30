-- Add skin_concerns and skin_types to products table

-- Add skin_concerns column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS skin_concerns text[] DEFAULT '{}';

-- Add skin_types column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS skin_types text[] DEFAULT '{}';

-- Create GIN indexes for fast array searching
CREATE INDEX IF NOT EXISTS idx_products_skin_concerns ON products USING GIN (skin_concerns);
CREATE INDEX IF NOT EXISTS idx_products_skin_types ON products USING GIN (skin_types);

-- Add constraints to ensure only allowed values are used
ALTER TABLE products
DROP CONSTRAINT IF EXISTS check_skin_concerns;

ALTER TABLE products
ADD CONSTRAINT check_skin_concerns
CHECK (skin_concerns <@ ARRAY['Dandruff', 'Uneven Skintone', 'Tan', 'Dry Skin', 'Pimple', 'Acne', 'Pigmentation', 'Open Pores']::text[]);

ALTER TABLE products
DROP CONSTRAINT IF EXISTS check_skin_types;

ALTER TABLE products
ADD CONSTRAINT check_skin_types
CHECK (skin_types <@ ARRAY['Oily', 'Dry', 'Combination', 'Sensitive', 'Normal']::text[]);

-- Add comments for documentation
COMMENT ON COLUMN products.skin_concerns IS 'Array of skin concerns: Dandruff, Uneven Skintone, Tan, Dry Skin, Pimple, Acne, Pigmentation, Open Pores';
COMMENT ON COLUMN products.skin_types IS 'Array of skin types: Oily, Dry, Combination, Sensitive, Normal';
