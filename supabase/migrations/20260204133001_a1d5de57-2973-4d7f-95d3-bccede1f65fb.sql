-- ============================================
-- BICOLLECTIVE MARKETPLACE UPGRADE MIGRATION
-- Selective, Non-Destructive Enhancement
-- ============================================

-- 1. EXTEND ORDER STATUS ENUM
-- Add new logistics statuses while preserving existing ones
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'confirmed';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'handed_to_courier';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'for_delivery';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'disputed';

-- 2. PROMOTION TYPES ENUM
CREATE TYPE promotion_type AS ENUM (
  'percentage_discount',
  'fixed_discount',
  'free_shipping'
);

-- 3. PROMOTION SCOPE ENUM
CREATE TYPE promotion_scope AS ENUM (
  'platform',
  'seller',
  'location',
  'product'
);

-- 4. VOUCHER STATUS ENUM
CREATE TYPE voucher_status AS ENUM (
  'active',
  'used',
  'expired',
  'cancelled'
);

-- 5. DISPUTE STATUS ENUM
CREATE TYPE dispute_status AS ENUM (
  'pending',
  'under_review',
  'resolved_refund',
  'resolved_replacement',
  'resolved_dismissed',
  'escalated'
);

-- 6. LOYALTY MILESTONE ENUM
CREATE TYPE loyalty_milestone AS ENUM (
  'first_purchase',
  'five_deliveries',
  'ten_unique_sellers'
);

-- ============================================
-- PROMOTIONS TABLE (for seller & admin promos)
-- ============================================
CREATE TABLE public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who created it
  created_by UUID NOT NULL,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE, -- NULL = platform-wide
  
  -- Promo details
  name TEXT NOT NULL,
  description TEXT,
  code TEXT UNIQUE, -- For promo codes (NULL = automatic discount)
  
  -- Type and scope
  type promotion_type NOT NULL,
  scope promotion_scope NOT NULL DEFAULT 'seller',
  
  -- Discount values
  discount_value NUMERIC NOT NULL DEFAULT 0, -- Percentage or fixed amount
  min_order_amount NUMERIC DEFAULT 0, -- Minimum order to apply
  max_discount_amount NUMERIC, -- Cap for percentage discounts
  
  -- Location targeting (for Bicol region promos)
  target_locations TEXT[], -- e.g., ['Albay', 'Camarines Sur']
  
  -- Product targeting
  target_product_ids UUID[], -- Specific products
  target_category_ids UUID[], -- Specific categories
  
  -- Scheduling
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ NOT NULL,
  
  -- Usage limits
  max_uses INTEGER, -- Total uses allowed
  max_uses_per_user INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- VOUCHERS TABLE (user-specific rewards)
-- ============================================
CREATE TABLE public.vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Owner
  user_id UUID NOT NULL,
  
  -- Voucher details
  name TEXT NOT NULL,
  description TEXT,
  code TEXT NOT NULL,
  
  -- Type
  type promotion_type NOT NULL,
  discount_value NUMERIC NOT NULL,
  max_discount_amount NUMERIC,
  min_order_amount NUMERIC DEFAULT 0,
  
  -- Source (how it was earned)
  source TEXT, -- 'loyalty_5_deliveries', 'loyalty_10_sellers', 'lucky_promo', 'admin_gift'
  source_promotion_id UUID REFERENCES promotions(id),
  
  -- Status and expiry
  status voucher_status DEFAULT 'active',
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  used_on_order_id UUID REFERENCES orders(id),
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- LOYALTY PROGRESS TABLE
-- ============================================
CREATE TABLE public.loyalty_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  
  -- Counters
  total_delivered_orders INTEGER DEFAULT 0,
  unique_sellers_purchased UUID[] DEFAULT '{}',
  
  -- Milestones achieved
  milestone_5_deliveries_claimed BOOLEAN DEFAULT false,
  milestone_10_sellers_claimed BOOLEAN DEFAULT false,
  
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- LUCKY PROMO CLAIMS TABLE
-- ============================================
CREATE TABLE public.lucky_promo_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  claimed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  voucher_id UUID REFERENCES vouchers(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Ensure max 1 claim per user per day
  UNIQUE(user_id, claimed_date)
);

-- ============================================
-- DISPUTES TABLE
-- ============================================
CREATE TABLE public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Related order
  vendor_order_id UUID REFERENCES vendor_orders(id) NOT NULL,
  
  -- Parties
  customer_id UUID NOT NULL,
  vendor_id UUID NOT NULL,
  
  -- Dispute details
  reason TEXT NOT NULL,
  description TEXT,
  evidence_urls TEXT[],
  
  -- Status
  status dispute_status DEFAULT 'pending',
  
  -- Resolution
  resolved_by UUID, -- Admin who resolved
  resolution_notes TEXT,
  refund_amount NUMERIC,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- ============================================
-- EXTEND VENDOR_ORDERS TABLE
-- ============================================
ALTER TABLE vendor_orders 
ADD COLUMN IF NOT EXISTS promo_code_applied TEXT,
ADD COLUMN IF NOT EXISTS voucher_id UUID REFERENCES vouchers(id),
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS free_shipping_applied BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS shipping_fee_original NUMERIC,
ADD COLUMN IF NOT EXISTS payment_reference TEXT,
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS handed_to_courier_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS for_delivery_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS auto_delivery_eligible BOOLEAN DEFAULT true;

-- ============================================
-- EXTEND ORDERS TABLE
-- ============================================
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS platform_voucher_id UUID REFERENCES vouchers(id),
ADD COLUMN IF NOT EXISTS total_discount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_shipping NUMERIC DEFAULT 0;

-- ============================================
-- EXTEND BRANDS TABLE (for shipping calculation)
-- ============================================
ALTER TABLE brands
ADD COLUMN IF NOT EXISTS shipping_base_fee NUMERIC DEFAULT 50,
ADD COLUMN IF NOT EXISTS shipping_per_item_fee NUMERIC DEFAULT 10;

-- ============================================
-- ENABLE RLS ON NEW TABLES
-- ============================================
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE lucky_promo_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: PROMOTIONS
-- ============================================
CREATE POLICY "Anyone can view active promotions"
ON promotions FOR SELECT
USING (is_active = true AND starts_at <= now() AND ends_at > now());

CREATE POLICY "Sellers can manage their own promotions"
ON promotions FOR ALL
USING (get_brand_owner(brand_id) = auth.uid());

CREATE POLICY "Admins can manage all promotions"
ON promotions FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- RLS POLICIES: VOUCHERS
-- ============================================
CREATE POLICY "Users can view their own vouchers"
ON vouchers FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can use their own vouchers"
ON vouchers FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can create vouchers for users"
ON vouchers FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can manage all vouchers"
ON vouchers FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- RLS POLICIES: LOYALTY PROGRESS
-- ============================================
CREATE POLICY "Users can view their own loyalty progress"
ON loyalty_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own loyalty progress"
ON loyalty_progress FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can manage loyalty progress"
ON loyalty_progress FOR ALL
WITH CHECK (true);

-- ============================================
-- RLS POLICIES: LUCKY PROMO CLAIMS
-- ============================================
CREATE POLICY "Users can view their own claims"
ON lucky_promo_claims FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own claims"
ON lucky_promo_claims FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES: DISPUTES
-- ============================================
CREATE POLICY "Customers can view their own disputes"
ON disputes FOR SELECT
USING (auth.uid() = customer_id);

CREATE POLICY "Customers can create disputes"
ON disputes FOR INSERT
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Vendors can view disputes on their orders"
ON disputes FOR SELECT
USING (auth.uid() = vendor_id);

CREATE POLICY "Admins can manage all disputes"
ON disputes FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- FUNCTION: Calculate Shipping Fee
-- ============================================
CREATE OR REPLACE FUNCTION calculate_shipping_fee(
  _seller_location TEXT,
  _buyer_location TEXT,
  _item_count INTEGER
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_fee NUMERIC := 50;
  per_item_fee NUMERIC := 10;
  distance_multiplier NUMERIC := 1.0;
BEGIN
  -- Simple distance calculation based on Bicol provinces
  IF _seller_location = _buyer_location THEN
    distance_multiplier := 1.0;
  ELSIF _seller_location ILIKE '%Albay%' AND _buyer_location ILIKE '%Sorsogon%' THEN
    distance_multiplier := 1.3;
  ELSIF _seller_location ILIKE '%Albay%' AND _buyer_location ILIKE '%Camarines%' THEN
    distance_multiplier := 1.5;
  ELSE
    distance_multiplier := 1.8;
  END IF;
  
  -- Calculate: base + (items * per_item) * distance, capped at 100
  RETURN LEAST(100, base_fee + (_item_count * per_item_fee * distance_multiplier));
END;
$$;

-- ============================================
-- FUNCTION: Award Loyalty Voucher
-- ============================================
CREATE OR REPLACE FUNCTION award_loyalty_voucher(
  _user_id UUID,
  _milestone loyalty_milestone
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  voucher_id UUID;
  voucher_name TEXT;
  voucher_value NUMERIC;
  expiry_days INTEGER := 30;
BEGIN
  -- Determine voucher based on milestone
  IF _milestone = 'five_deliveries' THEN
    voucher_name := 'Loyalty Reward: 5 Deliveries';
    voucher_value := 100;
  ELSIF _milestone = 'ten_unique_sellers' THEN
    voucher_name := 'Explorer Reward: 10 Sellers';
    voucher_value := 500;
  ELSE
    RETURN NULL;
  END IF;
  
  -- Create voucher
  INSERT INTO vouchers (
    user_id,
    name,
    description,
    code,
    type,
    discount_value,
    source,
    expires_at
  ) VALUES (
    _user_id,
    voucher_name,
    'Thank you for your loyalty! Enjoy this discount on your next purchase.',
    'LOYALTY-' || substr(gen_random_uuid()::text, 1, 8),
    'fixed_discount',
    voucher_value,
    _milestone::text,
    now() + (expiry_days || ' days')::interval
  )
  RETURNING id INTO voucher_id;
  
  RETURN voucher_id;
END;
$$;

-- ============================================
-- TRIGGER: Update loyalty progress on delivery
-- ============================================
CREATE OR REPLACE FUNCTION update_loyalty_on_delivery()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  customer UUID;
  seller UUID;
  current_progress RECORD;
  seller_count INTEGER;
BEGIN
  -- Only trigger on status change to 'delivered'
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    -- Get customer from parent order
    SELECT customer_id INTO customer FROM orders WHERE id = NEW.order_id;
    
    -- Get seller from brand
    SELECT owner_id INTO seller FROM brands WHERE id = NEW.brand_id;
    
    -- Update or create loyalty progress
    INSERT INTO loyalty_progress (user_id, total_delivered_orders, unique_sellers_purchased)
    VALUES (customer, 1, ARRAY[seller])
    ON CONFLICT (user_id) DO UPDATE SET
      total_delivered_orders = loyalty_progress.total_delivered_orders + 1,
      unique_sellers_purchased = CASE 
        WHEN seller = ANY(loyalty_progress.unique_sellers_purchased) THEN loyalty_progress.unique_sellers_purchased
        ELSE array_append(loyalty_progress.unique_sellers_purchased, seller)
      END,
      updated_at = now();
    
    -- Check for milestone rewards
    SELECT * INTO current_progress FROM loyalty_progress WHERE user_id = customer;
    
    -- 5 deliveries milestone
    IF current_progress.total_delivered_orders >= 5 AND NOT current_progress.milestone_5_deliveries_claimed THEN
      PERFORM award_loyalty_voucher(customer, 'five_deliveries');
      UPDATE loyalty_progress SET milestone_5_deliveries_claimed = true WHERE user_id = customer;
    END IF;
    
    -- 10 unique sellers milestone
    seller_count := array_length(current_progress.unique_sellers_purchased, 1);
    IF seller_count >= 10 AND NOT current_progress.milestone_10_sellers_claimed THEN
      PERFORM award_loyalty_voucher(customer, 'ten_unique_sellers');
      UPDATE loyalty_progress SET milestone_10_sellers_claimed = true WHERE user_id = customer;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_loyalty_on_delivery
AFTER UPDATE ON vendor_orders
FOR EACH ROW
EXECUTE FUNCTION update_loyalty_on_delivery();

-- ============================================
-- FUNCTION: Apply Free Shipping Discount
-- ============================================
CREATE OR REPLACE FUNCTION apply_free_shipping_discount(_shipping_fee NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Deduct fixed ₱50 from shipping fee
  RETURN GREATEST(0, _shipping_fee - 50);
END;
$$;

-- ============================================
-- INDEX FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(is_active, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_promotions_code ON promotions(code) WHERE code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vouchers_user ON vouchers(user_id, status);
CREATE INDEX IF NOT EXISTS idx_vouchers_expires ON vouchers(expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_vendor_order ON disputes(vendor_order_id);

-- ============================================
-- UPDATE TRIGGERS FOR TIMESTAMPS
-- ============================================
CREATE TRIGGER update_promotions_updated_at
BEFORE UPDATE ON promotions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_disputes_updated_at
BEFORE UPDATE ON disputes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();