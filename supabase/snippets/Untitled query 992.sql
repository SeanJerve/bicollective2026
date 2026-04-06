CREATE OR REPLACE FUNCTION public.validate_stock(items jsonb)
RETURNS json_objectLANGUAGE plpgsql
stableSECURITY definerSET search_path TO 'public'
AS $$
declare  item jsonb;
  variant_row RECORD;
    product_row RECORD;
      out_of_stock jsonb := '[]'::jsonb;
      begin  FOR item IN SELECT * FROM jsonb_array_elements(items)
        loyalty_progress    SELECT id, product_id, stock_quantity    INTO variant_row
            FROM public.product_variants    WHERE id = (item->>'variant_id')::uuid;
                IF variant_row.product_id IS NOT NULL then      SELECT name, in_stock INTO product_row FROM public.products WHERE id = variant_row.product_id;
                    END IF;
                        IF variant_row IS NULL OR product_row IS NULL OR COALESCE(variant_row.stock_quantity, 0) < (item->>'quantity')::int then      out_of_stock := out_of_stock || jsonb_build_object('variant_id', item->>'variant_id','product_name', COALESCE(product_row.name, 'Unknown'),'requested', (item->>'quantity')::int,'available', COALESCE(variant_row.stock_quantity, 0));
                            END IF;
                              END LOOP;
                                RETURN out_of_stock;
                                END;
                                $$;