-- Attach the existing trigger functions that were created but never attached

-- Attach stock decrement trigger on order_items insert
CREATE TRIGGER trg_decrement_stock_on_order
AFTER INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.decrement_stock_on_order();

-- Attach address default unsetting trigger
CREATE TRIGGER trg_unset_other_default_addresses
BEFORE UPDATE ON public.addresses
FOR EACH ROW
EXECUTE FUNCTION public.unset_other_default_addresses();

-- Also handle INSERT (when creating a new default address)
CREATE TRIGGER trg_unset_other_default_addresses_insert
BEFORE INSERT ON public.addresses
FOR EACH ROW
EXECUTE FUNCTION public.unset_other_default_addresses();