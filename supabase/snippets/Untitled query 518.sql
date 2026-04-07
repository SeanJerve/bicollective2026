-- ============================================================
-- BICOLLECTIVE 2026: ORDER VISIBILITY RLS
-- ============================================================

-- Allow Customers to see their own vendor_orders
DROP POLICY IF EXISTS "Customers can view their own vendor_orders" ON public.vendor_orders;
CREATE POLICY "Customers can view their own vendor_orders" ON public.vendor_orders
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.orders o 
            WHERE o.id = vendor_orders.order_id 
            AND o.customer_id = auth.uid()
        )
    );

-- Allow Customers to see their own order_items
DROP POLICY IF EXISTS "Customers can view their own order_items" ON public.order_items;
CREATE POLICY "Customers can view their own order_items" ON public.order_items
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.vendor_orders vo
            JOIN public.orders o ON o.id = vo.order_id
            WHERE vo.id = order_items.vendor_order_id
            AND o.customer_id = auth.uid()
        )
    );

NOTIFY pgrst, 'reload schema';
