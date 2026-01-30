import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import ProductCard from "@/components/marketplace/ProductCard";
import ProductCardSkeleton from "@/components/marketplace/ProductCardSkeleton";
import { useProducts, useBrands, useCategories } from "@/hooks/useProducts";

const Products = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("newest");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: brands } = useBrands();
  const { data: categories } = useCategories();

  const filteredProducts = (products || []).filter((product) => {
    if (selectedCategory && product.categorySlug !== selectedCategory) return false;
    if (selectedBrand && product.brandSlug !== selectedBrand) return false;
    return true;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      default:
        return 0;
    }
  });

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedBrand(null);
  };

  const hasActiveFilters = selectedCategory || selectedBrand;

  return (
    <PageLayout>
      {/* Header */}
      <section className="py-8 md:py-12 border-b-2 border-foreground">
        <div className="section-container">
          <nav className="text-xs md:text-sm mb-3 md:mb-4">
            <Link to="/" className="text-muted-foreground hover:text-foreground">
              Home
            </Link>
            <span className="mx-2 text-muted-foreground">/</span>
            <span>All Products</span>
          </nav>
          <h1 className="font-heading text-4xl md:text-6xl uppercase">Shop All</h1>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">
            {sortedProducts.length} {sortedProducts.length === 1 ? "product" : "products"}
          </p>
        </div>
      </section>

      {/* Filters & Products */}
      <section className="py-8 md:py-12">
        <div className="section-container">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setIsFilterOpen(true)}
              className="lg:hidden btn-brutal-secondary flex items-center justify-center gap-2"
            >
              <SlidersHorizontal className="w-4 h-4 md:w-5 md:h-5" />
              Filters
              {hasActiveFilters && (
                <span className="w-5 h-5 bg-foreground text-background text-xs flex items-center justify-center">
                  {(selectedCategory ? 1 : 0) + (selectedBrand ? 1 : 0)}
                </span>
              )}
            </button>

            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-24 space-y-8">
                {/* Categories */}
                <div>
                  <h3 className="font-heading uppercase text-sm tracking-wide mb-4">Categories</h3>
                  <ul className="space-y-2">
                    <li>
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className={`text-sm ${!selectedCategory ? "font-medium border-b-2 border-foreground" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        All Categories
                      </button>
                    </li>
                    {categories?.map((cat) => (
                      <li key={cat.id}>
                        <button
                          onClick={() => setSelectedCategory(cat.slug)}
                          className={`text-sm ${selectedCategory === cat.slug ? "font-medium border-b-2 border-foreground" : "text-muted-foreground hover:text-foreground"}`}
                        >
                          {cat.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Brands */}
                <div>
                  <h3 className="font-heading uppercase text-sm tracking-wide mb-4">Brands</h3>
                  <ul className="space-y-2">
                    <li>
                      <button
                        onClick={() => setSelectedBrand(null)}
                        className={`text-sm ${!selectedBrand ? "font-medium border-b-2 border-foreground" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        All Brands
                      </button>
                    </li>
                    {brands?.map((brand) => (
                      <li key={brand.id}>
                        <button
                          onClick={() => setSelectedBrand(brand.slug)}
                          className={`text-sm ${selectedBrand === brand.slug ? "font-medium border-b-2 border-foreground" : "text-muted-foreground hover:text-foreground"}`}
                        >
                          {brand.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-muted-foreground hover:text-foreground underline"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            </aside>

            {/* Mobile Filter Drawer */}
            {isFilterOpen && (
              <div className="fixed inset-0 z-50 lg:hidden">
                <div className="absolute inset-0 bg-foreground/50" onClick={() => setIsFilterOpen(false)} />
                <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-background border-l-2 border-foreground p-6 overflow-y-auto animate-slide-in-right">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="font-heading text-xl uppercase">Filters</h2>
                    <button onClick={() => setIsFilterOpen(false)}>
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-8">
                    {/* Categories */}
                    <div>
                      <h3 className="font-heading uppercase text-sm tracking-wide mb-4">Categories</h3>
                      <ul className="space-y-3">
                        <li>
                          <button
                            onClick={() => setSelectedCategory(null)}
                            className={`text-sm ${!selectedCategory ? "font-medium" : "text-muted-foreground"}`}
                          >
                            All Categories
                          </button>
                        </li>
                        {categories?.map((cat) => (
                          <li key={cat.id}>
                            <button
                              onClick={() => setSelectedCategory(cat.slug)}
                              className={`text-sm ${selectedCategory === cat.slug ? "font-medium" : "text-muted-foreground"}`}
                            >
                              {cat.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Brands */}
                    <div>
                      <h3 className="font-heading uppercase text-sm tracking-wide mb-4">Brands</h3>
                      <ul className="space-y-3">
                        <li>
                          <button
                            onClick={() => setSelectedBrand(null)}
                            className={`text-sm ${!selectedBrand ? "font-medium" : "text-muted-foreground"}`}
                          >
                            All Brands
                          </button>
                        </li>
                        {brands?.map((brand) => (
                          <li key={brand.id}>
                            <button
                              onClick={() => setSelectedBrand(brand.slug)}
                              className={`text-sm ${selectedBrand === brand.slug ? "font-medium" : "text-muted-foreground"}`}
                            >
                              {brand.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-border-subtle space-y-4">
                    {hasActiveFilters && (
                      <button onClick={clearFilters} className="btn-brutal-secondary w-full">
                        Clear Filters
                      </button>
                    )}
                    <button onClick={() => setIsFilterOpen(false)} className="btn-brutal w-full">
                      Apply Filters
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Product Grid */}
            <div className="flex-1">
              {/* Sort Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedCategory && (
                    <span className="inline-flex items-center gap-1 px-2 md:px-3 py-1 bg-secondary text-xs md:text-sm border border-border-subtle">
                      {categories?.find((c) => c.slug === selectedCategory)?.name}
                      <button onClick={() => setSelectedCategory(null)}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {selectedBrand && (
                    <span className="inline-flex items-center gap-1 px-2 md:px-3 py-1 bg-secondary text-xs md:text-sm border border-border-subtle">
                      {brands?.find((b) => b.slug === selectedBrand)?.name}
                      <button onClick={() => setSelectedBrand(null)}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>

                <div className="relative w-full sm:w-auto">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full sm:w-auto appearance-none bg-background border-2 border-foreground px-3 md:px-4 py-2 pr-10 font-heading text-xs md:text-sm uppercase cursor-pointer"
                  >
                    <option value="newest">Newest</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
                </div>
              </div>

              {/* Products */}
              {productsLoading ? (
                <div className="product-grid">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <ProductCardSkeleton key={i} />
                  ))}
                </div>
              ) : sortedProducts.length > 0 ? (
                <div className="product-grid">
                  {sortedProducts.map((product) => (
                    <ProductCard key={product.id} {...product} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 md:py-20">
                  <h3 className="font-heading text-xl md:text-2xl uppercase mb-2">No Products Found</h3>
                  <p className="text-muted-foreground mb-6 text-sm md:text-base">Try adjusting your filters</p>
                  <button onClick={clearFilters} className="btn-brutal-secondary">
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Products;
