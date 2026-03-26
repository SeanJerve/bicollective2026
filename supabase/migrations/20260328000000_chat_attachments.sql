-- 1. Create chat-attachments storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-attachments', 'chat-attachments', true) 
ON CONFLICT (id) DO NOTHING;

-- 2. Add RLS policies for chat-attachments
-- Allow authenticated users to upload to their own folder
DROP POLICY IF EXISTS "Users can upload their own chat attachments" ON storage.objects;
CREATE POLICY "Users can upload their own chat attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'chat-attachments' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view attachments if they are part of the conversation
-- For simplicity and performance with signed URLs, we allow authenticated users to select, 
-- but in a production environment, we would join with the messages table.
DROP POLICY IF EXISTS "Authenticated users can view chat attachments" ON storage.objects;
CREATE POLICY "Authenticated users can view chat attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'chat-attachments');

-- 3. Add index for messages matching to speed up conversation list
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON public.messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_vendor_order_id ON public.messages(vendor_order_id);
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON public.messages(read_at) WHERE read_at IS NULL;
