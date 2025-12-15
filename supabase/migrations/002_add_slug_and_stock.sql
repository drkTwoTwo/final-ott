-- Add slug field to products for SEO-friendly URLs
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Add stock/inventory tracking to products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT NULL;

-- Add quantity field to orders for stock tracking
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1 CHECK (quantity > 0);

-- Create index on slug for fast lookups
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug) WHERE slug IS NOT NULL;

-- Create index on stock for inventory queries
CREATE INDEX IF NOT EXISTS idx_products_stock ON public.products(stock_quantity) WHERE stock_quantity IS NOT NULL;

-- Add constraint to ensure stock is non-negative when set
ALTER TABLE public.products 
ADD CONSTRAINT check_stock_positive 
CHECK (stock_quantity IS NULL OR stock_quantity >= 0);

