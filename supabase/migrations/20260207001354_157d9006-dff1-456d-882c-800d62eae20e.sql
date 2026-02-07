-- Enable realtime for notification-relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.vendor_applications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vendor_verifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
ALTER PUBLICATION supabase_realtime ADD TABLE public.disputes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vendor_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;

-- Allow admin to delete vendor applications
CREATE POLICY "Admins can delete applications"
ON public.vendor_applications
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admin to delete brands (vendors)
CREATE POLICY "Admins can delete brands"
ON public.brands
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admin to delete products  
CREATE POLICY "Admins can delete all products"
ON public.products
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admin to delete reviews
CREATE POLICY "Admins can delete reviews"
ON public.reviews
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admin to delete reports
CREATE POLICY "Admins can delete reports"
ON public.reports
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admin to delete orders
CREATE POLICY "Admins can delete orders"
ON public.orders
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admin to delete vendor_orders
CREATE POLICY "Admins can delete vendor_orders"
ON public.vendor_orders
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admin to delete disputes
CREATE POLICY "Admins can delete disputes"
ON public.disputes
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admin to delete verifications
CREATE POLICY "Admins can delete verifications"
ON public.vendor_verifications
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admin to delete vouchers
CREATE POLICY "Admins can delete vouchers"
ON public.vouchers
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admin to delete promotions
CREATE POLICY "Admins can delete promotions"
ON public.promotions
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow vendor to delete their own reviews (for moderation)
CREATE POLICY "Vendors can delete reviews on their products"
ON public.reviews
FOR DELETE
USING (get_brand_owner(brand_id) = auth.uid());

-- Allow vendor to delete their own promotions
CREATE POLICY "Vendors can delete their promotions"
ON public.promotions
FOR DELETE
USING (get_brand_owner(brand_id) = auth.uid());

-- Storage policy for admin to read vendor-documents
CREATE POLICY "Admins can read vendor documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'vendor-documents' AND has_role(auth.uid(), 'admin'::app_role));
