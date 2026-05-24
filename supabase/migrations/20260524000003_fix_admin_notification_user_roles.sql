-- Fix: profiles has no "role" column — use user_roles for admin notifications.

CREATE OR REPLACE FUNCTION public.handle_admin_application_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    SELECT ur.user_id, 'New Vendor Application', 'A new vendor application is awaiting review', 'admin', '/admin/applications'
    FROM public.user_roles ur
    WHERE ur.role = 'admin';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_admin_verification_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    SELECT ur.user_id, 'New Verification Request', 'A new verification request is awaiting review', 'admin', '/admin/verifications'
    FROM public.user_roles ur
    WHERE ur.role = 'admin';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_dispute_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_vendor_id UUID;
  v_brand_name TEXT;
BEGIN
  SELECT b.owner_id, b.name INTO v_vendor_id, v_brand_name
  FROM public.vendor_orders vo
  JOIN public.brands b ON b.id = vo.brand_id
  WHERE vo.id = NEW.vendor_order_id;

  INSERT INTO public.notifications (user_id, title, message, type, link)
  SELECT ur.user_id, 'New Dispute Raised', 'A customer has raised a dispute for ' || COALESCE(v_brand_name, 'an order'), 'admin', '/admin/disputes'
  FROM public.user_roles ur
  WHERE ur.role = 'admin';

  IF v_vendor_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (v_vendor_id, 'Dispute Opened', 'A dispute has been opened for one of your orders', 'dispute', '/vendor/orders');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_vendor_status_update_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      NEW.user_id,
      'Application Update',
      'Your vendor application status has changed to: ' || NEW.status,
      'status',
      '/vendor/application-status'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_vendor_application_status_notification ON public.vendor_applications;
CREATE TRIGGER tr_vendor_application_status_notification
  AFTER UPDATE OF status ON public.vendor_applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_vendor_status_update_notification();
