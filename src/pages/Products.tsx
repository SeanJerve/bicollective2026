import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronDown, SlidersHorizontal, X, MapPin, LayoutGrid, List } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import ProductCard from "@/components/marketplace/ProductCard";
import ProductCardSkeleton from "@/components/marketplace/ProductCardSkeleton";
import { useProducts, useBrands, useCategories } from "@/hooks/useProducts";
import usePageSEO from "@/hooks/usePageSEO";

const BICOL_LOCATIONS = [
  "All Locations",
  "Legazpi City",
  "Naga City",
  "Tabaco City",
  "Ligao City",
  "Iriga City",
  "Sorsogon City",
  "Masbate City",
  "Daet",
  "Virac",
  "Albay",
  "Camarines Sur",
  "Camarines Norte",
  "Sorsogon",
  "Masbate",
  "Catanduanes",
];

const INITIAL_SHOW_COUNT = 3;

const Products = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  const locationParam = searchParams.get("location") || "";

  usePageSEO({
    title: "Products",
    description: "Browse curated Bicolano fashion products from verified local brands. Filter by category, brand, and location.",
  });

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(
    locationParam || null
  );
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllLocations, setShowAllLocations] = useState(false);

  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: brands } = useBrands();
  const { data: categories } = useCategories();

  useEffect(() => {
    if (locationParam) setSelectedLocation(locationParam);
  }, [locationParam]);

  const filteredProducts = (products || []).filter((product) => {
    if (selectedCategory && product.categorySlug !== selectedCategory) return false;
    if (selectedLocation) {
      const brandData = brands?.find((b) => b.slug === product.brandSlug);
      if (!brandData?.location?.toLowerCase().includes(selectedLocation.toLowerCase())) {
        return false;
      }
    }
    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      if (
        !product.name.toLowerCase().includes(lowerQ) &&
        !product.brandName.toLowerCase().includes(lowerQ) &&
        !product.category.toLowerCase().includes(lowerQ) &&
        !(product.brandLocation || "").toLowerCase().includes(lowerQ) &&
        !(product.description || "").toLowerCase().includes(lowerQ)
      ) {
        return false;
      }
    }
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
    setSelectedLocation(null);
  };

  const hasActiveFilters = selectedCategory || selectedLocation || searchQuery;

  const displayedCategories = showAllCategories
    ? categories
    : categories?.slice(0, INITIAL_SHOW_COUNT);

  const allLocations = BICOL_LOCATIONS.slice(1); // exclude "All Locations"
  const displayedLocations = showAllLocations
    ? allLocations
    : allLocations.slice(0, INITIAL_SHOW_COUNT);

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount);

  return (
    <PageLayout>
      {/* Header */}
      <section className="py-8 md:py-12 border-b-2 border-foreground">
        <div className="section-container">
          <nav className="text-[10px] md:text-sm mb-2 md:mb-4">
            <Link to="/" className="text-muted-foreground hover:text-foreground">
              Home
            </Link>
            <span className="mx-1.5 md:mx-2 text-muted-foreground">/</span>
            <span>All Products</span>
          </nav>
          <h1 className="font-heading text-2xl sm:text-4xl md:text-6xl uppercase">
            {searchQuery ? `Results for "${searchQuery}"` : "Shop All"}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">
            {sortedProducts.length} {sortedProducts.length === 1 ? "product" : "products"}
            {selectedLocation && ` in ${selectedLocation}`}
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
                  {(selectedCategory ? 1 : 0) + (selectedLocation ? 1 : 0)}
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
                    {displayedCategories?.map((cat) => (
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
                  {(categories?.length || 0) > INITIAL_SHOW_COUNT && (
                    <button
                      onClick={() => setShowAllCategories(!showAllCategories)}
                      className="text-xs text-muted-foreground hover:text-foreground mt-2 bg-transparent border-none p-0 cursor-pointer"
                    >
                      {showAllCategories ? "View less" : `View more (${(categories?.length || 0) - INITIAL_SHOW_COUNT})`}
                    </button>
                  )}
                </div>

                {/* Location */}
                <div>
                  <h3 className="font-heading uppercase text-sm tracking-wide mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Location
                  </h3>
                  <ul className="space-y-2">
                    <li>
                      <button
                        onClick={() => setSelectedLocation(null)}
                        className={`text-sm ${!selectedLocation ? "font-medium border-b-2 border-foreground" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        All Locations
                      </button>
                    </li>
                    {displayedLocations.map((loc) => (
                      <li key={loc}>
                        <button
                          onClick={() => setSelectedLocation(loc)}
                          className={`text-sm ${
                            selectedLocation === loc
                              ? "font-medium border-b-2 border-foreground"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {loc}
                        </button>
                      </li>
                    ))}
                  </ul>
                  {allLocations.length > INITIAL_SHOW_COUNT && (
                    <button
                      onClick={() => setShowAllLocations(!showAllLocations)}
                      className="text-xs text-muted-foreground hover:text-foreground mt-2 bg-transparent border-none p-0 cursor-pointer"
                    >
                      {showAllLocations ? "View less" : `View more (${allLocations.length - INITIAL_SHOW_COUNT})`}
                    </button>
                  )}
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
                        {displayedCategories?.map((cat) => (
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
                      {(categories?.length || 0) > INITIAL_SHOW_COUNT && (
                        <button
                          onClick={() => setShowAllCategories(!showAllCategories)}
                          className="text-xs text-muted-foreground hover:text-foreground mt-2 bg-transparent border-none p-0 cursor-pointer"
                        >
                          {showAllCategories ? "View less" : `View more (${(categories?.length || 0) - INITIAL_SHOW_COUNT})`}
                        </button>
                      )}
                    </div>

                    {/* Location */}
                    <div>
                      <h3 className="font-heading uppercase text-sm tracking-wide mb-4 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Location
                      </h3>
                      <ul className="space-y-3">
                        <li>
                          <button
                            onClick={() => setSelectedLocation(null)}
                            className={`text-sm ${!selectedLocation ? "font-medium" : "text-muted-foreground"}`}
                          >
                            All Locations
                          </button>
                        </li>
                        {displayedLocations.map((loc) => (
                          <li key={loc}>
                            <button
                              onClick={() => setSelectedLocation(loc)}
                              className={`text-sm ${
                                selectedLocation === loc ? "font-medium" : "text-muted-foreground"
                              }`}
                            >
                              {loc}
                            </button>
                          </li>
                        ))}
                      </ul>
                      {allLocations.length > INITIAL_SHOW_COUNT && (
                        <button
                          onClick={() => setShowAllLocations(!showAllLocations)}
                          className="text-xs text-muted-foreground hover:text-foreground mt-2 bg-transparent border-none p-0 cursor-pointer"
                        >
                          {showAllLocations ? "View less" : `View more (${allLocations.length - INITIAL_SHOW_COUNT})`}
                        </button>
                      )}
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
                  {selectedLocation && (
                    <span className="inline-flex items-center gap-1 px-2 md:px-3 py-1 bg-secondary text-xs md:text-sm border border-border-subtle">
                      <MapPin className="w-3 h-3" />
                      {selectedLocation}
                      <button onClick={() => setSelectedLocation(null)}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {/* Sort By */}
                  <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                    <span className="text-xs text-muted-foreground font-heading uppercase whitespace-nowrap">Sort by:</span>
                    <div className="relative flex-1 sm:flex-initial">
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

                  {/* View Toggle */}
                  <div className="flex border-2 border-foreground">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 transition-colors ${viewMode === "grid" ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-secondary"}`}
                      aria-label="Grid view"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 transition-colors border-l-2 border-foreground ${viewMode === "list" ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-secondary"}`}
                      aria-label="List view"
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
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
                viewMode === "grid" ? (
                  <div className="product-grid">
                    {sortedProducts.map((product) => (
                      <ProductCard key={product.id} {...product} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sortedProducts.map((product) => (
                      <Link
                        key={product.id}
                        to={`/products/${product.slug}`}
                        className="card-brutal flex gap-4 p-4 group hover:shadow-brutal-hover transition-shadow"
                      >
                        <div className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0 bg-muted overflow-hidden">
                          <img
                            src={product.image}
                            alt={product.name}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                            {product.brandName}
                          </p>
                          <h3 className="font-heading text-sm md:text-lg uppercase tracking-tight leading-tight mb-1 line-clamp-2">
                            {product.name}
                          </h3>
                          {product.category && (
                            <span className="text-xs text-muted-foreground">{product.category}</span>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {product.listingType === "teaser" ? (
                              <span className="font-heading text-sm md:text-base text-muted-foreground">Price TBA</span>
                            ) : (
                              <>
                                <span className="font-heading text-sm md:text-base">{formatPrice(product.price)}</span>
                                {product.originalPrice && product.originalPrice > product.price && (
                                  <span className="text-xs text-muted-foreground line-through">
                                    {formatPrice(product.originalPrice)}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                          {!product.inStock && product.listingType === "regular" && (
                            <span className="text-xs text-destructive mt-1 inline-block">Out of Stock</span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )
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
