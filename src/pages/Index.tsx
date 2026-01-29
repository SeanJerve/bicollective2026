import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, Shield } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import ProductCard from "@/components/marketplace/ProductCard";
import BrandCard from "@/components/marketplace/BrandCard";
import { products, brands, categories } from "@/data/mockData";
import heroBanner from "@/assets/hero-banner.jpg";

const Index = () => {
  const featuredProducts = products.slice(0, 4);
  const featuredBrands = brands.slice(0, 3);

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="relative min-h-[70vh] md:min-h-[80vh] flex items-center border-b-2 border-foreground overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={heroBanner}
            alt="Bicollective - Local Bicolano Fashion"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-background/60" />
        </div>

        {/* Content */}
        <div className="relative section-container py-20">
          <div className="max-w-2xl animate-fade-in">
            <span className="inline-block font-heading text-sm uppercase tracking-widest mb-4 border-2 border-foreground px-3 py-1 bg-background">
              Local Bicolano Fashion
            </span>
            <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl uppercase leading-[0.9] mb-6">
              Discover
              <br />
              Authentic
              <br />
              Style
            </h1>
            <p className="text-lg md:text-xl mb-8 max-w-md">
              Shop curated collections from verified local Bicolano clothing brands. 
              Quality fashion, community-driven commerce.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/products" className="btn-brutal inline-flex items-center gap-2">
                Shop Now
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/brands" className="btn-brutal-secondary inline-flex items-center gap-2">
                Explore Brands
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-8 border-b-2 border-foreground bg-secondary">
        <div className="section-container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="flex items-center justify-center gap-3">
              <BadgeCheck className="w-6 h-6" />
              <span className="font-heading uppercase tracking-wide">Verified Local Brands</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Shield className="w-6 h-6" />
              <span className="font-heading uppercase tracking-wide">Buyer Protection</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl">🇵🇭</span>
              <span className="font-heading uppercase tracking-wide">Supporting Bicol</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 md:py-24">
        <div className="section-container">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="text-sm uppercase tracking-widest text-muted-foreground mb-2 block">
                New Arrivals
              </span>
              <h2 className="font-heading text-4xl md:text-5xl uppercase">Featured Products</h2>
            </div>
            <Link
              to="/products"
              className="hidden md:inline-flex items-center gap-2 font-heading uppercase text-sm hover:opacity-60 transition-opacity"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="product-grid">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>

          <Link
            to="/products"
            className="md:hidden btn-brutal-secondary w-full mt-8 text-center block"
          >
            View All Products
          </Link>
        </div>
      </section>

      {/* Categories Strip */}
      <section className="py-12 bg-foreground text-background border-y-2 border-foreground">
        <div className="section-container">
          <div className="flex flex-wrap justify-center gap-4 md:gap-8">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/categories/${category.slug}`}
                className="font-heading text-lg md:text-2xl uppercase tracking-wide hover:opacity-60 transition-opacity"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Brands */}
      <section className="py-16 md:py-24">
        <div className="section-container">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="text-sm uppercase tracking-widest text-muted-foreground mb-2 block">
                Trusted Partners
              </span>
              <h2 className="font-heading text-4xl md:text-5xl uppercase">Local Brands</h2>
            </div>
            <Link
              to="/brands"
              className="hidden md:inline-flex items-center gap-2 font-heading uppercase text-sm hover:opacity-60 transition-opacity"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="brand-grid">
            {featuredBrands.map((brand) => (
              <BrandCard key={brand.id} {...brand} />
            ))}
          </div>

          <Link
            to="/brands"
            className="md:hidden btn-brutal-secondary w-full mt-8 text-center block"
          >
            View All Brands
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 bg-secondary border-t-2 border-foreground">
        <div className="section-container text-center">
          <h2 className="font-heading text-4xl md:text-6xl uppercase mb-6">
            Own a Local Brand?
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            Join Bicollective and reach thousands of customers. 
            Get your own storefront with zero setup fees.
          </p>
          <Link to="/vendor/register" className="btn-brutal inline-flex items-center gap-2">
            Become a Vendor
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </PageLayout>
  );
};

export default Index;
