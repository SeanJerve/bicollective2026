-- Make vendor-documents bucket public so uploaded files can be viewed via public URL
UPDATE storage.buckets
SET public = true
WHERE id = 'vendor-documents';

-- Allow anyone to read files from vendor-documents (public read)
DROP POLICY IF EXISTS "Public read vendor-documents" ON storage.objects;
CREATE POLICY "Public read vendor-documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'vendor-documents');

-- Allow authenticated users to upload to their own folder
DROP POLICY IF EXISTS "Vendors can upload documents" ON storage.objects;
CREATE POLICY "Vendors can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vendor-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own files
DROP POLICY IF EXISTS "Vendors can update their documents" ON storage.objects;
CREATE POLICY "Vendors can update their documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'vendor-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own files
DROP POLICY IF EXISTS "Vendors can delete their documents" ON storage.objects;
CREATE POLICY "Vendors can delete their documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'vendor-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
