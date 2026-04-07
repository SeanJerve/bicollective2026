-- ============================================================
-- BICOLLECTIVE 2026: FINAL 3NF DATABASE ALIGNMENT
-- Resolves: Checkout (order_items) and Cart (cart_items/carts) errors
-- ============================================================

-- 1. FIX: ORDERS TABLE (Shipping History)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_address TEXT;

-- 2. FIX: ORDER ITEMS (Relational Variants)
-- Adds variant_id to support 3NF product tracking
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL;

-- 3. FIX: CART HIERARCHY (Add parent Carts first)
CREATE TABLE IF NOT EXISTS public.carts (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 4. FIX: CART ITEMS (Align with 3NF Schema)
-- Remove old redundant columns if they exist
ALTER TABLE public.cart_items DROP COLUMN IF EXISTS size CASCADE;
ALTER TABLE public.cart_items DROP COLUMN IF EXISTS product_id CASCADE;

-- Add new 3NF relation columns
ALTER TABLE public.cart_items ADD COLUMN IF NOT EXISTS cart_id    uuid NOT NULL REFERENCES public.carts(id)            ON DELETE CASCADE;
ALTER TABLE public.cart_items ADD COLUMN IF NOT EXISTS variant_id uuid NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE;

-- 5. ENABLE SECURITY (RLS)
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- 6. SECURITY POLICIES: CARTS
DROP POLICY IF EXISTS "Users can view their own cart" ON public.carts;
CREATE POLICY "Users can view their own cart" ON public.carts FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own cart" ON public.carts;
CREATE POLICY "Users can insert their own cart" ON public.carts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7. SECURITY POLICIES: CART ITEMS
DROP POLICY IF EXISTS "Users can manage their own cart items" ON public.cart_items;
CREATE POLICY "Users can manage their own cart items" ON public.cart_items 
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.carts WHERE id = cart_items.cart_id AND user_id = auth.uid())
);

-- 8. SCHEMA REFRESH FOR POSTGREST
-- (Ensures the API cache recognizes the new columns immediately)
NOTIFY pgrst, 'reload schema';
