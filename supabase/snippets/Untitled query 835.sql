-- Add missing timestamp columns for full order tracking
ALTER TABLE public.vendor_orders ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;
ALTER TABLE public.vendor_orders ADD COLUMN IF NOT EXISTS handed_to_courier_at timestamptz;
ALTER TABLE public.vendor_orders ADD COLUMN IF NOT EXISTS for_delivery_at timestamptz;
ALTER TABLE public.vendor_orders ADD COLUMN IF NOT EXISTS delivered_at timestamptz;
ALTER TABLE public.vendor_orders ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

-- Refresh PostgREST cache
NOTIFY pgrst, 'reload schema';
