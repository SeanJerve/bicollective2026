-- PRODUCTS: 5 per brand (40 total) — look up categories by slug
DO $$
DECLARE
  cat_tshirts uuid; cat_hoodies uuid; cat_shorts uuid; cat_jackets uuid; cat_caps uuid;
BEGIN
  SELECT id INTO cat_tshirts FROM public.categories WHERE slug = 't-shirts' LIMIT 1;
  SELECT id INTO cat_hoodies FROM public.categories WHERE slug = 'hoodies' LIMIT 1;
  SELECT id INTO cat_shorts FROM public.categories WHERE slug = 'shorts' LIMIT 1;
  SELECT id INTO cat_jackets FROM public.categories WHERE slug = 'jackets' LIMIT 1;
  SELECT id INTO cat_caps FROM public.categories WHERE slug = 'caps' LIMIT 1;

  -- Create categories if they don't exist
  IF cat_tshirts IS NULL THEN INSERT INTO public.categories (id,name,slug) VALUES (gen_random_uuid(),'T-Shirts','t-shirts') RETURNING id INTO cat_tshirts; END IF;
  IF cat_hoodies IS NULL THEN INSERT INTO public.categories (id,name,slug) VALUES (gen_random_uuid(),'Hoodies','hoodies') RETURNING id INTO cat_hoodies; END IF;
  IF cat_shorts IS NULL THEN INSERT INTO public.categories (id,name,slug) VALUES (gen_random_uuid(),'Shorts','shorts') RETURNING id INTO cat_shorts; END IF;
  IF cat_jackets IS NULL THEN INSERT INTO public.categories (id,name,slug) VALUES (gen_random_uuid(),'Jackets','jackets') RETURNING id INTO cat_jackets; END IF;
  IF cat_caps IS NULL THEN INSERT INTO public.categories (id,name,slug) VALUES (gen_random_uuid(),'Caps','caps') RETURNING id INTO cat_caps; END IF;

  INSERT INTO public.products (brand_id, category_id, name, slug, description, price, original_price, image_url, in_stock, is_active, listing_type) VALUES
  -- Syndicate
  ('b1000000-0000-0000-0000-000000000001',cat_tshirts,'Mayon Oversized Tee','syndicate-mayon-tee','Oversized drop-shoulder tee with Mayon volcano backprint.',599,749,'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600',true,true,'regular'),
  ('b1000000-0000-0000-0000-000000000001',cat_hoodies,'Daraga Zip Hoodie','syndicate-daraga-hoodie','Full-zip heavyweight hoodie in washed black.',1299,1499,'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600',true,true,'regular'),
  ('b1000000-0000-0000-0000-000000000001',cat_shorts,'Rawdog Mesh Shorts','syndicate-rawdog-shorts','Breathable mesh shorts with side zip pockets.',499,null,'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=600',true,true,'regular'),
  ('b1000000-0000-0000-0000-000000000001',cat_jackets,'Asog Windbreaker','syndicate-asog-windbreaker','Lightweight windbreaker with reflective logo.',1599,1899,'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600',true,true,'regular'),
  ('b1000000-0000-0000-0000-000000000001',cat_caps,'Bloc Snapback','syndicate-bloc-snapback','Structured snapback with embroidered logo.',399,null,'https://images.unsplash.com/photo-1588850561407-ed78c334e67a?w=600',true,true,'regular'),
  -- Kultura
  ('b1000000-0000-0000-0000-000000000002',cat_tshirts,'Pintados Graphic Tee','kultura-pintados-tee','Heritage tattoo-print graphic on 100% cotton.',549,null,'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600',true,true,'regular'),
  ('b1000000-0000-0000-0000-000000000002',cat_hoodies,'Abaca Pullover Hoodie','kultura-abaca-hoodie','Earthy tone pullover with abaca weave texture print.',1199,1399,'https://images.unsplash.com/photo-1578768079470-0a4536cc7f93?w=600',true,true,'regular'),
  ('b1000000-0000-0000-0000-000000000002',cat_tshirts,'Sarung Box Tee','kultura-sarung-tee','Boxy fit tee with sarong-inspired pattern.',499,599,'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600',true,true,'regular'),
  ('b1000000-0000-0000-0000-000000000002',cat_shorts,'Likha Board Shorts','kultura-likha-shorts','Quick-dry board shorts with ethnic trim detail.',649,null,'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=600',true,true,'regular'),
  ('b1000000-0000-0000-0000-000000000002',cat_caps,'Tribal Dad Cap','kultura-tribal-cap','Soft-wash dad cap with embroidered tribal motif.',349,null,'https://images.unsplash.com/photo-1534215754734-18e55d13e346?w=600',true,true,'regular'),
  -- Rawthread
  ('b1000000-0000-0000-0000-000000000003',cat_tshirts,'Blank Essential Tee','rawthread-blank-tee','Premium heavyweight blank. 220gsm cotton.',399,null,'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600',true,true,'regular'),
  ('b1000000-0000-0000-0000-000000000003',cat_hoodies,'Daily Crew Hoodie','rawthread-daily-hoodie','Midweight fleece hoodie. Clean cut, zero branding.',1099,null,'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600',true,true,'regular'),
  ('b1000000-0000-0000-0000-000000000003',cat_shorts,'Clean Cut Shorts','rawthread-clean-shorts','French terry shorts with elastic waist.',449,null,'https://images.unsplash.com/photo-1598522325074-042db73aa4e6?w=600',true,true,'regular'),
  ('b1000000-0000-0000-0000-000000000003',cat_tshirts,'Washed Pocket Tee','rawthread-washed-tee','Garment-dyed pocket tee in vintage wash.',449,499,'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600',true,true,'regular'),
  ('b1000000-0000-0000-0000-000000000003',cat_jackets,'Coach Jacket','rawthread-coach-jacket','Unlined nylon coach jacket with snap buttons.',899,null,'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=600',true,true,'regular'),
  -- Hulo
  ('b1000000-0000-0000-0000-000000000004',cat_tshirts,'Tinagak Tee','hulo-tinagak-tee','Hand-stamped limited edition tee. Only 50 pieces.',799,null,'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600',true,true,'regular'),
  ('b1000000-0000-0000-0000-000000000004',cat_hoodies,'Tapis Knit Hoodie','hulo-tapis-hoodie','Chunky knit hoodie inspired by traditional tapis weaving.',1499,1799,'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600',true,true,'regular'),
  ('b1000000-0000-0000-0000-000000000004',cat_jackets,'Dagat Denim Jacket','hulo-dagat-denim','Raw selvedge denim jacket with ocean-wash finish.',1899,2199,'https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=600',true,true,'regular'),
  ('b1000000-0000-0000-0000-000000000004',cat_tshirts,'Alon Striped Tee','hulo-alon-tee','Nautical stripe tee in organic cotton.',649,null,'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=600',true,true,'regular'),
  ('b1000000-0000-0000-0000-000000000004',cat_caps,'Bukid Bucket Hat','hulo-bukid-bucket','Reversible bucket hat, solid + pattern sides.',449,null,'https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=600',true,true,'regular'),
  -- Gritto
  ('b1000000-0000-0000-0000-000000000005',cat_tshirts,'Revolt Tee','gritto-revolt-tee','Protest-art graphic tee. Screen-printed by hand.',549,null,'https://images.unsplash.com/photo-1503342394128-c104d54dba01?w=600',true,true,'regular'),
  ('b1000000-0000-0000-0000-000000000005',cat_hoodies,'Takas Hoodie','gritto-takas-hoodie','Heavyweight hoodie with all-over graffiti print.',1349,1499,'https://images.unsplash.com/photo-1542060748-10c28b62716f?w=600',true,true,'regular'),
  ('b1000000-0000-0000-0000-000000000005',cat_shorts,'Basag Cargo Shorts','gritto-basag-shorts','Six-pocket cargo shorts in olive drab.',599,null,'https://images.unsplash.com/photo-1560243563-062bfc001d68?w=600',true,true,'regular'),
  ('b1000000-0000-0000-0000-000000000005',cat_tshirts,'Mugshot Tee','gritto-mugshot-tee','Distressed mugshot-style self-portrait print.',499,null,'https://images.unsplash.com/photo-1554568218-0f1715e72254?w=600',true,true,'regular'),
  ('b1000000-0000-0000-0000-000000000005',cat_jackets,'Riot Bomber','gritto-riot-bomber','MA-1 bomber jacket with patchwork details.',1699,1999,'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600',true,true,'regular'),
  -- Labas
  ('b1000000-0000-0000-0000-000000000006',cat_tshirts,'Trail Dri-Fit Tee','labas-trail-tee','Moisture-wicking performance tee for outdoor runs.',499,null,'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600',true,true,'regular'),
  ('b1000000-0000-0000-0000-000000000006',cat_jackets,'Summit Shell Jacket','labas-summit-jacket','Waterproof shell jacket for Bicol rainy season.',1799,2099,'https://images.unsplash.com/photo-1495105787522-5334e3ffa0ef?w=600',true,true,'regular'),
  ('b1000000-0000-0000-0000-000000000006',cat_shorts,'River Quick-Dry Shorts','labas-river-shorts','UPF 50+ shorts for river trekking and water sports.',649,null,'https://images.unsplash.com/photo-1571455786673-9d9d6c194f90?w=600',true,true,'regular'),
  ('b1000000-0000-0000-0000-000000000006',cat_hoodies,'Fog Fleece Hoodie','labas-fog-hoodie','Technical fleece hoodie with thumbhole cuffs.',1299,null,'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600',true,true,'regular'),
  ('b1000000-0000-0000-0000-000000000006',cat_caps,'Peak Cap','labas-peak-cap','Ventilated trail cap with neck shade.',399,null,'https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?w=600',true,true,'regular'),
  -- Dapian
  ('b1000000-0000-0000-0000-000000000007',cat_tshirts,'Tahimik Minimal Tee','dapian-tahimik-tee','Clean minimal tee with tonal chest logo.',449,null,'https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=600',true,true,'regular'),
  ('b1000000-0000-0000-0000-000000000007',cat_hoodies,'Hiraya Hoodie','dapian-hiraya-hoodie','Relaxed fit hoodie in muted earth tones.',1149,null,'https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?w=600',true,true,'regular'),
  ('b1000000-0000-0000-0000-000000000007',cat_shorts,'Pahinga Lounge Shorts','dapian-pahinga-shorts','Ultra-soft lounge shorts with drawstring waist.',399,null,'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600',true,true,'regular'),
  ('b1000000-0000-0000-0000-000000000007',cat_tshirts,'Kulay Pastel Tee','dapian-kulay-tee','Pastel-dyed tee in five colorways.',499,null,'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=600',true,true,'regular'),
  ('b1000000-0000-0000-0000-000000000007',cat_jackets,'Layer Overshirt','dapian-layer-overshirt','Cotton twill overshirt for light layering.',949,1099,'https://images.unsplash.com/photo-1594938328870-9623159c8c99?w=600',true,true,'regular'),
  -- Sigaw
  ('b1000000-0000-0000-0000-000000000008',cat_tshirts,'Salita Statement Tee','sigaw-salita-tee','Bold Bicol phrase printed in heavy ink.',499,null,'https://images.unsplash.com/photo-1527719327859-c6ce80353573?w=600',true,true,'regular'),
  ('b1000000-0000-0000-0000-000000000008',cat_hoodies,'Ingay Cropped Hoodie','sigaw-ingay-hoodie','Cropped unisex hoodie with chenille patch.',1199,1399,'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600',true,true,'regular'),
  ('b1000000-0000-0000-0000-000000000008',cat_shorts,'Galak Skate Shorts','sigaw-galak-shorts','Relaxed skate shorts with bold side print.',549,null,'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=600',true,true,'regular'),
  ('b1000000-0000-0000-0000-000000000008',cat_tshirts,'Hugot Ringer Tee','sigaw-hugot-tee','Retro ringer tee with Bicol hugot quotes.',449,null,'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600',true,true,'regular'),
  ('b1000000-0000-0000-0000-000000000008',cat_caps,'Boses Trucker Cap','sigaw-boses-cap','Classic trucker cap with foam front panel.',349,null,'https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?w=600',true,true,'regular')
  ON CONFLICT (slug) DO NOTHING;
END $$;

-- PRODUCT VARIANTS (S/M/L/XL for each seeded product)
INSERT INTO public.product_variants (product_id, size, stock_quantity)
SELECT p.id, s.size, (15 + floor(random()*30))::int
FROM public.products p
CROSS JOIN (VALUES ('S'),('M'),('L'),('XL')) AS s(size)
WHERE p.brand_id::text LIKE 'b1000000%'
ON CONFLICT (product_id, size) DO NOTHING;

-- PRODUCT IMAGES (1 extra gallery image per product)
INSERT INTO public.product_images (product_id, image_url, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-' || 
  CASE (row_number() OVER ()) % 8
    WHEN 0 THEN '1521572163474-6864f9cf17ab'
    WHEN 1 THEN '1556821840-3a63f95609a7'
    WHEN 2 THEN '1583743814966-8936f5b7be1a'
    WHEN 3 THEN '1618354691373-d851c5c3a990'
    WHEN 4 THEN '1562157873-818bc0726f68'
    WHEN 5 THEN '1576566588028-4147f3842f27'
    WHEN 6 THEN '1503342217505-b0a15ec3261c'
    ELSE '1620799140408-edc6dcb6d633'
  END || '?w=600', 1
FROM public.products p
WHERE p.brand_id::text LIKE 'b1000000%';
