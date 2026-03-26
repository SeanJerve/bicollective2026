-- Allow customers to confirm delivery of their vendor orders
-- This policy allows updating the status to 'delivered' and setting 'delivered_at'
-- only if the current status is one of the shipping statuses.
DROP POLICY IF EXISTS "Customers can confirm delivery" ON public.vendor_orders;
CREATE POLICY "Customers can confirm delivery"
ON public.vendor_orders
FOR UPDATE
TO authenticated
USING (
  status IN ('handed_to_courier', 'shipped', 'for_delivery')
  AND EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = vendor_orders.order_id
      AND orders.customer_id = auth.uid()
  )
)
WITH CHECK (
  status = 'delivered'
  AND delivered_at IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = vendor_orders.order_id
      AND orders.customer_id = auth.uid()
  )
);

-- Also ensure vendors can still update statuses as they were
-- (Handled by the broad "Vendors can update their order status" policy)
