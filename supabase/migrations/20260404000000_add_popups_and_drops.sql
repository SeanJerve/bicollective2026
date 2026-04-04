CREATE TABLE IF NOT EXISTS public.site_popups (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    image_url text NOT NULL,
    redirect_url text,
    is_active boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

-- RLS for site_popups
ALTER TABLE public.site_popups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Popups viewable by everyone." ON public.site_popups FOR SELECT USING (true);
CREATE POLICY "Admins manage popups." ON public.site_popups FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'admin')
) WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'admin')
);


CREATE TABLE IF NOT EXISTS public.product_drops (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    image_url text,
    launch_date timestamp with time zone NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

-- RLS for product_drops
ALTER TABLE public.product_drops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Drops viewable by everyone." ON public.product_drops FOR SELECT USING (true);
CREATE POLICY "Vendors can insert their drops." ON public.product_drops FOR INSERT WITH CHECK (brand_id IN (SELECT id FROM public.brands WHERE owner_id = auth.uid()));
CREATE POLICY "Vendors can update their drops." ON public.product_drops FOR UPDATE USING (brand_id IN (SELECT id FROM public.brands WHERE owner_id = auth.uid()));
CREATE POLICY "Vendors can delete their drops." ON public.product_drops FOR DELETE USING (brand_id IN (SELECT id FROM public.brands WHERE owner_id = auth.uid()));


CREATE TABLE IF NOT EXISTS public.product_drop_notifications (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    drop_id uuid NOT NULL REFERENCES public.product_drops(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(drop_id, user_id)
);

-- RLS for product_drop_notifications
ALTER TABLE public.product_drop_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own drop max." ON public.product_drop_notifications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Optional: Function to make sure only ONE popup is active at a time?
-- For now, the app logic can just pick the first active one or order by created_at desc.
