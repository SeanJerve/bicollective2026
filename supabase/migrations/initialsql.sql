-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.brands (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  banner_url text,
  description text,
  status USER-DEFINED NOT NULL DEFAULT 'approved'::vendor_status,
  rating numeric DEFAULT 0,
  review_count integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  location text,
  shipping_base_fee numeric DEFAULT 50,
  shipping_per_item_fee numeric DEFAULT 10,
  CONSTRAINT brands_pkey PRIMARY KEY (id),
  CONSTRAINT brands_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id)
);
CREATE TABLE public.cart_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  size text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT cart_items_pkey PRIMARY KEY (id),
  CONSTRAINT cart_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  image_url text,
  product_count integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.disputes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  vendor_order_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  vendor_id uuid NOT NULL,
  reason text NOT NULL,
  description text,
  evidence_urls ARRAY,
  status USER-DEFINED DEFAULT 'pending'::dispute_status,
  resolved_by uuid,
  resolution_notes text,
  refund_amount numeric,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  resolved_at timestamp with time zone,
  CONSTRAINT disputes_pkey PRIMARY KEY (id),
  CONSTRAINT disputes_vendor_order_id_fkey FOREIGN KEY (vendor_order_id) REFERENCES public.vendor_orders(id)
);
CREATE TABLE public.loyalty_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  total_delivered_orders integer DEFAULT 0,
  unique_sellers_purchased ARRAY DEFAULT '{}'::uuid[],
  milestone_5_deliveries_claimed boolean DEFAULT false,
  milestone_10_sellers_claimed boolean DEFAULT false,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT loyalty_progress_pkey PRIMARY KEY (id)
);
CREATE TABLE public.lucky_promo_claims (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  claimed_date date NOT NULL DEFAULT CURRENT_DATE,
  voucher_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT lucky_promo_claims_pkey PRIMARY KEY (id),
  CONSTRAINT lucky_promo_claims_voucher_id_fkey FOREIGN KEY (voucher_id) REFERENCES public.vouchers(id)
);
CREATE TABLE public.lucky_promo_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  probability_percent integer NOT NULL DEFAULT 100,
  min_discount integer NOT NULL DEFAULT 20,
  max_discount integer NOT NULL DEFAULT 100,
  shipping_voucher_chance integer NOT NULL DEFAULT 30,
  shipping_voucher_amount integer NOT NULL DEFAULT 50,
  active_hours_start time without time zone,
  active_hours_end time without time zone,
  daily_claim_limit integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid,
  CONSTRAINT lucky_promo_settings_pkey PRIMARY KEY (id),
  CONSTRAINT lucky_promo_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id)
);
CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  vendor_order_id uuid NOT NULL,
  product_id uuid,
  product_name text NOT NULL,
  product_price numeric NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  size text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_vendor_order_id_fkey FOREIGN KEY (vendor_order_id) REFERENCES public.vendor_orders(id),
  CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  total_amount numeric NOT NULL,
  shipping_address text NOT NULL,
  shipping_name text NOT NULL,
  shipping_phone text NOT NULL,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  platform_voucher_id uuid,
  total_discount numeric DEFAULT 0,
  total_shipping numeric DEFAULT 0,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES auth.users(id),
  CONSTRAINT orders_platform_voucher_id_fkey FOREIGN KEY (platform_voucher_id) REFERENCES public.vouchers(id)
);
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL,
  category_id uuid,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  price numeric NOT NULL,
  original_price numeric,
  image_url text,
  images ARRAY,
  sizes ARRAY DEFAULT ARRAY['XS'::text, 'S'::text, 'M'::text, 'L'::text, 'XL'::text],
  in_stock boolean DEFAULT true,
  stock_quantity integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id),
  CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  phone text,
  address text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.promotions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL,
  brand_id uuid,
  name text NOT NULL,
  description text,
  code text UNIQUE,
  type USER-DEFINED NOT NULL,
  scope USER-DEFINED NOT NULL DEFAULT 'seller'::promotion_scope,
  discount_value numeric NOT NULL DEFAULT 0,
  min_order_amount numeric DEFAULT 0,
  max_discount_amount numeric,
  target_locations ARRAY,
  target_product_ids ARRAY,
  target_category_ids ARRAY,
  starts_at timestamp with time zone NOT NULL DEFAULT now(),
  ends_at timestamp with time zone NOT NULL,
  max_uses integer,
  max_uses_per_user integer DEFAULT 1,
  current_uses integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_stackable boolean DEFAULT true,
  deployment_target text DEFAULT 'manual_code'::text,
  CONSTRAINT promotions_pkey PRIMARY KEY (id),
  CONSTRAINT promotions_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id)
);
CREATE TABLE public.reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  product_id uuid,
  brand_id uuid,
  review_id uuid,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  admin_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  resolved_at timestamp with time zone,
  CONSTRAINT reports_pkey PRIMARY KEY (id),
  CONSTRAINT reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES auth.users(id),
  CONSTRAINT reports_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT reports_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id),
  CONSTRAINT reports_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.reviews(id)
);
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid,
  brand_id uuid,
  vendor_order_id uuid,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  is_visible boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT reviews_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id),
  CONSTRAINT reviews_vendor_order_id_fkey FOREIGN KEY (vendor_order_id) REFERENCES public.vendor_orders(id)
);
CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role USER-DEFINED NOT NULL DEFAULT 'customer'::app_role,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_roles_pkey PRIMARY KEY (id),
  CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.vendor_applications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  business_name text NOT NULL,
  business_type USER-DEFINED NOT NULL,
  location text NOT NULL,
  contact_phone text NOT NULL,
  description text,
  business_permit_url text,
  valid_id_url text,
  proof_of_products_url text,
  status USER-DEFINED DEFAULT 'pending'::vendor_application_status,
  admin_notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT vendor_applications_pkey PRIMARY KEY (id)
);
CREATE TABLE public.vendor_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  brand_id uuid NOT NULL,
  subtotal numeric NOT NULL,
  shipping_fee numeric DEFAULT 0,
  status USER-DEFINED NOT NULL DEFAULT 'pending_payment'::order_status,
  payment_proof_url text,
  tracking_number text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  promo_code_applied text,
  voucher_id uuid,
  discount_amount numeric DEFAULT 0,
  free_shipping_applied boolean DEFAULT false,
  shipping_fee_original numeric,
  payment_reference text,
  confirmed_at timestamp with time zone,
  handed_to_courier_at timestamp with time zone,
  for_delivery_at timestamp with time zone,
  delivered_at timestamp with time zone,
  auto_delivery_eligible boolean DEFAULT true,
  CONSTRAINT vendor_orders_pkey PRIMARY KEY (id),
  CONSTRAINT vendor_orders_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT vendor_orders_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id),
  CONSTRAINT vendor_orders_voucher_id_fkey FOREIGN KEY (voucher_id) REFERENCES public.vouchers(id)
);
CREATE TABLE public.vendor_verifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL,
  dti_registration_url text,
  bir_certificate_url text,
  mayor_permit_url text,
  additional_docs ARRAY,
  status USER-DEFINED DEFAULT 'pending'::vendor_verification_status,
  admin_notes text,
  submitted_at timestamp with time zone DEFAULT now(),
  reviewed_at timestamp with time zone,
  CONSTRAINT vendor_verifications_pkey PRIMARY KEY (id),
  CONSTRAINT vendor_verifications_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id)
);
CREATE TABLE public.vouchers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  code text NOT NULL,
  type USER-DEFINED NOT NULL,
  discount_value numeric NOT NULL,
  max_discount_amount numeric,
  min_order_amount numeric DEFAULT 0,
  source text,
  source_promotion_id uuid,
  status USER-DEFINED DEFAULT 'active'::voucher_status,
  expires_at timestamp with time zone NOT NULL,
  used_at timestamp with time zone,
  used_on_order_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  target_audience text,
  CONSTRAINT vouchers_pkey PRIMARY KEY (id),
  CONSTRAINT vouchers_source_promotion_id_fkey FOREIGN KEY (source_promotion_id) REFERENCES public.promotions(id),
  CONSTRAINT vouchers_used_on_order_id_fkey FOREIGN KEY (used_on_order_id) REFERENCES public.orders(id)
);
CREATE TABLE public.wishlists (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT wishlists_pkey PRIMARY KEY (id),
  CONSTRAINT wishlists_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);