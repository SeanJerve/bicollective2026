-- Add notification trigger for new review reports
-- When a vendor submits a report (INSERT into reports table),
-- notify all admins so they can take action quickly.

CREATE OR REPLACE FUNCTION public.handle_admin_report_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_review_comment TEXT;
  v_reporter_name TEXT;
  v_message TEXT;
BEGIN
  -- Only trigger for new pending reports
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN

    -- Try to get review comment (if it's a review report)
    IF NEW.review_id IS NOT NULL THEN
      SELECT COALESCE(comment, '(no comment)') INTO v_review_comment
      FROM public.reviews WHERE id = NEW.review_id;
    END IF;

    -- Try to get reporter name
    SELECT COALESCE(full_name, 'A vendor') INTO v_reporter_name
    FROM public.profiles WHERE user_id = NEW.reporter_id;

    -- Build message
    IF NEW.review_id IS NOT NULL THEN
      v_message := v_reporter_name || ' reported a review: "' || COALESCE(LEFT(v_review_comment, 60), '') || '"';
    ELSIF NEW.product_id IS NOT NULL THEN
      v_message := v_reporter_name || ' reported a product listing';
    ELSIF NEW.brand_id IS NOT NULL THEN
      v_message := v_reporter_name || ' reported a brand';
    ELSE
      v_message := v_reporter_name || ' submitted a new report';
    END IF;

    -- Insert notification for every admin user
    INSERT INTO public.notifications (user_id, title, message, type, link)
    SELECT
      p.user_id,
      'New Report Submitted',
      v_message,
      'admin',
      '/admin/reports'
    FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.user_id
    WHERE ur.role = 'admin';

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_admin_report_notification ON public.reports;
CREATE TRIGGER tr_admin_report_notification
  AFTER INSERT ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.handle_admin_report_notification();
