import { Link } from "react-router-dom";
import { BadgeCheck, Star } from "lucide-react";

interface BrandCardProps {
  id: string;
  name: string;
  slug: string;
  logo: string;
  banner?: string;
  description?: string;
  isVerified?: boolean;
  rating?: number;
  productCount?: number;
}

const BrandCard = ({
  name,
  slug,
  logo,
  banner,
  description,
  isVerified = false,
  rating,
  productCount,
}: BrandCardProps) => {
  return (
    <Link to={`/brands/${slug}`} className="block group">
      <article className="card-brutal overflow-hidden">
        {/* Banner */}
        <div className="relative h-32 bg-muted overflow-hidden">
          {banner ? (
            <img
              src={banner}
              alt={`${name} banner`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-muted to-accent" />
          )}
          
          {/* Logo */}
          <div className="absolute -bottom-8 left-4 w-16 h-16 bg-background border-2 border-foreground overflow-hidden">
            <img
              src={logo}
              alt={`${name} logo`}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Content */}
        <div className="pt-10 p-4">
          {/* Brand Name & Verified Badge */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-heading text-xl uppercase tracking-tight leading-tight">
              {name}
            </h3>
            {isVerified && (
              <div className="flex-shrink-0 badge-verified">
                <BadgeCheck className="w-3.5 h-3.5" />
                <span>Verified</span>
              </div>
            )}
          </div>

          {/* Description */}
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {description}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            {rating !== undefined && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-foreground" />
                <span className="font-medium">{rating.toFixed(1)}</span>
              </div>
            )}
            {productCount !== undefined && (
              <span className="text-muted-foreground">
                {productCount} {productCount === 1 ? "product" : "products"}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
};

export default BrandCard;
