-- Function to safely increment brand debt
CREATE OR REPLACE FUNCTION public.increment_brand_debt(brand_id_param uuid, amount_param numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.brands
  SET platform_debt = COALESCE(platform_debt, 0) + amount_param
  WHERE id = brand_id_param;
END;
$$;
