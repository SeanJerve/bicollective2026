-- 1. Helper Function to check if a user owns a brand (SECURITY DEFINER to bypass RLS during check)
CREATE OR REPLACE FUNCTION public.is_brand_owner(_brand_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.brands
    WHERE id = _brand_id AND owner_id = _user_id
  )
$$;

-- 2. Update Reviews Policy: Make all reviews readable for SELECT
-- This ensures vendors and customers can always see reviews
DROP POLICY IF EXISTS "Anyone can view visible reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can view all reviews" ON public.reviews;
DROP POLICY IF EXISTS "Vendors can view their own brand reviews" ON public.reviews;

CREATE POLICY "Anyone can view all reviews" ON public.reviews
  FOR SELECT USING (true);

-- 3. Update Profiles Policy: Make basic info readable
DROP POLICY IF EXISTS "Anyone can view basic profile info" ON public.profiles;
CREATE POLICY "Anyone can view basic profile info" ON public.profiles
  FOR SELECT USING (true);

-- 4. Ensure Vendors can also read the brands table (Already exists but let's be sure)
-- (Brands RLS already has "Owners can manage their brand" policy)
