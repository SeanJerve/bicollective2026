-- 4. Notification for new reviews (for vendors)
CREATE OR REPLACE FUNCTION public.handle_new_review_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_owner_id UUID;
  v_product_name TEXT;
BEGIN
  -- Get owner and product name
  SELECT owner_id INTO v_owner_id FROM public.brands WHERE id = NEW.brand_id;
  
  IF NEW.product_id IS NOT NULL THEN
    SELECT name INTO v_product_name FROM public.products WHERE id = NEW.product_id;
  END IF;

  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (
    v_owner_id,
    'New Review Received',
    CASE 
      WHEN v_product_name IS NOT NULL THEN 'You have a new ' || NEW.rating || '-star review for ' || v_product_name
      ELSE 'You have a new ' || NEW.rating || '-star review for your store'
    END,
    'review', -- Use 'review' type for correct icon and handling
    '/vendor/reviews'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_new_review_notification ON public.reviews;
CREATE TRIGGER tr_new_review_notification
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_review_notification();
