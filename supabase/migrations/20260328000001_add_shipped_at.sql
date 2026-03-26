-- Add shipped_at column to vendor_orders
ALTER TABLE public.vendor_orders ADD COLUMN IF NOT EXISTS shipped_at timestamp with time zone;
