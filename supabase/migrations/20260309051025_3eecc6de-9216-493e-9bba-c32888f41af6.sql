-- Fix: Allow customer to update from pending_payment to payment_uploaded only
DROP POLICY IF EXISTS "Customers can update payment proof only" ON public.vendor_orders;

-- Use USING to check current state (must be pending_payment and owned by customer)
-- WITH CHECK allows the new state to be payment_uploaded with payment proof
CREATE POLICY "Customers can upload payment proof"
ON public.vendor_orders
FOR UPDATE
TO authenticated
USING (
  status = 'pending_payment'
  AND EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = vendor_orders.order_id
      AND orders.customer_id = auth.uid()
  )
)
WITH CHECK (
  status = 'payment_uploaded'
  AND payment_proof_url IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = vendor_orders.order_id
      AND orders.customer_id = auth.uid()
  )
);

-- Also allow customers to cancel their own orders (pending_payment, payment_uploaded, confirmed)
CREATE POLICY "Customers can cancel their orders"
ON public.vendor_orders
FOR UPDATE
TO authenticated
USING (
  status IN ('pending_payment', 'payment_uploaded', 'confirmed')
  AND EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = vendor_orders.order_id
      AND orders.customer_id = auth.uid()
  )
)
WITH CHECK (
  status = 'cancelled'
  AND EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = vendor_orders.order_id
      AND orders.customer_id = auth.uid()
  )
);