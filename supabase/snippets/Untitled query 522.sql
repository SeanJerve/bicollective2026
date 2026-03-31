-- 1. FINAL SECURITY HARDENING (Fixes the last 3 Security Alerts)
-- These satisfy the 'search_path' security requirement for the remaining functions.

ALTER FUNCTION public.handle_new_review_notification() SET search_path = public;
ALTER FUNCTION public.handle_dispute_notification() SET search_path = public;
ALTER FUNCTION public.increment_brand_debt(uuid, numeric) SET search_path = public;


-- 2. RLS PERFORMANCE OPTIMIZATION (Fixes the 307 Performance Alerts)
-- We move complex 'EXISTS' subqueries into 'STABLE' functions which are highly optimized by Postgres.

-- A. Helper to check if a user is the customer of a specific order
CREATE OR REPLACE FUNCTION public.is_order_customer(_order_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.orders 
    WHERE id = _order_id AND customer_id = auth.uid()
  );
$$;

-- B. Helper to check if a user is the customer for a specific vendor_order
CREATE OR REPLACE FUNCTION public.is_vendor_order_customer(_vendor_order_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.vendor_orders vo
    JOIN public.orders o ON o.id = vo.order_id
    WHERE vo.id = _vendor_order_id AND o.customer_id = auth.uid()
  );
$$;

-- C. Apply optimized policies to Vendor Orders
DROP POLICY IF EXISTS "Customers can view their vendor orders" ON public.vendor_orders;
CREATE POLICY "Customers can view their vendor orders" ON public.vendor_orders
FOR SELECT USING (public.is_order_customer(order_id));

DROP POLICY IF EXISTS "Customers can create vendor orders" ON public.vendor_orders;
CREATE POLICY "Customers can create vendor orders" ON public.vendor_orders
FOR INSERT WITH CHECK (public.is_order_customer(order_id));

DROP POLICY IF EXISTS "Customers can update payment proof" ON public.vendor_orders;
CREATE POLICY "Customers can update payment proof" ON public.vendor_orders
FOR UPDATE USING (public.is_order_customer(order_id));

-- D. Apply optimized policies to Order Items
DROP POLICY IF EXISTS "Users can view their order items" ON public.order_items;
CREATE POLICY "Users can view their order items" ON public.order_items
FOR SELECT USING (public.is_vendor_order_customer(vendor_order_id));

DROP POLICY IF EXISTS "Users can create order items" ON public.order_items;
CREATE POLICY "Users can create order items" ON public.order_items
FOR INSERT WITH CHECK (public.is_vendor_order_customer(vendor_order_id));

-- E. Performance Index for role checking
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role_composite ON public.user_roles(user_id, role);
