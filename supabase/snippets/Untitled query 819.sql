-- ============================================================
-- BICOLLECTIVE 2026: SCHEMA STABILIZATION (3NF)
-- ============================================================

-- 1. Restore the shipping_address snapshot column (Critical for history)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS shipping_address TEXT;

-- 2. Enable RLS for Cart System
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- 3. Carts Policies (One cart per user)
DROP POLICY IF EXISTS "Users can view their own cart" ON public.carts;
CREATE POLICY "Users can view their own cart" ON public.carts 
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own cart" ON public.carts;
CREATE POLICY "Users can insert their own cart" ON public.carts 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Cart Items Policies (Users manage items in their own carts)
DROP POLICY IF EXISTS "Users can view their own cart items" ON public.cart_items;
CREATE POLICY "Users can view their own cart items" ON public.cart_items 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.carts WHERE id = cart_items.cart_id AND user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can manage their own cart items" ON public.cart_items;
CREATE POLICY "Users can manage their own cart items" ON public.cart_items 
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.carts WHERE id = cart_items.cart_id AND user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.carts WHERE id = cart_items.cart_id AND user_id = auth.uid())
);

-- 5. Fix variant_id non-null constraint (safety)
ALTER TABLE public.cart_items ALTER COLUMN variant_id SET NOT NULL;
