-- ============================================================
-- BICOLLECTIVE 2026: LEGACY TRIGGER CLEANUP
-- Resolves the "column p.stock_quantity does not exist" error
-- ============================================================

-- 1. Drop the old broken trigger
DROP TRIGGER IF EXISTS trg_restore_stock_on_cancellation ON public.vendor_orders;

-- 2. Drop the old broken function
DROP FUNCTION IF EXISTS public.restore_stock_on_cancellation();

-- 3. Reload schema
NOTIFY pgrst, 'reload schema';
