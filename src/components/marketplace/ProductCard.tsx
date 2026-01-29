import { Link } from "react-router-dom";
import { BadgeCheck } from "lucide-react";

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
}

const ProductCard = ({
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
}: ProductCardProps) => {
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  return (
    <article className="group">
      <Link to={`/products/${slug}`} className="block">
        <div className="card-brutal overflow-hidden">
          {/* Image Container */}
          <div className="relative aspect-[3/4] bg-muted overflow-hidden">
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {!inStock && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <span className="font-heading uppercase tracking-wide text-sm">
                  Out of Stock
                </span>
              </div>
            )}
            {category && (
              <span className="absolute top-3 left-3 badge-category">
                {category}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="p-4">
            {/* Brand */}
            <Link
              to={`/brands/${brandSlug}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 mb-2 group/brand"
            >
              <span className="text-xs uppercase tracking-wide text-muted-foreground group-hover/brand:text-foreground transition-colors">
                {brandName}
              </span>
              {isVerifiedBrand && (
                <BadgeCheck className="w-3.5 h-3.5 text-success" />
              )}
            </Link>

            {/* Product Name */}
            <h3 className="font-heading text-lg uppercase tracking-tight leading-tight mb-2 line-clamp-2">
              {name}
            </h3>

            {/* Price */}
            <div className="flex items-center gap-2">
              <span className="font-heading text-lg">{formatPrice(price)}</span>
              {originalPrice && originalPrice > price && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(originalPrice)}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
};

export default ProductCard;
