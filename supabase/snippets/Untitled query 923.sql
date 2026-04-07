-- ============================================================
-- BICOLLECTIVE 2026: FINAL PERMISSIONS REPAIR
-- ============================================================

-- 1. Fix the Address Permission for Vendors (Optimized Join)
DROP POLICY IF EXISTS "Vendors can view addresses for their orders" ON public.addresses;
CREATE POLICY "Vendors can view addresses for their orders" ON public.addresses
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.vendor_orders vo
            JOIN public.orders o ON o.id = vo.order_id
            JOIN public.brands b ON b.id = vo.brand_id
            WHERE o.shipping_address_id = addresses.id
            AND b.owner_id = auth.uid()
        )
    );

-- 2. Ensure Payment IDs work (In case previous run partially failed)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payment_verifications' AND column_name='payment_id') THEN
        ALTER TABLE public.payment_verifications ADD COLUMN payment_id uuid REFERENCES public.payments(id) ON DELETE CASCADE;
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';
