-- DATABASE HARDENING: FIXING SECURITY SEARCH PATHS
-- This migration addresses the 12 security alerts by setting a fixed search_path for SECURITY DEFINER functions.

-- 1. Admin Notification Functions
ALTER FUNCTION public.handle_admin_application_notification() SET search_path = public;
ALTER FUNCTION public.handle_admin_verification_notification() SET search_path = public;
ALTER FUNCTION public.handle_admin_report_notification() SET search_path = public;
ALTER FUNCTION public.create_notification() SET search_path = public;

-- 2. Vendor Notification Functions
ALTER FUNCTION public.handle_low_stock_notification() SET search_path = public;
ALTER FUNCTION public.handle_vendor_status_update_notification() SET search_path = public;
ALTER FUNCTION public.handle_new_order_notification() SET search_path = public;
ALTER FUNCTION public.handle_order_status_notification() SET search_path = public;
ALTER FUNCTION public.handle_new_message_notification() SET search_path = public;

-- 3. Core Logic Functions
ALTER FUNCTION public.decrement_stock_on_order() SET search_path = public;
ALTER FUNCTION public.update_brand_rating() SET search_path = public;
ALTER FUNCTION public.check_brand_owner(brand_id uuid) SET search_path = public;

-- PERFORMANCE OPTIMIZATION: REFINING INDEXES
-- Addressing the performance alerts by adding targeted composite indexes and optimizing high-traffic areas.

-- Optimize notification lookups (used by useNotifications hook)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_unread_type 
ON public.notifications(user_id, type) 
WHERE read_at IS NULL;

-- Optimize vendor order dashboard filtering
CREATE INDEX IF NOT EXISTS idx_vendor_orders_brand_status_created 
ON public.vendor_orders(brand_id, status, created_at DESC);

-- Optimize message unread counts
CREATE INDEX IF NOT EXISTS idx_messages_receiver_read_at_null 
ON public.messages(receiver_id) 
WHERE read_at IS NULL;

-- Optimize brand owner checks (used in RLS)
CREATE INDEX IF NOT EXISTS idx_brands_owner_id ON public.brands(owner_id);

-- Optimize product listing with active flag
CREATE INDEX IF NOT EXISTS idx_products_brand_active_stock 
ON public.products(brand_id, is_active, stock_quantity);

-- Remove legacy dispute triggers if they were previously created (from early project phases)
-- Note: Already handled by removing dispute UI, but good to keep DB clean.
DROP TRIGGER IF EXISTS tr_dispute_notification ON public.disputes;
