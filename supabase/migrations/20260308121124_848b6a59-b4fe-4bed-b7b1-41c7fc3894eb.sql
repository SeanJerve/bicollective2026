-- Allow all authenticated users to view basic profile info (for reviews display)
CREATE POLICY "Anyone can view basic profile info"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Removed storage policy to fix local startup