-- 1. Identify and fix the "Loyalty Calculator" function
CREATE OR REPLACE FUNCTION public.update_loyalty_on_delivery()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
        -- Link back to the main loyalty record
        -- Note: We now use the 'user_purchased_sellers' table instead of the old array column
        INSERT INTO public.user_purchased_sellers (loyalty_id, brand_id)
        SELECT lp.id, NEW.brand_id
        FROM public.loyalty_progress lp
        JOIN public.orders o ON o.id = NEW.order_id
        WHERE lp.user_id = o.customer_id
        ON CONFLICT DO NOTHING;

        -- Increment total delivered count
        UPDATE public.loyalty_progress lp
        SET total_delivered_orders = total_delivered_orders + 1,
            updated_at = now()
        FROM public.orders o
        WHERE o.id = NEW.order_id AND lp.user_id = o.customer_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Force the system to use this new logic immediately
NOTIFY pgrst, 'reload schema';
