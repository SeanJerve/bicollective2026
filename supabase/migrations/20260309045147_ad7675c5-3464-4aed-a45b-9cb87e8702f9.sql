-- Enforce that reviews can only be created for delivered vendor orders
-- Using a validation trigger (not CHECK constraint) for flexibility

CREATE OR REPLACE FUNCTION public.validate_review_delivery_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  vo_status TEXT;
BEGIN
  -- If vendor_order_id is provided, verify it's delivered
  IF NEW.vendor_order_id IS NOT NULL THEN
    SELECT status INTO vo_status
    FROM public.vendor_orders
    WHERE id = NEW.vendor_order_id;
    
    IF vo_status IS NULL THEN
      RAISE EXCEPTION 'Vendor order not found';
    END IF;
    
    IF vo_status != 'delivered' THEN
      RAISE EXCEPTION 'Reviews can only be submitted for delivered orders (current status: %)', vo_status;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Attach trigger to reviews table
DROP TRIGGER IF EXISTS trg_validate_review_delivery ON public.reviews;
CREATE TRIGGER trg_validate_review_delivery
  BEFORE INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_review_delivery_status();