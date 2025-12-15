-- Add category field to products for filtering
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS category TEXT;

-- Create index on category for faster filtering
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category) WHERE category IS NOT NULL;


