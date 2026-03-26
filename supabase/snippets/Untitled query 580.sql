-- Add attachment columns to messages table
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_url text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_type text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_name text;

-- Ensure shipped_at exists in vendor_orders (re-asserting just in case)
ALTER TABLE public.vendor_orders ADD COLUMN IF NOT EXISTS shipped_at timestamp with time zone;
