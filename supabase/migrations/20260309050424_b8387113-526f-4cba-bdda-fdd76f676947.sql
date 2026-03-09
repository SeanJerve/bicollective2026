-- 1. Fix profiles: Replace blanket SELECT with scoped policies
DROP POLICY IF EXISTS "Anyone can view basic profile info" ON public.profiles;

-- Users can view their own full profile
-- (Already exists: "Users can view their own profile")

-- For cross-user lookups (e.g., showing seller name on orders), create a limited policy
-- that only exposes non-sensitive fields via a security definer function
CREATE OR REPLACE FUNCTION public.get_profile_display_name(_user_id uuid)
RETURNS TABLE(user_id uuid, full_name text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.full_name, p.avatar_url
  FROM public.profiles p
  WHERE p.user_id = _user_id;
$$;

-- Authenticated users can only read their own profile row
CREATE POLICY "Authenticated users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2. Fix vouchers: Restrict INSERT to service role / admin only
DROP POLICY IF EXISTS "Authenticated users can receive vouchers" ON public.vouchers;

-- Only admins and system (service role) can create vouchers
CREATE POLICY "Only admins can insert vouchers"
ON public.vouchers
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. Fix lucky_promo_settings: Restrict to authenticated users
DROP POLICY IF EXISTS "Anyone can read lucky promo settings" ON public.lucky_promo_settings;

CREATE POLICY "Authenticated users can read lucky promo settings"
ON public.lucky_promo_settings
FOR SELECT
TO authenticated
USING (true);