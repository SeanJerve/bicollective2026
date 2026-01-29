-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

-- Create storage bucket for payment proofs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('payment-proofs', 'payment-proofs', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

-- Create storage bucket for brand assets (logos, banners)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('brand-assets', 'brand-assets', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

-- RLS policies for product-images bucket (public read, vendor write)
CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Vendors can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' 
  AND has_role(auth.uid(), 'vendor')
);

CREATE POLICY "Vendors can update their product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images' 
  AND has_role(auth.uid(), 'vendor')
);

CREATE POLICY "Vendors can delete their product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images' 
  AND has_role(auth.uid(), 'vendor')
);

-- RLS policies for payment-proofs bucket (private - customer upload, vendor/admin view)
CREATE POLICY "Customers can upload payment proofs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'payment-proofs'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Customers can view their payment proofs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'payment-proofs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Vendors can view payment proofs for their orders"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'payment-proofs'
  AND has_role(auth.uid(), 'vendor')
);

CREATE POLICY "Admins can view all payment proofs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'payment-proofs'
  AND has_role(auth.uid(), 'admin')
);

-- RLS policies for brand-assets bucket (public read, owner write)
CREATE POLICY "Anyone can view brand assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'brand-assets');

CREATE POLICY "Vendors can upload brand assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'brand-assets' 
  AND has_role(auth.uid(), 'vendor')
);

CREATE POLICY "Vendors can update their brand assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'brand-assets' 
  AND has_role(auth.uid(), 'vendor')
);

CREATE POLICY "Vendors can delete their brand assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'brand-assets' 
  AND has_role(auth.uid(), 'vendor')
);