-- Phase 1.3: Fix stock concurrency with row-level locking
-- Replace the existing decrement_stock_on_order function with a safer version

CREATE OR REPLACE FUNCTION public.decrement_stock_on_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_stock INTEGER;
BEGIN
  -- Lock the product row to prevent concurrent updates (FOR UPDATE)
  SELECT stock_quantity INTO current_stock
  FROM public.products
  WHERE id = NEW.product_id
  FOR UPDATE;
  
  -- Only decrement if we have sufficient stock
  IF current_stock IS NOT NULL AND current_stock >= NEW.quantity THEN
    UPDATE public.products
    SET 
      stock_quantity = stock_quantity - NEW.quantity,
      in_stock = CASE WHEN stock_quantity - NEW.quantity <= 0 THEN false ELSE true END
    WHERE id = NEW.product_id;
  ELSIF current_stock IS NOT NULL AND current_stock > 0 THEN
    -- Partial stock available - take what's available and set out of stock
    UPDATE public.products
    SET 
      stock_quantity = 0,
      in_stock = false
    WHERE id = NEW.product_id;
  END IF;
  
  RETURN NEW;
END;
$function$;