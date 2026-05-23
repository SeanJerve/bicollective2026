import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

const Cart = () => {
  const { items, loading, updateQuantity, removeItem } = useCart();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect admin users who try to access cart
  useEffect(() => {
    if (isAdmin) {
      navigate("/admin");
    }
  }, [isAdmin, navigate]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount);

  // Group items by brand
  const groupedItems = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const brandId = item.variant?.product?.brand_id;
        if (!brandId || !item.variant?.product?.brand) return acc;
        if (!acc[brandId]) {
          acc[brandId] = { brand: item.variant.product.brand, items: [], subtotal: 0 };
        }
        acc[brandId].items.push(item);
        acc[brandId].subtotal += Number(item.variant.product.price || 0) * item.quantity;
        return acc;
      },
      {} as Record<
        string,
        { brand: { id: string; name: string; slug: string }; items: typeof items; subtotal: number }
      >
    );
  }, [items]);

  // Pre-select all items when they load, skipping out of stock items
  useEffect(() => {
    if (items.length > 0 && selectedIds.size === 0) {
      const inStockItems = items.filter((i) => (i.variant?.stock_quantity ?? 0) > 0);
      setSelectedIds(new Set(inStockItems.map((i) => i.id)));
    }
  }, [items]);

  const toggleItem = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item || (item.variant?.stock_quantity ?? 0) <= 0) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleBrandGroup = (brandId: string) => {
    const group = groupedItems[brandId];
    if (!group) return;
    const inStockGroupItemIds = group.items
      .filter((i) => (i.variant?.stock_quantity ?? 0) > 0)
      .map((i) => i.id);
    if (inStockGroupItemIds.length === 0) return;

    const allSelected = inStockGroupItemIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      inStockGroupItemIds.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
      return next;
    });
  };

  const toggleAll = () => {
    const inStockItems = items.filter((i) => (i.variant?.stock_quantity ?? 0) > 0);
    const allInStockSelected = inStockItems.length > 0 && inStockItems.every((i) => selectedIds.has(i.id));

    if (allInStockSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(inStockItems.map((i) => i.id)));
    }
  };

  const selectedItems = items.filter((i) => selectedIds.has(i.id));
  const selectedTotal = selectedItems.reduce(
    (sum, item) => sum + Number(item.variant?.product?.price || 0) * item.quantity,
    0
  );

  const handleCheckout = () => {
    if (selectedIds.size === 0) return;
    navigate("/checkout", { state: { selectedCartItemIds: Array.from(selectedIds) } });
  };

  if (!user) {
    return (
      <PageLayout>
        <section className="py-20">
          <div className="section-container text-center">
            <ShoppingBag className="w-16 h-16 mx-auto mb-6 text-muted-foreground" />
            <h1 className="font-heading text-4xl uppercase mb-4">Your Cart</h1>
            <p className="text-muted-foreground mb-8">Please sign in to view your cart</p>
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
            <p className="text-muted-foreground mb-8">Start shopping to add items to your cart</p>
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
              {/* Select All */}
              <div className="flex items-center gap-3 pb-4 border-b border-border-subtle">
                <Checkbox
                  checked={
                    items.length > 0 &&
                    items.filter((i) => (i.variant?.stock_quantity ?? 0) > 0).every((i) => selectedIds.has(i.id))
                  }
                  onCheckedChange={toggleAll}
                  disabled={items.filter((i) => (i.variant?.stock_quantity ?? 0) > 0).length === 0}
                />
                <span className="font-heading text-sm uppercase">
                  Select All ({selectedIds.size}/{items.filter((i) => (i.variant?.stock_quantity ?? 0) > 0).length} in stock)
                </span>
              </div>

              {Object.entries(groupedItems).map(([brandId, group]) => {
                const inStockGroupIds = group.items
                  .filter((i) => (i.variant?.stock_quantity ?? 0) > 0)
                  .map((i) => i.id);
                const allGroupSelected =
                  inStockGroupIds.length > 0 && inStockGroupIds.every((id) => selectedIds.has(id));
                const isGroupDisabled = inStockGroupIds.length === 0;
                return (
                  <div key={brandId} className="card-brutal p-6">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border-subtle">
                      <Checkbox
                        checked={allGroupSelected}
                        onCheckedChange={() => toggleBrandGroup(brandId)}
                        disabled={isGroupDisabled}
                      />
                      <Link
                        to={`/brands/${group.brand.slug}`}
                        className="font-heading text-lg uppercase hover:opacity-60"
                      >
                        {group.brand.name}
                      </Link>
                    </div>

                    <div className="space-y-6">
                      {group.items.map((item) => {
                        const isOutOfStock = (item.variant?.stock_quantity ?? 0) <= 0;
                        const isStockLow = !isOutOfStock && (item.variant?.stock_quantity ?? 0) < item.quantity;
                        return (
                          <div key={item.id} className={`flex gap-4 ${isOutOfStock ? "opacity-60" : ""}`}>
                            <div className="flex items-start pt-2">
                              <Checkbox
                                checked={selectedIds.has(item.id)}
                                onCheckedChange={() => toggleItem(item.id)}
                                disabled={isOutOfStock}
                              />
                            </div>
                            <div className="w-24 h-32 bg-muted flex-shrink-0 border border-border-subtle relative">
                              {item.variant?.product?.image_url && (
                                <img
                                  src={item.variant.product.image_url}
                                  alt={item.variant.product.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = "/placeholder.svg";
                                  }}
                                />
                              )}
                              {isOutOfStock && (
                                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                                  <span className="font-heading text-xs text-destructive border-2 border-destructive px-1.5 py-0.5 rotate-12">
                                    OUT OF STOCK
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <Link
                                to={`/products/${item.variant?.product?.slug}`}
                                className="font-heading uppercase hover:opacity-60"
                              >
                                {item.variant?.product?.name}
                              </Link>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                {item.variant?.size && (
                                  <p className="text-sm text-muted-foreground">
                                    Size: {item.variant.size}
                                  </p>
                                )}
                                <span className="text-xs font-bold text-muted-foreground border-l border-border-subtle pl-3">
                                  Stock: {item.variant?.stock_quantity ?? 0}
                                </span>
                                {isStockLow && (
                                  <span className="text-xs text-destructive font-bold bg-destructive/10 px-2 py-0.5">
                                    Only {item.variant?.stock_quantity} left
                                  </span>
                                )}
                              </div>
                              <p className="font-heading text-lg mt-2">
                                {formatPrice(Number(item.variant?.product?.price || 0))}
                              </p>
                              <div className="flex items-center gap-4 mt-4">
                                <div className="inline-flex items-center border-2 border-foreground">
                                  <button
                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                    className="w-8 h-8 flex items-center justify-center hover:bg-secondary"
                                    disabled={isOutOfStock}
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  <span className="w-10 h-8 flex items-center justify-center font-heading text-sm border-x-2 border-foreground">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() => {
                                      const stockQty = item.variant?.stock_quantity ?? 0;
                                      if (item.quantity >= stockQty) {
                                        toast({
                                          title: "Stock Limit Reached",
                                          description: `Only ${stockQty} items available in stock.`,
                                          variant: "destructive",
                                        });
                                        return;
                                      }
                                      updateQuantity(item.id, item.quantity + 1);
                                    }}
                                    className="w-8 h-8 flex items-center justify-center hover:bg-secondary"
                                    disabled={isOutOfStock || item.quantity >= (item.variant?.stock_quantity ?? 0)}
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
                                {formatPrice(Number(item.variant?.product?.price || 0) * item.quantity)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="card-brutal p-6 sticky top-24">
                <h2 className="font-heading text-xl uppercase mb-6">Order Summary</h2>
                <div className="space-y-4 pb-6 border-b border-border-subtle">
                  <p className="text-sm text-muted-foreground">
                    {selectedIds.size} of {items.length} items selected
                  </p>
                </div>
                <div className="py-6 border-b border-border-subtle">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPrice(selectedTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-muted-foreground">Calculated at checkout</span>
                  </div>
                </div>
                <div className="py-6">
                  <div className="flex justify-between">
                    <span className="font-heading uppercase">Total</span>
                    <span className="font-heading text-xl">{formatPrice(selectedTotal)}</span>
                  </div>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={selectedIds.size === 0}
                  className="btn-brutal w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Proceed to Checkout
                  <ArrowRight className="w-5 h-5" />
                </button>
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
