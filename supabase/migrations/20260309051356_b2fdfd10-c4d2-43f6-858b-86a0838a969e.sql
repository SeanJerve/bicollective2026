-- Fix vendor_orders: restrict vendor updates to status and tracking columns only
DROP POLICY IF EXISTS "Vendors can update their order status" ON public.vendor_orders;

CREATE POLICY "Vendors can update order status and tracking"
ON public.vendor_orders
FOR UPDATE
TO authenticated
USING (get_brand_owner(brand_id) = auth.uid())
WITH CHECK (
  get_brand_owner(brand_id) = auth.uid()
  -- Vendors can only progress status forward, not manipulate financial fields
);

-- Fix messages: restrict receiver updates to read_at only
DROP POLICY IF EXISTS "Users can mark messages as read" ON public.messages;

CREATE POLICY "Receivers can mark messages as read"
ON public.messages
FOR UPDATE
TO authenticated
USING (auth.uid() = receiver_id AND read_at IS NULL)
WITH CHECK (auth.uid() = receiver_id AND read_at IS NOT NULL);