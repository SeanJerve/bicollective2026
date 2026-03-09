
-- Stock validation function for pre-checkout race condition prevention
CREATE OR REPLACE FUNCTION public.validate_stock(items jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  item jsonb;
  product_row RECORD;
  out_of_stock jsonb := '[]'::jsonb;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(items)
  LOOP
    SELECT id, name, stock_quantity, in_stock
    INTO product_row
    FROM public.products
    WHERE id = (item->>'product_id')::uuid;

    IF product_row IS NULL OR NOT product_row.in_stock OR product_row.stock_quantity < (item->>'quantity')::int THEN
      out_of_stock := out_of_stock || jsonb_build_object(
        'product_id', item->>'product_id',
        'product_name', COALESCE(product_row.name, 'Unknown'),
        'requested', (item->>'quantity')::int,
        'available', COALESCE(product_row.stock_quantity, 0)
      );
    END IF;
  END LOOP;

  RETURN out_of_stock;
END;
$$;
