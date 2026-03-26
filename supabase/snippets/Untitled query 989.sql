-- Create notifications table for persistent history
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'system' NOT NULL, -- 'order', 'message', 'verification', 'system'
  link TEXT, -- Optional URL to navigate to when clicked
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update (mark as read) their own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Index for performance
CREATE INDEX idx_notifications_user_id_read_at ON public.notifications(user_id, read_at);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Helper function to create notification easily from other functions if needed
-- (Optional, but good for future triggers)
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'system',
  p_link TEXT DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (p_user_id, p_title, p_message, p_type, p_link);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
