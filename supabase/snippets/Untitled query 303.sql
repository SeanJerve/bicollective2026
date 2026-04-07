-- ============================================================
-- BICOLLECTIVE 2026: VENDOR & CUSTOMER VISIBILITY (RLS)
-- ============================================================

-- Restore visibility for Customers
DROP POLICY IF EXISTS "Customers can view their own vendor orders" ON public.vendor_orders;
CREATE POLICY "Customers can view their own vendor orders" ON public.vendor_orders
    FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM public.orders WHERE id = vendor_orders.order_id AND customer_id = auth.uid())
    );

-- Restore visibility for Vendors
DROP POLICY IF EXISTS "Vendors can view their own brand orders" ON public.vendor_orders;
CREATE POLICY "Vendors can view their own brand orders" ON public.vendor_orders
    FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM public.brands WHERE id = vendor_orders.brand_id AND owner_id = auth.uid())
    );

-- Reload schema
NOTIFY pgrst, 'reload schema';
