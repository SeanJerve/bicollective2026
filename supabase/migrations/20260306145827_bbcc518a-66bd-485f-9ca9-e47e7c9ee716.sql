
-- 1. Create messages table for buyer-seller chat
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  vendor_order_id UUID REFERENCES public.vendor_orders(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_system_message BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages" ON public.messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can mark messages as read" ON public.messages
  FOR UPDATE USING (auth.uid() = receiver_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- 2. Fix the ambiguous review_count variable in update_brand_rating
CREATE OR REPLACE FUNCTION public.update_brand_rating()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  avg_rating NUMERIC;
  total_reviews INTEGER;
BEGIN
  SELECT 
    COALESCE(AVG(rating)::NUMERIC(3,2), 0),
    COUNT(*)
  INTO avg_rating, total_reviews
  FROM public.reviews
  WHERE brand_id = COALESCE(NEW.brand_id, OLD.brand_id)
    AND is_visible = true;
  
  UPDATE public.brands
  SET 
    rating = avg_rating,
    review_count = total_reviews
  WHERE id = COALESCE(NEW.brand_id, OLD.brand_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- 3. Create review-media storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('review-media', 'review-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view review media" ON storage.objects
  FOR SELECT USING (bucket_id = 'review-media');

CREATE POLICY "Authenticated users can upload review media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'review-media' AND auth.uid() IS NOT NULL);

-- 4. Add payment_method to vendor_orders
ALTER TABLE public.vendor_orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cod';
