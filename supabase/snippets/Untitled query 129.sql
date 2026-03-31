-- =========================================================
-- 1. SECURITY DEFINER HARDENING (Final 3)
-- =========================================================
ALTER FUNCTION public.handle_new_review_notification() SET search_path = public;
ALTER FUNCTION public.handle_dispute_notification() SET search_path = public;
ALTER FUNCTION public.increment_brand_debt(uuid, numeric) SET search_path = public;

-- =========================================================
-- 2. COMMERCE & ORDERS (Schema-Corrected)
-- =========================================================

-- ORDERS (Uses customer_id)
DROP POLICY IF EXISTS "Orders Main Policy" ON public.orders;
DROP POLICY IF EXISTS "Customers can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can create orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;

CREATE POLICY "Orders Unified Access" ON public.orders FOR ALL USING (
  customer_id = (SELECT auth.uid()) OR 
  (SELECT role FROM public.user_roles WHERE user_id = (SELECT auth.uid()) LIMIT 1) = 'admin'
);

-- VENDOR ORDERS (Needs join to orders for customer check)
DROP POLICY IF EXISTS "Vendor Orders Unified Access" ON public.vendor_orders;
DROP POLICY IF EXISTS "Vendors can view their orders" ON public.vendor_orders;
DROP POLICY IF EXISTS "Admins can manage all vendor orders" ON public.vendor_orders;
DROP POLICY IF EXISTS "Customers can upload payment proof" ON public.vendor_orders;
DROP POLICY IF EXISTS "Customers can cancel their orders" ON public.vendor_orders;
DROP POLICY IF EXISTS "Vendors can update order status and tracking" ON public.vendor_orders;
DROP POLICY IF EXISTS "Customers can confirm delivery" ON public.vendor_orders;
DROP POLICY IF EXISTS "Admins can delete vendor_orders" ON public.vendor_orders;

CREATE POLICY "Vendor Orders Unified Access" ON public.vendor_orders FOR ALL USING (
  (SELECT customer_id FROM public.orders WHERE id = order_id) = (SELECT auth.uid()) OR 
  brand_id IN (SELECT id FROM public.brands WHERE owner_id = (SELECT auth.uid())) OR
  (SELECT role FROM public.user_roles WHERE user_id = (SELECT auth.uid()) LIMIT 1) = 'admin'
);

-- ORDER ITEMS (Inherits from vendor_orders)
DROP POLICY IF EXISTS "Users can view their order items" ON public.order_items;
DROP POLICY IF EXISTS "Vendors can view their order items" ON public.order_items;
CREATE POLICY "Order Items Access" ON public.order_items FOR SELECT USING (
  vendor_order_id IN (
    SELECT id FROM public.vendor_orders vo 
    WHERE (SELECT customer_id FROM public.orders WHERE id = vo.order_id) = (SELECT auth.uid())
    OR vo.brand_id IN (SELECT id FROM public.brands WHERE owner_id = (SELECT auth.uid()))
  )
);

-- =========================================================
-- 3. MARKETING & LOYALTY (Schema-Corrected)
-- =========================================================

-- PROMOTIONS (Uses created_by)
DROP POLICY IF EXISTS "Sellers can manage their own promotions" ON public.promotions;
DROP POLICY IF EXISTS "Admins can manage all promotions" ON public.promotions;
DROP POLICY IF EXISTS "Admins can delete promotions" ON public.promotions;
CREATE POLICY "Promotions Management" ON public.promotions FOR ALL USING (
  created_by = (SELECT auth.uid()) OR 
  brand_id IN (SELECT id FROM public.brands WHERE owner_id = (SELECT auth.uid())) OR
  (SELECT role FROM public.user_roles WHERE user_id = (SELECT auth.uid()) LIMIT 1) = 'admin'
);

-- LOYALTY & VOUCHERS (Uses user_id)
DROP POLICY IF EXISTS "Users can view their own loyalty progress" ON public.loyalty_progress;
DROP POLICY IF EXISTS "Users can update their own loyalty progress" ON public.loyalty_progress;
DROP POLICY IF EXISTS "Admins can manage loyalty progress" ON public.loyalty_progress;
DROP POLICY IF EXISTS "Users can insert their own loyalty progress" ON public.loyalty_progress;

CREATE POLICY "Loyalty Access" ON public.loyalty_progress FOR ALL USING (
  user_id = (SELECT auth.uid()) OR 
  (SELECT role FROM public.user_roles WHERE user_id = (SELECT auth.uid()) LIMIT 1) = 'admin'
);

-- ADDRESSES (Uses user_id)
DROP POLICY IF EXISTS "Users can manage their own addresses" ON public.addresses;
CREATE POLICY "Addresses Management" ON public.addresses FOR ALL USING (
  user_id = (SELECT auth.uid())
);

-- =========================================================
-- 4. MESSAGES & REPORTS (Schema-Corrected)
-- =========================================================

-- REPORTS (Uses reporter_id)
DROP POLICY IF EXISTS "Users can view their own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
DROP POLICY IF EXISTS "Admins can manage all reports" ON public.reports;
DROP POLICY IF EXISTS "Vendors can view their own reports" ON public.reports;
DROP POLICY IF EXISTS "Vendors can submit review reports" ON public.reports;
DROP POLICY IF EXISTS "Admins can delete reports" ON public.reports;

CREATE POLICY "Reports Access" ON public.reports FOR ALL USING (
  reporter_id = (SELECT auth.uid()) OR 
  (SELECT role FROM public.user_roles WHERE user_id = (SELECT auth.uid()) LIMIT 1) = 'admin'
);

-- DISPUTES (Uses customer_id and vendor_id)
DROP POLICY IF EXISTS "Customers can view their own disputes" ON public.disputes;
DROP POLICY IF EXISTS "Customers can create disputes" ON public.disputes;
DROP POLICY IF EXISTS "Vendors can view disputes on their orders" ON public.disputes;
DROP POLICY IF EXISTS "Admins can manage all disputes" ON public.disputes;
DROP POLICY IF EXISTS "Admins can delete disputes" ON public.disputes;

CREATE POLICY "Disputes Access" ON public.disputes FOR ALL USING (
  customer_id = (SELECT auth.uid()) OR 
  vendor_id = (SELECT auth.uid()) OR
  (SELECT role FROM public.user_roles WHERE user_id = (SELECT auth.uid()) LIMIT 1) = 'admin'
);

-- =========================================================
-- 5. FINAL STATS REFRESH
-- =========================================================
ANALYZE;
