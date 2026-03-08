import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { useToast } from "@/hooks/use-toast";

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  size: string | null;
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

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  itemCount: number;
  total: number;
  addToCart: (productId: string, quantity: number, size?: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCart = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("cart_items")
        .select(`
          id,
          product_id,
          quantity,
          size,
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
        `)
        .eq("user_id", user.id);

      if (error) throw error;

      // Transform data to handle the nested structure
      const transformedItems = (data || []).map((item: any) => ({
        ...item,
        product: {
          ...item.product,
          brand: item.product.brand,
        },
      }));

      setItems(transformedItems);
    } catch (error) {
      console.error("Error fetching cart:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId: string, quantity: number, size?: string) => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to add items to cart",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if item already exists
      const existing = items.find(
        (item) => item.product_id === productId && item.size === size
      );

      if (existing) {
        await updateQuantity(existing.id, existing.quantity + quantity);
      } else {
        const { error } = await supabase.from("cart_items").insert({
          user_id: user.id,
          product_id: productId,
          quantity,
          size: size || null,
        });

        if (error) throw error;

        await fetchCart();
        toast({
          title: "Added to cart",
          description: "Item has been added to your cart",
        });
      }
    } catch (error: any) {
      console.error("Error adding to cart:", error);
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
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
        prev.map((item) =>
          item.id === itemId ? { ...item, quantity } : item
        )
      );
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive",
      });
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      setItems((prev) => prev.filter((item) => item.id !== itemId));
      toast({
        title: "Removed",
        description: "Item removed from cart",
      });
    } catch (error) {
      console.error("Error removing item:", error);
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive",
      });
    }
  };

  const clearCart = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      setItems([]);
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );

  const value = {
    items,
    loading,
    itemCount,
    total,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCart: fetchCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
