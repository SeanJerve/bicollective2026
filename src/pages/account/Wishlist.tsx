import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import BrutalistConfirmModal from "@/components/ui/BrutalistConfirmModal";

interface WishlistItem {
  id: string;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    original_price: number | null;
    image_url: string | null;
    in_stock: boolean;
    drop_id: string | null;
    listing_type: string | null;
    brand: {
      name: string;
      slug: string;
    };
  };
}

const Wishlist = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeProduct, setActiveProduct] = useState<any | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("wishlists")
          .select(
            `
             id,
             product:products (
               id,
               name,
               slug,
               price,
               original_price,
               image_url,
               in_stock,
               drop_id,
               listing_type,
               brand:brands (name, slug)
             )
           `
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Filter wishlist items to include only drop-associated or teaser products
        const fetchedItems = (data as any) || [];
        const filteredItems = fetchedItems.filter((item: any) => {
          if (!item.product) return false;
          return item.product.drop_id !== null || item.product.listing_type === "teaser";
        });

        setItems(filteredItems);
      } catch (error) {
        console.error("Error fetching wishlist:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [user]);

  const removeFromWishlist = async (wishlistId: string) => {
    try {
      await supabase.from("wishlists").delete().eq("id", wishlistId);
      setItems(items.filter((item) => item.id !== wishlistId));
      toast({ title: "Removed from wishlist" });
    } catch (error) {
      console.error("Error removing from wishlist:", error);
    }
  };

  const formatPrice = (amount: number) => {
    if (amount === 0) return "TBA Soon";
    return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount);
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="section-container py-12">
          <div className="skeleton-brutal h-8 w-48 mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton-brutal h-64" />
            ))}
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <section className="py-12 border-b-2 border-foreground">
        <div className="section-container">
          <h1 className="font-heading text-4xl md:text-5xl uppercase">My Wishlist</h1>
          <p className="text-muted-foreground mt-2">{items.length} items saved</p>
        </div>
      </section>

      <section className="py-12">
        <div className="section-container">
          {items.length === 0 ? (
            <div className="card-brutal p-12 text-center">
              <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="font-heading text-2xl uppercase mb-2">No wishes yet</h2>
              <p className="text-muted-foreground mb-6">
                Start adding upcoming drops or trailer products to your wishlist
              </p>
              <Link to="/brands" className="btn-brutal">
                Explore Drops & Trailers
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {items.map((item) => (
                <div key={item.id} className="card-brutal group">
                  <div className="relative aspect-[3/4] bg-muted overflow-hidden">
                    <div 
                      onClick={() => setActiveProduct(item.product)}
                      className="w-full h-full cursor-pointer"
                    >
                      {item.product.image_url ? (
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-muted-foreground">No image</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setConfirmDeleteId(item.id)}
                      className="absolute top-2 right-2 w-8 h-8 bg-background border-2 border-foreground flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors group/heart"
                      title="Remove from Wishlist"
                    >
                      <Heart className="w-4 h-4 fill-destructive text-destructive group-hover/heart:fill-transparent group-hover/heart:text-foreground" />
                    </button>
                  </div>
                  <div className="p-4 flex flex-col justify-between min-h-[110px]">
                    <div>
                      <Link
                        to={`/brands/${item.product.brand.slug}`}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        {item.product.brand.name}
                      </Link>
                      <button
                        onClick={() => setActiveProduct(item.product)}
                        className="text-left w-full focus:outline-none block"
                      >
                        <h3 className="font-heading text-sm uppercase mt-1 line-clamp-2 hover:opacity-60 transition-opacity">
                          {item.product.name}
                        </h3>
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {item.product.price === 0 ? (
                        <span className="font-heading text-sm uppercase text-muted-foreground">TBA Soon</span>
                      ) : (
                        <>
                          <span className="font-heading">{formatPrice(item.product.price)}</span>
                          {item.product.original_price &&
                            item.product.original_price > item.product.price && (
                              <span className="text-sm text-muted-foreground line-through">
                                {formatPrice(item.product.original_price)}
                              </span>
                            )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Sub-modal popup for clicking an individual product */}
      {activeProduct && (
        <div
          className="fixed inset-0 bg-background/95 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in text-foreground"
          onClick={() => setActiveProduct(null)}
        >
          <div
            className="relative bg-background border-4 border-foreground p-2 max-w-lg w-full shadow-brutal flex flex-col items-center animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveProduct(null)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-background border-2 border-foreground rounded-full flex items-center justify-center font-heading hover:bg-secondary transition-colors z-10"
            >
              ✕
            </button>
            <div className="w-full aspect-[3/4] bg-muted overflow-hidden border-2 border-foreground">
              <img
                src={activeProduct.image_url || "/placeholder.svg"}
                alt={activeProduct.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg";
                }}
              />
            </div>
            <div className="w-full mt-3 p-3 bg-secondary border-2 border-foreground text-center">
              <h3 className="font-heading text-lg uppercase mb-1">{activeProduct.name}</h3>
              <p className="text-xs font-heading uppercase text-muted-foreground">
                Price: {activeProduct.price === 0 ? "TBA Soon" : formatPrice(activeProduct.price)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Visual Confirmation Modal */}
      <BrutalistConfirmModal
        isOpen={confirmDeleteId !== null}
        title="Remove from Wishlist?"
        message="Are you sure you want to remove this item from your wishlist?"
        confirmText="Yes, Remove"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={() => {
          if (confirmDeleteId) {
            removeFromWishlist(confirmDeleteId);
            setConfirmDeleteId(null);
          }
        }}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </PageLayout>
  );
};

export default Wishlist;
