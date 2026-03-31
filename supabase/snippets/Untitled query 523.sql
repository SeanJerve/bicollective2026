-- =========================================================
-- 1. FIX SECURITY ERROR: CATEGORIES (Restricting Delete/Update)
-- =========================================================
DROP POLICY IF EXISTS "Categories Unified Access" ON public.categories;
-- Allow everyone to view
CREATE POLICY "Categories View Policy" ON public.categories FOR SELECT USING (true);
-- Only admins can manage (Insert/Update/Delete)
CREATE POLICY "Categories Admin Policy" ON public.categories FOR ALL 
USING ((SELECT public.has_role((SELECT auth.uid()), 'admin')))
WITH CHECK ((SELECT public.has_role((SELECT auth.uid()), 'admin')));

-- =========================================================
-- 2. RESOLVE DUPLICATE INDEXES (Performance)
-- =========================================================
DROP INDEX IF EXISTS public.idx_brands_owner_id_lookup;
DROP INDEX IF EXISTS public.idx_disputes_vendor_order_id;
DROP INDEX IF EXISTS public.idx_user_roles_user_role_composite;

-- =========================================================
-- 3. UNIFY REMAINING FRAGMENTED POLICIES
-- =========================================================

-- VOUCHERS
DROP POLICY IF EXISTS "Users can view their own vouchers" ON public.vouchers;
DROP POLICY IF EXISTS "Admins can manage all vouchers" ON public.vouchers;
DROP POLICY IF EXISTS "Admins can delete vouchers" ON public.vouchers;
DROP POLICY IF EXISTS "Only admins can insert vouchers" ON public.vouchers;
CREATE POLICY "Vouchers Unified Access" ON public.vouchers FOR ALL USING (
  user_id = (SELECT auth.uid()) OR 
  (SELECT public.has_role((SELECT auth.uid()), 'admin'))
);

-- MESSAGES
DROP POLICY IF EXISTS "Messages Unified Access" ON public.messages;
DROP POLICY IF EXISTS "Receivers can mark messages as read" ON public.messages;
CREATE POLICY "Messages Unified Access" ON public.messages FOR ALL USING (
  sender_id = (SELECT auth.uid()) OR 
  receiver_id = (SELECT auth.uid()) OR
  (SELECT public.has_role((SELECT auth.uid()), 'admin'))
);

-- PROMOTIONS
DROP POLICY IF EXISTS "Anyone can view active promotions" ON public.promotions;
DROP POLICY IF EXISTS "Promotions Management" ON public.promotions;
DROP POLICY IF EXISTS "Vendors can delete their promotions" ON public.promotions;
CREATE POLICY "Promotions Unified Access" ON public.promotions FOR ALL USING (
  (is_active = true AND starts_at <= now() AND ends_at > now()) OR 
  created_by = (SELECT auth.uid()) OR 
  brand_id IN (SELECT id FROM public.brands WHERE owner_id = (SELECT auth.uid())) OR
  (SELECT public.has_role((SELECT auth.uid()), 'admin'))
);

-- VENDOR ORDERS (The final consolidation)
DROP POLICY IF EXISTS "Customers can view their vendor orders" ON public.vendor_orders;
DROP POLICY IF EXISTS "Customers can create vendor orders" ON public.vendor_orders;
DROP POLICY IF EXISTS "Customers can update payment proof" ON public.vendor_orders;
-- Note: "Vendor Orders Unified Access" was created in the previous step, we keep it as our master policy.

-- =========================================================
-- 4. FINAL INITPLAN OPTIMIZATIONS
-- =========================================================

-- LUCKY PROMO CLAIMS
DROP POLICY IF EXISTS "Users can view their own claims" ON public.lucky_promo_claims;
DROP POLICY IF EXISTS "Users can create their own claims" ON public.lucky_promo_claims;
CREATE POLICY "Lucky Promo Claims Access" ON public.lucky_promo_claims FOR ALL USING (
  user_id = (SELECT auth.uid())
);

-- =========================================================
-- 5. REFRESH & FINALIZE
-- =========================================================
ANALYZE;
