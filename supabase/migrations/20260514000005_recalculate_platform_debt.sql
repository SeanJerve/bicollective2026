-- Function to automatically recalculate a brand's platform debt based on order history and payments
CREATE OR REPLACE FUNCTION public.recalculate_brand_platform_debt(v_brand_id UUID)
RETURNS numeric AS $$
DECLARE
  v_fees numeric := 0;
  v_paid numeric := 0;
  v_new_debt numeric := 0;
BEGIN
  -- 1. Sum platform fees from COD orders that are delivered or completed
  SELECT COALESCE(SUM(vo.total_platform_fee), 0)
  INTO v_fees
  FROM public.vendor_orders vo
  JOIN public.orders o ON o.id = vo.order_id
  JOIN public.payments p ON p.order_id = o.id
  WHERE vo.brand_id = v_brand_id
    AND vo.status = 'delivered';

  -- 2. Sum approved debt payments
  SELECT COALESCE(SUM(amount), 0)
  INTO v_paid
  FROM public.platform_transactions
  WHERE brand_id = v_brand_id
    AND transaction_type = 'debt_payment'
    AND status = 'approved';

  v_new_debt := v_fees - v_paid;

  -- 3. Update brands table
  UPDATE public.brands
  SET platform_debt = GREATEST(0, v_new_debt)
  WHERE id = v_brand_id;

  RETURN GREATEST(0, v_new_debt);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for vendor_orders
CREATE OR REPLACE FUNCTION public.tr_recalc_debt_order()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalculate_brand_platform_debt(OLD.brand_id);
    RETURN OLD;
  ELSE
    PERFORM public.recalculate_brand_platform_debt(NEW.brand_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_recalc_debt_order ON public.vendor_orders;
CREATE TRIGGER tr_recalc_debt_order
  AFTER INSERT OR UPDATE OF status OR DELETE ON public.vendor_orders
  FOR EACH ROW EXECUTE FUNCTION public.tr_recalc_debt_order();

-- Trigger for platform_transactions
CREATE OR REPLACE FUNCTION public.tr_recalc_debt_txn()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalculate_brand_platform_debt(OLD.brand_id);
    RETURN OLD;
  ELSE
    PERFORM public.recalculate_brand_platform_debt(NEW.brand_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_recalc_debt_txn ON public.platform_transactions;
CREATE TRIGGER tr_recalc_debt_txn
  AFTER INSERT OR UPDATE OF status OR DELETE ON public.platform_transactions
  FOR EACH ROW EXECUTE FUNCTION public.tr_recalc_debt_txn();

-- Apply immediately to all existing brands
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT id FROM public.brands LOOP
    PERFORM public.recalculate_brand_platform_debt(r.id);
  END LOOP;
END;
$$;
