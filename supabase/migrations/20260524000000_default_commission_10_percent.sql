-- Platform standard commission: 10% (premium vendors use separate migration for 5%)
ALTER TABLE public.brands ALTER COLUMN commission_rate SET DEFAULT 10;

UPDATE public.brands
SET commission_rate = 10
WHERE COALESCE(subscription_tier, 'standard') <> 'premium'
  AND (commission_rate IS NULL OR commission_rate = 5);
