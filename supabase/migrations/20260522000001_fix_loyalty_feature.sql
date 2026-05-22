-- ============================================================
-- BICOLLECTIVE 2026: Fix Loyalty Feature & Vouchers
-- 1. Redefine award_loyalty_voucher to target the 3NF discounts schema.
-- 2. Redefine update_loyalty_on_delivery with user initialization.
-- 3. Run retroactive calculation for 65 existing delivered orders.
-- ============================================================

-- Drop functions to recreate cleanly
DROP FUNCTION IF EXISTS public.award_loyalty_voucher(uuid, loyalty_milestone) CASCADE;
DROP FUNCTION IF EXISTS public.update_loyalty_on_delivery() CASCADE;

-- 1. Create award_loyalty_voucher function
CREATE OR REPLACE FUNCTION public.award_loyalty_voucher(
  _user_id UUID,
  _milestone loyalty_milestone
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_discount_id UUID;
  claim_id UUID;
  voucher_name TEXT;
  voucher_value NUMERIC;
  expiry_days INTEGER := 30;
  generated_code TEXT;
  expiry_timestamp TIMESTAMPTZ;
BEGIN
  -- Determine voucher details based on milestone
  IF _milestone = 'five_deliveries' THEN
    voucher_name := 'Loyalty Reward: 5 Deliveries';
    voucher_value := 100;
  ELSIF _milestone = 'ten_unique_sellers' THEN
    voucher_name := 'Explorer Reward: 10 Sellers';
    voucher_value := 500;
  ELSE
    RETURN NULL;
  END IF;
  
  expiry_timestamp := now() + (expiry_days || ' days')::interval;
  generated_code := 'LOYALTY-' || upper(substr(gen_random_uuid()::text, 1, 8));
  
  -- Create discount supertype record
  INSERT INTO public.discounts (
    name,
    description,
    discount_type,
    discount_value,
    min_order_amount,
    max_discount_amount,
    max_uses,
    max_uses_per_user,
    current_uses,
    is_stackable,
    starts_at,
    ends_at,
    is_active
  ) VALUES (
    voucher_name,
    'Thank you for your loyalty! Enjoy this discount on your next purchase.',
    'fixed',
    voucher_value,
    0,
    voucher_value,
    1,
    1,
    0,
    false,
    now(),
    expiry_timestamp,
    true
  )
  RETURNING id INTO new_discount_id;
  
  -- Create user discount claim record
  INSERT INTO public.user_discount_claims (
    user_id,
    discount_id,
    code,
    expires_at,
    status
  ) VALUES (
    _user_id,
    new_discount_id,
    generated_code,
    expiry_timestamp,
    'active'
  )
  RETURNING id INTO claim_id;
  
  RETURN claim_id;
END;
$$;

-- 2. Create update_loyalty_on_delivery function
CREATE OR REPLACE FUNCTION public.update_loyalty_on_delivery()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  customer UUID;
  loyalty_rec_id UUID;
  current_progress RECORD;
  seller_count INTEGER;
BEGIN
  -- Only trigger on status change to 'delivered'
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    -- Get customer from parent order
    SELECT customer_id INTO customer FROM public.orders WHERE id = NEW.order_id;
    
    IF customer IS NOT NULL THEN
      -- Ensure loyalty_progress record exists for the customer
      INSERT INTO public.loyalty_progress (user_id, total_delivered_orders, milestone_5_deliveries_claimed, milestone_10_sellers_claimed)
      VALUES (customer, 0, false, false)
      ON CONFLICT (user_id) DO NOTHING;
      
      -- Get the loyalty_progress ID
      SELECT id INTO loyalty_rec_id FROM public.loyalty_progress WHERE user_id = customer;
      
      -- Link seller to user_purchased_sellers (junction table)
      INSERT INTO public.user_purchased_sellers (loyalty_id, brand_id)
      VALUES (loyalty_rec_id, NEW.brand_id)
      ON CONFLICT DO NOTHING;

      -- Update loyalty progress: increment total_delivered_orders and update updated_at
      UPDATE public.loyalty_progress
      SET total_delivered_orders = total_delivered_orders + 1,
          updated_at = now()
      WHERE id = loyalty_rec_id;
      
      -- Query updated stats
      SELECT total_delivered_orders, milestone_5_deliveries_claimed, milestone_10_sellers_claimed
      INTO current_progress
      FROM public.loyalty_progress
      WHERE id = loyalty_rec_id;
      
      -- Count unique sellers purchased
      SELECT count(*) INTO seller_count
      FROM public.user_purchased_sellers
      WHERE loyalty_id = loyalty_rec_id;
      
      -- 5 deliveries milestone
      IF current_progress.total_delivered_orders >= 5 AND NOT current_progress.milestone_5_deliveries_claimed THEN
        PERFORM public.award_loyalty_voucher(customer, 'five_deliveries');
        UPDATE public.loyalty_progress
        SET milestone_5_deliveries_claimed = true,
            updated_at = now()
        WHERE id = loyalty_rec_id;
      END IF;
      
      -- 10 unique sellers milestone
      IF seller_count >= 10 AND NOT current_progress.milestone_10_sellers_claimed THEN
        PERFORM public.award_loyalty_voucher(customer, 'ten_unique_sellers');
        UPDATE public.loyalty_progress
        SET milestone_10_sellers_claimed = true,
            updated_at = now()
        WHERE id = loyalty_rec_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. Recreate the trigger
DROP TRIGGER IF EXISTS trigger_loyalty_on_delivery ON public.vendor_orders;
CREATE TRIGGER trigger_loyalty_on_delivery
AFTER UPDATE ON public.vendor_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_loyalty_on_delivery();

-- 4. Retroactive calculation block for existing delivered vendor orders
DO $$
DECLARE
    rec RECORD;
    customer UUID;
    loyalty_rec_id UUID;
    seller_count INTEGER;
    current_progress RECORD;
BEGIN
    -- Truncate existing progress to rebuild from source of truth
    TRUNCATE TABLE public.user_purchased_sellers CASCADE;
    TRUNCATE TABLE public.loyalty_progress CASCADE;
    
    -- Process all delivered vendor orders chronologically
    FOR rec IN 
        SELECT vo.id, vo.order_id, vo.brand_id, vo.delivered_at, o.customer_id
        FROM public.vendor_orders vo
        JOIN public.orders o ON o.id = vo.order_id
        WHERE vo.status = 'delivered'
        ORDER BY COALESCE(vo.delivered_at, vo.updated_at, vo.created_at) ASC
    LOOP
        customer := rec.customer_id;
        
        -- Ensure loyalty_progress record exists
        INSERT INTO public.loyalty_progress (user_id, total_delivered_orders, milestone_5_deliveries_claimed, milestone_10_sellers_claimed, updated_at)
        VALUES (customer, 0, false, false, COALESCE(rec.delivered_at, now()))
        ON CONFLICT (user_id) DO NOTHING;
        
        -- Get current progress ID
        SELECT id INTO loyalty_rec_id FROM public.loyalty_progress WHERE user_id = customer;
        
        -- Insert unique seller
        INSERT INTO public.user_purchased_sellers (loyalty_id, brand_id)
        VALUES (loyalty_rec_id, rec.brand_id)
        ON CONFLICT DO NOTHING;
        
        -- Increment total delivered count
        UPDATE public.loyalty_progress
        SET total_delivered_orders = total_delivered_orders + 1,
            updated_at = COALESCE(rec.delivered_at, now())
        WHERE id = loyalty_rec_id;
        
        -- Query updated stats
        SELECT total_delivered_orders, milestone_5_deliveries_claimed, milestone_10_sellers_claimed
        INTO current_progress
        FROM public.loyalty_progress
        WHERE id = loyalty_rec_id;
        
        SELECT count(*) INTO seller_count
        FROM public.user_purchased_sellers
        WHERE loyalty_id = loyalty_rec_id;
        
        -- 5 deliveries milestone
        IF current_progress.total_delivered_orders >= 5 AND NOT current_progress.milestone_5_deliveries_claimed THEN
            PERFORM public.award_loyalty_voucher(customer, 'five_deliveries');
            UPDATE public.loyalty_progress
            SET milestone_5_deliveries_claimed = true,
                updated_at = COALESCE(rec.delivered_at, now())
            WHERE id = loyalty_rec_id;
        END IF;
        
        -- 10 unique sellers milestone
        IF seller_count >= 10 AND NOT current_progress.milestone_10_sellers_claimed THEN
            PERFORM public.award_loyalty_voucher(customer, 'ten_unique_sellers');
            UPDATE public.loyalty_progress
            SET milestone_10_sellers_claimed = true,
                updated_at = COALESCE(rec.delivered_at, now())
            WHERE id = loyalty_rec_id;
        END IF;
    END LOOP;
END;
$$;
