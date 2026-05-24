-- Allow customers to attach evidence when opening a dispute.

ALTER TABLE public.dispute_evidence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers insert dispute evidence" ON public.dispute_evidence;
CREATE POLICY "Customers insert dispute evidence"
ON public.dispute_evidence
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.disputes d
    WHERE d.id = dispute_id AND d.customer_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Dispute parties can view evidence" ON public.dispute_evidence;
CREATE POLICY "Dispute parties can view evidence"
ON public.dispute_evidence
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.disputes d
    WHERE d.id = dispute_id
      AND (
        d.customer_id = auth.uid()
        OR d.vendor_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
      )
  )
);
