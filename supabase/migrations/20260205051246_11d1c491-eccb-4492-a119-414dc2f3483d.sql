-- Create wishlist table
CREATE TABLE public.wishlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Enable RLS
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

-- RLS policies for wishlists
CREATE POLICY "Users can view their own wishlist"
ON public.wishlists FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their own wishlist"
ON public.wishlists FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their own wishlist"
ON public.wishlists FOR DELETE
USING (auth.uid() = user_id);

-- Create function to decrement stock on order
CREATE OR REPLACE FUNCTION public.decrement_stock_on_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrement stock for each order item
  UPDATE public.products
  SET 
    stock_quantity = GREATEST(0, stock_quantity - NEW.quantity),
    in_stock = CASE WHEN stock_quantity - NEW.quantity <= 0 THEN false ELSE true END
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for stock decrement
CREATE TRIGGER decrement_stock_on_order_item
AFTER INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.decrement_stock_on_order();

-- Create function to update brand rating when review is added
CREATE OR REPLACE FUNCTION public.update_brand_rating()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating NUMERIC;
  review_count INTEGER;
BEGIN
  -- Calculate new average rating and count for the brand
  SELECT 
    COALESCE(AVG(rating)::NUMERIC(3,2), 0),
    COUNT(*)
  INTO avg_rating, review_count
  FROM public.reviews
  WHERE brand_id = COALESCE(NEW.brand_id, OLD.brand_id)
    AND is_visible = true;
  
  -- Update brand
  UPDATE public.brands
  SET 
    rating = avg_rating,
    review_count = review_count
  WHERE id = COALESCE(NEW.brand_id, OLD.brand_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for brand rating
CREATE TRIGGER update_brand_rating_on_insert
AFTER INSERT ON public.reviews
FOR EACH ROW
WHEN (NEW.brand_id IS NOT NULL)
EXECUTE FUNCTION public.update_brand_rating();

CREATE TRIGGER update_brand_rating_on_update
AFTER UPDATE ON public.reviews
FOR EACH ROW
WHEN (NEW.brand_id IS NOT NULL OR OLD.brand_id IS NOT NULL)
EXECUTE FUNCTION public.update_brand_rating();

CREATE TRIGGER update_brand_rating_on_delete
AFTER DELETE ON public.reviews
FOR EACH ROW
WHEN (OLD.brand_id IS NOT NULL)
EXECUTE FUNCTION public.update_brand_rating();