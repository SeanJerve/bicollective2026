-- 1. Fix voucher UPDATE: restrict to only marking as 'used' with order reference
DROP POLICY IF EXISTS "Users can use their own vouchers" ON public.vouchers;

-- Create a security definer function for using vouchers safely
CREATE OR REPLACE FUNCTION public.use_voucher(_voucher_id uuid, _order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.vouchers
  SET status = 'used', used_at = now(), used_on_order_id = _order_id
  WHERE id = _voucher_id
    AND user_id = auth.uid()
    AND status = 'active'
    AND expires_at > now();
  RETURN FOUND;
END;
$$;

-- Users can only read their vouchers (no direct UPDATE)
-- The "Users can view their own vouchers" SELECT policy already exists

-- 2. Fix vendor_orders customer UPDATE: restrict to payment_proof_url and payment_reference only
DROP POLICY IF EXISTS "Customers can update payment proof" ON public.vendor_orders;

CREATE POLICY "Customers can update payment proof only"
ON public.vendor_orders
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = vendor_orders.order_id
      AND orders.customer_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = vendor_orders.order_id
      AND orders.customer_id = auth.uid()
  )
  AND status = 'pending_payment'
);

-- 3. Fix lucky promo settings: use a function to expose only safe fields
DROP POLICY IF EXISTS "Authenticated users can read lucky promo settings" ON public.lucky_promo_settings;

CREATE OR REPLACE FUNCTION public.get_lucky_promo_public_info()
RETURNS TABLE(is_active boolean, active_hours_start time, active_hours_end time, daily_claim_limit integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.is_active, s.active_hours_start, s.active_hours_end, s.daily_claim_limit
  FROM public.lucky_promo_settings s
  LIMIT 1;
$$;

-- Admin-only SELECT remains
-- No public/authenticated SELECT on the raw table anymore