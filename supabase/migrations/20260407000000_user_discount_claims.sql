-- ============================================================
-- BICOLLECTIVE 2026: user_discount_claims
-- Gives every user a personal "My Vouchers" wallet.
-- A row here = a user owns/has claimed a specific discount code.
-- Replaces the old vouchers table's per-user ownership concept.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_discount_claims (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid NOT NULL REFERENCES auth.users(id)    ON DELETE CASCADE,
    discount_id     uuid NOT NULL REFERENCES public.discounts(id) ON DELETE CASCADE,
    code            varchar(100),           -- snapshot of the code at claim time
    expires_at      timestamptz,            -- snapshot of expiry at claim time
    used_at         timestamptz,            -- null = not yet used
    used_on_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
    status          varchar(50) NOT NULL DEFAULT 'active', -- 'active', 'used', 'expired'
    created_at      timestamptz DEFAULT now(),
    UNIQUE(user_id, discount_id)            -- prevents double-claiming same discount
);

-- Index for fast "My Vouchers" page loads
CREATE INDEX IF NOT EXISTS idx_user_discount_claims_user_id
    ON public.user_discount_claims(user_id);
