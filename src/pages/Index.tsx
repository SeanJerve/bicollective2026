import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, Shield, Tag, Sparkles, Heart } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import ProductCard from "@/components/marketplace/ProductCard";
import ProductCardSkeleton from "@/components/marketplace/ProductCardSkeleton";
import BrandCard from "@/components/marketplace/BrandCard";
import BrandCardSkeleton from "@/components/marketplace/BrandCardSkeleton";
import SitePopup from "@/components/ui/SitePopup";
import BecomeVendorCTA from "@/components/marketplace/BecomeVendorCTA";
import { useProducts, useBrands, useCategories } from "@/hooks/useProducts";
import { useAuth } from "@/contexts/AuthContext";
import usePageSEO from "@/hooks/usePageSEO";
import heroBanner from "@/assets/hero-banner.png";

const Index = () => {
  const { isVendor, isAdmin } = useAuth();
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: brands, isLoading: brandsLoading } = useBrands();
  const { data: categories, isLoading: categoriesLoading } = useCategories();

  usePageSEO({
    title: "",
    description:
      "Shop curated collections from verified local Bicolano clothing brands. Quality fashion, community-driven commerce from the Bicol region.",
  });

  const featuredProducts = (products || [])
    .filter((p) => !p.isTeaser && p.listingType !== "teaser")
    .slice(0, 4);
  const featuredBrands = brands?.slice(0, 3) || [];

  const saleProducts = useMemo(() => {
    return (
      products
        ?.filter((p) => {
          if (p.isTeaser || p.listingType === "teaser") return false;
          const isProductSale = p.originalPrice && p.originalPrice > p.price;
          const isPreorderSale = p.preorderDiscountPercent && p.preorderDiscountPercent > 0;
          const isStoreSale =
            p.storeSalePercent &&
            p.storeSalePercent > 0 &&
            p.storeSaleEndsAt &&
            new Date(p.storeSaleEndsAt) > new Date();
          return isProductSale || isPreorderSale || isStoreSale;
        })
        .slice(0, 4) || []
    );
  }, [products]);

  const dailyDiscoverProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    const filtered = products.filter((p) => !p.isTeaser && p.listingType !== "teaser");
    const shuffled = [...filtered].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 8);
  }, [products]);

  return (
    <PageLayout>
      <SitePopup />
      {/* Hero Section */}
      <section
        className="relative min-h-[60vh] md:min-h-[80vh] flex items-center border-b-2 border-foreground overflow-hidden bg-cover bg-right md:bg-center"
        style={{ backgroundImage: `url(${heroBanner})` }}
      >
        {/* Content */}
        <div className="relative section-container py-12 md:py-20 text-left flex justify-start w-full">
          <div className="max-w-2xl animate-fade-in text-left flex flex-col items-start">
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
              Shop curated collections from verified local Bicolano clothing brands. Quality
              fashion, community-driven commerce.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <Link
                to="/products"
                className="btn-brutal inline-flex items-center justify-center gap-2"
              >
                Shop Now
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
              </Link>
              <Link
                to="/brands"
                className="btn-brutal-secondary inline-flex items-center justify-center gap-2"
              >
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
              <span className="font-heading text-sm md:text-base uppercase tracking-wide">
                Verified Local Brands
              </span>
            </div>
            <div className="flex items-center justify-center gap-2 md:gap-3">
              <Shield className="w-5 h-5 md:w-6 md:h-6" />
              <span className="font-heading text-sm md:text-base uppercase tracking-wide">
                Buyer Protection
              </span>
            </div>
            <div className="flex items-center justify-center gap-2 md:gap-3">
              <Heart className="w-5 h-5 md:w-6 md:h-6 fill-destructive text-destructive" />
              <span className="font-heading text-sm md:text-base uppercase tracking-wide">
                Supporting Bicol
              </span>
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
              featuredProducts.map((product) => <ProductCard key={product.id} {...product} />)
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
            {categoriesLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-6 w-20 bg-background/20 animate-pulse" />
                ))
              : categories?.map((category) => (
                  <Link
                    key={category.id}
                    to={`/categories/${category.slug}`}
                    className="font-heading text-base md:text-2xl uppercase tracking-wide hover:opacity-60 transition-opacity"
                  >
                    {category.name}
                  </Link>
                ))}
          </div>
        </div>
      </section>

      {/* Flash Deals / Sale Section */}
      {saleProducts.length > 0 && (
        <section className="py-12 md:py-16 bg-accent/10 border-b-2 border-foreground">
          <div className="section-container">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 md:mb-10">
              <div>
                <span className="text-xs md:text-sm uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
                  <Tag className="w-4 h-4" /> Limited Time Offers
                </span>
                <h2 className="font-heading text-3xl md:text-5xl uppercase text-destructive">
                  Flash Deals
                </h2>
              </div>
              <Link
                to="/products"
                className="hidden sm:inline-flex items-center gap-2 font-heading uppercase text-sm hover:opacity-60 transition-opacity"
              >
                View All Deals
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="product-grid">
              {saleProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>

            <Link
              to="/products"
              className="sm:hidden btn-brutal-secondary w-full mt-6 md:mt-8 text-center block"
            >
              View All Deals
            </Link>
          </div>
        </section>
      )}

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
              featuredBrands.map((brand) => <BrandCard key={brand.id} {...brand} />)
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

      {/* Daily Discover Section */}
      <section className="py-12 md:py-24 border-t-2 border-foreground">
        <div className="section-container">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 md:mb-10">
            <div>
              <span className="text-xs md:text-sm uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" /> Recommended For You
              </span>
              <h2 className="font-heading text-3xl md:text-5xl uppercase">Daily Discover</h2>
            </div>
          </div>

          <div className="product-grid">
            {productsLoading ? (
              Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
            ) : dailyDiscoverProducts.length > 0 ? (
              dailyDiscoverProducts.map((product) => (
                <ProductCard key={`discover-${product.id}`} {...product} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">Check back later for new discoveries!</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SEO & Marketing Copy */}
      <section className="py-12 md:py-16 border-t-2 border-foreground bg-secondary/50">
        <div className="section-container max-w-5xl text-sm md:text-base text-muted-foreground space-y-6">
          <div>
            <h3 className="font-heading text-lg md:text-xl text-foreground uppercase mb-2">
              Buy and Sell the Best Local Fashion on Bicollective
            </h3>
            <p className="leading-relaxed">
              Bicollective is a community-driven, free, and trusted way to buy and sell authentic
              clothing online. We are the premier local fashion marketplace platform for the Bicol
              region—bringing together the best streetwear, tailored garments, and lifestyle brands
              from Camarines Sur, Albay, Sorsogon, and beyond. Join thousands of others on
              Bicollective to list products and shop for the best local deals online. Doing your
              online shopping is safe with our robust Buyer Protection. You get the item you
              ordered, or you get your money back! Create and browse verified listings for free.
              Join the Bicollective community and wear your local pride today!
            </p>
          </div>
          <div>
            <h3 className="font-heading text-lg md:text-xl text-foreground uppercase mb-2">
              Experience a Curated Shopping Journey
            </h3>
            <p className="leading-relaxed">
              Join Bicollective to find everything you need at the best prices, directly from the
              creators. Shopping on the region's best marketplace cannot get any easier. Support
              homegrown talent by browsing through our extensive categories, from exclusive graphic
              tees by Soul of Bicol, heavyweight hoodies by Gubat Collective, to timeless
              accessories by Magayon Studio.
            </p>
          </div>
          <div>
            <h3 className="font-heading text-lg md:text-xl text-foreground uppercase mb-2">
              Enjoy Special Drops, Promos, and Local Discounts
            </h3>
            <p className="leading-relaxed">
              Shopping locally is not only easy and safe, but we make it rewarding. Keep an eye out
              for our exclusive Product Target Drops, store-wide sales, and Premium Vendor
              discounts. Treat yourself during payday with exclusive vouchers!
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <BecomeVendorCTA />
    </PageLayout>
  );
};

export default Index;
