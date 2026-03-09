
-- =============================================
-- BATCH 1: Critical Database Fixes
-- =============================================

-- 1. Drop duplicate stock decrement triggers on order_items (keep trg_decrement_stock_on_order)
DROP TRIGGER IF EXISTS decrement_stock_on_order_item ON public.order_items;
DROP TRIGGER IF EXISTS on_order_item_created ON public.order_items;

-- 2. Drop duplicate address default triggers on addresses (keep trg_unset_other_default_addresses)
DROP TRIGGER IF EXISTS on_address_default_change ON public.addresses;
DROP TRIGGER IF EXISTS trg_unset_other_default_addresses_insert ON public.addresses;
DROP TRIGGER IF EXISTS trigger_unset_other_defaults ON public.addresses;

-- 3. Add media_urls column to reviews table
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS media_urls text[] DEFAULT '{}';

-- 4. Drop stale product_count column from categories
ALTER TABLE public.categories DROP COLUMN IF EXISTS product_count;
