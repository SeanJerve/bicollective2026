import { useParams, Link, useNavigate } from "react-router-dom";
import { BadgeCheck, Minus, Plus, ShoppingBag, Star, ChevronRight, Heart, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import PageLayout from "@/components/layout/PageLayout";
import ProductCard from "@/components/marketplace/ProductCard";
import ProductCardSkeleton from "@/components/marketplace/ProductCardSkeleton";
import { useProduct, useProductsByBrand } from "@/hooks/useProducts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";

const ProductDetail = () => {
  const { slug } = useParams();
  const { data: product, isLoading: productLoading } = useProduct(slug || "");
  const { data: relatedProducts, isLoading: relatedLoading } = useProductsByBrand(product?.brandSlug || "");
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  // Wishlist state
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      if (!product?.id) return;
      setReviewsLoading(true);
      try {
        const { data, error } = await supabase
          .from("reviews")
          .select(`
            *,
            profile:profiles!reviews_user_id_fkey(full_name, avatar_url)
          `)
          .eq("product_id", product.id)
          .eq("is_visible", true)
          .order("created_at", { ascending: false });

        if (!error && data) {
          setReviews(data);
          setReviewCount(data.length);
          if (data.length > 0) {
            const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
            setAverageRating(avg);
          }
        }
      } catch (err) {
        console.error("Error fetching reviews:", err);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchReviews();
  }, [product?.id]);

  // Check if product is wishlisted
  useEffect(() => {
    const checkWishlist = async () => {
      if (!user || !product?.id) return;
      const { data } = await supabase
        .from("wishlists")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", product.id)
        .maybeSingle();
      setIsWishlisted(!!data);
    };
    checkWishlist();
  }, [user, product?.id]);

  const toggleWishlist = async () => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to add items to your wishlist",
        variant: "destructive",
      });
      return;
    }
    if (!product) return;

    setWishlistLoading(true);
    try {
      if (isWishlisted) {
        await supabase.from("wishlists").delete().eq("user_id", user.id).eq("product_id", product.id);
        setIsWishlisted(false);
        toast({ title: "Removed from wishlist" });
      } else {
        await supabase.from("wishlists").insert({ user_id: user.id, product_id: product.id });
        setIsWishlisted(true);
        toast({ title: "Added to wishlist" });
      }
    } catch (err) {
      console.error("Wishlist error:", err);
    } finally {
      setWishlistLoading(false);
    }
  };

  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  if (productLoading) {
    return (
      <PageLayout>
        <div className="section-container py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            <div className="aspect-[3/4] skeleton-brutal" />
            <div className="space-y-4">
              <div className="h-6 w-32 skeleton-brutal" />
              <div className="h-12 w-64 skeleton-brutal" />
              <div className="h-8 w-24 skeleton-brutal" />
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!product) {
    return (
      <PageLayout>
        <div className="section-container py-16 md:py-20 text-center">
          <h1 className="font-heading text-3xl md:text-4xl uppercase mb-4">Product Not Found</h1>
          <p className="text-muted-foreground mb-6 md:mb-8 text-sm md:text-base">
            The product you're looking for doesn't exist.
          </p>
          <Link to="/products" className="btn-brutal">
            Browse Products
          </Link>
        </div>
      </PageLayout>
    );
  }

  const filteredRelated = (relatedProducts || [])
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  return (
    <PageLayout>
      {/* Breadcrumb */}
      <nav className="section-container py-3 md:py-4 border-b border-border-subtle overflow-x-auto">
        <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-muted-foreground whitespace-nowrap">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <ChevronRight className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
          <Link to="/products" className="hover:text-foreground">Products</Link>
          <ChevronRight className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
          <Link to={`/categories/${product.categorySlug}`} className="hover:text-foreground">
            {product.category}
          </Link>
          <ChevronRight className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
          <span className="text-foreground truncate max-w-[150px] md:max-w-none">{product.name}</span>
        </div>
      </nav>

      {/* Product Section */}
      <section className="py-8 md:py-12">
        <div className="section-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Product Image */}
            <div className="card-brutal overflow-hidden">
              <div className="aspect-[3/4] bg-muted">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Product Info */}
            <div className="lg:py-8">
              {/* Brand */}
              <Link
                to={`/brands/${product.brandSlug}`}
                className="inline-flex items-center gap-2 mb-3 md:mb-4 group"
              >
                <span className="text-xs md:text-sm uppercase tracking-wide text-muted-foreground group-hover:text-foreground transition-colors">
                  {product.brandName}
                </span>
                {product.isVerifiedBrand && (
                  <BadgeCheck className="w-3 h-3 md:w-4 md:h-4 text-success" />
                )}
              </Link>

              {/* Title */}
              <h1 className="font-heading text-3xl md:text-5xl uppercase leading-tight mb-3 md:mb-4">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-4 md:mb-6">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 md:w-4 md:h-4 ${i < Math.round(averageRating) ? "fill-foreground" : "fill-muted stroke-muted-foreground"}`}
                    />
                  ))}
                </div>
                <span className="text-xs md:text-sm text-muted-foreground">({reviewCount} reviews)</span>
              </div>

              {/* Price */}
              <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-6 md:mb-8">
                <span className="font-heading text-2xl md:text-3xl">{formatPrice(product.price)}</span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <>
                    <span className="text-lg md:text-xl text-muted-foreground line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                    <span className="badge-verified text-xs">
                      {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                    </span>
                  </>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <p className="text-muted-foreground mb-6 md:mb-8 leading-relaxed text-sm md:text-base">
                  {product.description}
                </p>
              )}

              {/* Size Selection */}
              <div className="mb-6 md:mb-8">
                <div className="flex items-center justify-between mb-2 md:mb-3">
                  <span className="font-heading uppercase text-xs md:text-sm">Select Size</span>
                  <button className="text-xs md:text-sm text-muted-foreground hover:text-foreground underline">
                    Size Guide
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-10 h-10 md:w-12 md:h-12 border-2 font-heading text-xs md:text-sm transition-colors ${
                        selectedSize === size
                          ? "border-foreground bg-foreground text-background"
                          : "border-border-subtle hover:border-foreground"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="mb-6 md:mb-8">
                <span className="font-heading uppercase text-xs md:text-sm mb-2 md:mb-3 block">Quantity</span>
                <div className="inline-flex items-center border-2 border-foreground">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center hover:bg-secondary transition-colors"
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-3 h-3 md:w-4 md:h-4" />
                  </button>
                  <span className="w-12 h-10 md:w-16 md:h-12 flex items-center justify-center font-heading border-x-2 border-foreground text-sm md:text-base">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center hover:bg-secondary transition-colors"
                  >
                    <Plus className="w-3 h-3 md:w-4 md:h-4" />
                  </button>
                </div>
              </div>

              {/* Add to Cart */}
              <div className="space-y-4">
                <button
                  onClick={() => {
                    if (!selectedSize) {
                      toast({
                        title: "Please select a size",
                        description: "Choose a size before adding to cart",
                        variant: "destructive",
                      });
                      return;
                    }
                    addToCart(product.id, quantity, selectedSize);
                  }}
                  className="btn-brutal w-full flex items-center justify-center gap-2 text-sm md:text-base"
                  disabled={!product.inStock}
                >
                  <ShoppingBag className="w-4 h-4 md:w-5 md:h-5" />
                  {product.inStock ? "Add to Cart" : "Out of Stock"}
                </button>
                <button
                  onClick={toggleWishlist}
                  disabled={wishlistLoading}
                  className={`btn-brutal-secondary w-full flex items-center justify-center gap-2 text-sm md:text-base ${
                    isWishlisted ? "bg-destructive/10 border-destructive text-destructive" : ""
                  }`}
                >
                  <Heart className={`w-4 h-4 md:w-5 md:h-5 ${isWishlisted ? "fill-destructive" : ""}`} />
                  {isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                </button>
              </div>

              {/* Trust Badges */}
              <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-border-subtle">
                <div className="grid grid-cols-2 gap-3 md:gap-4 text-xs md:text-sm">
                  <div className="flex items-center gap-2">
                    <BadgeCheck className="w-4 h-4 md:w-5 md:h-5 text-success" />
                    <span>Buyer Protection</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🇵🇭</span>
                    <span>Ships from Bicol</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-12 md:py-16 border-t-2 border-foreground">
        <div className="section-container">
          <h2 className="font-heading text-2xl md:text-3xl uppercase mb-6 md:mb-8">
            Customer Reviews ({reviewCount})
          </h2>

          {reviewsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton-brutal h-24" />
              ))}
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="card-brutal p-4 md:p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-heading text-sm flex-shrink-0">
                      {review.profile?.full_name?.charAt(0) || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-heading text-sm">
                          {review.profile?.full_name || "Anonymous"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < review.rating ? "fill-foreground" : "fill-muted"
                            }`}
                          />
                        ))}
                      </div>
                      {review.comment && (
                        <p className="text-sm text-muted-foreground">{review.comment}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card-brutal p-8 text-center text-muted-foreground">
              No reviews yet. Be the first to review this product!
            </div>
          )}
        </div>
      </section>

      {/* Related Products */}
      {filteredRelated.length > 0 && (
        <section className="py-12 md:py-16 border-t-2 border-foreground">
          <div className="section-container">
            <h2 className="font-heading text-2xl md:text-3xl uppercase mb-6 md:mb-8">
              More from {product.brandName}
            </h2>
            <div className="product-grid">
              {relatedLoading
                ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
                : filteredRelated.map((p) => <ProductCard key={p.id} {...p} />)
              }
            </div>
          </div>
        </section>
      )}
    </PageLayout>
  );
};

export default ProductDetail;
