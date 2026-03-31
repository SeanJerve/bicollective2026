-- 1. FINAL SECURITY HARDENING (Fixes the last 3 Security Alerts)
ALTER FUNCTION public.handle_new_review_notification() SET search_path = public;
ALTER FUNCTION public.handle_dispute_notification() SET search_path = public;
ALTER FUNCTION public.increment_brand_debt(uuid, numeric) SET search_path = public;

-- 2. RLS PERFORMANCE REFACTORING (Fixes 307+ Performance Alerts)
-- We wrap auth function calls in subqueries to enable Postgres Plans to cache them.

-- PROFILES
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles 
FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles 
FOR UPDATE USING (user_id = (SELECT auth.uid()));

-- USER ROLES
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles 
FOR SELECT USING (user_id = (SELECT auth.uid()));

-- CATEGORIES (Consolidating Policies)
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Categories Access Policy" ON public.categories
FOR SELECT USING (true); -- Public read is always safe since it's just categories

CREATE POLICY "Admin Category Management" ON public.categories
FOR ALL USING ((SELECT role FROM public.user_roles WHERE user_id = (SELECT auth.uid()) LIMIT 1) = 'admin');

-- BRANDS (Consolidating Deletion & Management)
DROP POLICY IF EXISTS "Admins can delete brands" ON public.brands;
DROP POLICY IF EXISTS "Admins can manage all brands" ON public.brands;
DROP POLICY IF EXISTS "Owners can manage their brand" ON public.brands;

CREATE POLICY "Brand Management Policy" ON public.brands
FOR ALL USING (
  owner_id = (SELECT auth.uid()) OR 
  (SELECT role FROM public.user_roles WHERE user_id = (SELECT auth.uid()) LIMIT 1) = 'admin'
);

-- AD BOOSTS (Consolidating overlapping policies)
DROP POLICY IF EXISTS "Vendors can view their own boosts" ON public.ad_boosts;
DROP POLICY IF EXISTS "Vendors can insert their own boosts" ON public.ad_boosts;
DROP POLICY IF EXISTS "Admins can view all boosts" ON public.ad_boosts;

CREATE POLICY "Ad Boosts Access" ON public.ad_boosts
FOR ALL USING (
  brand_id IN (SELECT id FROM public.brands WHERE owner_id = (SELECT auth.uid())) OR
  (SELECT role FROM public.user_roles WHERE user_id = (SELECT auth.uid()) LIMIT 1) = 'admin'
);

-- NOTIFICATIONS & MESSAGES (Performance wrapping)
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications 
FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update (mark as read) their own notifications" ON public.notifications;
CREATE POLICY "Users can update (mark as read) their own notifications" ON public.notifications 
FOR UPDATE USING (user_id = (SELECT auth.uid()));

-- 3. UPDATING STATISTICS
ANALYZE public.profiles;
ANALYZE public.user_roles;
ANALYZE public.brands;
ANALYZE public.categories;
ANALYZE public.ad_boosts;
ANALYZE public.notifications;
ANALYZE public.orders;
ANALYZE public.vendor_orders;
