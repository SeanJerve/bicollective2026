-- COMPREHENSIVE NOTIFICATION TRIGGERS
-- This migration ensures every actionable event creates a persistent notification row.

-- 1. Admin Notifications: Vendor Applications
CREATE OR REPLACE FUNCTION public.handle_admin_application_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    SELECT id, 'New Vendor Application', 'A new vendor application is awaiting review', 'admin', '/admin/applications'
    FROM public.profiles WHERE role = 'admin';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_admin_application_notification ON public.vendor_applications;
CREATE TRIGGER tr_admin_application_notification
  AFTER INSERT OR UPDATE OF status ON public.vendor_applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_admin_application_notification();


-- 2. Admin Notifications: Vendor Verifications
CREATE OR REPLACE FUNCTION public.handle_admin_verification_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    SELECT id, 'New Verification Request', 'A new verification request is awaiting review', 'admin', '/admin/verifications'
    FROM public.profiles WHERE role = 'admin';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_admin_verification_notification ON public.vendor_verifications;
CREATE TRIGGER tr_admin_verification_notification
  AFTER INSERT OR UPDATE OF status ON public.vendor_verifications
  FOR EACH ROW EXECUTE FUNCTION public.handle_admin_verification_notification();


-- 3. Admin & Vendor Notifications: Disputes
CREATE OR REPLACE FUNCTION public.handle_dispute_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_vendor_id UUID;
  v_brand_name TEXT;
BEGIN
  -- Get vendor owner and brand name
  SELECT b.owner_id, b.name INTO v_vendor_id, v_brand_name
  FROM public.vendor_orders vo
  JOIN public.brands b ON b.id = vo.brand_id
  WHERE vo.id = NEW.order_id;

  -- Notify Admins
  INSERT INTO public.notifications (user_id, title, message, type, link)
  SELECT id, 'New Dispute Raised', 'A customer has raised a dispute for ' || v_brand_name, 'admin', '/admin/disputes'
  FROM public.profiles WHERE role = 'admin';

  -- Notify Vendor
  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (v_vendor_id, 'Dispute Opened', 'A dispute has been opened for one of your orders', 'dispute', '/vendor/orders');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Assuming a 'disputes' table exists or will be created. 
-- Adjusting to check if table exists first in a real migration, but here we'll define it for the schema.
DROP TRIGGER IF EXISTS tr_dispute_notification ON public.disputes;
CREATE TRIGGER tr_dispute_notification 
  AFTER INSERT ON public.disputes 
  FOR EACH ROW EXECUTE FUNCTION public.handle_dispute_notification();


-- 4. Vendor Notifications: Application/Verification Status Updates
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
      '/vendor/register'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Added check for TG_TABLE_NAME if needed, but separate triggers are cleaner.

-- 5. Vendor Notifications: Low Stock Alert
CREATE OR REPLACE FUNCTION public.handle_low_stock_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_owner_id UUID;
BEGIN
  -- Only notify if it was above 5 and now it's below
  IF (OLD.stock_quantity >= 5 AND NEW.stock_quantity < 5) THEN
    SELECT owner_id INTO v_owner_id FROM public.brands WHERE id = NEW.brand_id;
    
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      v_owner_id,
      'Low Stock Alert',
      'Your product "' || NEW.name || '" is running low on stock (' || NEW.stock_quantity || ' left)',
      'inventory',
      '/vendor/products'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_low_stock_notification ON public.products;
CREATE TRIGGER tr_low_stock_notification
  AFTER UPDATE OF stock_quantity ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_low_stock_notification();
