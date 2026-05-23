-- ============================================================
-- BICOLLECTIVE 2026: Drops & Brand Verification Migration
-- 1. Add drop_id foreign key to products
-- 2. Move Shirts products to T-Shirts, delete Shirts category
-- 3. Reset verified status for unverified brands
-- 4. Set premium unsplash category banners
-- ============================================================

-- 1. Add drop_id to products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS drop_id UUID REFERENCES public.product_drops(id) ON DELETE SET NULL;

-- 2. Merge Shirts category into T-Shirts and delete Shirts
-- T-Shirts ID: '7d152976-7690-46d9-a764-e6470629de72'
-- Shirts ID: '0d0b3d7c-3299-4deb-bc21-f3e80e751f4d'
UPDATE public.products 
SET category_id = '7d152976-7690-46d9-a764-e6470629de72' 
WHERE category_id = '0d0b3d7c-3299-4deb-bc21-f3e80e751f4d';

DELETE FROM public.categories 
WHERE id = '0d0b3d7c-3299-4deb-bc21-f3e80e751f4d';

-- 3. Reset brand verification status
-- Only brands with a successful 'verified' verification entry keep their verified status
UPDATE public.brands
SET status = 'approved'::vendor_status
WHERE id NOT IN (
  SELECT brand_id 
  FROM public.vendor_verifications 
  WHERE status = 'verified'
);

-- 4. Set beautiful Unsplash categories images
UPDATE public.categories SET image_url = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80' WHERE slug = 't-shirts';
UPDATE public.categories SET image_url = 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&auto=format&fit=crop&q=80' WHERE slug = 'pants';
UPDATE public.categories SET image_url = 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&auto=format&fit=crop&q=80' WHERE slug = 'hoodies';
UPDATE public.categories SET image_url = 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80' WHERE slug = 'jackets';
UPDATE public.categories SET image_url = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80' WHERE slug = 'accessories';
