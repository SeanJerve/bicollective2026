import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import ProductCard from "@/components/marketplace/ProductCard";
import ProductCardSkeleton from "@/components/marketplace/ProductCardSkeleton";
import { useCategory, useProductsByCategory } from "@/hooks/useProducts";

const CategoryDetail = () => {
  const { slug } = useParams();
  const { data: category, isLoading: categoryLoading } = useCategory(slug || "");
  const { data: categoryProducts, isLoading: productsLoading } = useProductsByCategory(slug || "");
  const [sortBy, setSortBy] = useState("newest");

  const sortedProducts = [...(categoryProducts || [])].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      default:
        return 0;
    }
  });

  if (categoryLoading) {
    return (
      <PageLayout>
        <div className="section-container py-20">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 skeleton-brutal" />
            <div className="h-4 w-32 skeleton-brutal" />
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!category) {
    return (
      <PageLayout>
        <div className="section-container py-16 md:py-20 text-center">
          <h1 className="font-heading text-3xl md:text-4xl uppercase mb-4">Category Not Found</h1>
          <p className="text-muted-foreground mb-6 md:mb-8 text-sm md:text-base">
            The category you're looking for doesn't exist.
          </p>
          <Link to="/categories" className="btn-brutal">
            Browse Categories
          </Link>
        </div>
      </PageLayout>
    );
  }

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
            <Link to="/categories" className="text-muted-foreground hover:text-foreground">
              Categories
            </Link>
            <span className="mx-2 text-muted-foreground">/</span>
            <span>{category.name}</span>
          </nav>
          <h1 className="font-heading text-4xl md:text-6xl uppercase">{category.name}</h1>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">
            {sortedProducts.length} {sortedProducts.length === 1 ? "product" : "products"}
          </p>
        </div>
      </section>

      {/* Products */}
      <section className="py-8 md:py-12">
        <div className="section-container">
          {/* Sort Bar */}
          <div className="flex items-center justify-end mb-6 md:mb-8">
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
            <div className="text-center py-12 md:py-16 border-2 border-border-subtle">
              <h3 className="font-heading text-xl md:text-2xl uppercase mb-2">No Products Yet</h3>
              <p className="text-muted-foreground mb-6 text-sm md:text-base">
                No products in this category yet.
              </p>
              <Link to="/products" className="btn-brutal-secondary">
                Browse All Products
              </Link>
            </div>
          )}
        </div>
      </section>
    </PageLayout>
  );
};

export default CategoryDetail;
