-- ============================================================
-- BICOLLECTIVE 2026: DISCOUNTS SECURITY (RLS) - FINAL VERIFIED
-- ============================================================

-- 1. Enable RLS
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_vouchers ENABLE ROW LEVEL SECURITY;

-- 2. DISCOUNTS Table Policies
DROP POLICY IF EXISTS "Anyone can view active discounts" ON public.discounts;
CREATE POLICY "Anyone can view active discounts" ON public.discounts
    FOR SELECT TO authenticated USING (is_active = true);

-- ADMIN ACCESS (Verified: Using user_roles table)
DROP POLICY IF EXISTS "Admins have full access to discounts" ON public.discounts;
CREATE POLICY "Admins have full access to discounts" ON public.discounts
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
    );

-- VENDOR CREATE ACCESS (Verified: Using brands table ownership)
DROP POLICY IF EXISTS "Vendors can create discounts" ON public.discounts;
CREATE POLICY "Vendors can create discounts" ON public.discounts
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (SELECT 1 FROM public.brands WHERE owner_id = auth.uid())
    );

-- 3. VENDOR_VOUCHERS Table Policies
DROP POLICY IF EXISTS "Vendors can manage their own vouchers" ON public.vendor_vouchers;
CREATE POLICY "Vendors can manage their own vouchers" ON public.vendor_vouchers
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.brands WHERE id = vendor_vouchers.brand_id AND owner_id = auth.uid())
    );

-- 4. Reload schema
NOTIFY pgrst, 'reload schema';
