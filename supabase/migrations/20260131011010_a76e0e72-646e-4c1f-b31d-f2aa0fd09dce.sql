-- Add location column to brands for location-aware filtering
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS location TEXT;

-- Index for faster location filtering
CREATE INDEX IF NOT EXISTS idx_brands_location ON public.brands(location);
