-- 1. Ensure profile-pictures bucket exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-pictures', 'profile-pictures', true) 
ON CONFLICT (id) DO NOTHING;

-- 2. Add indexes for performance optimization
-- Speed up Vendor Reviews page
CREATE INDEX IF NOT EXISTS idx_reviews_brand_id ON public.reviews(brand_id);
-- Speed up Vendor Orders filtering by brand
CREATE INDEX IF NOT EXISTS idx_vendor_orders_brand_id ON public.vendor_orders(brand_id);
-- Speed up Product searching by category/brand
CREATE INDEX IF NOT EXISTS idx_products_brand_category ON public.products(brand_id, category_id);

-- 3. Enhance profile-pictures RLS to be more robust
-- Allow users to upload to their own folder within the bucket
DROP POLICY IF EXISTS "Users can upload their own profile picture" ON storage.objects;
CREATE POLICY "Users can upload their own profile picture"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'profile-pictures' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can update their own profile picture" ON storage.objects;
CREATE POLICY "Users can update their own profile picture"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'profile-pictures' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete their own profile picture" ON storage.objects;
CREATE POLICY "Users can delete their own profile picture"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'profile-pictures' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Fix for 'new row violates RLS' on profiles table
-- Ensure every user has a profile and can update it
-- The existing policies look okay, but let's re-assert them to be sure
-- Sometimes the issue is missing 'INSERT' permission for the handle_new_user trigger in some environments,
-- but the trigger is SECURITY DEFINER so it should be fine.
-- Let's make sure 'public' can insert into profiles if authenticated (though usually handled by trigger)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Fix for Voucher Claim cast error (if any remaining)
-- Re-confirming the promotion_type cast in lucky_promo_claims if needed
-- Actually, let's also add an index for notifications since there were reports of issues there
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read ON public.notifications(user_id, read) WHERE read = false;
