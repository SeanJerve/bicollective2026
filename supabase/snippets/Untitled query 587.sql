-- 1. FINAL SECURITY HARDENING (Fixes the last 3 Security Alerts)CREATE OR REPLACE FUNCTION public.vaCREATE OR REPLACE FUNCTION public.validate_stock(items jsonb)
RETURNS json_objectLANGUAGE plpgsql
stableSECURITY definerSET search_path TO 'public'
AS $$
declare  item jsonb;
  variant_row RECORD;
    product_row RECORD;
      out_of_stock jsonb := '[]'::jsonb;
      begin  FOR item IN SELECT * FROM jsonb_array_elements(items)CREATE OR REPLACE FUNCTION public.validate_stock(items jsonb)
      RETURNS jsonb _await_responseLANGUAGE plpgsql _await_responseSTABLE _await_responseSECURITY DEFINER _await_responseSET search_path TO 'public' _await_responseAS $$ _await_responseDECLARE _await_response  item jsonb; _await_response  variant_row RECORD; _await_response  product_row RECORD; _await_response  out_of_stock jsonb := '[]'::jsonb; _await_responseBEGIN _await_response  FOR item IN SELECT * FROM jsonb_array_elements(items) _await_response  LOOP _await_response    SELECT id, product_id, stock_quantity _await_response    INTO variant_row _await_response    FROM public.product_variants _await_response    WHERE id = (item->>'variant_id')::uuid; _await_response
          IF variant_row.product_id IS NOT NULL THEN _await_response      SELECT name, in_stock _await_response      INTO product_row _await_response      FROM public.products _await_response      WHERE id = variant_row.product_id; _await_response    END IF; _await_response
              IF variant_row IS NULL _await_response       OR product_row IS NULL _await_response       OR NOT COALESCE(product_row.in_stock, true) _await_response       OR COALESCE(variant_row.stock_quantity, 0) < (item->>'quantity')::int THEN _await_response      _await_response      out_of_stock := out_of_stock || jsonb_build_object( _await_response        'variant_id', item->>'variant_id', _await_response        'product_name', COALESCE(product_row.name, 'Unknown Product'), _await_response        'requested', (item->>'quantity')::int, _await_response        'available', COALESCE(variant_row.stock_quantity, 0) _await_response      ); _await_response    END IF; _await_response  END LOOP; _await_response
                RETURN out_of_stock; _await_responseEND; _await_response$$;
        loyalty_progress    SELECT id, product_id, stock_quantity    INTO variant_row
            FROM public.product_variants    WHERE id = (item->>'variant_id')::uuid;

                IF variant_row.product_id IS NOT NULL then      SELECT name, in_stock      INTO product_row
                      FROM public.products      WHERE id = variant_row.product_id;
                          END IF;

                              IF variant_row IS NULL _await_response       OR product_row IS NULL _await_response       OR NOT COALESCE(product_row.in_stock, true)
                                     OR COALESCE(variant_row.stock_quantity, 0) < (item->>'quantity')::int then      _await_response      out_of_stock := out_of_stock || jsonb_build_object(
                                              'variant_id', item->>'variant_id',
                                                      'product_name', COALESCE(product_row.name, 'Unknown Product'),
                                                              'requested', (item->>'quantity')::int,
                                                                      'available', COALESCE(variant_row.stock_quantity, 0)
                                                                            );
                                                                                END IF;
                                                                                  END LOOP;

                                                                                    RETURN out_of_stock;
                                                                                    END;
                                                                                    $$;
                                     )
ALTER FUNCTION public.handle_new_review_notification() SET search_path = public;
ALTER FUNCTION public.handle_dispute_notification() SET search_path = public;
ALTER FUNCTION public.increment_brand_debt(uuid, numeric) SET search_path = public;

-- 2. RLS PERFORMANCE REFACTORING (Fixes 307+ Performance Alerts)
-- We wrap auth function calls in subqueries to enable Postgres Plans to cache them.

-- PROFILES
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles 
FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles 
FOR UPDATE USING (user_id = (SELECT auth.uid()));

-- USER ROLES
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles 
FOR SELECT USING (user_id = (SELECT auth.uid()));

-- CATEGORIES (Consolidating Policies)
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Categories Access Policy" ON public.categories
FOR SELECT USING (true); -- Public read is always safe since it's just categories

CREATE POLICY "Admin Category Management" ON public.categories
FOR ALL USING ((SELECT role FROM public.user_roles WHERE user_id = (SELECT auth.uid()) LIMIT 1) = 'admin');

-- BRANDS (Consolidating Deletion & Management)
DROP POLICY IF EXISTS "Admins can delete brands" ON public.brands;
DROP POLICY IF EXISTS "Admins can manage all brands" ON public.brands;
DROP POLICY IF EXISTS "Owners can manage their brand" ON public.brands;

CREATE POLICY "Brand Management Policy" ON public.brands
FOR ALL USING (
  owner_id = (SELECT auth.uid()) OR 
  (SELECT role FROM public.user_roles WHERE user_id = (SELECT auth.uid()) LIMIT 1) = 'admin'
);

-- AD BOOSTS (Consolidating overlapping policies)
DROP POLICY IF EXISTS "Vendors can view their own boosts" ON public.ad_boosts;
DROP POLICY IF EXISTS "Vendors can insert their own boosts" ON public.ad_boosts;
DROP POLICY IF EXISTS "Admins can view all boosts" ON public.ad_boosts;

CREATE POLICY "Ad Boosts Access" ON public.ad_boosts
FOR ALL USING (
  brand_id IN (SELECT id FROM public.brands WHERE owner_id = (SELECT auth.uid())) OR
  (SELECT role FROM public.user_roles WHERE user_id = (SELECT auth.uid()) LIMIT 1) = 'admin'
);

-- NOTIFICATIONS & MESSAGES (Performance wrapping)
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications 
FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update (mark as read) their own notifications" ON public.notifications;
CREATE POLICY "Users can update (mark as read) their own notifications" ON public.notifications 
FOR UPDATE USING (user_id = (SELECT auth.uid()));

-- 3. UPDATING STATISTICS
ANALYZE public.profiles;
ANALYZE public.user_roles;
ANALYZE public.brands;
ANALYZE public.categories;
ANALYZE public.ad_boosts;
ANALYZE public.notifications;
ANALYZE public.orders;
ANALYZE public.vendor_orders;
