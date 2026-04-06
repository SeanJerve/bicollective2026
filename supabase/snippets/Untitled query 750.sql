-- STEP 0: Drop blocking triggers first
DROP TRIGGER IF EXISTS tr_low_stock_notification ON public.products;
DROP TRIGGER IF EXISTS tr_low_stock_notify ON public.products;

-- STEP 1: Drop all old bad columns
ALTER TABLE public.disputes DROP COLUMN IF EXISTS evidence_urls CASCADE;
ALTER TABLE public.reviews DROP COLUMN IF EXISTS media_urls CASCADE;
ALTER TABLE public.loyalty_progress DROP COLUMN IF EXISTS unique_sellers_purchased CASCADE;
ALTER TABLE public.products DROP COLUMN IF EXISTS sizes CASCADE;
ALTER TABLE public.products DROP COLUMN IF EXISTS images CASCADE;
ALTER TABLE public.products DROP COLUMN IF EXISTS stock_quantity CASCADE;
ALTER TABLE public.brands DROP COLUMN IF EXISTS rating CASCADE;
ALTER TABLE public.brands DROP COLUMN IF EXISTS review_count CASCADE;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS address CASCADE;
ALTER TABLE public.orders DROP COLUMN IF EXISTS shipping_address CASCADE;
ALTER TABLE public.vendor_orders DROP COLUMN IF EXISTS payment_method CASCADE;
ALTER TABLE public.promotions DROP COLUMN IF EXISTS target_category_ids CASCADE;
ALTER TABLE public.promotions DROP COLUMN IF EXISTS target_locations CASCADE;
ALTER TABLE public.promotions DROP COLUMN IF EXISTS target_product_ids CASCADE;
ALTER TABLE public.cart_items DROP COLUMN IF EXISTS size CASCADE;
ALTER TABLE public.cart_items DROP COLUMN IF EXISTS product_id CASCADE;

-- STEP 2: Create new normalized tables
ALTER TABLE public.brands ADD CONSTRAINT unique_brand_owner UNIQUE (owner_id);

CREATE TABLE IF NOT EXISTS public.dispute_evidence (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), dispute_id uuid NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE, evidence_url text NOT NULL, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.review_media (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE, media_url text NOT NULL, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.user_purchased_sellers (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), loyalty_id uuid NOT NULL REFERENCES public.loyalty_progress(id) ON DELETE CASCADE, brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE, UNIQUE(loyalty_id, brand_id));
CREATE TABLE IF NOT EXISTS public.product_variants (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE, size varchar(50) NOT NULL, stock_quantity integer NOT NULL DEFAULT 0, created_at timestamptz DEFAULT now(), UNIQUE(product_id, size));
CREATE TABLE IF NOT EXISTS public.product_images (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE, image_url text NOT NULL, sort_order integer DEFAULT 0, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.carts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.payment_verifications (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), vendor_order_id uuid NOT NULL REFERENCES public.vendor_orders(id) ON DELETE CASCADE, proof_image_url text NOT NULL, reference_number varchar(100), verified_at timestamptz, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.promotion_targets (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), promotion_id uuid NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE, target_type varchar(50) NOT NULL, target_id text NOT NULL);

-- STEP 3: Add new columns
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_address_id uuid REFERENCES public.addresses(id) ON DELETE RESTRICT;
ALTER TABLE public.vendor_orders ADD COLUMN IF NOT EXISTS payment_method smallint NOT NULL DEFAULT 0;
DELETE FROM public.cart_items;
ALTER TABLE public.cart_items ADD COLUMN IF NOT EXISTS cart_id uuid NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE;
ALTER TABLE public.cart_items ADD COLUMN IF NOT EXISTS variant_id uuid NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE;

-- STEP 4: Dynamic view (replaces cached rating)
CREATE OR REPLACE VIEW public.brand_aggregates AS
SELECT b.id as brand_id, COALESCE(AVG(r.rating), 0) as average_rating, COUNT(r.id) as review_count
FROM public.brands b
LEFT JOIN public.reviews r ON b.id = r.brand_id AND r.is_visible = true
GROUP BY b.id;
