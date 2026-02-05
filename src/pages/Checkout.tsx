import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, MapPin } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import ShippingCalculator, { calculateShippingFee, BICOL_PROVINCES } from "@/components/checkout/ShippingCalculator";
import VoucherSelector from "@/components/checkout/VoucherSelector";
import PromoCodeInput from "@/components/checkout/PromoCodeInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Checkout = () => {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  // Promo and voucher state
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [buyerLocation, setBuyerLocation] = useState<string>("Albay");

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
    notes: "",
  });

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

  // Calculate shipping for each brand
  const shippingByBrand = useMemo(() => {
    const fees: Record<string, { original: number; final: number }> = {};
    Object.entries(groupedItems).forEach(([brandId, group]) => {
      const sellerLocation = (group.brand as any).location || "Albay";
      const itemCount = group.items.reduce((sum, item) => sum + item.quantity, 0);
      const original = calculateShippingFee(sellerLocation, buyerLocation, itemCount);
      const hasFreeShipping = 
        (selectedVoucher?.type === "free_shipping") ||
        (appliedPromo?.type === "free_shipping");
      const final = hasFreeShipping ? Math.max(0, original - 50) : original;
      fees[brandId] = { original, final };
    });
    return fees;
  }, [groupedItems, buyerLocation, selectedVoucher, appliedPromo]);

  const totalShipping = useMemo(() => 
    Object.values(shippingByBrand).reduce((sum, fee) => sum + fee.final, 0)
  , [shippingByBrand]);

  // Calculate discount
  const discount = useMemo(() => {
    const activeDiscount = selectedVoucher || appliedPromo;
    if (!activeDiscount || activeDiscount.type === "free_shipping") return 0;

    let discountAmount = 0;
    if (activeDiscount.type === "percentage_discount") {
      discountAmount = (total * activeDiscount.discount_value) / 100;
      if (activeDiscount.max_discount_amount) {
        discountAmount = Math.min(discountAmount, activeDiscount.max_discount_amount);
      }
    } else if (activeDiscount.type === "fixed_discount") {
      discountAmount = activeDiscount.discount_value;
    }
    return Math.min(discountAmount, total);
  }, [selectedVoucher, appliedPromo, total]);

  const grandTotal = useMemo(() => 
    Math.max(0, total + totalShipping - discount)
  , [total, totalShipping, discount]);

  // Handle voucher/promo selection
  const handleVoucherSelect = (voucher: any) => {
    setSelectedVoucher(voucher);
    if (voucher) {
      setAppliedPromo(null);
    }
  };

  const handlePromoApply = (promo: any) => {
    setAppliedPromo(promo);
    if (promo) {
      setSelectedVoucher(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to place an order",
        variant: "destructive",
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Add items to your cart before checkout",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Create the main order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_id: user.id,
          total_amount: grandTotal,
          total_shipping: totalShipping,
          total_discount: discount,
          shipping_name: formData.fullName,
          shipping_phone: formData.phone,
          shipping_address: formData.address,
          notes: formData.notes || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create vendor orders and order items for each brand
      for (const [brandId, group] of Object.entries(groupedItems)) {
        const shippingFee = shippingByBrand[brandId]?.final || 0;
        const hasFreeShipping = (selectedVoucher?.type === "free_shipping") || 
          (appliedPromo?.type === "free_shipping");

        const { data: vendorOrder, error: vendorOrderError } = await supabase
          .from("vendor_orders")
          .insert({
            order_id: order.id,
            brand_id: brandId,
            subtotal: group.subtotal,
            shipping_fee: shippingFee,
            shipping_fee_original: shippingByBrand[brandId]?.original || 0,
            free_shipping_applied: hasFreeShipping,
            voucher_id: selectedVoucher?.id || null,
            promo_code_applied: appliedPromo?.code || null,
            status: "pending_payment",
          })
          .select()
          .single();

        if (vendorOrderError) throw vendorOrderError;

        // Create order items
        const orderItems = group.items.map((item) => ({
          vendor_order_id: vendorOrder.id,
          product_id: item.product_id,
          product_name: item.product.name,
          product_price: Number(item.product.price),
          quantity: item.quantity,
          size: item.size,
        }));

        const { error: itemsError } = await supabase
          .from("order_items")
          .insert(orderItems);

        if (itemsError) throw itemsError;
      }

      // Mark voucher as used
      if (selectedVoucher) {
        await supabase
          .from("vouchers")
          .update({
            status: "used",
            used_at: new Date().toISOString(),
            used_on_order_id: order.id,
          })
          .eq("id", selectedVoucher.id);
      }

      // Clear cart
      await clearCart();

      setOrderId(order.id);
      setOrderComplete(true);
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({
        title: "Checkout failed",
        description: error.message || "Failed to place order",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  if (orderComplete && orderId) {
    return (
      <PageLayout>
        <section className="py-20">
          <div className="section-container max-w-lg text-center">
            <CheckCircle className="w-20 h-20 mx-auto mb-6 text-success" />
            <h1 className="font-heading text-4xl uppercase mb-4">Order Placed!</h1>
            <p className="text-muted-foreground mb-8">
              Your order has been placed successfully. Please upload your payment
              proof to complete the transaction.
            </p>
            <div className="card-brutal p-6 mb-8 text-left">
              <p className="text-sm text-muted-foreground mb-2">Order ID</p>
              <p className="font-heading uppercase text-lg break-all">{orderId}</p>
            </div>
            <div className="space-y-4">
              <button
                onClick={() => navigate("/account/orders")}
                className="btn-brutal w-full"
              >
                View My Orders
              </button>
              <button
                onClick={() => navigate("/products")}
                className="btn-brutal-secondary w-full"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </section>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <section className="py-12 border-b-2 border-foreground">
        <div className="section-container">
          <h1 className="font-heading text-5xl md:text-6xl uppercase">Checkout</h1>
        </div>
      </section>

      <section className="py-12">
        <div className="section-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Shipping Form */}
            <div>
              <h2 className="font-heading text-2xl uppercase mb-6">
                Shipping Information
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="font-heading text-sm uppercase tracking-wide mb-2 block">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    className="input-brutal"
                    placeholder="Juan Dela Cruz"
                    required
                  />
                </div>

                <div>
                  <label className="font-heading text-sm uppercase tracking-wide mb-2 block">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="input-brutal"
                    placeholder="+63 9XX XXX XXXX"
                    required
                  />
                </div>

                <div>
                  <label className="font-heading text-sm uppercase tracking-wide mb-2 block">
                    Shipping Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                  className="input-brutal min-h-[80px]"
                  placeholder="Street, Barangay, City"
                    required
                  />
                </div>

              <div>
                <label className="font-heading text-sm uppercase tracking-wide mb-2 block">
                  Province (for shipping calculation)
                </label>
                <Select value={buyerLocation} onValueChange={setBuyerLocation}>
                  <SelectTrigger className="input-brutal">
                    <SelectValue placeholder="Select province" />
                  </SelectTrigger>
                  <SelectContent>
                    {BICOL_PROVINCES.map((province) => (
                      <SelectItem key={province} value={province}>
                        {province}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

                <div>
                  <label className="font-heading text-sm uppercase tracking-wide mb-2 block">
                    Order Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    className="input-brutal min-h-[80px]"
                    placeholder="Any special instructions..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || items.length === 0}
                  className="btn-brutal w-full"
                >
                  {loading ? "Placing Order..." : "Place Order"}
                </button>
              </form>
            </div>

            {/* Order Summary */}
            <div>
              <h2 className="font-heading text-2xl uppercase mb-6">
                Order Summary
              </h2>
              <div className="card-brutal p-6">
                {Object.entries(groupedItems).map(([brandId, group]) => (
                  <div
                    key={brandId}
                    className="pb-6 mb-6 border-b border-border-subtle last:border-0 last:pb-0 last:mb-0"
                  >
                    <h3 className="font-heading uppercase mb-4">{group.brand.name}</h3>
                    <div className="space-y-4">
                      {group.items.map((item) => (
                        <div key={item.id} className="flex gap-4">
                          <div className="w-14 h-18 bg-muted flex-shrink-0">
                            {item.product.image_url && (
                              <img
                                src={item.product.image_url}
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{item.product.name}</p>
                            {item.size && (
                              <p className="text-xs text-muted-foreground">
                                Size: {item.size}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Qty: {item.quantity}
                            </p>
                          </div>
                          <div className="text-sm">
                            {formatPrice(Number(item.product.price) * item.quantity)}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between mt-3 pt-3 border-t border-border-subtle text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatPrice(group.subtotal)}</span>
                    </div>
                    <div className="mt-2">
                      <ShippingCalculator
                        sellerLocation={(group.brand as any).location || "Albay"}
                        buyerLocation={buyerLocation}
                        itemCount={group.items.reduce((sum, i) => sum + i.quantity, 0)}
                        hasFreeShipping={
                          selectedVoucher?.type === "free_shipping" ||
                          appliedPromo?.type === "free_shipping"
                        }
                      />
                    </div>
                  </div>
                ))}

                {/* Voucher & Promo Section */}
                <div className="pt-4 border-t-2 border-foreground space-y-4">
                  <div>
                    <label className="font-heading text-xs uppercase tracking-wide mb-2 block">
                      Your Vouchers
                    </label>
                    <VoucherSelector
                      onSelect={handleVoucherSelect}
                      selectedVoucherId={selectedVoucher?.id || null}
                      orderTotal={total}
                    />
                  </div>

                  {!selectedVoucher && (
                    <div>
                      <label className="font-heading text-xs uppercase tracking-wide mb-2 block">
                        Promo Code
                      </label>
                      <PromoCodeInput
                        onApply={handlePromoApply}
                        appliedCode={appliedPromo?.code || null}
                        orderTotal={total}
                      />
                    </div>
                  )}
                </div>

                {/* Totals */}
                <div className="pt-4 border-t-2 border-foreground space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{formatPrice(totalShipping)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-success">
                      <span>Discount</span>
                      <span>-{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-border-subtle">
                    <span className="font-heading uppercase">Grand Total</span>
                    <span className="font-heading text-2xl">
                      {formatPrice(grandTotal)}
                    </span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-secondary">
                  <h4 className="font-heading text-sm uppercase mb-2">
                    Payment Instructions
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    After placing your order, you'll need to upload proof of payment
                    (GCash or Bank Transfer) from your order history page.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Checkout;
