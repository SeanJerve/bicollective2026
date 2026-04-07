-- ============================================================
-- BICOLLECTIVE 2026: SCHEMA REPAIR & PERMISSIONS
-- ============================================================

-- 1. Ensure the column exists (fixes the error you saw)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payment_verifications' AND column_name='payment_id') THEN
        ALTER TABLE public.payment_verifications ADD COLUMN payment_id uuid REFERENCES public.payments(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Allow Vendors to see the Address of customers who bought from them
DROP POLICY IF EXISTS "Vendors can view addresses for their orders" ON public.addresses;
CREATE POLICY "Vendors can view addresses for their orders" ON public.addresses
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            JOIN public.vendor_orders vo ON vo.order_id = o.id
            CROSS JOIN public.brands b
            WHERE o.shipping_address_id = addresses.id
            AND b.owner_id = auth.uid()
            AND b.id = vo.brand_id
        )
    );

-- 3. Allow Vendors to see payment verifications for their orders
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
