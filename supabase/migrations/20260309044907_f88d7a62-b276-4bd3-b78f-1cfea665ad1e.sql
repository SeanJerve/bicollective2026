-- Phase 1.1: Add B-Tree indexes to high-traffic foreign key columns for query performance

-- vendor_orders indexes
CREATE INDEX IF NOT EXISTS idx_vendor_orders_brand_id ON public.vendor_orders (brand_id);
CREATE INDEX IF NOT EXISTS idx_vendor_orders_order_id ON public.vendor_orders (order_id);
CREATE INDEX IF NOT EXISTS idx_vendor_orders_status ON public.vendor_orders (status);

-- order_items indexes
CREATE INDEX IF NOT EXISTS idx_order_items_vendor_order_id ON public.order_items (vendor_order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items (product_id);

-- products indexes
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON public.products (brand_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products (is_active);

-- orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders (customer_id);

-- reviews indexes
CREATE INDEX IF NOT EXISTS idx_reviews_brand_id ON public.reviews (brand_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews (product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_vendor_order_id ON public.reviews (vendor_order_id);

-- wishlists indexes
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON public.wishlists (user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product_id ON public.wishlists (product_id);

-- cart_items indexes
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON public.cart_items (user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON public.cart_items (product_id);

-- messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_vendor_order_id ON public.messages (vendor_order_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages (receiver_id);

-- disputes indexes
CREATE INDEX IF NOT EXISTS idx_disputes_vendor_order_id ON public.disputes (vendor_order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_customer_id ON public.disputes (customer_id);
CREATE INDEX IF NOT EXISTS idx_disputes_vendor_id ON public.disputes (vendor_id);

-- vouchers indexes
CREATE INDEX IF NOT EXISTS idx_vouchers_user_id ON public.vouchers (user_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_status ON public.vouchers (status);