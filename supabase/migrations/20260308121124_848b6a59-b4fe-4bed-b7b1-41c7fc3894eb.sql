-- Allow all authenticated users to view basic profile info (for reviews display)
CREATE POLICY "Anyone can view basic profile info"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Allow brand owners to access payment proofs for their orders
CREATE POLICY "Brand owners can view payment proofs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-proofs'
  AND (
    -- The uploader can always view
    (storage.foldername(name))[1] = auth.uid()::text
    -- Admins can view all
    OR public.has_role(auth.uid(), 'admin')
  )
);