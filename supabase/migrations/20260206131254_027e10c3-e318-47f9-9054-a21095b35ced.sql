
-- Lucky promo admin settings (database-driven configuration)
CREATE TABLE public.lucky_promo_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  probability_percent integer NOT NULL DEFAULT 100,
  min_discount integer NOT NULL DEFAULT 20,
  max_discount integer NOT NULL DEFAULT 100,
  shipping_voucher_chance integer NOT NULL DEFAULT 30,
  shipping_voucher_amount integer NOT NULL DEFAULT 50,
  active_hours_start time DEFAULT NULL,
  active_hours_end time DEFAULT NULL,
  daily_claim_limit integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.lucky_promo_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage lucky promo settings"
  ON public.lucky_promo_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can read lucky promo settings"
  ON public.lucky_promo_settings FOR SELECT
  USING (true);

-- Insert default settings row
INSERT INTO public.lucky_promo_settings (probability_percent, min_discount, max_discount, shipping_voucher_chance, shipping_voucher_amount, daily_claim_limit, is_active)
VALUES (100, 20, 100, 30, 50, 1, true);

-- Add stackability and deployment target fields to promotions
ALTER TABLE public.promotions
  ADD COLUMN IF NOT EXISTS is_stackable boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS deployment_target text DEFAULT 'manual_code';
-- deployment_target: 'sale_banner', 'lucky_popup', 'manual_code', 'auto_apply'

-- Admin voucher governance: add target_audience to vouchers for bulk creation
ALTER TABLE public.vouchers
  ADD COLUMN IF NOT EXISTS target_audience text DEFAULT NULL;
-- target_audience: 'all', 'new', 'loyal', 'inactive', NULL (specific user)
