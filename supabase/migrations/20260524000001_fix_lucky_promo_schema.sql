-- Rewrite claim_lucky_promo function to conform to Bicollective 3NF schema
CREATE OR REPLACE FUNCTION public.claim_lucky_promo(_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
   settings RECORD;
   claim_count INTEGER;
   today DATE := CURRENT_DATE;
   is_free_shipping BOOLEAN;
   discount_val NUMERIC;
   voucher_code TEXT;
   v_discount_id UUID;
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
 
   -- Create discount supertype
   INSERT INTO public.discounts (
     name, description, discount_type, discount_value, min_order_amount, max_discount_amount, max_uses, max_uses_per_user, starts_at, ends_at, is_active
   ) VALUES (
     CASE WHEN is_free_shipping THEN 'Lucky Free Shipping' ELSE 'Lucky Daily Reward' END,
     CASE WHEN is_free_shipping 
       THEN 'Free shipping on your next order! ₱' || settings.shipping_voucher_amount || ' off shipping fees.'
       ELSE 'You got lucky! Use this discount on your next purchase.'
     END,
     CASE WHEN is_free_shipping THEN 'free_shipping' ELSE 'fixed' END,
     discount_val,
     0,
     discount_val,
     1,
     1,
     now(),
     now() + interval '24 hours',
     true
   )
   RETURNING id INTO v_discount_id;
 
   -- Create claim (user_discount_claims)
   INSERT INTO public.user_discount_claims (
     user_id, discount_id, code, expires_at, status
   ) VALUES (
     _user_id,
     v_discount_id,
     voucher_code,
     now() + interval '24 hours',
     'active'
   );
 
   -- Record claim (lucky_promo_claims)
   INSERT INTO public.lucky_promo_claims (user_id, discount_id, claimed_date) 
   VALUES (_user_id, v_discount_id, today);
 
   RETURN jsonb_build_object(
     'success', true,
     'code', voucher_code,
     'value', discount_val,
     'type', CASE WHEN is_free_shipping THEN 'free_shipping' ELSE 'discount' END
   );
 END;
 $function$;
