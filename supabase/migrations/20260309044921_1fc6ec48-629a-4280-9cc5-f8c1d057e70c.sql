-- Phase 1.2: Implement soft-delete for products and brands
-- Add deleted_at columns for soft-delete functionality

-- Add deleted_at to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add deleted_at to brands table  
ALTER TABLE public.brands
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for efficient filtering of non-deleted items
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON public.products (deleted_at);
CREATE INDEX IF NOT EXISTS idx_brands_deleted_at ON public.brands (deleted_at);

-- Drop and recreate the RLS policy for viewing active products to include soft-delete check
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
CREATE POLICY "Anyone can view active products" ON public.products
FOR SELECT
USING (is_active = true AND deleted_at IS NULL);

-- Update admin policy to allow viewing all products including soft-deleted
DROP POLICY IF EXISTS "Admins can manage all products" ON public.products;
CREATE POLICY "Admins can manage all products" ON public.products
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update brand owner policy to filter out deleted products
DROP POLICY IF EXISTS "Brand owners can manage their products" ON public.products;
CREATE POLICY "Brand owners can manage their products" ON public.products
FOR ALL
USING (get_brand_owner(brand_id) = auth.uid() AND (deleted_at IS NULL OR has_role(auth.uid(), 'admin'::app_role)));

-- Update brands RLS to filter deleted brands for public view
DROP POLICY IF EXISTS "Anyone can view approved/verified brands" ON public.brands;
CREATE POLICY "Anyone can view approved/verified brands" ON public.brands
FOR SELECT
USING (status = ANY (ARRAY['approved'::vendor_status, 'verified'::vendor_status]) AND deleted_at IS NULL);