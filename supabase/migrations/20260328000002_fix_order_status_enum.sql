-- Add missing order statuses if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'order_status' AND e.enumlabel = 'handed_to_courier') THEN
        ALTER TYPE public.order_status ADD VALUE 'handed_to_courier';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'order_status' AND e.enumlabel = 'for_delivery') THEN
        ALTER TYPE public.order_status ADD VALUE 'for_delivery';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'order_status' AND e.enumlabel = 'disputed') THEN
        ALTER TYPE public.order_status ADD VALUE 'disputed';
    END IF;
END $$;

-- Add shipped_at column if missing
ALTER TABLE public.vendor_orders ADD COLUMN IF NOT EXISTS shipped_at timestamp with time zone;
