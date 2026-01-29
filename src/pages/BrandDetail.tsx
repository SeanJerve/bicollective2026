import { useParams, Link } from "react-router-dom";
import { BadgeCheck, Star, Shield } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import ProductCard from "@/components/marketplace/ProductCard";
import { getBrandBySlug, getProductsByBrand } from "@/data/mockData";

const BrandDetail = () => {
  const { slug } = useParams();
  const brand = getBrandBySlug(slug || "");
  const brandProducts = getProductsByBrand(slug || "");

  if (!brand) {
    return (
      <PageLayout>
        <div className="section-container py-20 text-center">
          <h1 className="font-heading text-4xl uppercase mb-4">Brand Not Found</h1>
          <p className="text-muted-foreground mb-8">
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
        <div className="h-48 md:h-64 bg-gradient-to-br from-muted to-accent" />

        {/* Brand Info */}
        <div className="section-container -mt-16 pb-8">
          <div className="flex flex-col md:flex-row md:items-end gap-6">
            {/* Logo */}
            <div className="w-32 h-32 bg-background border-2 border-foreground shadow-brutal overflow-hidden">
              <img
                src={brand.logo}
                alt={brand.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="font-heading text-4xl md:text-5xl uppercase">
                  {brand.name}
                </h1>
                {brand.isVerified && (
                  <span className="badge-verified">
                    <BadgeCheck className="w-4 h-4" />
                    Verified
                  </span>
                )}
              </div>

              {brand.description && (
                <p className="text-muted-foreground max-w-2xl mb-4">
                  {brand.description}
                </p>
              )}

              <div className="flex items-center gap-6">
                {brand.rating && (
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 fill-foreground" />
                    <span className="font-heading text-lg">{brand.rating.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">(142 reviews)</span>
                  </div>
                )}
                <span className="text-muted-foreground">
                  {brandProducts.length} products
                </span>
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          {brand.isVerified && (
            <div className="mt-8 flex flex-wrap gap-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary border border-border-subtle">
                <BadgeCheck className="w-5 h-5 text-success" />
                <span className="text-sm">Verified Local Brand</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary border border-border-subtle">
                <Shield className="w-5 h-5" />
                <span className="text-sm">Buyer Protection Active</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Products */}
      <section className="py-12">
        <div className="section-container">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-heading text-3xl uppercase">Products</h2>
          </div>

          {brandProducts.length > 0 ? (
            <div className="product-grid">
              {brandProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border-2 border-border-subtle">
              <h3 className="font-heading text-2xl uppercase mb-2">No Products Yet</h3>
              <p className="text-muted-foreground">
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
