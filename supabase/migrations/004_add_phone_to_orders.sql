-- Add phone number field to orders for contact details
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Create index for phone number lookups
CREATE INDEX IF NOT EXISTS idx_orders_phone_number ON public.orders(phone_number) WHERE phone_number IS NOT NULL;


