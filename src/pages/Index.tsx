import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, Shield } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import ProductCard from "@/components/marketplace/ProductCard";
import ProductCardSkeleton from "@/components/marketplace/ProductCardSkeleton";
import BrandCard from "@/components/marketplace/BrandCard";
import BrandCardSkeleton from "@/components/marketplace/BrandCardSkeleton";
import { useProducts, useBrands, useCategories } from "@/hooks/useProducts";
import { useAuth } from "@/contexts/AuthContext";
import heroBanner from "@/assets/hero-banner.jpg";

const Index = () => {
  const { isVendor } = useAuth();
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: brands, isLoading: brandsLoading } = useBrands();
  const { data: categories, isLoading: categoriesLoading } = useCategories();

  const featuredProducts = products?.slice(0, 4) || [];
  const featuredBrands = brands?.slice(0, 3) || [];

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="relative min-h-[60vh] md:min-h-[80vh] flex items-center border-b-2 border-foreground overflow-hidden">
        {/* Plain Background */}
        <div className="absolute inset-0 bg-background" />

        {/* Content */}
        <div className="relative section-container py-12 md:py-20">
          <div className="max-w-2xl animate-fade-in">
            <span className="inline-block font-heading text-xs md:text-sm uppercase tracking-widest mb-3 md:mb-4 border-2 border-foreground px-2 md:px-3 py-1 bg-background">
              Local Bicolano Fashion
            </span>
            <h1 className="font-heading text-4xl sm:text-5xl md:text-7xl lg:text-8xl uppercase leading-[0.9] mb-4 md:mb-6">
              Discover
              <br />
              Authentic
              <br />
              Style
            </h1>
            <p className="text-base md:text-xl mb-6 md:mb-8 max-w-md">
              Shop curated collections from verified local Bicolano clothing brands. 
              Quality fashion, community-driven commerce.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <Link to="/products" className="btn-brutal inline-flex items-center justify-center gap-2">
                Shop Now
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
              </Link>
              <Link to="/brands" className="btn-brutal-secondary inline-flex items-center justify-center gap-2">
                Explore Brands
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-6 md:py-8 border-b-2 border-foreground bg-secondary">
        <div className="section-container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 text-center">
            <div className="flex items-center justify-center gap-2 md:gap-3">
              <BadgeCheck className="w-5 h-5 md:w-6 md:h-6" />
              <span className="font-heading text-sm md:text-base uppercase tracking-wide">Verified Local Brands</span>
            </div>
            <div className="flex items-center justify-center gap-2 md:gap-3">
              <Shield className="w-5 h-5 md:w-6 md:h-6" />
              <span className="font-heading text-sm md:text-base uppercase tracking-wide">Buyer Protection</span>
            </div>
            <div className="flex items-center justify-center gap-2 md:gap-3">
              <span className="text-xl md:text-2xl">🇵🇭</span>
              <span className="font-heading text-sm md:text-base uppercase tracking-wide">Supporting Bicol</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 md:py-24">
        <div className="section-container">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 md:mb-10">
            <div>
              <span className="text-xs md:text-sm uppercase tracking-widest text-muted-foreground mb-2 block">
                New Arrivals
              </span>
              <h2 className="font-heading text-3xl md:text-5xl uppercase">Featured Products</h2>
            </div>
            <Link
              to="/products"
              className="hidden sm:inline-flex items-center gap-2 font-heading uppercase text-sm hover:opacity-60 transition-opacity"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="product-grid">
            {productsLoading ? (
              Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
            ) : featuredProducts.length > 0 ? (
              featuredProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">No products available yet.</p>
              </div>
            )}
          </div>

          <Link
            to="/products"
            className="sm:hidden btn-brutal-secondary w-full mt-6 md:mt-8 text-center block"
          >
            View All Products
          </Link>
        </div>
      </section>

      {/* Categories Strip */}
      <section className="py-8 md:py-12 bg-foreground text-background border-y-2 border-foreground">
        <div className="section-container">
          <div className="flex flex-wrap justify-center gap-3 md:gap-8">
            {categoriesLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-6 w-20 bg-background/20 animate-pulse" />
              ))
            ) : (
              categories?.map((category) => (
                <Link
                  key={category.id}
                  to={`/categories/${category.slug}`}
                  className="font-heading text-base md:text-2xl uppercase tracking-wide hover:opacity-60 transition-opacity"
                >
                  {category.name}
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Featured Brands */}
      <section className="py-12 md:py-24">
        <div className="section-container">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 md:mb-10">
            <div>
              <span className="text-xs md:text-sm uppercase tracking-widest text-muted-foreground mb-2 block">
                Trusted Partners
              </span>
              <h2 className="font-heading text-3xl md:text-5xl uppercase">Local Brands</h2>
            </div>
            <Link
              to="/brands"
              className="hidden sm:inline-flex items-center gap-2 font-heading uppercase text-sm hover:opacity-60 transition-opacity"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="brand-grid">
            {brandsLoading ? (
              Array.from({ length: 3 }).map((_, i) => <BrandCardSkeleton key={i} />)
            ) : featuredBrands.length > 0 ? (
              featuredBrands.map((brand) => (
                <BrandCard key={brand.id} {...brand} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">No brands available yet.</p>
              </div>
            )}
          </div>

          <Link
            to="/brands"
            className="sm:hidden btn-brutal-secondary w-full mt-6 md:mt-8 text-center block"
          >
            View All Brands
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      {!isVendor && (
        <section className="py-16 md:py-32 bg-secondary border-t-2 border-foreground">
          <div className="section-container text-center px-4">
            <h2 className="font-heading text-3xl md:text-6xl uppercase mb-4 md:mb-6">
              Own a Local Brand?
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-6 md:mb-8">
              Join Bicollective and reach thousands of customers. 
              Get your own storefront with zero setup fees.
            </p>
            <Link to="/vendor/register" className="btn-brutal inline-flex items-center gap-2">
              Become a Vendor
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
            </Link>
          </div>
        </section>
      )}
    </PageLayout>
  );
};

export default Index;
