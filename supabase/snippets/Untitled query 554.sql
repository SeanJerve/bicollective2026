-- ============================================================
-- BICOLLECTIVE 2026: FINAL 3NF CONSTRAINTS & RPC RESTORATION (v2)
-- ============================================================

-- 1. Remove the legacy user_id column that's blocking cart additions
ALTER TABLE public.cart_items DROP COLUMN IF EXISTS user_id CASCADE;

-- 2. Restore the Variant-Aware Stock Decrement function
CREATE OR REPLACE FUNCTION public.decrement_stock_on_order(items jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  item jsonb;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(items)
  LOOP
    UPDATE public.product_variants
    SET stock_quantity = stock_quantity - (item->>'quantity')::int
    WHERE id = (item->>'variant_id')::uuid;
  END LOOP;
END; $$;

-- 3. Restore Platform Debt tracking function
CREATE OR REPLACE FUNCTION public.increment_brand_debt(brand_id_param uuid, amount_param numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  -- Track the debt in the brands table
  UPDATE public.brands 
  SET platform_debt = COALESCE(platform_debt, 0) + amount_param
  WHERE id = brand_id_param;
END; $$;

-- 4. Final RLS Health Check & PostgREST Reload
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own cart items" ON public.cart_items;
CREATE POLICY "Users can view their own cart items" ON public.cart_items 
FOR SELECT USING (EXISTS (SELECT 1 FROM public.carts WHERE id = cart_items.cart_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage their own cart items" ON public.cart_items;
CREATE POLICY "Users can manage their own cart items" ON public.cart_items 
FOR ALL USING (EXISTS (SELECT 1 FROM public.carts WHERE id = cart_items.cart_id AND user_id = auth.uid()));

NOTIFY pgrst, 'reload schema';
