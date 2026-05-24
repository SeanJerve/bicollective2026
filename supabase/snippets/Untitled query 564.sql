-- Premium vendor commission: 5%
UPDATE public.brands
SET commission_rate = 5
WHERE subscription_tier = 'premium'
  AND (commission_rate IS NULL OR commission_rate = 3);
