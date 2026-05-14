-- Add is_hidden flag to brands
ALTER TABLE public.brands
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;

-- Function to check for active/ongoing orders
-- Returns true if there are any incomplete orders
CREATE OR REPLACE FUNCTION public.check_active_orders(v_brand_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  active_count INT;
BEGIN
  SELECT COUNT(*)
  INTO active_count
  FROM public.vendor_orders
  WHERE brand_id = v_brand_id
    AND status NOT IN ('delivered', 'cancelled');

  RETURN active_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
