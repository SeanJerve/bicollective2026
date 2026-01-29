import { useParams, Link } from "react-router-dom";
import { BadgeCheck, Minus, Plus, ShoppingBag, Star, ChevronRight } from "lucide-react";
import { useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import ProductCard from "@/components/marketplace/ProductCard";
import { getProductBySlug, getProductsByBrand } from "@/data/mockData";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";

const ProductDetail = () => {
  const { slug } = useParams();
  const product = getProductBySlug(slug || "");
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const { addToCart } = useCart();
  const { toast } = useToast();

  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];

  if (!product) {
    return (
      <PageLayout>
        <div className="section-container py-20 text-center">
          <h1 className="font-heading text-4xl uppercase mb-4">Product Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The product you're looking for doesn't exist.
          </p>
          <Link to="/products" className="btn-brutal">
            Browse Products
          </Link>
        </div>
      </PageLayout>
    );
  }

  const relatedProducts = getProductsByBrand(product.brandSlug)
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  return (
    <PageLayout>
      {/* Breadcrumb */}
      <nav className="section-container py-4 border-b border-border-subtle">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link to="/products" className="hover:text-foreground">Products</Link>
          <ChevronRight className="w-4 h-4" />
          <Link to={`/categories/${product.categorySlug}`} className="hover:text-foreground">
            {product.category}
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground">{product.name}</span>
        </div>
      </nav>

      {/* Product Section */}
      <section className="py-12">
        <div className="section-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Product Image */}
            <div className="card-brutal overflow-hidden">
              <div className="aspect-[3/4] bg-muted">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Product Info */}
            <div className="lg:py-8">
              {/* Brand */}
              <Link
                to={`/brands/${product.brandSlug}`}
                className="inline-flex items-center gap-2 mb-4 group"
              >
                <span className="text-sm uppercase tracking-wide text-muted-foreground group-hover:text-foreground transition-colors">
                  {product.brandName}
                </span>
                {product.isVerifiedBrand && (
                  <BadgeCheck className="w-4 h-4 text-success" />
                )}
              </Link>

              {/* Title */}
              <h1 className="font-heading text-4xl md:text-5xl uppercase leading-tight mb-4">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-6">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < 4 ? "fill-foreground" : "fill-muted stroke-muted-foreground"}`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">(24 reviews)</span>
              </div>

              {/* Price */}
              <div className="flex items-center gap-3 mb-8">
                <span className="font-heading text-3xl">{formatPrice(product.price)}</span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <>
                    <span className="text-xl text-muted-foreground line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                    <span className="badge-verified">
                      {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                    </span>
                  </>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  {product.description}
                </p>
              )}

              {/* Size Selection */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-heading uppercase text-sm">Select Size</span>
                  <button className="text-sm text-muted-foreground hover:text-foreground underline">
                    Size Guide
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-12 h-12 border-2 font-heading text-sm transition-colors ${
                        selectedSize === size
                          ? "border-foreground bg-foreground text-background"
                          : "border-border-subtle hover:border-foreground"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="mb-8">
                <span className="font-heading uppercase text-sm mb-3 block">Quantity</span>
                <div className="inline-flex items-center border-2 border-foreground">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 h-12 flex items-center justify-center hover:bg-secondary transition-colors"
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-16 h-12 flex items-center justify-center font-heading border-x-2 border-foreground">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-12 h-12 flex items-center justify-center hover:bg-secondary transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Add to Cart */}
              <div className="space-y-4">
                <button
                  onClick={() => {
                    if (!selectedSize) {
                      toast({
                        title: "Please select a size",
                        description: "Choose a size before adding to cart",
                        variant: "destructive",
                      });
                      return;
                    }
                    addToCart(product.id, quantity, selectedSize);
                  }}
                  className="btn-brutal w-full flex items-center justify-center gap-3"
                  disabled={!product.inStock}
                >
                  <ShoppingBag className="w-5 h-5" />
                  {product.inStock ? "Add to Cart" : "Out of Stock"}
                </button>
              </div>

              {/* Trust Badges */}
              <div className="mt-8 pt-8 border-t border-border-subtle">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <BadgeCheck className="w-5 h-5 text-success" />
                    <span>Buyer Protection</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🇵🇭</span>
                    <span>Ships from Bicol</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="py-16 border-t-2 border-foreground">
          <div className="section-container">
            <h2 className="font-heading text-3xl uppercase mb-8">
              More from {product.brandName}
            </h2>
            <div className="product-grid">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} {...p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </PageLayout>
  );
};

export default ProductDetail;
