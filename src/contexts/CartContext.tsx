import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { useToast } from "@/hooks/use-toast";

// ─── Types ────────────────────────────────────────────────────────────────────
interface CartVariant {
  id: string;
  size: string;
  stock_quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    image_url: string | null;
    brand_id: string;
    brand: {
      id: string;
      name: string;
      slug: string;
    };
  };
}

interface CartItem {
  id: string;
  variant_id: string;
  quantity: number;
  variant: CartVariant;
}

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  itemCount: number;
  total: number;
  // addToCart now takes variantId — no more (productId, size)
  addToCart: (variantId: string, quantity: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartId, setCartId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // ── Step 1: Get or create a carts row for this user ──────────────────────
  const getOrCreateCart = useCallback(
    async (userId: string): Promise<string | null> => {
      // Try to find existing cart
      const { data: existing } = await supabase
        .from("carts")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) return existing.id;

      // No cart yet — create one
      const { data: created, error } = await supabase
        .from("carts")
        .insert({ user_id: userId })
        .select("id")
        .single();

      if (error) {
        console.error("Error creating cart:", error);
        return null;
      }
      return created.id;
    },
    []
  );

  // ── Step 2: Fetch items using cart_id → variant → product → brand ────────
  const fetchCart = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      const id = await getOrCreateCart(user.id);
      if (!id) return;
      setCartId(id);

      const { data, error } = await supabase
        .from("cart_items")
        .select(`
          id,
          variant_id,
          quantity,
          variant:product_variants (
            id,
            size,
            stock_quantity,
            product:products (
              id,
              name,
              slug,
              price,
              image_url,
              brand_id,
              brand:brands (
                id,
                name,
                slug
              )
            )
          )
        `)
        .eq("cart_id", id);

      if (error) throw error;
      setItems((data as unknown as CartItem[]) || []);
    } catch (error) {
      console.error("Error fetching cart:", error);
    } finally {
      setLoading(false);
    }
  }, [user, getOrCreateCart]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // ── addToCart: takes variantId (not productId + size) ────────────────────
  const addToCart = async (variantId: string, quantity: number) => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to add items to cart",
        variant: "destructive",
      });
      return;
    }

    try {
      let cId = cartId;
      if (!cId) {
        cId = await getOrCreateCart(user.id);
        if (!cId) return;
        setCartId(cId);
      }

      // If same variant already in cart, just bump quantity
      const existing = items.find((item) => item.variant_id === variantId);
      if (existing) {
        await updateQuantity(existing.id, existing.quantity + quantity);
      } else {
        const { error } = await supabase.from("cart_items").insert({
          cart_id: cId,
          variant_id: variantId,
          quantity,
        });
        if (error) throw error;
        await fetchCart();
        toast({ title: "Added to cart", description: "Item added to your cart" });
      }
    } catch (error: any) {
      console.error("Error adding to cart:", error);
      toast({ title: "Error", description: "Failed to add item to cart", variant: "destructive" });
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      if (quantity <= 0) {
        await removeItem(itemId);
        return;
      }
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity })
        .eq("id", itemId);
      if (error) throw error;
      setItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, quantity } : item))
      );
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast({ title: "Error", description: "Failed to update quantity", variant: "destructive" });
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const { error } = await supabase.from("cart_items").delete().eq("id", itemId);
      if (error) throw error;
      setItems((prev) => prev.filter((item) => item.id !== itemId));
      toast({ title: "Removed", description: "Item removed from cart" });
    } catch (error) {
      console.error("Error removing item:", error);
      toast({ title: "Error", description: "Failed to remove item", variant: "destructive" });
    }
  };

  const clearCart = async () => {
    if (!cartId) return;
    try {
      const { error } = await supabase.from("cart_items").delete().eq("cart_id", cartId);
      if (error) throw error;
      setItems([]);
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce(
    (sum, item) => sum + Number(item.variant?.product?.price || 0) * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        itemCount,
        total,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart: fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) throw new Error("useCart must be used within a CartProvider");
  return context;
};
