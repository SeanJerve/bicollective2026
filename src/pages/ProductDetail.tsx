import { useParams, Link, useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  Minus,
  Plus,
  ShoppingBag,
  Star,
  ChevronRight,
  Heart,
  Zap,
  Clock,
  MessageSquare,
  MapPin,
} from "lucide-react";
import { useState, useEffect } from "react";
import PageLayout from "@/components/layout/PageLayout";
import ProductCard from "@/components/marketplace/ProductCard";
import ProductCardSkeleton from "@/components/marketplace/ProductCardSkeleton";
import ImageGallery from "@/components/product/ImageGallery";
import { useProduct, useProductsByBrand, type ProductVariant } from "@/hooks/useProducts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import usePageSEO from "@/hooks/usePageSEO";

const ProductDetail = () => {
  const { slug } = useParams();
  const { data: product, isLoading: productLoading } = useProduct(slug || "");
  const { data: relatedProducts, isLoading: relatedLoading } = useProductsByBrand(
    product?.brandSlug || ""
  );
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const { user, isAdmin, isVendor } = useAuth();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string | null>(null);

  // Fetch the vendor's own brand to block self-purchasing
  const [vendorBrandId, setVendorBrandId] = useState<string | null>(null);
  useEffect(() => {
    if (!isVendor || !user) return;
    supabase
      .from("brands")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setVendorBrandId(data.id);
      });
  }, [isVendor, user]);

  // Chat with seller state
  const [brandOwnerId, setBrandOwnerId] = useState<string | null>(null);
  useEffect(() => {
    if (!product?.brandId) return;
    supabase
      .from("brands")
      .select("owner_id")
      .eq("id", product.brandId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setBrandOwnerId(data.owner_id);
      });
  }, [product?.brandId]);

  // Redirect if product is a teaser (trailer exclusive)
  useEffect(() => {
    if (product && (product.isTeaser || product.listingType === "teaser")) {
      toast({
        title: "Exclusive Trailer Product",
        description: "This item is part of an exclusive drop trailer and cannot be viewed individually.",
      });
      navigate(`/brands/${product.brandSlug}`, { replace: true });
    }
  }, [product, navigate, toast]);

  usePageSEO({
    title: product?.name || "Product",
    description:
      product?.description || `Shop ${product?.name} from ${product?.brandName} on Bicollective.`,
  });

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
          .select("*")
          .eq("product_id", product.id)
          .eq("is_visible", true)
          .order("created_at", { ascending: false });

        if (!error && data) {
          // Fetch profiles for reviewers
          const userIds = [...new Set(data.map((r) => r.user_id))];
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, full_name, avatar_url")
            .in("user_id", userIds);

          const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
          const enriched = data.map((r) => ({
            ...r,
            profile: profileMap.get(r.user_id) || null,
          }));

          setReviews(enriched);
          setReviewCount(enriched.length);
          if (enriched.length > 0) {
            const avg = enriched.reduce((sum, r) => sum + r.rating, 0) / enriched.length;
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
        await supabase
          .from("wishlists")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", product.id);
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

  // Derive sizes from product.variants (replaces old product.sizes array)
  const variants = product?.variants || [];

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

  const filteredRelated = (relatedProducts || []).filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <PageLayout>
      {/* Breadcrumb */}
      <nav className="section-container py-3 md:py-4 border-b border-border-subtle overflow-x-auto">
        <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-muted-foreground whitespace-nowrap">
          <Link to="/" className="hover:text-foreground">
            Home
          </Link>
          <ChevronRight className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
          <Link to="/products" className="hover:text-foreground">
            Products
          </Link>
          <ChevronRight className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
          <Link to={`/categories/${product.categorySlug}`} className="hover:text-foreground">
            {product.category}
          </Link>
          <ChevronRight className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
          <span className="text-foreground truncate max-w-[150px] md:max-w-none">
            {product.name}
          </span>
        </div>
      </nav>

      {/* Product Section */}
      <section className="py-8 md:py-12">
        <div className="section-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Product Image Gallery */}
            <div>
              <ImageGallery
                mainImage={product.image}
                images={product.galleryImages || []}
                alt={product.name}
              />
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
                {(product as any).subscriptionTier === "premium" && (
                  <span className="badge-premium px-1.5 py-0.5 text-[8px] md:text-[10px] flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5" /> PREMIUM STORE
                  </span>
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
                <span className="text-xs md:text-sm text-muted-foreground">
                  ({reviewCount} reviews)
                </span>
              </div>

              {/* Listing Type Badge */}
              {product.listingType === "teaser" && (
                <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 bg-muted border-2 border-foreground text-sm font-heading uppercase">
                  <Clock className="w-4 h-4" />
                  Coming Soon
                </div>
              )}
              {product.listingType === "preorder" && (
                <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 bg-accent border-2 border-foreground text-sm font-heading uppercase">
                  <Zap className="w-4 h-4" />
                  Pre-order{" "}
                  {product.preorderDiscountPercent
                    ? `— ${product.preorderDiscountPercent}% OFF`
                    : ""}
                </div>
              )}
              {product.releaseDate && (
                <p className="text-xs text-muted-foreground mb-4">
                  Release date: {new Date(product.releaseDate).toLocaleDateString()}
                </p>
              )}

              {/* Price */}
              <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-6 md:mb-8">
                {product.isTeaser ? (
                  product.price === 0 ? (
                    <span className="font-heading text-2xl md:text-3xl text-muted-foreground">
                      Price TBA
                    </span>
                  ) : (
                    <span className="font-heading text-2xl md:text-3xl text-muted-foreground font-semibold">
                      Preview: {formatPrice(product.price)}
                    </span>
                  )
                ) : (
                  <>
                    <span className="font-heading text-2xl md:text-3xl">
                      {formatPrice(product.price)}
                    </span>
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
                  </>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <p className="text-muted-foreground mb-6 md:mb-8 leading-relaxed text-sm md:text-base">
                  {product.description}
                </p>
              )}

              {/* Teaser Notice Block */}
              {product.isTeaser && (
                <div className="card-brutal p-4 bg-secondary mb-6 border-2 border-foreground">
                  <span className="font-heading text-xs text-destructive uppercase tracking-widest block mb-1">
                    Teaser / Upcoming Drop
                  </span>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    This item is part of an upcoming collection. You cannot purchase it yet, but you can wishlist it to get notified when it goes live!
                  </p>
                  {product.releaseDate && (
                    <div className="mt-3 text-xs font-mono font-bold uppercase flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Expected Release: {new Date(product.releaseDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )}

              {/* Size / Variant Selection */}
              {!product.isTeaser && (
                <div
                  className={`mb-6 md:mb-8 ${!product.inStock ? "opacity-50 pointer-events-none select-none grayscale" : ""}`}
                >
                  <div className="flex items-center justify-between mb-2 md:mb-3">
                    <span className="font-heading uppercase text-xs md:text-sm">Select Size</span>
                    {selectedVariant && (
                      <span className="text-xs text-muted-foreground">
                        {selectedVariant.stock_quantity} left in stock
                      </span>
                    )}
                  </div>
                  {variants.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {variants.map((variant) => (
                        <button
                          key={variant.id}
                          onClick={() => setSelectedVariant(variant)}
                          disabled={variant.stock_quantity === 0}
                          className={`w-10 h-10 md:w-12 md:h-12 border-2 font-heading text-xs md:text-sm transition-colors ${
                            selectedVariant?.id === variant.id
                              ? "border-foreground bg-foreground text-background"
                              : variant.stock_quantity === 0
                                ? "border-border-subtle text-muted-foreground line-through cursor-not-allowed"
                                : "border-border-subtle hover:border-foreground"
                          }`}
                        >
                          {variant.size}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No sizes available</p>
                  )}
                </div>
              )}

              {/* Quantity */}
              {!product.isTeaser && (
                <div
                  className={`mb-6 md:mb-8 ${!product.inStock ? "opacity-50 pointer-events-none select-none grayscale" : ""}`}
                >
                  <span className="font-heading uppercase text-xs md:text-sm mb-2 md:mb-3 block">
                    Quantity
                  </span>
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
              )}

              {/* Actions */}
              {isAdmin ? (
                <div className="p-4 border-2 border-border-subtle bg-secondary text-center">
                  <p className="text-xs font-heading uppercase text-muted-foreground">
                    Admin accounts cannot purchase products
                  </p>
                </div>
              ) : isVendor && vendorBrandId && vendorBrandId === product.brandId ? (
                <div className="p-4 border-2 border-border-subtle bg-secondary text-center">
                  <p className="text-xs font-heading uppercase text-muted-foreground">
                    You cannot purchase your own products
                  </p>
                </div>
              ) : product.isTeaser ? (
                <div className="space-y-3">
                  <button
                    onClick={toggleWishlist}
                    disabled={wishlistLoading}
                    className={`btn-brutal w-full flex items-center justify-center gap-2 text-sm md:text-base transition-all ${isWishlisted ? "bg-success text-success-foreground" : ""}`}
                  >
                    <Heart className={`w-4 h-4 md:w-5 md:h-5 ${isWishlisted ? "fill-foreground" : ""}`} />
                    {isWishlisted ? "In Wishlist" : "Add to Wishlist"}
                  </button>
                </div>
              ) : !product.inStock ? (
                <div className="py-4 border-y-2 border-destructive bg-destructive/10 text-center">
                  <p className="text-sm font-heading uppercase text-destructive tracking-widest font-bold">
                    Out of Stock
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Buy Now & Add to Cart — equal width row */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        if (!selectedVariant) {
                          toast({
                            title: "Please select a size",
                            description: "Choose a size before buying",
                            variant: "destructive",
                          });
                          return;
                        }
                        navigate("/checkout", {
                          state: {
                            buyNowItem: {
                              variant_id: selectedVariant.id,
                              quantity,
                              product: {
                                id: product.id,
                                name: product.name,
                                price: product.price,
                                image_url: product.image,
                                brand_id: product.brandId,
                                size: selectedVariant.size,
                                brand: {
                                  id: product.brandId,
                                  name: product.brandName,
                                  slug: product.brandSlug,
                                  location: product.brandLocation || "Albay",
                                },
                              },
                            },
                          },
                        });
                      }}
                      className="btn-brutal flex items-center justify-center gap-2 text-sm md:text-base py-3"
                    >
                      <Zap className="w-4 h-4" />
                      {product.listingType === "preorder" ? "Pre-order" : "Buy Now"}
                    </button>

                    <button
                      onClick={() => {
                        if (!selectedVariant) {
                          toast({
                            title: "Please select a size",
                            description: "Choose a size before adding to cart",
                            variant: "destructive",
                          });
                          return;
                        }
                        addToCart(selectedVariant.id, quantity);
                      }}
                      className="btn-brutal-secondary flex items-center justify-center gap-2 text-sm md:text-base py-3"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Add to Cart
                    </button>
                  </div>

                  {/* Add to Wishlist — full width below */}
                  <button
                    onClick={toggleWishlist}
                    disabled={wishlistLoading}
                    className={`w-full flex items-center justify-center gap-2 py-3 border-2 font-heading text-sm uppercase tracking-wide transition-all ${
                      isWishlisted
                        ? "border-foreground bg-foreground text-background"
                        : "border-foreground hover:bg-secondary"
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isWishlisted ? "fill-background" : ""}`} />
                    {isWishlisted ? "In Wishlist" : "Add to Wishlist"}
                  </button>
                </div>
              )}

              {/* Message Seller */}
              {!isAdmin && !(isVendor && vendorBrandId === product.brandId) && (
                <button
                  onClick={() => {
                    if (!user) {
                      toast({
                        title: "Login Required",
                        description: "Please log in to message this seller.",
                        variant: "destructive",
                      });
                      navigate("/auth");
                      return;
                    }
                    navigate(
                      `/account/messages?vendorOrderId=dm-${brandOwnerId}&otherUserId=${brandOwnerId}&otherUserName=${encodeURIComponent(
                        product.brandName
                      )}&productId=${product.id}&productName=${encodeURIComponent(
                        product.name
                      )}&productImage=${encodeURIComponent(product.image || "")}&role=customer`
                    );
                  }}
                  className="mt-2 w-full flex items-center justify-center gap-2 py-3 border-2 border-foreground/40 text-sm font-heading uppercase tracking-wide hover:border-foreground hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                >
                  <MessageSquare className="w-4 h-4" />
                  Message Seller
                </button>
              )}

              {/* Trust Badges */}
              <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-border-subtle">
                <div className="grid grid-cols-2 gap-3 md:gap-4 text-xs md:text-sm">
                  <div className="flex items-center gap-2">
                    <BadgeCheck className="w-4 h-4 md:w-5 md:h-5 text-success" />
                    <span>Buyer Protection</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 md:w-5 md:h-5 text-foreground" />
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
                      {review.media_urls && review.media_urls.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {review.media_urls.map((url: string, index: number) => {
                            const isVideo = url.match(/\.(mp4|webm|ogg|mov)$/i) || url.includes("/video");
                            return (
                              <div
                                key={index}
                                onClick={() => setSelectedMediaUrl(url)}
                                className="w-16 h-16 border-2 border-foreground bg-secondary cursor-pointer hover:opacity-80 transition-all overflow-hidden flex items-center justify-center"
                              >
                                {isVideo ? (
                                  <video src={url} className="w-full h-full object-cover" muted />
                                ) : (
                                  <img
                                    src={url}
                                    alt=""
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.src = "/placeholder.svg";
                                    }}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
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
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 md:mb-8">
              <div>
                <span className="text-xs uppercase tracking-widest text-muted-foreground block mb-1">
                  {product.brandName}
                </span>
                <h2 className="font-heading text-2xl md:text-3xl uppercase">
                  More From The Same Shop
                </h2>
              </div>
              <Link
                to={`/brands/${product.brandSlug}`}
                className="font-heading text-sm uppercase hover:opacity-60 transition-opacity inline-flex items-center gap-1"
              >
                View Shop
              </Link>
            </div>
            <div className="product-grid">
              {relatedLoading
                ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
                : (filteredRelated as any[]).map((p) => <ProductCard key={p.id} {...p} />)}
            </div>
          </div>
        </section>
      )}

      {/* Media Lightbox Modal */}
      {selectedMediaUrl && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedMediaUrl(null)}
        >
          <div
            className="relative bg-background border-4 border-foreground p-2 max-w-3xl max-h-[80vh] flex items-center justify-center shadow-brutal animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedMediaUrl(null)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-background border-2 border-foreground rounded-full flex items-center justify-center font-heading hover:bg-secondary transition-colors"
            >
              ✕
            </button>
            {selectedMediaUrl.match(/\.(mp4|webm|ogg|mov)$/i) || selectedMediaUrl.includes("/video") ? (
              <video src={selectedMediaUrl} className="max-w-full max-h-[75vh]" controls autoPlay />
            ) : (
              <img
                src={selectedMediaUrl}
                alt=""
                className="max-w-full max-h-[75vh] object-contain"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg";
                }}
              />
            )}
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default ProductDetail;
