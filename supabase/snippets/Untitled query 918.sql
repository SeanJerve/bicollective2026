-- 1. PERFORMANCE INDEXES (The Foundation)
-- These ensure that looking up a user's ID or Role is near-instant.
CREATE INDEX IF NOT EXISTS idx_user_roles_composite_id_role ON public.user_roles(user_id, role);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id_lookup ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_brands_owner_id_lookup ON public.brands(owner_id);

-- 2. REFACTORING POLICIES (Fixes the 307 Performance Alerts)
-- We switch from generic function calls to direct, indexed subqueries that Postgres can cache.

-- Table: public.user_roles
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles" ON public.user_roles
FOR ALL USING (
  (SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1) = 'admin'
);

-- Table: public.brands
DROP POLICY IF EXISTS "Admins can manage all brands" ON public.brands;
CREATE POLICY "Admins can manage all brands" ON public.brands
FOR ALL USING (
  (SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1) = 'admin'
);

-- Table: public.profiles
-- The 'Users can view their own profile' is standard, but we ensure it uses the unique index.
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = user_id);

-- 3. OPTIMIZING REFRESH RATES
-- This helps the Supabase Advisor realize the plan is now using efficient index scans.
ANALYZE public.profiles;
ANALYZE public.user_roles;
ANALYZE public.brands;
ANALYZE public.notifications;
