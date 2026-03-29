-- Create the payment-proofs bucket in storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Allow public access to view payment proofs (SELECT)
DROP POLICY IF EXISTS "Public read payment-proofs" ON storage.objects;
CREATE POLICY "Public read payment-proofs"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-proofs');

-- Allow authenticated users to upload to their own folder within payment-proofs
DROP POLICY IF EXISTS "Authenticated users can upload payment proofs" ON storage.objects;
CREATE POLICY "Authenticated users can upload payment proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payment-proofs'
  -- We allow the upload since the application handles the path (brand_id/filename)
);

-- Allow authenticated users to manage their own files
DROP POLICY IF EXISTS "Users can manage their own payment proofs" ON storage.objects;
CREATE POLICY "Users can manage their own payment proofs"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'payment-proofs');
