-- Trigger to create a persistent notification in the history for Direct Messages
DROP TRIGGER IF EXISTS tr_new_direct_message_notification ON public.direct_messages;

CREATE TRIGGER tr_new_direct_message_notification
  AFTER INSERT ON public.direct_messages
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_message_notification();
