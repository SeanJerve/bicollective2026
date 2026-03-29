-- Fix Profile RLS: Allow anyone to view basic profile info (names, avatars)
-- This is necessary for reviews and vendor-customer interactions
DROP POLICY IF EXISTS "Anyone can view basic profile info" ON public.profiles;
CREATE POLICY "Anyone can view basic profile info" ON public.profiles
  FOR SELECT USING (true);

-- Fix Review RLS: Ensure vendors can see all reviews for their own brands
-- even if they are marked as hidden (though they shouldn't be by default)
DROP POLICY IF EXISTS "Vendors can view their own brand reviews" ON public.reviews;
CREATE POLICY "Vendors can view their own brand reviews" ON public.reviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.brands b
      WHERE b.id = reviews.brand_id
      AND b.owner_id = auth.uid()
    )
  );

-- Double check brands RLS: Ensure owners can always see their brand
DROP POLICY IF EXISTS "Owners can manage their brand" ON public.brands;
CREATE POLICY "Owners can manage their brand" ON public.brands
  FOR ALL USING (auth.uid() = owner_id);
