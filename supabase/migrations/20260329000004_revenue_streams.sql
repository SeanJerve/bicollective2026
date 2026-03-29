-- Add revenue fields to brands
ALTER TABLE public.brands 
ADD COLUMN commission_rate numeric DEFAULT 5,
ADD COLUMN platform_debt numeric DEFAULT 0,
ADD COLUMN subscription_tier text DEFAULT 'free',
ADD COLUMN subscription_expires_at timestamp with time zone;

-- Add revenue fields to vendor_orders
ALTER TABLE public.vendor_orders
ADD COLUMN platform_commission numeric DEFAULT 0,
ADD COLUMN platform_shipping_margin numeric DEFAULT 20,
ADD COLUMN total_platform_fee numeric DEFAULT 0;

-- Create ad_boosts table
CREATE TABLE public.ad_boosts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  brand_id uuid NOT NULL,
  boost_type text NOT NULL, -- 'daily', 'weekly', 'monthly'
  amount_paid numeric NOT NULL,
  payment_proof_url text,
  status text DEFAULT 'pending'::text, -- 'pending', 'active', 'expired', 'rejected'
  starts_at timestamp with time zone,
  ends_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ad_boosts_pkey PRIMARY KEY (id),
  CONSTRAINT ad_boosts_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT ad_boosts_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id)
);

-- Create platform_transactions table for debt payments, boosts, and subscriptions
CREATE TABLE public.platform_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL,
  amount numeric NOT NULL,
  transaction_type text NOT NULL, -- 'debt_payment', 'boost_purchase', 'subscription_purchase'
  status text DEFAULT 'pending'::text, -- 'pending', 'approved', 'rejected'
  payment_proof_url text,
  admin_notes text,
  reference_id uuid, -- link to ad_boosts or similar if needed
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT platform_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT platform_transactions_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id)
);

-- Enable RLS
ALTER TABLE public.ad_boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for ad_boosts
CREATE POLICY "Vendors can view their own boosts" ON public.ad_boosts
FOR SELECT USING (brand_id IN (SELECT id FROM public.brands WHERE owner_id = auth.uid()));

CREATE POLICY "Vendors can insert their own boosts" ON public.ad_boosts
FOR INSERT WITH CHECK (brand_id IN (SELECT id FROM public.brands WHERE owner_id = auth.uid()));

-- Policies for platform_transactions
CREATE POLICY "Vendors can view their own transactions" ON public.platform_transactions
FOR SELECT USING (brand_id IN (SELECT id FROM public.brands WHERE owner_id = auth.uid()));

CREATE POLICY "Vendors can insert their own transactions" ON public.platform_transactions
FOR INSERT WITH CHECK (brand_id IN (SELECT id FROM public.brands WHERE owner_id = auth.uid()));

-- Admin policies
CREATE POLICY "Admins can view all boosts" ON public.ad_boosts
FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can view all transactions" ON public.platform_transactions
FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
