-- ============================================================
-- BICOLLECTIVE 2026: ZERO-ANOMALY NORMALIZATION MIGRATION
-- Full 1NF / 2NF / 3NF Compliance
-- ============================================================

-- STEP 0: Kill all blocking triggers
DROP TRIGGER IF EXISTS tr_low_stock_notification ON public.products;
DROP TRIGGER IF EXISTS tr_low_stock_notify ON public.products;

-- ============================================================
-- STEP 1: DROP ALL BAD COLUMNS CASCADE
-- ============================================================
ALTER TABLE public.disputes             DROP COLUMN IF EXISTS evidence_urls CASCADE;
ALTER TABLE public.reviews              DROP COLUMN IF EXISTS media_urls CASCADE;
ALTER TABLE public.loyalty_progress     DROP COLUMN IF EXISTS unique_sellers_purchased CASCADE;
ALTER TABLE public.products             DROP COLUMN IF EXISTS sizes CASCADE;
ALTER TABLE public.products             DROP COLUMN IF EXISTS images CASCADE;
ALTER TABLE public.products             DROP COLUMN IF EXISTS stock_quantity CASCADE;
ALTER TABLE public.brands               DROP COLUMN IF EXISTS rating CASCADE;
ALTER TABLE public.brands               DROP COLUMN IF EXISTS review_count CASCADE;
ALTER TABLE public.profiles             DROP COLUMN IF EXISTS address CASCADE;
ALTER TABLE public.profiles             DROP COLUMN IF EXISTS email CASCADE;
ALTER TABLE public.orders               DROP COLUMN IF EXISTS shipping_address CASCADE;
ALTER TABLE public.orders               DROP COLUMN IF EXISTS platform_voucher_id CASCADE;
ALTER TABLE public.vendor_orders        DROP COLUMN IF EXISTS payment_method CASCADE;
ALTER TABLE public.vendor_orders        DROP COLUMN IF EXISTS payment_proof_url CASCADE;
ALTER TABLE public.vendor_orders        DROP COLUMN IF EXISTS payment_reference CASCADE;
ALTER TABLE public.vendor_orders        DROP COLUMN IF EXISTS promo_code_applied CASCADE;
ALTER TABLE public.vendor_orders        DROP COLUMN IF EXISTS voucher_id CASCADE;
ALTER TABLE public.vendor_verifications DROP COLUMN IF EXISTS additional_docs CASCADE;
ALTER TABLE public.cart_items           DROP COLUMN IF EXISTS size CASCADE;
ALTER TABLE public.cart_items           DROP COLUMN IF EXISTS product_id CASCADE;
ALTER TABLE public.lucky_promo_claims   DROP COLUMN IF EXISTS voucher_id CASCADE;

-- ============================================================
-- STEP 2: DESTROY OLD REDUNDANT PROMOTION/VOUCHER SYSTEM
-- (Being fully replaced by Discounts Supertype architecture)
-- ============================================================
DROP TABLE IF EXISTS public.vouchers   CASCADE;
DROP TABLE IF EXISTS public.promotions CASCADE;

-- ============================================================
-- STEP 3: ENFORCE STRICT CARDINALITY
-- ============================================================
ALTER TABLE public.brands DROP CONSTRAINT IF EXISTS unique_brand_owner;
ALTER TABLE public.brands ADD CONSTRAINT unique_brand_owner UNIQUE (owner_id);

-- ============================================================
-- STEP 4: 1NF FIX — REPLACE ALL ARRAYS WITH JUNCTION TABLES
-- ============================================================

-- 4a. Dispute Evidence (was evidence_urls[])
CREATE TABLE IF NOT EXISTS public.dispute_evidence (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    dispute_id   uuid NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
    evidence_url text NOT NULL,
    created_at   timestamptz DEFAULT now()
);

-- 4b. Review Media (was media_urls[])
CREATE TABLE IF NOT EXISTS public.review_media (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id  uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
    media_url  text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- 4c. User Purchased Sellers (was unique_sellers_purchased[])
CREATE TABLE IF NOT EXISTS public.user_purchased_sellers (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    loyalty_id uuid NOT NULL REFERENCES public.loyalty_progress(id) ON DELETE CASCADE,
    brand_id   uuid NOT NULL REFERENCES public.brands(id)           ON DELETE CASCADE,
    UNIQUE(loyalty_id, brand_id)
);

-- 4d. Product Variants (was sizes[] + global stock_quantity)
CREATE TABLE IF NOT EXISTS public.product_variants (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id     uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    size           varchar(50) NOT NULL,
    stock_quantity integer NOT NULL DEFAULT 0,
    created_at     timestamptz DEFAULT now(),
    UNIQUE(product_id, size)
);

-- 4e. Product Images (was images[])
CREATE TABLE IF NOT EXISTS public.product_images (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url  text NOT NULL,
    sort_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- 4f. Vendor Additional Docs (was additional_docs[] in vendor_verifications)
CREATE TABLE IF NOT EXISTS public.vendor_additional_docs (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    verification_id uuid NOT NULL REFERENCES public.vendor_verifications(id) ON DELETE CASCADE,
    doc_url         text NOT NULL,
    created_at      timestamptz DEFAULT now()
);

-- ============================================================
-- STEP 5: CART HIERARCHY (Parent entity fix)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.carts (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

DELETE FROM public.cart_items;
ALTER TABLE public.cart_items ADD COLUMN IF NOT EXISTS cart_id    uuid NOT NULL REFERENCES public.carts(id)            ON DELETE CASCADE;
ALTER TABLE public.cart_items ADD COLUMN IF NOT EXISTS variant_id uuid NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE;

-- ============================================================
-- STEP 6: PAYMENT SUPERTYPE / SUBTYPES (Disjoint)
-- Supertype: Payments
-- Subtype A: COD (no verification needed)
-- Subtype B: Payment_Verifications (GCash=1, Bank=2 only)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payments (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id       uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    payment_method smallint NOT NULL DEFAULT 0, -- 0=COD, 1=GCash, 2=Bank Transfer
    amount         numeric NOT NULL,
    status         varchar(50) DEFAULT 'pending',
    created_at     timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payment_verifications (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id       uuid NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    proof_image_url  text NOT NULL,
    reference_number varchar(100),
    verified_at      timestamptz,
    created_at       timestamptz DEFAULT now()
);

-- ============================================================
-- STEP 7: DISCOUNT SUPERTYPE / SUBTYPES (Disjoint)
-- Supertype: Discounts (universal math)
-- Subtype A: Platform_Promos (admin-managed, system-wide)
-- Subtype B: Vendor_Vouchers (vendor-managed, store-specific)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.discounts (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name                varchar(255) NOT NULL,
    description         text,
    discount_type       varchar(50) NOT NULL DEFAULT 'percentage', -- 'percentage', 'fixed', 'free_shipping'
    discount_value      numeric NOT NULL DEFAULT 0,
    min_order_amount    numeric,
    max_discount_amount numeric,
    max_uses            integer,
    max_uses_per_user   integer DEFAULT 1,
    current_uses        integer DEFAULT 0,
    is_stackable        boolean DEFAULT false,
    starts_at           timestamptz NOT NULL DEFAULT now(),
    ends_at             timestamptz NOT NULL,
    is_active           boolean DEFAULT true,
    created_at          timestamptz DEFAULT now(),
    updated_at          timestamptz DEFAULT now()
);

-- Subtype A: Platform_Promos — Admin-created, DISJOINT
CREATE TABLE IF NOT EXISTS public.platform_promos (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    discount_id       uuid NOT NULL REFERENCES public.discounts(id) ON DELETE CASCADE UNIQUE,
    code              varchar(100) UNIQUE,
    scope             varchar(50) DEFAULT 'platform', -- 'platform', 'category', 'product'
    deployment_target varchar(50),
    created_by        uuid NOT NULL REFERENCES auth.users(id)
);

-- Subtype B: Vendor_Vouchers — Vendor-created, DISJOINT
CREATE TABLE IF NOT EXISTS public.vendor_vouchers (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    discount_id     uuid NOT NULL REFERENCES public.discounts(id) ON DELETE CASCADE UNIQUE,
    brand_id        uuid NOT NULL REFERENCES public.brands(id)    ON DELETE CASCADE,
    code            varchar(100),
    source          varchar(50) DEFAULT 'vendor', -- 'lucky_promo', 'vendor_created'
    target_audience varchar(50) DEFAULT 'all'
);

-- Link orders/vendor_orders/lucky_promo to new discounts table
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS discount_id uuid REFERENCES public.discounts(id) ON DELETE SET NULL;
ALTER TABLE public.vendor_orders
    ADD COLUMN IF NOT EXISTS discount_id uuid REFERENCES public.discounts(id) ON DELETE SET NULL;
ALTER TABLE public.lucky_promo_claims
    ADD COLUMN IF NOT EXISTS discount_id uuid REFERENCES public.discounts(id) ON DELETE SET NULL;

-- ============================================================
-- STEP 8: 3NF ADDRESS FIX
-- ============================================================
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS shipping_address_id uuid REFERENCES public.addresses(id) ON DELETE RESTRICT;

-- ============================================================
-- STEP 9: DYNAMIC VIEW (Replaces cached aggregates on brands)
-- ============================================================
DROP VIEW IF EXISTS public.brand_aggregates;
CREATE VIEW public.brand_aggregates AS
SELECT
    b.id                                      AS brand_id,
    COALESCE(AVG(r.rating), 0)::numeric(3,2)  AS average_rating,
    COUNT(r.id)                               AS review_count
FROM public.brands b
LEFT JOIN public.reviews r ON b.id = r.brand_id AND r.is_visible = true
GROUP BY b.id;
