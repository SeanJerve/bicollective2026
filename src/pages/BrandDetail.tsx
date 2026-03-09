import { useParams, Link } from "react-router-dom";
import { BadgeCheck, Star, Shield } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import ProductCard from "@/components/marketplace/ProductCard";
import ProductCardSkeleton from "@/components/marketplace/ProductCardSkeleton";
import { useBrand, useProductsByBrand } from "@/hooks/useProducts";

const BrandDetail = () => {
  const { slug } = useParams();
  const { data: brand, isLoading: brandLoading } = useBrand(slug || "");
  const { data: brandProducts, isLoading: productsLoading } = useProductsByBrand(slug || "");

  if (brandLoading) {
    return (
      <PageLayout>
        <div className="section-container py-20">
          <div className="animate-pulse space-y-6">
            <div className="h-48 md:h-64 skeleton-brutal" />
            <div className="h-8 w-48 skeleton-brutal" />
            <div className="h-4 w-96 skeleton-brutal" />
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!brand) {
    return (
      <PageLayout>
        <div className="section-container py-16 md:py-20 text-center">
          <h1 className="font-heading text-3xl md:text-4xl uppercase mb-4">Brand Not Found</h1>
          <p className="text-muted-foreground mb-6 md:mb-8 text-sm md:text-base">
            The brand you're looking for doesn't exist.
          </p>
          <Link to="/brands" className="btn-brutal">
            Browse Brands
          </Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {/* Brand Header */}
      <section className="border-b-2 border-foreground">
        {/* Banner */}
        <div className="aspect-[4/1] md:aspect-[5/1] bg-gradient-to-br from-muted to-accent overflow-hidden">
          {brand.banner && (
            <img
              src={brand.banner}
              alt={`${brand.name} banner`}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Brand Info */}
        <div className="section-container -mt-12 md:-mt-16 pb-6 md:pb-8">
          <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6">
            {/* Logo */}
            <div className="w-24 h-24 md:w-32 md:h-32 aspect-square bg-background border-2 border-foreground shadow-brutal overflow-hidden flex-shrink-0">
              <img
                src={brand.logo}
                alt={brand.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                <h1 className="font-heading text-3xl md:text-5xl uppercase">
                  {brand.name}
                </h1>
                {brand.isVerified && (
                  <span className="badge-verified">
                    <BadgeCheck className="w-3 h-3 md:w-4 md:h-4" />
                    Verified
                  </span>
                )}
              </div>

              {brand.description && (
                <p className="text-muted-foreground max-w-2xl mb-3 md:mb-4 text-sm md:text-base">
                  {brand.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm md:text-base">
                {brand.rating && (
                  <div className="flex items-center gap-1 md:gap-2">
                    <Star className="w-4 h-4 md:w-5 md:h-5 fill-foreground" />
                    <span className="font-heading">{brand.rating.toFixed(1)}</span>
                  </div>
                )}
                <span className="text-muted-foreground">
                  {brandProducts?.length || 0} products
                </span>
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          {brand.isVerified && (
            <div className="mt-6 md:mt-8 flex flex-wrap gap-3 md:gap-4">
              <div className="inline-flex items-center gap-2 px-3 md:px-4 py-2 bg-secondary border border-border-subtle text-xs md:text-sm">
                <BadgeCheck className="w-4 h-4 md:w-5 md:h-5 text-success" />
                <span>Verified Local Brand</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 md:px-4 py-2 bg-secondary border border-border-subtle text-xs md:text-sm">
                <Shield className="w-4 h-4 md:w-5 md:h-5" />
                <span>Buyer Protection Active</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Products */}
      <section className="py-8 md:py-12">
        <div className="section-container">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h2 className="font-heading text-2xl md:text-3xl uppercase">Products</h2>
          </div>

          {productsLoading ? (
            <div className="product-grid">
              {Array.from({ length: 4 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : brandProducts && brandProducts.length > 0 ? (
            <div className="product-grid">
              {brandProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 md:py-16 border-2 border-border-subtle">
              <h3 className="font-heading text-xl md:text-2xl uppercase mb-2">No Products Yet</h3>
              <p className="text-muted-foreground text-sm md:text-base">
                This brand hasn't listed any products.
              </p>
            </div>
          )}
        </div>
      </section>
    </PageLayout>
  );
};

export default BrandDetail;
