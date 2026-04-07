-- ============================================================
-- BICOLLECTIVE 2026: ADDRESS READ PERMISSIONS
-- ============================================================

-- Allow Vendors to see the addresses of their customers
DROP POLICY IF EXISTS "Vendors can view customer addresses for their orders" ON public.addresses;
CREATE POLICY "Vendors can view customer addresses for their orders" ON public.addresses
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            JOIN public.vendor_orders vo ON vo.order_id = o.id
            JOIN public.brands b ON b.id = vo.brand_id
            WHERE o.shipping_address_id = addresses.id
            AND b.owner_id = auth.uid()
        )
        OR user_id = auth.uid() -- Customer can still see their own
        OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin') -- Admin can see all
    );

NOTIFY pgrst, 'reload schema';
