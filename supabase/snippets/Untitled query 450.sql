-- ============================================================
-- BICOLLECTIVE 2026: SECURE CUSTOMER CANCELLATION RPC
-- Includes automatic restocking logic
-- ============================================================

CREATE OR REPLACE FUNCTION public.cancel_vendor_order_customer(vendor_order_id_param uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- 1. Verify the order belongs to the calling user
  IF NOT EXISTS (
    SELECT 1 FROM public.vendor_orders vo
    JOIN public.orders o ON vo.id = vendor_order_id_param AND vo.order_id = o.id
    WHERE o.customer_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized to cancel this order';
  END IF;

  -- 2. Verify status allows cancellation (only before shipping)
  IF (SELECT status FROM public.vendor_orders WHERE id = vendor_order_id_param) 
     NOT IN ('pending_payment', 'payment_uploaded', 'confirmed') THEN
    RAISE EXCEPTION 'Order cannot be cancelled at this stage.';
  END IF;

  -- 3. Restock items
  UPDATE public.product_variants pv
  SET stock_quantity = pv.stock_quantity + oi.quantity
  FROM public.order_items oi
  WHERE oi.vendor_order_id = vendor_order_id_param 
    AND pv.id = oi.variant_id;

  -- 4. Update status
  UPDATE public.vendor_orders
  SET status = 'cancelled'
  WHERE id = vendor_order_id_param;
END; $$;

-- 5. Grant permission to authenticated users
GRANT EXECUTE ON FUNCTION public.cancel_vendor_order_customer(uuid) TO authenticated;
