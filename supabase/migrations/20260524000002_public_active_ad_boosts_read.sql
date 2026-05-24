-- Customers need to read active boosts so products sort into featured sections.
-- Vendors/admins still manage boosts via existing policies (RLS policies are OR'd).
CREATE POLICY "Public can view active ad boosts"
ON public.ad_boosts
FOR SELECT
USING (
  status = 'active'
  AND (starts_at IS NULL OR starts_at <= now())
  AND (ends_at IS NULL OR ends_at >= now())
);
