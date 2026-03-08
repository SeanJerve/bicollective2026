
-- Stock restore trigger: when a vendor_order is cancelled, restore stock for its items
CREATE OR REPLACE FUNCTION public.restore_stock_on_cancellation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    UPDATE public.products p
    SET 
      stock_quantity = p.stock_quantity + oi.quantity,
      in_stock = true
    FROM public.order_items oi
    WHERE oi.vendor_order_id = NEW.id
      AND p.id = oi.product_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_restore_stock_on_cancellation
AFTER UPDATE ON public.vendor_orders
FOR EACH ROW
EXECUTE FUNCTION public.restore_stock_on_cancellation();
