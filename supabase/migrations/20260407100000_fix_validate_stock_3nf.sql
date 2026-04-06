-- ============================================================
-- BICOLLECTIVE 2026: Fix validate_stock for 3NF
-- Re-defining the function to use product_variants
-- ============================================================

CREATE OR REPLACE FUNCTION public.validate_stock(items jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  item jsonb;
  variant_row RECORD;
  product_row RECORD;
  out_of_stock jsonb := '[]'::jsonb;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(items)
  LOOP
    -- 1. Fetch the variant info
    SELECT id, product_id, stock_quantity
    INTO variant_row
    FROM public.product_variants
    WHERE id = (item->>'variant_id')::uuid;

    -- 2. Fetch the product info (for the name in the error)
    IF variant_row.product_id IS NOT NULL THEN
      SELECT name, in_stock
      INTO product_row
      FROM public.products
      WHERE id = variant_row.product_id;
    END IF;

    -- 3. Validation Logic
    IF variant_row IS NULL 
       OR product_row IS NULL 
       OR NOT product_row.in_stock 
       OR variant_row.stock_quantity < (item->>'quantity')::int THEN
      
      out_of_stock := out_of_stock || jsonb_build_object(
        'variant_id', item->>'variant_id',
        'product_name', COALESCE(product_row.name, 'Unknown Product'),
        'requested', (item->>'quantity')::int,
        'available', COALESCE(variant_row.stock_quantity, 0)
      );
    END IF;
  END LOOP;

  RETURN out_of_stock;
END;
$$;

-- ============================================================
-- BICOLLECTIVE 2026: Fix decrement_stock_on_order for 3NF
-- ============================================================

CREATE OR REPLACE FUNCTION public.decrement_stock_on_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_stock INTEGER;
BEGIN
  -- 1. Lock the variant row to prevent concurrent updates
  SELECT stock_quantity INTO current_stock
  FROM public.product_variants
  WHERE id = NEW.variant_id
  FOR UPDATE;
  
  -- 2. Only decrement if we have sufficient stock
  IF current_stock IS NOT NULL AND current_stock >= NEW.quantity THEN
    UPDATE public.product_variants
    SET stock_quantity = stock_quantity - NEW.quantity
    WHERE id = NEW.variant_id;
  ELSIF current_stock IS NOT NULL AND current_stock > 0 THEN
    -- Partial stock available
    UPDATE public.product_variants
    SET stock_quantity = 0
    WHERE id = NEW.variant_id;
  END IF;
  
  -- 3. Optionally update the parent product's in_stock status
  -- (Trigger on product_variants could handle this more robustly, 
  -- but we can do a quick check here or let a separate trigger handle it)
  
  RETURN NEW;
END;
$function$;
