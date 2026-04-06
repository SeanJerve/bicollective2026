-- ============================================================
-- BICOLLECTIVE 2026: Full 3NF Execution Fixes
-- Aligning DB Functions and RLS with variant-based inventory
-- ============================================================

-- 1. Fix validate_stock (Variant-Aware)
CREATE OR REPLACE FUNCTION public.validate_stock(items jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $func$
DECLARE
  item jsonb;
  variant_row RECORD;
  product_row RECORD;
  out_of_stock jsonb := '[]'::jsonb;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(items)
  LOOP
    -- Fetch the variant specifically
    SELECT id, product_id, stock_quantity
    INTO variant_row
    FROM public.product_variants
    WHERE id = (item->>'variant_id')::uuid;

    IF variant_row.product_id IS NOT NULL THEN
      SELECT name, in_stock INTO product_row 
      FROM public.products WHERE id = variant_row.product_id;
    END IF;

    -- Stock check at the variant level
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
END; $func$;

-- 2. Fix decrement_stock (Variant-Aware)
CREATE OR REPLACE FUNCTION public.decrement_stock_on_order()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $func$
DECLARE
  current_stock INTEGER;
BEGIN
  IF NEW.variant_id IS NOT NULL THEN
    -- Lock only the variant row
    SELECT stock_quantity INTO current_stock
    FROM public.product_variants
    WHERE id = NEW.variant_id
    FOR UPDATE;
    
    IF current_stock IS NOT NULL AND current_stock >= NEW.quantity THEN
      UPDATE public.product_variants
      SET stock_quantity = stock_quantity - NEW.quantity
      WHERE id = NEW.variant_id;
    ELSIF current_stock IS NOT NULL AND current_stock > 0 THEN
      UPDATE public.product_variants SET stock_quantity = 0 WHERE id = NEW.variant_id;
    END IF;
  END IF;
  RETURN NEW;
END; $func$;

-- 3. Restore Claim Status
ALTER TABLE public.user_discount_claims 
  ADD COLUMN IF NOT EXISTS status varchar(50) NOT NULL DEFAULT 'active';

-- 4. Secure Claim RLS
ALTER TABLE public.user_discount_claims ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own claims" ON public.user_discount_claims;
CREATE POLICY "Users can view their own claims" ON public.user_discount_claims FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own claims" ON public.user_discount_claims;
CREATE POLICY "Users can insert their own claims" ON public.user_discount_claims FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own claims" ON public.user_discount_claims;
CREATE POLICY "Users can update their own claims" ON public.user_discount_claims FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can manage all claims" ON public.user_discount_claims;
CREATE POLICY "Admins can manage all claims" ON public.user_discount_claims FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- 5. Secure Discount RLS
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read discounts" ON public.discounts;
CREATE POLICY "Anyone can read discounts" ON public.discounts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can insert discounts" ON public.discounts;
CREATE POLICY "Authenticated users can insert discounts" ON public.discounts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Authenticated users can update discounts" ON public.discounts;
CREATE POLICY "Authenticated users can update discounts" ON public.discounts FOR UPDATE USING (auth.uid() IS NOT NULL);

-- 6. Secure Vouchers RLS
ALTER TABLE public.vendor_vouchers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view vendor vouchers" ON public.vendor_vouchers;
CREATE POLICY "Public can view vendor vouchers" ON public.vendor_vouchers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Vendors can manage their vouchers" ON public.vendor_vouchers;
CREATE POLICY "Vendors can manage their vouchers" ON public.vendor_vouchers FOR ALL USING (brand_id IN (SELECT id FROM public.brands WHERE owner_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
