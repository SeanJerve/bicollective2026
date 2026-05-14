-- Fix stale trigger: update_brand_rating references dropped columns (rating, review_count)
-- These are now computed via the brand_aggregates view, so make the trigger a no-op
CREATE OR REPLACE FUNCTION public.update_brand_rating()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- No-op: brand ratings are now computed via brand_aggregates view
  RETURN NEW;
END;
$$;

-- ADDRESSES for demo customers
INSERT INTO public.addresses (id, user_id, label, full_name, phone, street, barangay, city, province, zip_code, is_default) VALUES
  ('ad000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000001','Home','Juan dela Cruz','09181000001','123 Rizal St','Brgy. 1','Legazpi City','Albay','4500',true),
  ('ad000000-0000-0000-0000-000000000002','c1000000-0000-0000-0000-000000000002','Home','Anna Garcia','09181000002','456 Mabini Ave','Brgy. Concepcion Grande','Naga City','Camarines Sur','4400',true),
  ('ad000000-0000-0000-0000-000000000003','c1000000-0000-0000-0000-000000000003','Home','Rico Fernandez','09181000003','789 Penaranda St','Brgy. Tabuco','Naga City','Camarines Sur','4400',true),
  ('ad000000-0000-0000-0000-000000000004','c1000000-0000-0000-0000-000000000004','Home','Mika Tan','09181000004','321 Quezon Blvd','Brgy. Rawis','Legazpi City','Albay','4500',true)
ON CONFLICT (id) DO NOTHING;

-- ORDERS (24 orders: 3 per brand across 4 customers, all delivered)
-- Using a DO block for cleaner generation
DO $$
DECLARE
  v_brand_ids text[] := ARRAY[
    'b1000000-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000002',
    'b1000000-0000-0000-0000-000000000003','b1000000-0000-0000-0000-000000000004',
    'b1000000-0000-0000-0000-000000000005','b1000000-0000-0000-0000-000000000006',
    'b1000000-0000-0000-0000-000000000007','b1000000-0000-0000-0000-000000000008'
  ];
  v_cust_ids text[] := ARRAY[
    'c1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000002',
    'c1000000-0000-0000-0000-000000000003','c1000000-0000-0000-0000-000000000004'
  ];
  v_addr_ids text[] := ARRAY[
    'ad000000-0000-0000-0000-000000000001','ad000000-0000-0000-0000-000000000002',
    'ad000000-0000-0000-0000-000000000003','ad000000-0000-0000-0000-000000000004'
  ];
  v_names text[] := ARRAY['Juan dela Cruz','Anna Garcia','Rico Fernandez','Mika Tan'];
  v_phones text[] := ARRAY['09181000001','09181000002','09181000003','09181000004'];
  v_brand_id text;
  v_cust_idx int;
  v_order_id uuid;
  v_vo_id uuid;
  v_product record;
  v_variant record;
  v_subtotal numeric;
  v_total numeric;
  v_order_date timestamptz;
  v_order_num int := 0;
BEGIN
  FOR b_idx IN 1..8 LOOP
    v_brand_id := v_brand_ids[b_idx];
    FOR o_idx IN 1..3 LOOP
      v_order_num := v_order_num + 1;
      v_cust_idx := ((b_idx + o_idx - 1) % 4) + 1;
      v_order_id := gen_random_uuid();
      v_vo_id := gen_random_uuid();
      v_order_date := now() - ((v_order_num * 3 + floor(random()*5))::int || ' days')::interval;

      -- Pick first product of this brand
      SELECT p.id, p.name, p.price INTO v_product
      FROM public.products p WHERE p.brand_id = v_brand_id::uuid LIMIT 1;

      -- Pick a variant
      SELECT pv.id INTO v_variant
      FROM public.product_variants pv WHERE pv.product_id = v_product.id LIMIT 1;

      v_subtotal := v_product.price * (1 + floor(random()*2))::int;
      v_total := v_subtotal + 60;

      -- Create order
      INSERT INTO public.orders (id, customer_id, total_amount, total_shipping, total_discount, shipping_name, shipping_phone, shipping_address_id, created_at, updated_at)
      VALUES (v_order_id, v_cust_ids[v_cust_idx]::uuid, v_total, 60, 0, v_names[v_cust_idx], v_phones[v_cust_idx], v_addr_ids[v_cust_idx]::uuid, v_order_date, v_order_date);

      -- Create vendor_order (delivered)
      INSERT INTO public.vendor_orders (id, order_id, brand_id, subtotal, shipping_fee, status, discount_amount, platform_commission, total_platform_fee, created_at, updated_at, confirmed_at, shipped_at, for_delivery_at, delivered_at)
      VALUES (v_vo_id, v_order_id, v_brand_id::uuid, v_subtotal, 60, 'delivered', 0, v_subtotal * 0.05, v_subtotal * 0.05 + 20, v_order_date, v_order_date + interval '1 day', v_order_date + interval '4 hours', v_order_date + interval '1 day', v_order_date + interval '2 days', v_order_date + interval '3 days');

      -- Create order_item
      INSERT INTO public.order_items (vendor_order_id, product_id, product_name, product_price, quantity, size, variant_id)
      VALUES (v_vo_id, v_product.id, v_product.name, v_product.price, GREATEST(1, (v_subtotal / v_product.price)::int), 'M', v_variant.id);

      -- Create payment (verified)
      INSERT INTO public.payments (order_id, payment_method, amount, status, created_at)
      VALUES (v_order_id, (floor(random()*3))::int, v_total, 'verified', v_order_date);
    END LOOP;
  END LOOP;
END $$;

-- REVIEWS (2-3 reviews per brand from different customers)
DO $$
DECLARE
  v_brand_ids text[] := ARRAY[
    'b1000000-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000002',
    'b1000000-0000-0000-0000-000000000003','b1000000-0000-0000-0000-000000000004',
    'b1000000-0000-0000-0000-000000000005','b1000000-0000-0000-0000-000000000006',
    'b1000000-0000-0000-0000-000000000007','b1000000-0000-0000-0000-000000000008'
  ];
  v_cust_ids text[] := ARRAY[
    'c1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000002',
    'c1000000-0000-0000-0000-000000000003','c1000000-0000-0000-0000-000000000004'
  ];
  v_comments text[] := ARRAY[
    'Solid quality! Fabric feels premium for the price.',
    'Love the design, very unique. Will order again.',
    'Fit is perfect. True to size.',
    'Great local brand! Shipping was fast too.',
    'Nice material, comfortable to wear all day.',
    'The print quality is amazing. No fading after wash.',
    'Super comfy hoodie. Perfect for Bicol weather.',
    'Clean design, gets a lot of compliments.',
    'Good value. Better than most mall brands.',
    'Exactly as pictured. Very happy with my purchase.',
    'Ordered two more in different colors!',
    'Fast shipping from Bicol to Manila. Impressed.'
  ];
  v_product record;
  v_vo record;
  v_rating int;
  v_comment text;
  v_cust_idx int;
BEGIN
  FOR b_idx IN 1..8 LOOP
    FOR r_idx IN 1..3 LOOP
      v_cust_idx := ((b_idx + r_idx) % 4) + 1;

      -- Get a product from this brand
      SELECT id INTO v_product FROM public.products
      WHERE brand_id = v_brand_ids[b_idx]::uuid
      ORDER BY random() LIMIT 1;

      -- Get a vendor_order for this brand+customer
      SELECT vo.id INTO v_vo FROM public.vendor_orders vo
      JOIN public.orders o ON o.id = vo.order_id
      WHERE vo.brand_id = v_brand_ids[b_idx]::uuid
      AND o.customer_id = v_cust_ids[v_cust_idx]::uuid
      LIMIT 1;

      v_rating := 3 + floor(random()*3)::int; -- 3-5 stars
      v_comment := v_comments[((b_idx * 3 + r_idx) % 12) + 1];

      IF v_vo.id IS NOT NULL THEN
        INSERT INTO public.reviews (user_id, product_id, brand_id, vendor_order_id, rating, comment, is_visible)
        VALUES (v_cust_ids[v_cust_idx]::uuid, v_product.id, v_brand_ids[b_idx]::uuid, v_vo.id, v_rating, v_comment, true);
      END IF;
    END LOOP;
  END LOOP;
END $$;
