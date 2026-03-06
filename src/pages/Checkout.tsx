import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle, Ticket, ChevronDown, ChevronUp, MapPin } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import ShippingCalculator, { calculateShippingFee, BICOL_PROVINCES } from "@/components/checkout/ShippingCalculator";
import PromoCodeInput from "@/components/checkout/PromoCodeInput";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface BuyNowItem {
  product_id: string;
  quantity: number;
  size: string;
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string;
    brand_id: string;
    brand: {
      id: string;
      name: string;
      slug: string;
      location?: string;
    };
  };
}

type GroupedItems = Record<string, { brand: { id: string; name: string; slug: string; location?: string }; items: any[]; subtotal: number }>;

const Checkout = () => {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  // Buy Now mode
  const buyNowItem: BuyNowItem | null = location.state?.buyNowItem || null;
  const isBuyNow = !!buyNowItem;

  // Selective cart checkout
  const selectedCartItemIds: string[] | null = location.state?.selectedCartItemIds || null;

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "gcash" | "bank_transfer">("cod");
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);

  // Address state
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");

  // Discount state
  const [selectedVouchers, setSelectedVouchers] = useState<any[]>([]);
  const [shippingVoucher, setShippingVoucher] = useState<any>(null);
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [showVouchers, setShowVouchers] = useState(false);
  const [notes, setNotes] = useState("");

  // Fetch user addresses
  const { data: addresses, isLoading: addressesLoading } = useQuery({
    queryKey: ["user-addresses", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user!.id)
        .order("is_default", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Redirect to add address if none exist
  useEffect(() => {
    if (!addressesLoading && addresses && addresses.length === 0 && user) {
      navigate("/account/add-address?returnTo=/checkout", { replace: true });
    }
  }, [addresses, addressesLoading, user, navigate]);

  // Set default address on load
  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find((a) => a.is_default) || addresses[0];
      setSelectedAddressId(defaultAddr.id);
    }
  }, [addresses, selectedAddressId]);

  const selectedAddress = addresses?.find((a) => a.id === selectedAddressId);
  const buyerLocation = selectedAddress?.province || "Albay";

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount);

  // Build checkout items
  const checkoutItems = useMemo(() => {
    if (isBuyNow && buyNowItem) {
      return [{
        id: "buy-now",
        product_id: buyNowItem.product_id,
        quantity: buyNowItem.quantity,
        size: buyNowItem.size,
        product: {
          ...buyNowItem.product,
          slug: "",
        },
      }] as any[];
    }
    // If selectedCartItemIds provided, filter cart items
    if (selectedCartItemIds && selectedCartItemIds.length > 0) {
      return items.filter((item) => selectedCartItemIds.includes(item.id));
    }
    return items;
  }, [isBuyNow, buyNowItem, items, selectedCartItemIds]);

  const productSubtotal = useMemo(() => {
    return checkoutItems.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
  }, [checkoutItems]);

  // Group items by brand
  const groupedItems: GroupedItems = useMemo(() => {
    return checkoutItems.reduce((acc: GroupedItems, item: any) => {
      const brandId = item.product.brand_id;
      if (!acc[brandId]) {
        acc[brandId] = { brand: item.product.brand, items: [], subtotal: 0 };
      }
      acc[brandId].items.push(item);
      acc[brandId].subtotal += Number(item.product.price) * item.quantity;
      return acc;
    }, {} as GroupedItems);
  }, [checkoutItems]);

  // Fetch active auto-apply promos
  const { data: autoPromos } = useQuery({
    queryKey: ["auto-apply-promos"],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from("promotions")
        .select("*")
        .eq("is_active", true)
        .lte("starts_at", now)
        .gte("ends_at", now)
        .in("deployment_target", ["auto_apply"])
        .in("scope", ["platform", "location"]);
      return data || [];
    },
  });

  // Fetch user vouchers
  const { data: userVouchers } = useQuery({
    queryKey: ["checkout-vouchers", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("vouchers")
        .select("*")
        .eq("user_id", user!.id)
        .eq("status", "active")
        .gte("expires_at", new Date().toISOString())
        .order("discount_value", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  // Promo discount
  const promoDiscount = useMemo(() => {
    let discount = 0;
    if (appliedPromo && appliedPromo.type !== "free_shipping") {
      if (appliedPromo.type === "percentage_discount") {
        let d = (productSubtotal * appliedPromo.discount_value) / 100;
        if (appliedPromo.max_discount_amount) d = Math.min(d, appliedPromo.max_discount_amount);
        discount += d;
      } else if (appliedPromo.type === "fixed_discount") {
        discount += appliedPromo.discount_value;
      }
    }
    autoPromos?.forEach((promo) => {
      if (promo.type === "free_shipping") return;
      if (promo.scope === "location" && promo.target_locations && !promo.target_locations.includes(buyerLocation)) return;
      if (promo.min_order_amount && productSubtotal < Number(promo.min_order_amount)) return;
      if (promo.type === "percentage_discount") {
        let d = (productSubtotal * Number(promo.discount_value)) / 100;
        if (promo.max_discount_amount) d = Math.min(d, Number(promo.max_discount_amount));
        discount += d;
      } else if (promo.type === "fixed_discount") {
        discount += Number(promo.discount_value);
      }
    });
    return Math.min(discount, productSubtotal);
  }, [appliedPromo, autoPromos, productSubtotal, buyerLocation]);

  const discountedSubtotal = Math.max(0, productSubtotal - promoDiscount);

  // Shipping
  const shippingByBrand = useMemo(() => {
    const fees: Record<string, { original: number; final: number }> = {};
    Object.entries(groupedItems).forEach(([brandId, group]) => {
      const sellerLocation = group.brand?.location || "Albay";
      const itemCount = group.items.reduce((sum, item) => sum + item.quantity, 0);
      const original = calculateShippingFee(sellerLocation, buyerLocation, itemCount);
      fees[brandId] = { original, final: original };
    });
    return fees;
  }, [groupedItems, buyerLocation]);

  const totalShippingOriginal = useMemo(() =>
    Object.values(shippingByBrand).reduce((sum, fee) => sum + fee.original, 0)
  , [shippingByBrand]);

  // Voucher deductions
  const pesoVoucherDeduction = useMemo(() => {
    return selectedVouchers.reduce((sum, v) => {
      if (v.type === "percentage_discount") {
        let d = (discountedSubtotal * Number(v.discount_value)) / 100;
        if (v.max_discount_amount) d = Math.min(d, Number(v.max_discount_amount));
        return sum + d;
      }
      return sum + Number(v.discount_value);
    }, 0);
  }, [selectedVouchers, discountedSubtotal]);

  const shippingVoucherDeduction = useMemo(() => {
    if (!shippingVoucher) return 0;
    const deduction = Number(shippingVoucher.discount_value) || 50;
    return Math.min(deduction, totalShippingOriginal);
  }, [shippingVoucher, totalShippingOriginal]);

  const finalShipping = Math.max(0, totalShippingOriginal - shippingVoucherDeduction);

  const promoFreeShipping = useMemo(() => {
    if (appliedPromo?.type === "free_shipping") return Math.min(50, totalShippingOriginal);
    const autoFreeShip = autoPromos?.find((p) => p.type === "free_shipping" && p.is_active);
    if (autoFreeShip) return Math.min(Number(autoFreeShip.discount_value) || 50, totalShippingOriginal);
    return 0;
  }, [appliedPromo, autoPromos, totalShippingOriginal]);

  const effectiveShipping = Math.max(0, finalShipping - promoFreeShipping);

  const grandTotal = useMemo(() => {
    return Math.max(0, discountedSubtotal + effectiveShipping - pesoVoucherDeduction);
  }, [discountedSubtotal, effectiveShipping, pesoVoucherDeduction]);

  const pesoVouchers = userVouchers?.filter((v) => v.type !== "free_shipping") || [];
  const shippingVouchers = userVouchers?.filter((v) => v.type === "free_shipping") || [];

  const togglePesoVoucher = (voucher: any) => {
    const exists = selectedVouchers.find((v) => v.id === voucher.id);
    if (exists) {
      setSelectedVouchers(selectedVouchers.filter((v) => v.id !== voucher.id));
    } else {
      if (voucher.min_order_amount && productSubtotal < Number(voucher.min_order_amount)) {
        toast({ title: "Minimum not met", description: `Min order ₱${Number(voucher.min_order_amount).toLocaleString()} required`, variant: "destructive" });
        return;
      }
      setSelectedVouchers([...selectedVouchers, voucher]);
    }
  };

  const toggleShippingVoucher = (voucher: any) => {
    if (shippingVoucher?.id === voucher.id) {
      setShippingVoucher(null);
    } else {
      setShippingVoucher(voucher);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast({ title: "Please sign in", variant: "destructive" }); return; }
    if (checkoutItems.length === 0) { toast({ title: "No items to checkout", variant: "destructive" }); return; }
    if (!selectedAddress) { toast({ title: "Please select an address", variant: "destructive" }); return; }

    setLoading(true);
    try {
      const shippingAddressStr = `${selectedAddress.street}, ${selectedAddress.barangay}, ${selectedAddress.city}, ${selectedAddress.province} ${selectedAddress.zip_code}`;

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_id: user.id,
          total_amount: grandTotal,
          total_shipping: effectiveShipping,
          total_discount: promoDiscount + pesoVoucherDeduction + shippingVoucherDeduction + promoFreeShipping,
          shipping_name: selectedAddress.full_name,
          shipping_phone: selectedAddress.phone,
          shipping_address: shippingAddressStr,
          notes: notes || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      for (const [brandId, group] of Object.entries(groupedItems)) {
        const brandShipping = shippingByBrand[brandId]?.original || 0;
        const brandShippingAfterVoucher = shippingVoucher
          ? Math.max(0, brandShipping - Math.round(shippingVoucherDeduction * brandShipping / totalShippingOriginal))
          : brandShipping;
        const brandShippingFinal = promoFreeShipping > 0
          ? Math.max(0, brandShippingAfterVoucher - Math.round(promoFreeShipping * brandShipping / totalShippingOriginal))
          : brandShippingAfterVoucher;

        const { data: vendorOrder, error: vendorOrderError } = await supabase
          .from("vendor_orders")
          .insert({
            order_id: order.id,
            brand_id: brandId,
            subtotal: group.subtotal,
            shipping_fee: brandShippingFinal,
            shipping_fee_original: brandShipping,
            free_shipping_applied: shippingVoucherDeduction > 0 || promoFreeShipping > 0,
            discount_amount: Math.round(promoDiscount * group.subtotal / productSubtotal),
            voucher_id: selectedVouchers.length > 0 ? selectedVouchers[0].id : null,
            promo_code_applied: appliedPromo?.code || null,
            status: "pending_payment",
          })
          .select()
          .single();

        if (vendorOrderError) throw vendorOrderError;

        const orderItems = group.items.map((item) => ({
          vendor_order_id: vendorOrder.id,
          product_id: item.product_id,
          product_name: item.product.name,
          product_price: Number(item.product.price),
          quantity: item.quantity,
          size: item.size,
        }));

        const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
        if (itemsError) throw itemsError;
      }

      // Mark vouchers as used
      const allUsedVouchers = [...selectedVouchers, ...(shippingVoucher ? [shippingVoucher] : [])];
      for (const v of allUsedVouchers) {
        await supabase.from("vouchers").update({
          status: "used", used_at: new Date().toISOString(), used_on_order_id: order.id,
        }).eq("id", v.id);
      }

      if (appliedPromo?.id) {
        try {
          await supabase
            .from("promotions")
            .update({ current_uses: (appliedPromo.current_uses || 0) + 1 })
            .eq("id", appliedPromo.id);
        } catch {}
      }

      // Only clear cart if NOT buy now mode
      if (!isBuyNow) {
        await clearCart();
      }
      setOrderId(order.id);
      setOrderComplete(true);
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({ title: "Checkout failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!user) { navigate("/login"); return null; }

  if (orderComplete && orderId) {
    return (
      <PageLayout>
        <section className="py-20">
          <div className="section-container max-w-lg text-center">
            <CheckCircle className="w-20 h-20 mx-auto mb-6 text-success" />
            <h1 className="font-heading text-4xl uppercase mb-4">Order Placed!</h1>
            <p className="text-muted-foreground mb-8">Your order has been placed. Upload payment proof from your order history.</p>
            <div className="card-brutal p-6 mb-8 text-left">
              <p className="text-sm text-muted-foreground mb-2">Order ID</p>
              <p className="font-heading uppercase text-lg break-all">{orderId}</p>
            </div>
            <div className="space-y-4">
              <button onClick={() => navigate("/account/orders")} className="btn-brutal w-full">View My Orders</button>
              {isBuyNow ? (
                <button onClick={() => navigate(-1)} className="btn-brutal-secondary w-full">Back to Product</button>
              ) : (
                <button onClick={() => navigate("/products")} className="btn-brutal-secondary w-full">Continue Shopping</button>
              )}
            </div>
          </div>
        </section>
      </PageLayout>
    );
  }

  if (addressesLoading) {
    return (
      <PageLayout>
        <div className="section-container py-20 text-center">
          <div className="skeleton-brutal h-8 w-48 mx-auto mb-4" />
          <div className="skeleton-brutal h-4 w-64 mx-auto" />
        </div>
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
            {/* Shipping Address & Notes */}
            <div>
              <h2 className="font-heading text-2xl uppercase mb-6">Delivery Address</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Address Selector */}
                <div className="card-brutal p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      <span className="font-heading text-sm uppercase">Select Address</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate("/account/add-address?returnTo=/checkout")}
                      className="text-xs underline hover:text-foreground text-muted-foreground"
                    >
                      + Add New
                    </button>
                  </div>

                  {addresses && addresses.length > 0 ? (
                    <div className="space-y-2">
                      {addresses.map((addr) => (
                        <label
                          key={addr.id}
                          className={`block p-3 border-2 cursor-pointer transition-colors ${
                            selectedAddressId === addr.id
                              ? "border-foreground bg-secondary/50"
                              : "border-border-subtle hover:border-foreground/50"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              name="address"
                              checked={selectedAddressId === addr.id}
                              onChange={() => setSelectedAddressId(addr.id)}
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-heading text-sm">{addr.full_name}</span>
                                {addr.is_default && (
                                  <span className="text-xs bg-foreground text-background px-2 py-0.5">DEFAULT</span>
                                )}
                                <span className="text-xs text-muted-foreground">({addr.label})</span>
                              </div>
                              <p className="text-xs text-muted-foreground">{addr.phone}</p>
                              <p className="text-xs text-muted-foreground">
                                {addr.street}, {addr.barangay}, {addr.city}, {addr.province} {addr.zip_code}
                              </p>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No addresses found.</p>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="font-heading text-sm uppercase tracking-wide mb-2 block">Order Notes (Optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="input-brutal min-h-[80px]"
                    placeholder="Any special instructions..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || checkoutItems.length === 0 || !selectedAddress}
                  className="btn-brutal w-full"
                >
                  {loading ? "Placing Order..." : "Place Order"}
                </button>
              </form>
            </div>

            {/* Order Summary */}
            <div>
              <h2 className="font-heading text-2xl uppercase mb-6">Order Summary</h2>
              <div className="card-brutal p-6">
                {/* Items by brand */}
                {Object.entries(groupedItems).map(([brandId, group]) => (
                  <div key={brandId} className="pb-6 mb-6 border-b border-border-subtle last:border-0 last:pb-0 last:mb-0">
                    <h3 className="font-heading uppercase mb-4">{group.brand?.name || "Unknown Brand"}</h3>
                    <div className="space-y-3">
                      {group.items.map((item) => (
                        <div key={item.id} className="flex gap-4">
                          <div className="w-14 h-18 bg-muted flex-shrink-0">
                            {(item.product as any).image_url && <img src={(item.product as any).image_url} alt={item.product.name} className="w-full h-full object-cover" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{item.product.name}</p>
                            {item.size && <p className="text-xs text-muted-foreground">Size: {item.size}</p>}
                            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                          <div className="text-sm">{formatPrice(Number(item.product.price) * item.quantity)}</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between mt-3 pt-3 border-t border-border-subtle text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatPrice(group.subtotal)}</span>
                    </div>
                    <div className="mt-2">
                      <ShippingCalculator
                        sellerLocation={group.brand?.location || "Albay"}
                        buyerLocation={buyerLocation}
                        itemCount={group.items.reduce((sum, i) => sum + i.quantity, 0)}
                        hasFreeShipping={!!shippingVoucher || appliedPromo?.type === "free_shipping"}
                      />
                    </div>
                  </div>
                ))}

                {/* Promo Code */}
                <div className="pt-4 border-t-2 border-foreground space-y-4">
                  <div>
                    <label className="font-heading text-xs uppercase tracking-wide mb-2 block">Promo Code</label>
                    <PromoCodeInput
                      onApply={(promo: any) => setAppliedPromo(promo)}
                      appliedCode={appliedPromo?.code || null}
                      orderTotal={productSubtotal}
                    />
                  </div>

                  {/* Vouchers */}
                  <div>
                    <button
                      onClick={() => setShowVouchers(!showVouchers)}
                      className="w-full flex items-center justify-between p-3 border-2 border-foreground hover:bg-secondary/50 transition-colors"
                    >
                      <span className="flex items-center gap-2 text-sm">
                        <Ticket className="w-4 h-4" />
                        My Vouchers
                        {(selectedVouchers.length > 0 || shippingVoucher) && (
                          <span className="bg-success text-success-foreground px-2 py-0.5 text-xs">
                            {selectedVouchers.length + (shippingVoucher ? 1 : 0)} applied
                          </span>
                        )}
                      </span>
                      {showVouchers ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {showVouchers && (
                      <div className="border-2 border-t-0 border-foreground max-h-64 overflow-y-auto">
                        {pesoVouchers.length > 0 && (
                          <div>
                            <div className="px-3 py-2 bg-muted text-xs font-heading uppercase">Discount Vouchers (stackable)</div>
                            {pesoVouchers.map((v) => {
                              const isSelected = selectedVouchers.some((sv) => sv.id === v.id);
                              const meetsMin = !v.min_order_amount || productSubtotal >= Number(v.min_order_amount);
                              return (
                                <button
                                  key={v.id}
                                  onClick={() => meetsMin && togglePesoVoucher(v)}
                                  disabled={!meetsMin}
                                  className={`w-full p-3 text-left border-t border-border-subtle transition-colors ${isSelected ? "bg-success/10" : "hover:bg-secondary/50"} ${!meetsMin ? "opacity-40" : ""}`}
                                >
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <span className="font-heading text-sm">
                                        {v.type === "percentage_discount" ? `${v.discount_value}% OFF` : formatPrice(Number(v.discount_value))}
                                      </span>
                                      <p className="text-xs text-muted-foreground">{v.name}</p>
                                      {!meetsMin && <p className="text-xs text-destructive">Min: {formatPrice(Number(v.min_order_amount))}</p>}
                                    </div>
                                    {isSelected && <span className="text-success text-xs font-heading">✓ APPLIED</span>}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                        {shippingVouchers.length > 0 && (
                          <div>
                            <div className="px-3 py-2 bg-muted text-xs font-heading uppercase">Shipping Vouchers (max 1)</div>
                            {shippingVouchers.map((v) => {
                              const isSelected = shippingVoucher?.id === v.id;
                              return (
                                <button
                                  key={v.id}
                                  onClick={() => toggleShippingVoucher(v)}
                                  className={`w-full p-3 text-left border-t border-border-subtle transition-colors ${isSelected ? "bg-success/10" : "hover:bg-secondary/50"}`}
                                >
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <span className="font-heading text-sm">FREE SHIPPING</span>
                                      <p className="text-xs text-muted-foreground">{v.name} · ₱{v.discount_value} off shipping</p>
                                    </div>
                                    {isSelected && <span className="text-success text-xs font-heading">✓ APPLIED</span>}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                        {pesoVouchers.length === 0 && shippingVouchers.length === 0 && (
                          <div className="p-4 text-center text-sm text-muted-foreground">No vouchers available</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Totals */}
                <div className="pt-4 border-t-2 border-foreground space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Product Subtotal</span>
                    <span>{formatPrice(productSubtotal)}</span>
                  </div>
                  {promoDiscount > 0 && (
                    <div className="flex justify-between text-sm text-success">
                      <span>Promo Discount</span>
                      <span>-{formatPrice(promoDiscount)}</span>
                    </div>
                  )}
                  {promoDiscount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Discounted Subtotal</span>
                      <span>{formatPrice(discountedSubtotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping Fee</span>
                    <span>{formatPrice(totalShippingOriginal)}</span>
                  </div>
                  {shippingVoucherDeduction > 0 && (
                    <div className="flex justify-between text-sm text-success">
                      <span>Shipping Voucher</span>
                      <span>-{formatPrice(shippingVoucherDeduction)}</span>
                    </div>
                  )}
                  {promoFreeShipping > 0 && (
                    <div className="flex justify-between text-sm text-success">
                      <span>Free Shipping Promo</span>
                      <span>-{formatPrice(promoFreeShipping)}</span>
                    </div>
                  )}
                  {pesoVoucherDeduction > 0 && (
                    <div className="flex justify-between text-sm text-success">
                      <span>Voucher Discount{selectedVouchers.length > 1 ? `s (${selectedVouchers.length})` : ""}</span>
                      <span>-{formatPrice(pesoVoucherDeduction)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-border-subtle">
                    <span className="font-heading uppercase">Grand Total</span>
                    <span className="font-heading text-2xl">{formatPrice(grandTotal)}</span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-secondary">
                  <h4 className="font-heading text-sm uppercase mb-2">Payment Instructions</h4>
                  <p className="text-sm text-muted-foreground">
                    After placing your order, upload proof of payment (GCash or Bank Transfer) from your order history page.
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
