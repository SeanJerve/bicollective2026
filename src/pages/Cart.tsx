import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";

const Cart = () => {
  const { items, loading, total, updateQuantity, removeItem } = useCart();
  const { user } = useAuth();

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  // Group items by brand
  const groupedItems = items.reduce((acc, item) => {
    const brandId = item.product.brand_id;
    if (!acc[brandId]) {
      acc[brandId] = {
        brand: item.product.brand,
        items: [],
        subtotal: 0,
      };
    }
    acc[brandId].items.push(item);
    acc[brandId].subtotal += Number(item.product.price) * item.quantity;
    return acc;
  }, {} as Record<string, { brand: { id: string; name: string; slug: string }; items: typeof items; subtotal: number }>);

  if (!user) {
    return (
      <PageLayout>
        <section className="py-20">
          <div className="section-container text-center">
            <ShoppingBag className="w-16 h-16 mx-auto mb-6 text-muted-foreground" />
            <h1 className="font-heading text-4xl uppercase mb-4">Your Cart</h1>
            <p className="text-muted-foreground mb-8">
              Please sign in to view your cart
            </p>
            <Link to="/login" className="btn-brutal">
              Sign In
            </Link>
          </div>
        </section>
      </PageLayout>
    );
  }

  if (loading) {
    return (
      <PageLayout>
        <section className="py-12">
          <div className="section-container">
            <div className="animate-pulse space-y-6">
              <div className="h-8 w-48 skeleton-brutal" />
              <div className="h-40 skeleton-brutal" />
              <div className="h-40 skeleton-brutal" />
            </div>
          </div>
        </section>
      </PageLayout>
    );
  }

  if (items.length === 0) {
    return (
      <PageLayout>
        <section className="py-20">
          <div className="section-container text-center">
            <ShoppingBag className="w-16 h-16 mx-auto mb-6 text-muted-foreground" />
            <h1 className="font-heading text-4xl uppercase mb-4">Your Cart is Empty</h1>
            <p className="text-muted-foreground mb-8">
              Start shopping to add items to your cart
            </p>
            <Link to="/products" className="btn-brutal">
              Browse Products
            </Link>
          </div>
        </section>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <section className="py-12 border-b-2 border-foreground">
        <div className="section-container">
          <h1 className="font-heading text-5xl md:text-6xl uppercase">Your Cart</h1>
          <p className="text-muted-foreground mt-2">
            {items.length} {items.length === 1 ? "item" : "items"}
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="section-container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-8">
              {Object.entries(groupedItems).map(([brandId, group]) => (
                <div key={brandId} className="card-brutal p-6">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-border-subtle">
                    <Link
                      to={`/brands/${group.brand.slug}`}
                      className="font-heading text-lg uppercase hover:opacity-60"
                    >
                      {group.brand.name}
                    </Link>
                    <span className="text-sm text-muted-foreground">
                      Subtotal: {formatPrice(group.subtotal)}
                    </span>
                  </div>

                  <div className="space-y-6">
                    {group.items.map((item) => (
                      <div key={item.id} className="flex gap-4">
                        <div className="w-24 h-32 bg-muted flex-shrink-0 border border-border-subtle">
                          {item.product.image_url && (
                            <img
                              src={item.product.image_url}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>

                        <div className="flex-1">
                          <Link
                            to={`/products/${item.product.slug}`}
                            className="font-heading uppercase hover:opacity-60"
                          >
                            {item.product.name}
                          </Link>
                          {item.size && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Size: {item.size}
                            </p>
                          )}
                          <p className="font-heading text-lg mt-2">
                            {formatPrice(Number(item.product.price))}
                          </p>

                          <div className="flex items-center gap-4 mt-4">
                            <div className="inline-flex items-center border-2 border-foreground">
                              <button
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity - 1)
                                }
                                className="w-8 h-8 flex items-center justify-center hover:bg-secondary"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-10 h-8 flex items-center justify-center font-heading text-sm border-x-2 border-foreground">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity + 1)
                                }
                                className="w-8 h-8 flex items-center justify-center hover:bg-secondary"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>

                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-heading">
                            {formatPrice(
                              Number(item.product.price) * item.quantity
                            )}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="card-brutal p-6 sticky top-24">
                <h2 className="font-heading text-xl uppercase mb-6">
                  Order Summary
                </h2>

                <div className="space-y-4 pb-6 border-b border-border-subtle">
                  {Object.entries(groupedItems).map(([brandId, group]) => (
                    <div key={brandId} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {group.brand.name}
                      </span>
                      <span>{formatPrice(group.subtotal)}</span>
                    </div>
                  ))}
                </div>

                <div className="py-6 border-b border-border-subtle">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-muted-foreground">
                      Calculated at checkout
                    </span>
                  </div>
                </div>

                <div className="py-6">
                  <div className="flex justify-between">
                    <span className="font-heading uppercase">Total</span>
                    <span className="font-heading text-xl">
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>

                <Link
                  to="/checkout"
                  className="btn-brutal w-full flex items-center justify-center gap-2"
                >
                  Proceed to Checkout
                  <ArrowRight className="w-5 h-5" />
                </Link>

                <Link
                  to="/products"
                  className="block text-center text-sm text-muted-foreground hover:text-foreground mt-4"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Cart;
