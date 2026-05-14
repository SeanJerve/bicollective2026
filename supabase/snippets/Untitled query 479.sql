-- ============================================================
-- BICOLLECTIVE SEED: 8 Vendors + Products + Orders + Reviews
-- Run this in Supabase Studio SQL Editor
-- All passwords: "password123"
-- ============================================================

-- STEP 0: Fix the stale handle_new_user trigger function (email column was dropped from profiles)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

-- STEP 1: Create Auth Users (8 vendors + 4 customers)
-- Password hash for "password123" using bcrypt
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud, created_at, updated_at, confirmation_token, recovery_token)
VALUES
  -- Vendors
  ('a1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'vendor.syndicate@demo.com', '$2a$10$PznXqF1GBHPEObAMHJMZhOVBAglJNSrl.GZ3HswB1FkGOkWJsMzrG', now(), '{"full_name":"Marco Villanueva"}', 'authenticated', 'authenticated', now(), now(), '', ''),
  ('a1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'vendor.kultura@demo.com', '$2a$10$PznXqF1GBHPEObAMHJMZhOVBAglJNSrl.GZ3HswB1FkGOkWJsMzrG', now(), '{"full_name":"Maria Santos"}', 'authenticated', 'authenticated', now(), now(), '', ''),
  ('a1000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'vendor.rawthread@demo.com', '$2a$10$PznXqF1GBHPEObAMHJMZhOVBAglJNSrl.GZ3HswB1FkGOkWJsMzrG', now(), '{"full_name":"Jake Ramirez"}', 'authenticated', 'authenticated', now(), now(), '', ''),
  ('a1000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'vendor.hulo@demo.com', '$2a$10$PznXqF1GBHPEObAMHJMZhOVBAglJNSrl.GZ3HswB1FkGOkWJsMzrG', now(), '{"full_name":"Anika Bautista"}', 'authenticated', 'authenticated', now(), now(), '', ''),
  ('a1000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'vendor.gritto@demo.com', '$2a$10$PznXqF1GBHPEObAMHJMZhOVBAglJNSrl.GZ3HswB1FkGOkWJsMzrG', now(), '{"full_name":"Diego Cruz"}', 'authenticated', 'authenticated', now(), now(), '', ''),
  ('a1000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'vendor.labas@demo.com', '$2a$10$PznXqF1GBHPEObAMHJMZhOVBAglJNSrl.GZ3HswB1FkGOkWJsMzrG', now(), '{"full_name":"Trisha Mendoza"}', 'authenticated', 'authenticated', now(), now(), '', ''),
  ('a1000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000000', 'vendor.dapian@demo.com', '$2a$10$PznXqF1GBHPEObAMHJMZhOVBAglJNSrl.GZ3HswB1FkGOkWJsMzrG', now(), '{"full_name":"Kenneth Ong"}', 'authenticated', 'authenticated', now(), now(), '', ''),
  ('a1000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000000', 'vendor.sigaw@demo.com', '$2a$10$PznXqF1GBHPEObAMHJMZhOVBAglJNSrl.GZ3HswB1FkGOkWJsMzrG', now(), '{"full_name":"Camille Reyes"}', 'authenticated', 'authenticated', now(), now(), '', ''),
  -- Customers
  ('c1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'customer.juan@demo.com', '$2a$10$PznXqF1GBHPEObAMHJMZhOVBAglJNSrl.GZ3HswB1FkGOkWJsMzrG', now(), '{"full_name":"Juan dela Cruz"}', 'authenticated', 'authenticated', now(), now(), '', ''),
  ('c1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'customer.anna@demo.com', '$2a$10$PznXqF1GBHPEObAMHJMZhOVBAglJNSrl.GZ3HswB1FkGOkWJsMzrG', now(), '{"full_name":"Anna Garcia"}', 'authenticated', 'authenticated', now(), now(), '', ''),
  ('c1000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'customer.rico@demo.com', '$2a$10$PznXqF1GBHPEObAMHJMZhOVBAglJNSrl.GZ3HswB1FkGOkWJsMzrG', now(), '{"full_name":"Rico Fernandez"}', 'authenticated', 'authenticated', now(), now(), '', ''),
  ('c1000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'customer.mika@demo.com', '$2a$10$PznXqF1GBHPEObAMHJMZhOVBAglJNSrl.GZ3HswB1FkGOkWJsMzrG', now(), '{"full_name":"Mika Tan"}', 'authenticated', 'authenticated', now(), now(), '', '')
ON CONFLICT (id) DO NOTHING;

-- Also insert identities for each user so Supabase auth works
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
SELECT id, id, json_build_object('sub', id, 'email', email), 'email', id, now(), now(), now()
FROM auth.users WHERE id IN (
  'a1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000004',
  'a1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000008',
  'c1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000002','c1000000-0000-0000-0000-000000000003','c1000000-0000-0000-0000-000000000004'
) ON CONFLICT DO NOTHING;

-- STEP 2: Profiles
INSERT INTO public.profiles (user_id, full_name, avatar_url, phone) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Marco Villanueva', 'https://i.pravatar.cc/150?u=marco', '09171000001'),
  ('a1000000-0000-0000-0000-000000000002', 'Maria Santos', 'https://i.pravatar.cc/150?u=maria', '09171000002'),
  ('a1000000-0000-0000-0000-000000000003', 'Jake Ramirez', 'https://i.pravatar.cc/150?u=jake', '09171000003'),
  ('a1000000-0000-0000-0000-000000000004', 'Anika Bautista', 'https://i.pravatar.cc/150?u=anika', '09171000004'),
  ('a1000000-0000-0000-0000-000000000005', 'Diego Cruz', 'https://i.pravatar.cc/150?u=diego', '09171000005'),
  ('a1000000-0000-0000-0000-000000000006', 'Trisha Mendoza', 'https://i.pravatar.cc/150?u=trisha', '09171000006'),
  ('a1000000-0000-0000-0000-000000000007', 'Kenneth Ong', 'https://i.pravatar.cc/150?u=kenneth', '09171000007'),
  ('a1000000-0000-0000-0000-000000000008', 'Camille Reyes', 'https://i.pravatar.cc/150?u=camille', '09171000008'),
  ('c1000000-0000-0000-0000-000000000001', 'Juan dela Cruz', 'https://i.pravatar.cc/150?u=juan', '09181000001'),
  ('c1000000-0000-0000-0000-000000000002', 'Anna Garcia', 'https://i.pravatar.cc/150?u=anna', '09181000002'),
  ('c1000000-0000-0000-0000-000000000003', 'Rico Fernandez', 'https://i.pravatar.cc/150?u=rico', '09181000003'),
  ('c1000000-0000-0000-0000-000000000004', 'Mika Tan', 'https://i.pravatar.cc/150?u=mika', '09181000004')
ON CONFLICT (user_id) DO NOTHING;

-- STEP 3: Roles
INSERT INTO public.user_roles (user_id, role) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'vendor'),
  ('a1000000-0000-0000-0000-000000000002', 'vendor'),
  ('a1000000-0000-0000-0000-000000000003', 'vendor'),
  ('a1000000-0000-0000-0000-000000000004', 'vendor'),
  ('a1000000-0000-0000-0000-000000000005', 'vendor'),
  ('a1000000-0000-0000-0000-000000000006', 'vendor'),
  ('a1000000-0000-0000-0000-000000000007', 'vendor'),
  ('a1000000-0000-0000-0000-000000000008', 'vendor'),
  ('c1000000-0000-0000-0000-000000000001', 'customer'),
  ('c1000000-0000-0000-0000-000000000002', 'customer'),
  ('c1000000-0000-0000-0000-000000000003', 'customer'),
  ('c1000000-0000-0000-0000-000000000004', 'customer')
ON CONFLICT DO NOTHING;

-- STEP 4: Ensure categories exist
INSERT INTO public.categories (id, name, slug, image_url) VALUES
  ('ca000000-0000-0000-0000-000000000001', 'T-Shirts', 't-shirts', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'),
  ('ca000000-0000-0000-0000-000000000002', 'Hoodies', 'hoodies', 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400'),
  ('ca000000-0000-0000-0000-000000000003', 'Shorts', 'shorts', 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=400'),
  ('ca000000-0000-0000-0000-000000000004', 'Jackets', 'jackets', 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400'),
  ('ca000000-0000-0000-0000-000000000005', 'Caps', 'caps', 'https://images.unsplash.com/photo-1588850561407-ed78c334e67a?w=400')
ON CONFLICT (slug) DO NOTHING;

-- STEP 5: Brands (8 Bicol clothing brands, all verified)
INSERT INTO public.brands (id, owner_id, name, slug, description, status, location, logo_url, banner_url, shipping_base_fee, shipping_per_item_fee, commission_rate) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Syndicate', 'syndicate', 'Albay-born streetwear. Bold cuts, raw attitude.', 'verified', 'Legazpi City, Albay', 'https://images.unsplash.com/photo-1622434641406-a158123450f9?w=200', 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200', 60, 15, 5),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'Kultura', 'kultura', 'Heritage meets hype. Bicolano-inspired prints on modern silhouettes.', 'verified', 'Naga City, Camarines Sur', 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=200', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200', 55, 10, 5),
  ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', 'Rawthread', 'rawthread', 'No frills. No fakes. Just clean everyday essentials from Bicol.', 'verified', 'Daraga, Albay', 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=200', 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=1200', 50, 10, 5),
  ('b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000004', 'Hulo', 'hulo', 'Handwoven stories. Limited-run pieces rooted in Bicolano craft.', 'verified', 'Tabaco City, Albay', 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=200', 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200', 65, 15, 5),
  ('b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000005', 'Gritto', 'gritto', 'Loud graphics. Louder message. Streetwear for the fearless.', 'verified', 'Legazpi City, Albay', 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=200', 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200', 55, 12, 5),
  ('b1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000006', 'Labas', 'labas', 'Outdoor-ready gear designed for the Bicol terrain and climate.', 'verified', 'Iriga City, Camarines Sur', 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=200', 'https://images.unsplash.com/photo-1504198453319-5ce911bafcde?w=1200', 70, 15, 5),
  ('b1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000007', 'Dapian', 'dapian', 'Minimal aesthetic. Maximum comfort. Daily wear, elevated.', 'verified', 'Sorsogon City, Sorsogon', 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=200', 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=1200', 60, 10, 5),
  ('b1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000008', 'Sigaw', 'sigaw', 'Express yourself. Unisex statement pieces from the heart of Bicol.', 'verified', 'Ligao City, Albay', 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=200', 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200', 50, 10, 5)
ON CONFLICT (slug) DO NOTHING;
