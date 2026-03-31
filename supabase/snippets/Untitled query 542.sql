-- 1. Drop the overlapping policies
DROP POLICY IF EXISTS "Categories View Policy" ON public.categories;
DROP POLICY IF EXISTS "Categories Admin Policy" ON public.categories;

-- 2. Create the "View" policy (only for Select)
CREATE POLICY "Categories Select Policy" ON public.categories 
FOR SELECT USING (true);

-- 3. Create the "Management" policies (separately for Insert/Update/Delete)
-- This avoids the overlap and makes the linter happy!
CREATE POLICY "Categories Insert Policy" ON public.categories 
FOR INSERT WITH CHECK ((SELECT public.has_role((SELECT auth.uid()), 'admin')));

CREATE POLICY "Categories Update Policy" ON public.categories 
FOR UPDATE USING ((SELECT public.has_role((SELECT auth.uid()), 'admin')));

CREATE POLICY "Categories Delete Policy" ON public.categories 
FOR DELETE USING ((SELECT public.has_role((SELECT auth.uid()), 'admin')));

-- 4. Final Refresh
ANALYZE;
