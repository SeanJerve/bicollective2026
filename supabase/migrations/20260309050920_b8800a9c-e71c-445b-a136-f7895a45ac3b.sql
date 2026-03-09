-- Create server-side function for lucky promo claims
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
  current_time_str TEXT;
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
    CASE WHEN is_free_shipping THEN 'free_shipping' ELSE 'fixed_discount' END,
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