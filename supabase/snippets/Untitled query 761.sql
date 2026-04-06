-- ============================================================
-- BICOLLECTIVE 2026: Fix missing status in user_discount_claims
-- ============================================================

ALTER TABLE public.user_discount_claims 
    ADD COLUMN IF NOT EXISTS status varchar(50) NOT NULL DEFAULT 'active';

-- Also add a unique constraint if missing to prevent double claims
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_discount_claims_user_id_discount_id_key'
    ) THEN
        ALTER TABLE public.user_discount_claims 
            ADD CONSTRAINT user_discount_claims_user_id_discount_id_key UNIQUE(user_id, discount_id);
    END IF;
END $$;
