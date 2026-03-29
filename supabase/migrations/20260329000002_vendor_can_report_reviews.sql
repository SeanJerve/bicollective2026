-- Allow vendors to report reviews (insert into reports table with review_id)
-- Vendors can only report reviews for products/brands they own
DROP POLICY IF EXISTS "Vendors can submit review reports" ON public.reports;
CREATE POLICY "Vendors can submit review reports"
ON public.reports
FOR INSERT
TO authenticated
WITH CHECK (
  reporter_id = auth.uid()
  AND review_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.reviews rv
    JOIN public.brands b ON b.id = rv.brand_id
    WHERE rv.id = reports.review_id
    AND b.owner_id = auth.uid()
  )
);

-- Vendors can view reports they submitted
DROP POLICY IF EXISTS "Vendors can view their own reports" ON public.reports;
CREATE POLICY "Vendors can view their own reports"
ON public.reports
FOR SELECT
TO authenticated
USING (reporter_id = auth.uid());

-- Allow admins to delete reviews (for resolving reports)
DROP POLICY IF EXISTS "Admins can update review visibility" ON public.reviews;
CREATE POLICY "Admins can update review visibility"
ON public.reviews
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
