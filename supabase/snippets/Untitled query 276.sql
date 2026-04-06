-- Bicollective Normalization Migration
-- Eliminates 1NF, 2NF, 3NF violations and establishes strict structural constraints.

-- 1. VENDOR-BRAND CARDINALITY (Strict 1:1 Restriction)
-- Prevents a single user from making multiple brands and spamming standard vendor tables.
ALTER TABLE public.brands
ADD CONSTRAINT unique_brand_owner UNIQUE (owner_id);

-- 2. DISPUTE EVIDENCE (1NF Fix)
-- Removes array column and replaces with Junction Table
ALTER TABLE public.disputes DROP COLUMN evidence_urls;

CREATE TABLE public.dispute_evidence (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    dispute_id uuid NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
    evidence_url text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- 3. REVIEW MEDIA (1NF Fix)
-- Removes array column
ALTER TABLE public.reviews DROP COLUMN media_urls;

CREATE TABLE public.review_media (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
    media_url text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- 4. LOYALTY PROGRESS (1NF Fix)
-- Removes array column
ALTER TABLE public.loyalty_progress DROP COLUMN unique_sellers_purchased;

CREATE TABLE public.user_purchased_sellers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    loyalty_id uuid NOT NULL REFERENCES public.loyalty_progress(id) ON DELETE CASCADE,
    brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
    UNIQUE(loyalty_id, brand_id)
);

-- 5. PRODUCTS INVENTORY & IMAGES (1NF Fix + Stock Accuracy)
-- Removes array sizes, array images, and global stock count
ALTER TABLE public.products DROP COLUMN sizes;
ALTER TABLE public.products DROP COLUMN images;
ALTER TABLE public.products DROP COLUMN stock_quantity;

CREATE TABLE public.product_variants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    size varchar(50) NOT NULL,
    stock_quantity integer NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    UNIQUE(product_id, size)
);

CREATE TABLE public.product_images (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url text NOT NULL,
    sort_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- 6. CACHED AGGREGATES UPDATE ANOMALY
-- Drops hardcoded repeating values in Brands
ALTER TABLE public.brands DROP COLUMN rating;
ALTER TABLE public.brands DROP COLUMN review_count;

-- Creates dynamic view to calculate it perfectly every time
CREATE OR REPLACE VIEW public.brand_aggregates AS
SELECT 
    b.id as brand_id,
    COALESCE(AVG(r.rating), 0) as average_rating,
    COUNT(r.id) as review_count
FROM public.brands b
LEFT JOIN public.reviews r ON b.id = r.brand_id AND r.is_visible = true
GROUP BY b.id;

-- 7. REDUNDANT ADDRESS DATA (3NF Fix)
-- Removes raw text string from profiles/orders in favor of mapping to the Addresses table
ALTER TABLE public.profiles DROP COLUMN address;
ALTER TABLE public.orders DROP COLUMN shipping_address;
ALTER TABLE public.orders ADD COLUMN shipping_address_id uuid REFERENCES public.addresses(id) ON DELETE RESTRICT;

-- 8. CART PARENT (Logical grouping)
CREATE TABLE public.carts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Link existing cart_items to carts. We must drop all independent floating items first to avoid orphaned data.
DELETE FROM public.cart_items; 
ALTER TABLE public.cart_items ADD COLUMN cart_id uuid NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE;
-- Also update cart_items to link to product_variants instead of global products
ALTER TABLE public.cart_items DROP COLUMN size;
ALTER TABLE public.cart_items DROP COLUMN product_id;
ALTER TABLE public.cart_items ADD COLUMN variant_id uuid NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE;

-- 9. PAYMENT SUBTYPES (Enum conversion & Verifications Subtype)
ALTER TABLE public.vendor_orders DROP COLUMN payment_method;
-- smallint mapping: 0 = COD, 1 = GCash, 2 = Bank Transfer
ALTER TABLE public.vendor_orders ADD COLUMN payment_method smallint NOT NULL DEFAULT 0;

CREATE TABLE public.payment_verifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_order_id uuid NOT NULL REFERENCES public.vendor_orders(id) ON DELETE CASCADE,
    proof_image_url text NOT NULL,
    reference_number varchar(100),
    verified_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- 10. PROMOTIONS NORMALIZATION (1NF Fix)
ALTER TABLE public.promotions DROP COLUMN target_category_ids;
ALTER TABLE public.promotions DROP COLUMN target_locations;
ALTER TABLE public.promotions DROP COLUMN target_product_ids;

CREATE TABLE public.promotion_targets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    promotion_id uuid NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
    target_type varchar(50) NOT NULL, -- 'category', 'location', 'product'
    target_id text NOT NULL
);
