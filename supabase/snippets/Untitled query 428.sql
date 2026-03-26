-- Triggers for automatic notification creation

-- 1. Notification for new messages
CREATE OR REPLACE FUNCTION public.handle_new_message_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (
    NEW.receiver_id,
    'New Message',
    'You received a new message',
    'message',
    CASE 
      WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.receiver_id AND role = 'vendor') 
      THEN '/vendor/messages' 
      ELSE '/account/messages' 
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_new_message_notification ON public.messages;
CREATE TRIGGER tr_new_message_notification
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_message_notification();

-- 2. Notification for order status updates
CREATE OR REPLACE FUNCTION public.handle_order_status_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_customer_id UUID;
  v_brand_name TEXT;
BEGIN
  -- Only notify on status change
  IF (OLD.status IS DISTINCT FROM NEW.status) THEN
    -- Get customer ID and brand name
    SELECT o.customer_id, b.name INTO v_customer_id, v_brand_name
    FROM public.vendor_orders vo
    JOIN public.orders o ON o.id = vo.order_id
    JOIN public.brands b ON b.id = vo.brand_id
    WHERE vo.id = NEW.id;

    -- Notify customer
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      v_customer_id,
      'Order Update: ' || NEW.status,
      'Your order from ' || v_brand_name || ' is now ' || NEW.status,
      'order',
      '/account/orders/' || (SELECT order_id FROM public.vendor_orders WHERE id = NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_order_status_notification ON public.vendor_orders;
CREATE TRIGGER tr_order_status_notification
  AFTER UPDATE OF status ON public.vendor_orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_order_status_notification();

-- 3. Notification for new orders (for vendors)
CREATE OR REPLACE FUNCTION public.handle_new_order_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_owner_id UUID;
BEGIN
  SELECT owner_id INTO v_owner_id FROM public.brands WHERE id = NEW.brand_id;
  
  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (
    v_owner_id,
    'New Order Received',
    'You have a new order to process',
    'order',
    '/vendor/orders'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_new_order_notification ON public.vendor_orders;
CREATE TRIGGER tr_new_order_notification
  AFTER INSERT ON public.vendor_orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_order_notification();
