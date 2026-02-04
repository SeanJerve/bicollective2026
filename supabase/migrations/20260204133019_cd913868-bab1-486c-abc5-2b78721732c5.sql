-- Fix overly permissive RLS policies for vouchers and loyalty_progress

-- Drop and recreate the vouchers insert policy with proper check
DROP POLICY IF EXISTS "System can create vouchers for users" ON vouchers;

-- Allow authenticated users to receive vouchers (system creates them via security definer functions)
CREATE POLICY "Authenticated users can receive vouchers"
ON vouchers FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Drop and recreate loyalty_progress policy
DROP POLICY IF EXISTS "System can manage loyalty progress" ON loyalty_progress;

-- Users can insert their own loyalty progress (triggered by first order)
CREATE POLICY "Users can insert their own loyalty progress"
ON loyalty_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can manage all loyalty progress
CREATE POLICY "Admins can manage loyalty progress"
ON loyalty_progress FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Fix apply_free_shipping_discount function search path
CREATE OR REPLACE FUNCTION apply_free_shipping_discount(_shipping_fee NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN GREATEST(0, _shipping_fee - 50);
END;
$$;