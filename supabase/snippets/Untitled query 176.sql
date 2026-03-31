-- =========================================================
-- 1. SYSTEM FUNCTIONS (Performance Wrapper)
-- =========================================================
-- No changes needed here, but we will wrap these in (SELECT ) in policies below.

-- =========================================================
-- 2. CORE TABLES CONSOLIDATION (Resolves Multiple Policies & Performance)
-- =========================================================

-- BRANDS
DROP POLICY IF EXISTS "Anyone can view approved/verified brands" ON public.brands;
DROP POLICY IF EXISTS "Brand Management Policy" ON public.brands;
CREATE POLICY "Brands Unified Access" ON public.brands FOR ALL USING (
  status IN ('approved', 'verified') OR 
  owner_id = (SELECT auth.uid()) OR 
  (SELECT public.has_role((SELECT auth.uid()), 'admin'))
);

-- CATEGORIES
DROP POLICY IF EXISTS "Categories Access Policy" ON public.categories;
DROP POLICY IF EXISTS "Admin Category Management" ON public.categories;
CREATE POLICY "Categories Unified Access" ON public.categories FOR ALL USING (
  true -- Anyone can view
) WITH CHECK (
  (SELECT public.has_role((SELECT auth.uid()), 'admin'))
);

-- PRODUCTS
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Brand owners can manage their products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage all products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete all products" ON public.products;
CREATE POLICY "Products Unified Access" ON public.products FOR ALL USING (
  is_active = true OR 
  brand_id IN (SELECT id FROM public.brands WHERE owner_id = (SELECT auth.uid())) OR
  (SELECT public.has_role((SELECT auth.uid()), 'admin'))
);

-- PROFILES
DROP POLICY IF EXISTS "Anyone can view basic profile info" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Profiles Unified Access" ON public.profiles FOR ALL USING (
  user_id = (SELECT auth.uid()) OR 
  (SELECT public.has_role((SELECT auth.uid()), 'admin'))
) WITH CHECK (
  user_id = (SELECT auth.uid())
);

-- REVIEWS
DROP POLICY IF EXISTS "Anyone can view all reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can view visible reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can create reviews for completed orders" ON public.reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can manage all reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can update review visibility" ON public.reviews;
DROP POLICY IF EXISTS "Admins can delete reviews" ON public.reviews;
DROP POLICY IF EXISTS "Vendors can delete reviews on their products" ON public.reviews;
CREATE POLICY "Reviews Unified Access" ON public.reviews FOR ALL USING (
  is_visible = true OR 
  user_id = (SELECT auth.uid()) OR 
  brand_id IN (SELECT id FROM public.brands WHERE owner_id = (SELECT auth.uid())) OR
  (SELECT public.has_role((SELECT auth.uid()), 'admin'))
);

-- USER ROLES
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "User Roles Unified Access" ON public.user_roles FOR ALL USING (
  user_id = (SELECT auth.uid()) OR 
  (SELECT public.has_role((SELECT auth.uid()), 'admin'))
);

-- =========================================================
-- 3. VENDOR INFRASTRUCTURE CONSOLIDATION
-- =========================================================

-- VENDOR APPLICATIONS
DROP POLICY IF EXISTS "Users can view their own applications" ON public.vendor_applications;
DROP POLICY IF EXISTS "Users can create their own applications" ON public.vendor_applications;
DROP POLICY IF EXISTS "Users can update their own pending applications" ON public.vendor_applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON public.vendor_applications;
DROP POLICY IF EXISTS "Admins can update all applications" ON public.vendor_applications;
DROP POLICY IF EXISTS "Admins can delete applications" ON public.vendor_applications;
CREATE POLICY "Vendor Applications Unified Access" ON public.vendor_applications FOR ALL USING (
  user_id = (SELECT auth.uid()) OR 
  (SELECT public.has_role((SELECT auth.uid()), 'admin'))
);

-- VENDOR VERIFICATIONS
DROP POLICY IF EXISTS "Brand owners can view their verifications" ON public.vendor_verifications;
DROP POLICY IF EXISTS "Brand owners can create verifications" ON public.vendor_verifications;
DROP POLICY IF EXISTS "Brand owners can update pending verifications" ON public.vendor_verifications;
DROP POLICY IF EXISTS "Admins can view all verifications" ON public.vendor_verifications;
DROP POLICY IF EXISTS "Admins can update all verifications" ON public.vendor_verifications;
DROP POLICY IF EXISTS "Admins can delete verifications" ON public.vendor_verifications;
CREATE POLICY "Vendor Verifications Unified Access" ON public.vendor_verifications FOR ALL USING (
  brand_id IN (SELECT id FROM public.brands WHERE owner_id = (SELECT auth.uid())) OR 
  (SELECT public.has_role((SELECT auth.uid()), 'admin'))
);

-- =========================================================
-- 4. UTILITY & FEATURES (InitPlan Fixes)
-- =========================================================

-- CART ITEMS
DROP POLICY IF EXISTS "Users can manage their own cart" ON public.cart_items;
CREATE POLICY "Cart Items Access" ON public.cart_items FOR ALL USING (
  user_id = (SELECT auth.uid())
);

-- WISHLISTS
DROP POLICY IF EXISTS "Users can view their own wishlist" ON public.wishlists;
DROP POLICY IF EXISTS "Users can add to their own wishlist" ON public.wishlists;
DROP POLICY IF EXISTS "Users can remove from their own wishlist" ON public.wishlists;
CREATE POLICY "Wishlists Unified Access" ON public.wishlists FOR ALL USING (
  user_id = (SELECT auth.uid())
);

-- MESSAGES
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can mark messages as read" ON public.messages;
CREATE POLICY "Messages Unified Access" ON public.messages FOR ALL USING (
  sender_id = (SELECT auth.uid()) OR receiver_id = (SELECT auth.uid())
);

-- LUCKY PROMO & TRANSACTIONS
DROP POLICY IF EXISTS "Admins can manage lucky promo settings" ON public.lucky_promo_settings;
CREATE POLICY "Lucky Promo Settings Admin" ON public.lucky_promo_settings FOR ALL USING (
  (SELECT public.has_role((SELECT auth.uid()), 'admin'))
);

DROP POLICY IF EXISTS "Vendors can view their own transactions" ON public.platform_transactions;
DROP POLICY IF EXISTS "Vendors can insert their own transactions" ON public.platform_transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.platform_transactions;
CREATE POLICY "Platform Transactions Unified Access" ON public.platform_transactions FOR ALL USING (
  brand_id IN (SELECT id FROM public.brands WHERE owner_id = (SELECT auth.uid())) OR
  (SELECT public.has_role((SELECT auth.uid()), 'admin'))
);

-- =========================================================
-- 5. REFRESH
-- =========================================================
ANALYZE;
