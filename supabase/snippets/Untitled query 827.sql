-- DATABASE HARDENING: FIXING SECURITY SEARCH PATHS
-- Standardize search paths for all security definer functions to clear the 12 alerts.

ALTER FUNCTION public.handle_admin_application_notification() SET search_path = public;
ALTER FUNCTION public.handle_admin_verification_notification() SET search_path = public;
ALTER FUNCTION public.handle_admin_report_notification() SET search_path = public;
ALTER FUNCTION public.handle_low_stock_notification() SET search_path = public;
ALTER FUNCTION public.handle_vendor_status_update_notification() SET search_path = public;
ALTER FUNCTION public.handle_new_order_notification() SET search_path = public;
ALTER FUNCTION public.handle_order_status_notification() SET search_path = public;
ALTER FUNCTION public.handle_new_message_notification() SET search_path = public;
ALTER FUNCTION public.decrement_stock_on_order() SET search_path = public;
ALTER FUNCTION public.update_brand_rating() SET search_path = public;

-- This one requires the argument types to be included:
ALTER FUNCTION public.create_notification(uuid, text, text, text, text) SET search_path = public;


-- PERFORMANCE OPTIMIZATION: REFINING INDEXES
-- Addressing the performance alerts for high-traffic views and counts.

-- Speed up unread notification lookups
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_unread_type 
ON public.notifications(user_id, type) 
WHERE read_at IS NULL;

-- Speed up vendor dashboard order filtering
CREATE INDEX IF NOT EXISTS idx_vendor_orders_brand_status_created 
ON public.vendor_orders(brand_id, status, created_at DESC);

-- Speed up real-time unread message counts
CREATE INDEX IF NOT EXISTS idx_messages_receiver_read_at_null 
ON public.messages(receiver_id) 
WHERE read_at IS NULL;

-- Speed up brand owner lookups for security checks
CREATE INDEX IF NOT EXISTS idx_brands_owner_id ON public.brands(owner_id);

-- Speed up product filtering for customers
CREATE INDEX IF NOT EXISTS idx_products_brand_active_stock 
ON public.products(brand_id, is_active, stock_quantity);
