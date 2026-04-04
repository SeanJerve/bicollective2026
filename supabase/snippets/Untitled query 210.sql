-- Create platform-assets bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('platform-assets', 'platform-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
DROP POLICY IF EXISTS "Public read platform-assets" ON storage.objects;
CREATE POLICY "Public read platform-assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'platform-assets');

-- Allow admins to insert and manage
DROP POLICY IF EXISTS "Admins can manage platform assets" ON storage.objects;
CREATE POLICY "Admins can manage platform assets"
ON storage.objects FOR ALL
USING (
  bucket_id = 'platform-assets'
  AND auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'admin')
)
WITH CHECK (
  bucket_id = 'platform-assets'
  AND auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'admin')
);
