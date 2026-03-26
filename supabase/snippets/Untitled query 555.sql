-- 1. Add missing fields to brands
ALTER TABLE public.brands 
ADD COLUMN IF NOT EXISTS store_sale_percent integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS store_sale_ends_at date;

-- 2. Add missing fields to products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS listing_type text DEFAULT 'regular',
ADD COLUMN IF NOT EXISTS release_date date,
ADD COLUMN IF NOT EXISTS preorder_discount_percent numeric DEFAULT 0;

-- 3. Fix profile-pictures RLS policies
DO $$
BEGIN
    -- Only enable RLS if it isn't already enabled to be safe
    -- The bucket might need policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Public can view profile pictures'
    ) THEN
        CREATE POLICY "Public can view profile pictures"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'profile-pictures');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Users can upload their own profile picture'
    ) THEN
        CREATE POLICY "Users can upload their own profile picture"
        ON storage.objects FOR INSERT
        WITH CHECK (
            bucket_id = 'profile-pictures' AND
            auth.uid()::text = (storage.foldername(name))[1]
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Users can update their own profile picture'
    ) THEN
        CREATE POLICY "Users can update their own profile picture"
        ON storage.objects FOR UPDATE
        USING (
            bucket_id = 'profile-pictures' AND
            auth.uid()::text = (storage.foldername(name))[1]
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Users can delete their own profile picture'
    ) THEN
        CREATE POLICY "Users can delete their own profile picture"
        ON storage.objects FOR DELETE
        USING (
            bucket_id = 'profile-pictures' AND
            auth.uid()::text = (storage.foldername(name))[1]
        );
    END IF;

    -- ==========================================
    -- CREATE brand-files BUCKET
    -- ==========================================
    INSERT INTO storage.buckets (id, name, public) VALUES ('brand-files', 'brand-files', true) ON CONFLICT (id) DO NOTHING;

    CREATE POLICY "Anyone can view brand_files" ON storage.objects FOR SELECT USING ( bucket_id = 'brand-files' );
    CREATE POLICY "Users can insert their own brand_files" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'brand-files' );
    CREATE POLICY "Users can update their own brand_files" ON storage.objects FOR UPDATE TO authenticated USING ( bucket_id = 'brand-files' );
    CREATE POLICY "Users can delete their own brand_files" ON storage.objects FOR DELETE TO authenticated USING ( bucket_id = 'brand-files' );

    -- ==========================================
    -- CREATE review-images BUCKET
    -- ==========================================
    INSERT INTO storage.buckets (id, name, public) VALUES ('review-images', 'review-images', true) ON CONFLICT (id) DO NOTHING;

    CREATE POLICY "Anyone can view review_images" ON storage.objects FOR SELECT USING ( bucket_id = 'review-images' );
    CREATE POLICY "Users can insert their own review_images" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'review-images' );
    CREATE POLICY "Users can update their own review_images" ON storage.objects FOR UPDATE TO authenticated USING ( bucket_id = 'review-images' );
    CREATE POLICY "Users can delete their own review_images" ON storage.objects FOR DELETE TO authenticated USING ( bucket_id = 'review-images' );
END $$;

-- 4. Fix voucher claim function cast error
CREATE OR REPLACE FUNCTION public.claim_lucky_promo(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  settings RECORD;
  today DATE := CURRENT_DATE;
  claim_count INTEGER;
  is_free_shipping BOOLEAN;
  discount_val NUMERIC;
  voucher_code TEXT;
  voucher_record RECORD;
BEGIN
  -- Verify the caller is the user
  IF auth.uid() != _user_id THEN
    RETURN jsonb_build_object('error', 'Unauthorized');
  END IF;

  -- Fetch settings
  SELECT * INTO settings FROM lucky_promo_settings LIMIT 1;
  IF settings IS NULL OR NOT settings.is_active THEN
    RETURN jsonb_build_object('error', 'Lucky promo is not active');
  END IF;

  -- Check active hours
  IF settings.active_hours_start IS NOT NULL AND settings.active_hours_end IS NOT NULL THEN
    IF CURRENT_TIME < settings.active_hours_start OR CURRENT_TIME > settings.active_hours_end THEN
      RETURN jsonb_build_object('error', 'Lucky promo is not available right now');
    END IF;
  END IF;

  -- Check daily claim limit
  SELECT COUNT(*) INTO claim_count
  FROM lucky_promo_claims
  WHERE user_id = _user_id AND claimed_date = today;

  IF claim_count >= settings.daily_claim_limit THEN
    RETURN jsonb_build_object('error', 'Daily claim limit reached');
  END IF;

  -- Generate reward (server-side randomization)
  is_free_shipping := random() * 100 < settings.shipping_voucher_chance;
  IF is_free_shipping THEN
    discount_val := settings.shipping_voucher_amount;
  ELSE
    discount_val := floor(random() * (settings.max_discount - settings.min_discount + 1)) + settings.min_discount;
  END IF;
  voucher_code := 'LUCKY-' || upper(substr(gen_random_uuid()::text, 1, 8));

  -- Create voucher
  INSERT INTO vouchers (
    user_id, name, description, code, type, discount_value, source, expires_at
  ) VALUES (
    _user_id,
    CASE WHEN is_free_shipping THEN 'Lucky Free Shipping' ELSE 'Lucky Daily Reward' END,
    CASE WHEN is_free_shipping 
      THEN 'Free shipping on your next order! ₱' || settings.shipping_voucher_amount || ' off shipping fees.'
      ELSE 'You got lucky! Use this discount on your next purchase.'
    END,
    voucher_code,
    CAST(CASE WHEN is_free_shipping THEN 'free_shipping' ELSE 'fixed_discount' END AS promotion_type),
    discount_val,
    'lucky_promo',
    now() + interval '24 hours'
  )
  RETURNING * INTO voucher_record;

  -- Record claim
  INSERT INTO lucky_promo_claims (user_id, voucher_id) VALUES (_user_id, voucher_record.id);

  RETURN jsonb_build_object(
    'success', true,
    'code', voucher_code,
    'value', discount_val,
    'type', CASE WHEN is_free_shipping THEN 'free_shipping' ELSE 'discount' END
  );
END;
$$;
