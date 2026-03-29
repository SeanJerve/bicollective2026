import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Clock, ShoppingBag, Zap } from "lucide-react";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import { useIsMobile } from "@/hooks/use-mobile";
import QuickAddDrawer from "./QuickAddDrawer";

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  image: string;
  brandName: string;
  brandSlug: string;
  isVerifiedBrand?: boolean;
  category?: string;
  inStock?: boolean;
  listingType?: string;
  preorderDiscountPercent?: number;
  storeSalePercent?: number;
  storeSaleEndsAt?: string;
  sizes?: string[];
  isBoosted?: boolean;
}

const ProductCard = ({
  id,
  name,
  slug,
  price,
  originalPrice,
  image,
  brandName,
  brandSlug,
  isVerifiedBrand = false,
  category,
  inStock = true,
  listingType = "regular",
  preorderDiscountPercent,
  storeSalePercent,
  storeSaleEndsAt,
  sizes,
  isBoosted = false,
}: ProductCardProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const isStoreSaleActive = storeSalePercent && storeSalePercent > 0 && storeSaleEndsAt && new Date(storeSaleEndsAt) > new Date();
  const canAddToCart = inStock && listingType !== "teaser";

  return (
    <>
      <article className="group">
        <Link to={`/products/${slug}`} className="block">
          <div className="card-brutal overflow-hidden">
            {/* Image Container */}
            <div className="relative aspect-[3/4] bg-muted overflow-hidden">
              <img
                src={image}
                alt={name}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {!inStock && listingType === "regular" && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                  <span className="font-heading uppercase tracking-wide text-xs md:text-sm">
                    Out of Stock
                  </span>
                </div>
              )}
              {listingType === "teaser" && (
                <div className="absolute top-2 right-2 md:top-3 md:right-3 px-1.5 py-0.5 md:px-2 md:py-1 bg-muted border border-foreground text-[10px] md:text-xs font-heading uppercase flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5 md:w-3 md:h-3" /> Coming Soon
                </div>
              )}
              {listingType === "preorder" && (
                <div className="absolute top-2 right-2 md:top-3 md:right-3 px-1.5 py-0.5 md:px-2 md:py-1 bg-accent border border-foreground text-[10px] md:text-xs font-heading uppercase flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5 md:w-3 md:h-3" /> Pre-order
                </div>
              )}
              {isStoreSaleActive && (
                <div className="absolute top-2 left-2 md:top-3 md:left-3 px-1.5 py-0.5 md:px-2 md:py-1 bg-destructive text-destructive-foreground text-[10px] md:text-xs font-heading uppercase">
                  {storeSalePercent}% OFF
                </div>
              )}
              {category && !isStoreSaleActive && (
                <span className="absolute top-2 left-2 md:top-3 md:left-3 badge-category text-[10px] md:text-xs">
                  {category}
                </span>
              )}
              {isBoosted && (
                <div className="absolute bottom-2 left-2 md:bottom-3 md:left-3 px-1.5 py-0.5 md:px-2 md:py-1 bg-background/80 border border-foreground text-[8px] md:text-[10px] font-heading uppercase tracking-tighter flex items-center gap-1 z-10 backdrop-blur-sm">
                   SPONSORED
                </div>
              )}

              {/* Mobile Quick Add Button */}
              {isMobile && canAddToCart && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDrawerOpen(true);
                  }}
                  className="absolute bottom-2 right-2 w-8 h-8 bg-foreground text-background flex items-center justify-center shadow-brutal-sm border border-foreground active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all z-10"
                  aria-label="Quick add to cart"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Content */}
            <div className="p-2.5 md:p-4">
              {/* Brand */}
              <span
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate(`/brands/${brandSlug}`);
                }}
                className="inline-flex items-center gap-1 md:gap-1.5 mb-1 md:mb-2 group/brand cursor-pointer"
              >
                <span className="text-[10px] md:text-xs uppercase tracking-wide text-muted-foreground group-hover/brand:text-foreground transition-colors">
                  {brandName}
                </span>
                {isVerifiedBrand && (
                  <VerifiedBadge size="sm" />
                )}
              </span>

              {/* Product Name */}
              <h3 className="font-heading text-sm md:text-lg uppercase tracking-tight leading-tight mb-1 md:mb-2 line-clamp-2">
                {name}
              </h3>

              {/* Price */}
              <div className="flex items-center gap-1.5 md:gap-2">
                {listingType === "teaser" ? (
                  <span className="font-heading text-sm md:text-lg text-muted-foreground">Price TBA</span>
                ) : (
                  <>
                    <span className="font-heading text-sm md:text-lg">{formatPrice(price)}</span>
                    {originalPrice && originalPrice > price && (
                      <span className="text-[10px] md:text-sm text-muted-foreground line-through">
                        {formatPrice(originalPrice)}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </Link>
      </article>

      {/* Quick Add Drawer */}
      {isMobile && (
        <QuickAddDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          product={{ id, name, price, image, sizes, inStock }}
        />
      )}
    </>
  );
};

export default ProductCard;
