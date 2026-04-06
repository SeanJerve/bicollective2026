-- ============================================================
-- BICOLLECTIVE 2026: Full 3NF Alignment - All Functions & RLS
-- Run this ENTIRE script in Supabase Studio SQL Editor
-- ============================================================

-- 1. Fix validate_stock to use product_variants (Source of Truth)
CREATE OR REPLACE FUNCTION public.validate_stock(items jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  item jsonb;
  variant_row RECORD;
  product_row RECORD;
  out_of_stock jsonb := '[]'::jsonb;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(items)
  LOOP
    -- Target the new normalized variants table
    SELECT id, product_id, stock_quantity
    INTO variant_row
    FROM public.product_variants
    WHERE id = (item->>'variant_id')::uuid;

    IF variant_row IS NOT NULL AND variant_row.product_id IS NOT NULL THEN
      SELECT name, in_stock INTO product_row
      FROM public.products WHERE id = variant_row.product_id;
    END IF;

    -- Correct inventory check mapping
    IF variant_row IS NULL 
       OR product_row IS NULL 
       OR NOT COALESCE(product_row.in_stock, true)
       OR COALESCE(variant_row.stock_quantity, 0) < COALESCE((item->>'quantity')::int, 1) THEN
      
      out_of_stock := out_of_stock || jsonb_build_object(
        'variant_id', item->>'variant_id',
        'product_name', COALESCE(product_row.name, 'Unknown Product'),
        'requested', COALESCE((item->>'quantity')::int, 1),
        'available', COALESCE(variant_row.stock_quantity, 0)
      );
    END IF;
  END LOOP;
  RETURN out_of_stock;
END;
$$;

-- 2. Fix decrement_stock_on_order to use product_variants
CREATE OR REPLACE FUNCTION public.decrement_stock_on_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_stock INTEGER;
BEGIN
  IF NEW.variant_id IS NOT NULL THEN
    -- Lock the specific variant row for update
    SELECT stock_quantity INTO current_stock
    FROM public.product_variants
    WHERE id = NEW.variant_id
    FOR UPDATE;
    
    IF current_stock IS NOT NULL AND current_stock >= NEW.quantity THEN
      UPDATE public.product_variants
      SET stock_quantity = stock_quantity - NEW.quantity
      WHERE id = NEW.variant_id;
    ELSIF current_stock IS NOT NULL AND current_stock > 0 THEN
      -- Safety fallback to zero if discrepancy occurs
      UPDATE public.product_variants SET stock_quantity = 0 WHERE id = NEW.variant_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- 3. Ensure status column exists on user_discount_claims
ALTER TABLE public.user_discount_claims
  ADD COLUMN IF NOT EXISTS status varchar(50) NOT NULL DEFAULT 'active';

-- 4. Secure RLS for user_discount_claims
ALTER TABLE public.user_discount_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own claims" ON public.user_discount_claims;
CREATE POLICY "Users can view their own claims"
  ON public.user_discount_claims FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own claims" ON public.user_discount_claims;
CREATE POLICY "Users can insert their own claims"
  ON public.user_discount_claims FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own claims" ON public.user_discount_claims;
CREATE POLICY "Users can update their own claims"
  ON public.user_discount_claims FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all claims" ON public.user_discount_claims;
CREATE POLICY "Admins can view all claims"
  ON public.user_discount_claims FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- 5. Secure Discounts RLS
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read discounts" ON public.discounts;
CREATE POLICY "Anyone can read discounts" ON public.discounts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can update discounts" ON public.discounts;
CREATE POLICY "Authenticated users can update discounts" ON public.discounts FOR UPDATE USING (auth.uid() IS NOT NULL);

-- 6. Secure Vendor Vouchers RLS
ALTER TABLE public.vendor_vouchers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view vendor vouchers" ON public.vendor_vouchers;
CREATE POLICY "Public can view vendor vouchers" ON public.vendor_vouchers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Vendors can manage their vouchers" ON public.vendor_vouchers;
CREATE POLICY "Vendors can manage their vouchers"
  ON public.vendor_vouchers FOR ALL
  USING (
    brand_id IN (SELECT id FROM public.brands WHERE owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- 7. Secure Carts RLS (3NF Ownership)
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own cart" ON public.carts;
CREATE POLICY "Users can manage their own cart"
  ON public.carts FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 8. Secure Cart Items RLS (Linked via Cart Ownership)
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own cart items" ON public.cart_items;
CREATE POLICY "Users can manage their own cart items"
  ON public.cart_items FOR ALL
  USING (
    cart_id IN (SELECT id FROM public.carts WHERE user_id = auth.uid())
  )
  WITH CHECK (
    cart_id IN (SELECT id FROM public.carts WHERE user_id = auth.uid())
  );

-- 9. Explicit Grant Permissions for Authenticated Users
GRANT ALL ON public.carts TO authenticated;
GRANT ALL ON public.cart_items TO authenticated;
GRANT ALL ON public.orders TO authenticated;
GRANT ALL ON public.vendor_orders TO authenticated;
GRANT ALL ON public.order_items TO authenticated;
GRANT ALL ON public.user_discount_claims TO authenticated;
GRANT ALL ON public.addresses TO authenticated;
GRANT ALL ON public.discounts TO authenticated;
GRANT ALL ON public.vendor_vouchers TO authenticated;
GRANT ALL ON public.platform_promos TO authenticated;
