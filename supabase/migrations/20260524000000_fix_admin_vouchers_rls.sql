-- Fix RLS policy on user_discount_claims for Admin bulk-creating/managing claims
DROP POLICY IF EXISTS "Admins can manage all claims" ON public.user_discount_claims;

CREATE POLICY "Admins can manage all claims" ON public.user_discount_claims
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_roles.user_id = auth.uid() 
              AND user_roles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_roles.user_id = auth.uid() 
              AND user_roles.role = 'admin'
        )
    );
