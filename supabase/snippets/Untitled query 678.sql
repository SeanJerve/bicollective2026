-- ============================================================
-- BICOLLECTIVE 2026: VENDOR PERMISSIONS FOR ADDRESSES & PROOFS
-- ============================================================

-- Allow Vendors to see the Address of customers who bought from them
DROP POLICY IF EXISTS "Vendors can view addresses for their orders" ON public.addresses;
CREATE POLICY "Vendors can view addresses for their orders" ON public.addresses
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            JOIN public.vendor_orders vo ON vo.order_id = o.id
            JOIN public.brands b ON b.id = vo.brand_id
            WHERE o.shipping_address_id = addresses.id
            AND b.owner_id = auth.uid()
        )
    );

-- Allow Vendors to see payment verifications for their orders
DROP POLICY IF EXISTS "Vendors can view payment verifications for their orders" ON public.payment_verifications;
CREATE POLICY "Vendors can view payment verifications for their orders" ON public.payment_verifications
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.payments p
            JOIN public.vendor_orders vo ON vo.order_id = p.order_id
            JOIN public.brands b ON b.id = vo.brand_id
            WHERE p.id = payment_verifications.payment_id
            AND b.owner_id = auth.uid()
        )
    );

NOTIFY pgrst, 'reload schema';
