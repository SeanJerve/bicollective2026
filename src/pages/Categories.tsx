import { Link } from "react-router-dom";
import PageLayout from "@/components/layout/PageLayout";
import CategoryCard from "@/components/marketplace/CategoryCard";
import ProductCard from "@/components/marketplace/ProductCard";
import ProductCardSkeleton from "@/components/marketplace/ProductCardSkeleton";
import { useCategories, useProducts } from "@/hooks/useProducts";
import { Sparkles, ArrowRight, Layers } from "lucide-react";

const Categories = () => {
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: products, isLoading: productsLoading } = useProducts();

  // Get 4 trending/latest active products
  const featuredProducts = products?.filter((p) => p.inStock && !p.isTeaser).slice(0, 4) || [];

  return (
    <PageLayout>
      {/* Premium Header */}
      <section className="relative py-16 md:py-24 border-b-2 border-foreground bg-secondary/35 overflow-hidden">
        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
        
        <div className="relative section-container">
          <nav className="text-xs md:text-sm mb-4 font-mono uppercase tracking-wider">
            <Link to="/" className="text-muted-foreground hover:text-foreground">
              Home
            </Link>
            <span className="mx-2 text-muted-foreground">/</span>
            <span className="text-foreground font-semibold">Categories</span>
          </nav>
          
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-heading uppercase tracking-widest bg-foreground text-background mb-4">
              <Layers className="w-3.5 h-3.5" /> Curated Departments
            </span>
            <h1 className="font-heading text-4xl sm:text-5xl md:text-7xl uppercase leading-none tracking-tight">
              Explore
              <br />
              Departments
            </h1>
            <p className="text-muted-foreground mt-4 text-sm md:text-lg max-w-xl leading-relaxed">
              Find exactly what you are looking for by exploring our streetwear, casual wear, and accessory lines sourced directly from Bicol's finest independent creators.
            </p>
          </div>
        </div>
      </section>

      {/* Main Categories Section */}
      <section className="py-16 md:py-24">
        <div className="section-container">
          <div className="mb-8 md:mb-12 flex justify-between items-end border-b border-foreground/10 pb-4">
            <div>
              <h2 className="font-heading text-xl md:text-3xl uppercase">All Collections</h2>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">Select a category to view the complete catalog</p>
            </div>
            <span className="text-xs md:text-sm font-mono text-muted-foreground uppercase hidden sm:inline">
              {categories?.length || 0} Departments Active
            </span>
          </div>

          {categoriesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="skeleton-brutal h-48 md:h-64" />
              ))}
            </div>
          ) : categories && categories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {categories.map((category) => (
                <CategoryCard
                  key={category.id}
                  name={category.name}
                  slug={category.slug}
                  image={category.image}
                  productCount={category.productCount}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 card-brutal max-w-md mx-auto">
              <p className="text-muted-foreground">No categories available yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* Featured Products Section to fill empty space and add value */}
      <section className="py-16 md:py-24 bg-secondary/20 border-t-2 border-foreground">
        <div className="section-container">
          <div className="mb-8 md:mb-12 flex justify-between items-end">
            <div>
              <span className="font-heading text-xs text-primary uppercase tracking-widest flex items-center gap-1 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-primary fill-primary" /> Curated Pick
              </span>
              <h2 className="font-heading text-xl md:text-3xl uppercase">Trending In Shop</h2>
            </div>
            <Link to="/products" className="text-xs md:text-sm font-heading uppercase tracking-wider flex items-center gap-1 hover:underline">
              See All Products <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {[1, 2, 3, 4].map((i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-center text-muted-foreground py-8">No trending products available.</p>
          )}
        </div>
      </section>
    </PageLayout>
  );
};

export default Categories;
