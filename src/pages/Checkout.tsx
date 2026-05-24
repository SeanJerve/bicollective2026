import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle, Ticket, ChevronDown, ChevronUp, MapPin, Upload, X } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import ShippingCalculator, {
  calculateShippingFee,
  BICOL_PROVINCES,
} from "@/components/checkout/ShippingCalculator";
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
import { useQuery } from "@tanstack/react-query";
import { resolveCommissionRate } from "@/lib/platformFees";

interface BuyNowItem {
  variant_id: string; // Added variant_id
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

type GroupedItems = Record<
  string,
  {
    brand: { id: string; name: string; slug: string; location?: string };
    items: any[];
    subtotal: number;
  }
>;

const Checkout = () => {
  const { items, total, clearCart } = useCart();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect admin users who try to access checkout
  useEffect(() => {
    if (isAdmin) {
      navigate("/admin");
    }
  }, [isAdmin, navigate]);

  const [loading, setLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [createdVendorOrders, setCreatedVendorOrders] = useState<{ id: string; brandName: string }[]>([]);

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
  const [isDragging, setIsDragging] = useState(false);

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
    let rawItems: any[] = [];

    if (isBuyNow && buyNowItem) {
      rawItems = [
        {
          id: "buy-now",
          variant_id: buyNowItem.variant_id,
          product_id: buyNowItem.product_id,
          quantity: buyNowItem.quantity,
          size: buyNowItem.size,
          variant: {
            product: {
              ...buyNowItem.product,
              slug: "",
            },
          },
        },
      ];
    } else {
      // If selectedCartItemIds provided, filter cart items
      rawItems =
        selectedCartItemIds && selectedCartItemIds.length > 0
          ? items.filter((item) => selectedCartItemIds.includes(item.id))
          : items;
    }

    // Ensure all items have a variant.product structure for consistent access
    return rawItems.map((item) => ({
      ...item,
      variant: item.variant || { product: item.product },
    }));
  }, [isBuyNow, buyNowItem, items, selectedCartItemIds]);

  const productSubtotal = useMemo(() => {
    return checkoutItems.reduce((sum, item) => {
      const price = Number(item.variant?.product?.price || 0);
      return sum + price * item.quantity;
    }, 0);
  }, [checkoutItems]);

  // Group items by brand
  const groupedItems: GroupedItems = useMemo(() => {
    return checkoutItems.reduce((acc: GroupedItems, item: any) => {
      const product = item.variant?.product;
      const brandId = product?.brand_id;
      if (!brandId) return acc;

      if (!acc[brandId]) {
        acc[brandId] = { brand: product.brand, items: [], subtotal: 0 };
      }
      acc[brandId].items.push(item);
      acc[brandId].subtotal += Number(product.price || 0) * item.quantity;
      return acc;
    }, {} as GroupedItems);
  }, [checkoutItems]);

  // Fetch active auto-apply promos (via Discounts Supertype)
  const { data: autoPromos } = useQuery({
    queryKey: ["auto-apply-promos-new"],
    queryFn: async () => {
      const now = new Date().toISOString();
      // Join discounts [supertype] with platform_promos [subtype]
      const { data, error } = await supabase
        .from("discounts")
        .select(`*, platform_promos!inner(*)`)
        .eq("is_active", true)
        .lte("starts_at", now)
        .gte("ends_at", now)
        .eq("platform_promos.deployment_target", "auto_apply");

      if (error) console.error("Error fetching auto-promos:", error);
      return data || [];
    },
  });

  // Fetch user vouchers (claimed discounts)
  const { data: userVouchers } = useQuery({
    queryKey: ["checkout-vouchers-claimed", user?.id],
    queryFn: async () => {
      // Query junction table user_discount_claims joined with discounts supertype
      const { data, error } = await (supabase.from("user_discount_claims") as any)
        .select(`*, discounts!inner(*)`)
        .eq("user_id", user!.id)
        .eq("status", "active")
        .gte("discounts.ends_at", new Date().toISOString());

      if (error) console.error("Error fetching claimed vouchers:", error);
      // Flatten the result to match expected discount structure
      return (data || []).map((claim: any) => {
        // Precise 3NF mapping: ensuring we get the data from the nested 'discounts' object
        const d = claim.discounts;
        return {
          ...d,
          id: d?.id,
          discount_value: Number(d?.discount_value) || 0,
          claim_id: claim.id,
        };
      });
    },
    enabled: !!user,
  });

  // Promo discount
  const promoDiscount = useMemo(() => {
    let discount = 0;
    if (appliedPromo && appliedPromo.discount_type !== "free_shipping") {
      if (appliedPromo.discount_type === "percentage") {
        let d = (productSubtotal * appliedPromo.discount_value) / 100;
        if (appliedPromo.max_discount_amount) d = Math.min(d, appliedPromo.max_discount_amount);
        discount += d;
      } else if (appliedPromo.discount_type === "fixed") {
        discount += appliedPromo.discount_value;
      }
    }
    autoPromos?.forEach((promo) => {
      if (promo.discount_type === "free_shipping") return;
      if (promo.min_order_amount && productSubtotal < (Number(promo.min_order_amount) || 0)) return;
      if (promo.discount_type === "percentage") {
        let d = (productSubtotal * (Number(promo.discount_value) || 0)) / 100;
        if (promo.max_discount_amount) d = Math.min(d, Number(promo.max_discount_amount) || 0);
        discount += d;
      } else if (promo.discount_type === "fixed") {
        discount += Number(promo.discount_value) || 0;
      }
    });
    return Math.min(discount || 0, productSubtotal);
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

  const totalShippingOriginal = useMemo(
    () => Object.values(shippingByBrand).reduce((sum, fee) => sum + fee.original, 0),
    [shippingByBrand]
  );

  // Voucher deductions
  const pesoVoucherDeduction = useMemo(() => {
    const total = selectedVouchers.reduce((sum, v) => {
      const val = Number(v.discount_value) || 0;
      if (v.discount_type === "percentage") {
        let d = (discountedSubtotal * val) / 100;
        if (v.max_discount_amount) d = Math.min(d, Number(v.max_discount_amount));
        return sum + d;
      }
      return sum + val;
    }, 0);
    console.log("Peso Voucher Calculation:", {
      total,
      discountedSubtotal,
      deduction: Math.min(total, discountedSubtotal),
    });
    return Math.min(total, discountedSubtotal);
  }, [selectedVouchers, discountedSubtotal]);

  const shippingVoucherDeduction = useMemo(() => {
    if (!shippingVoucher) return 0;
    const deduction = Number(shippingVoucher.discount_value) || 50;
    return Math.min(deduction, totalShippingOriginal);
  }, [shippingVoucher, totalShippingOriginal]);

  const finalShipping = Math.max(0, totalShippingOriginal - shippingVoucherDeduction);

  const promoFreeShipping = useMemo(() => {
    if (appliedPromo?.discount_type === "free_shipping") return Math.min(50, totalShippingOriginal);
    const autoFreeShip = autoPromos?.find((p) => p.discount_type === "free_shipping");
    if (autoFreeShip)
      return Math.min(Number(autoFreeShip.discount_value) || 50, totalShippingOriginal);
    return 0;
  }, [appliedPromo, autoPromos, totalShippingOriginal]);

  const effectiveShipping = Math.max(0, finalShipping - promoFreeShipping);

  const grandTotal = useMemo(() => {
    const base = Number(discountedSubtotal) || 0;
    const ship = Number(effectiveShipping) || 0;
    const vouch = Number(pesoVoucherDeduction) || 0;
    const total = Math.max(0, base + ship - vouch);
    console.log("Grand Total Calculation:", { base, ship, vouch, total });
    return total;
  }, [discountedSubtotal, effectiveShipping, pesoVoucherDeduction]);

  const brandCalculations = useMemo(() => {
    const brandsList = Object.entries(groupedItems).map(([id, group]) => ({
      id,
      subtotal: group.subtotal,
      originalShipping: shippingByBrand[id]?.original || 0,
    }));

    // Sort to be deterministic
    brandsList.sort((a, b) => a.id.localeCompare(b.id));

    // 1. Allocate final shipping fee (effectiveShipping)
    const brandShippingFinals: Record<string, number> = {};
    let allocatedShippingSum = 0;
    const totalOriginalShipping = totalShippingOriginal || 1; // avoid division by zero

    brandsList.forEach((b, idx) => {
      if (idx === brandsList.length - 1) {
        // Last one takes remainder
        brandShippingFinals[b.id] = Math.max(0, effectiveShipping - allocatedShippingSum);
      } else {
        const share = Math.round((effectiveShipping * b.originalShipping) / totalOriginalShipping);
        brandShippingFinals[b.id] = share;
        allocatedShippingSum += share;
      }
    });

    // 2. Allocate final product subtotal after product discount and voucher discount
    const finalProductSubtotal = Math.max(0, productSubtotal - promoDiscount - pesoVoucherDeduction);
    const brandProductFinals: Record<string, number> = {};
    let allocatedProductSum = 0;
    const totalSub = productSubtotal || 1; // avoid division by zero

    brandsList.forEach((b, idx) => {
      if (idx === brandsList.length - 1) {
        brandProductFinals[b.id] = Math.max(0, finalProductSubtotal - allocatedProductSum);
      } else {
        const share = Math.round((finalProductSubtotal * b.subtotal) / totalSub);
        brandProductFinals[b.id] = share;
        allocatedProductSum += share;
      }
    });

    // 3. Construct calculations object for each brand
    const calculations: Record<
      string,
      {
        subtotal: number;
        originalShipping: number;
        shippingFee: number;
        shippingDiscountShare: number;
        discountAmount: number;
        vendorTotal: number;
      }
    > = {};

    brandsList.forEach((b) => {
      const shippingFee = brandShippingFinals[b.id];
      const originalShipping = b.originalShipping;
      const shippingDiscountShare = originalShipping - shippingFee;

      const productFinal = brandProductFinals[b.id];
      const discountAmount = b.subtotal - productFinal;

      calculations[b.id] = {
        subtotal: b.subtotal,
        originalShipping,
        shippingFee,
        shippingDiscountShare,
        discountAmount,
        vendorTotal: productFinal + shippingFee,
      };
    });

    return calculations;
  }, [groupedItems, shippingByBrand, totalShippingOriginal, effectiveShipping, productSubtotal, promoDiscount, pesoVoucherDeduction]);

  const pesoVouchers = userVouchers?.filter((v) => v.discount_type !== "free_shipping") || [];
  const shippingVouchers = userVouchers?.filter((v) => v.discount_type === "free_shipping") || [];

  const togglePesoVoucher = (voucher: any) => {
    const exists = selectedVouchers.find((v) => v.id === voucher.id);
    if (exists) {
      setSelectedVouchers(selectedVouchers.filter((v) => v.id !== voucher.id));
    } else {
      if (voucher.min_order_amount && productSubtotal < Number(voucher.min_order_amount)) {
        toast({
          title: "Minimum not met",
          description: `Min order ₱${Number(voucher.min_order_amount).toLocaleString()} required`,
          variant: "destructive",
        });
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
    if (!user) {
      toast({ title: "Please sign in", variant: "destructive" });
      return;
    }
    if (checkoutItems.length === 0) {
      toast({ title: "No items to checkout", variant: "destructive" });
      return;
    }
    if (!selectedAddress) {
      toast({ title: "Please select an address", variant: "destructive" });
      return;
    }
    if (paymentMethod !== "cod" && !paymentProofFile) {
      toast({
        title: "Payment proof required",
        description: "Please upload proof of payment for GCash/Bank Transfer",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Stock validation — prevent race conditions
      const stockCheckItems = checkoutItems.map((item: any) => ({
        variant_id: item.variant_id, // Updated to use variant_id
        quantity: item.quantity,
      }));

      const { data: outOfStock, error: stockError } = await supabase.rpc("validate_stock", {
        items: stockCheckItems,
      });

      if (stockError) throw stockError;

      if (outOfStock && Array.isArray(outOfStock) && outOfStock.length > 0) {
        const names = outOfStock
          .map((i: any) => `${i.product_name} (${i.available} left)`)
          .join(", ");
        toast({
          title: "Some items are out of stock",
          description: `Insufficient stock: ${names}. Please update your cart.`,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      // Upload payment proof if needed
      let paymentProofUrl: string | null = null;
      if (paymentProofFile && paymentMethod !== "cod") {
        setUploadingProof(true);
        const ext = paymentProofFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("payment-proofs")
          .upload(path, paymentProofFile);
        if (uploadErr) throw uploadErr;
        // Store the path directly — use signed URLs when viewing since bucket is private
        paymentProofUrl = path;
        setUploadingProof(false);
      }

      const shippingAddressStr = `${selectedAddress.street}, ${selectedAddress.barangay}, ${selectedAddress.city}, ${selectedAddress.province} ${selectedAddress.zip_code}`;

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_id: user.id,
          total_amount: grandTotal || 0,
          total_shipping: effectiveShipping || 0,
          total_discount:
            (promoDiscount || 0) +
            (pesoVoucherDeduction || 0) +
            (shippingVoucherDeduction || 0) +
            (promoFreeShipping || 0),
          discount_id: appliedPromo?.id || null, // Track the discount source
          shipping_name: selectedAddress.full_name,
          shipping_phone: selectedAddress.phone,
          shipping_address_id: selectedAddress.id, // Linked for management
          shipping_address: shippingAddressStr, // Snapshot for history (Restored via SQL)
          notes: notes || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // --- NEW RELATIONAL PAYMENT LOGIC (OUTSIDE BRAND LOOP) ---
      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .insert({
          order_id: order.id,
          payment_method: paymentMethod === "cod" ? 0 : paymentMethod === "gcash" ? 1 : 2,
          amount: grandTotal,
          status: paymentMethod === "cod" ? "pending" : "pending_verification",
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      if (paymentMethod !== "cod" && paymentProofUrl) {
        const { error: proofError } = await supabase.from("payment_verifications").insert({
          payment_id: payment.id,
          proof_image_url: paymentProofUrl,
        } as any);
        if (proofError) throw proofError;
      }
      // ---------------------------------------------------------

      const createdOrdersList: { id: string; brandName: string }[] = [];
      for (const [brandId, group] of Object.entries(groupedItems)) {
        const brandCalc = brandCalculations[brandId];
        const brandShipping = brandCalc?.originalShipping || 0;
        const brandShippingFinal = brandCalc?.shippingFee || 0;
        const totalDeductionsForBrand = brandCalc?.discountAmount || 0;

        const initialStatus =
          paymentMethod === "cod"
            ? "confirmed"
            : paymentProofUrl
              ? "payment_uploaded"
              : "pending_payment";

        // Calculate Platform Fees
        const product = group.items[0]?.variant?.product;
        const commissionRate = resolveCommissionRate(product?.brand?.commission_rate);
        const platformCommission = Math.round((group.subtotal * commissionRate) / 100);
        const shippingMargin = 20; // Fixed 20 pesos margin
        const totalPlatformFee = platformCommission + shippingMargin;

        const { data: vendorOrder, error: vendorOrderError } = await supabase
          .from("vendor_orders")
          .insert({
            order_id: order.id,
            brand_id: brandId,
            subtotal: group.subtotal,
            shipping_fee: brandShippingFinal,
            shipping_fee_original: brandShipping,
            free_shipping_applied: (brandCalc?.shippingDiscountShare || 0) > 0,
            discount_amount: totalDeductionsForBrand,
            status: initialStatus,
            platform_commission: platformCommission,
            platform_shipping_margin: shippingMargin,
            total_platform_fee: totalPlatformFee,
            discount_id: appliedPromo?.id || null,
          })
          .select()
          .single();

        if (vendorOrderError) throw vendorOrderError;

        createdOrdersList.push({
          id: vendorOrder.id,
          brandName: group.brand?.name || "Unknown Brand",
        });

        // Platform Debt is now automatically calculated via database triggers
        // when the vendor marks the order as 'delivered' (for COD).

        const orderItems = group.items.map((item: any) => {
          const product = item.variant?.product;
          return {
            vendor_order_id: vendorOrder.id,
            product_id: product?.id || item.product_id || null,
            variant_id: item.variant_id,
            product_name: product?.name || "Unknown Product",
            product_price: Number(product?.price || 0),
            quantity: item.quantity,
            size: item.size || item.variant?.size || "",
          };
        });

        const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
        if (itemsError) throw itemsError;

        // --- NEW RELATIONAL STOCK DECREMENT ---
        const { error: decrementError } = await (supabase.rpc as any)("decrement_stock_on_order", {
          items: orderItems.map((i: any) => ({ variant_id: i.variant_id, quantity: i.quantity })),
        });
        if (decrementError) console.error("Error decrementing stock:", decrementError);
        // --------------------------------------
      }

      setCreatedVendorOrders(createdOrdersList);

      // Mark vouchers as used (Update user_discount_claims status)
      const allUsedVouchers = [...selectedVouchers, ...(shippingVoucher ? [shippingVoucher] : [])];
      for (const v of allUsedVouchers) {
        if (v.claim_id) {
          await supabase
            .from("user_discount_claims")
            .update({ status: "used", used_at: new Date().toISOString() })
            .eq("id", v.claim_id);
        }
      }

      if (appliedPromo?.id) {
        try {
          await supabase
            .from("discounts")
            .update({ current_uses: (appliedPromo.current_uses || 0) + 1 })
            .eq("id", appliedPromo.id);
        } catch {}
      }

      // Only clear selected items from cart (not buy now mode)
      if (!isBuyNow) {
        if (selectedCartItemIds) {
          // Only remove selected items from cart
          for (const itemId of selectedCartItemIds) {
            await supabase.from("cart_items").delete().eq("id", itemId);
          }
        } else {
          await clearCart();
        }
      }
      setOrderId(order.id);
      setOrderComplete(true);
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({ title: "Checkout failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
      setUploadingProof(false);
    }
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  if (orderComplete && orderId) {
    return (
      <PageLayout minimalHeader>
        <section className="py-20">
          <div className="section-container max-w-lg text-center">
            <CheckCircle className="w-20 h-20 mx-auto mb-6 text-success" />
            <h1 className="font-heading text-4xl uppercase mb-4">Order Placed!</h1>
            <p className="text-muted-foreground mb-8">
              Your order has been placed. Upload payment proof from your order history.
            </p>
            <div className="card-brutal p-6 mb-8 text-left space-y-4">
              <div>
                <p className="text-sm font-heading uppercase text-muted-foreground mb-2">Vendor Orders</p>
                <div className="space-y-2">
                  {createdVendorOrders.map((vo) => (
                    <div key={vo.id} className="flex justify-between items-center border-b border-dashed border-border-subtle pb-2 last:border-0 last:pb-0">
                      <span className="font-medium text-sm">{vo.brandName}</span>
                      <span className="font-mono text-sm font-bold uppercase text-primary">#{vo.id.slice(0, 8)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-2 border-t border-border-subtle">
                <p className="text-[10px] uppercase font-heading text-muted-foreground mb-1">Master Reference ID</p>
                <p className="font-mono text-xs break-all text-muted-foreground select-all">{orderId}</p>
              </div>
            </div>
            <div className="space-y-4">
              <button onClick={() => navigate("/account/orders")} className="btn-brutal w-full">
                View My Orders
              </button>
              {isBuyNow ? (
                <button onClick={() => navigate(-1)} className="btn-brutal-secondary w-full">
                  Back to Product
                </button>
              ) : (
                <button
                  onClick={() => navigate("/products")}
                  className="btn-brutal-secondary w-full"
                >
                  Continue Shopping
                </button>
              )}
            </div>
          </div>
        </section>
      </PageLayout>
    );
  }

  if (addressesLoading) {
    return (
      <PageLayout minimalHeader>
        <div className="section-container py-20 text-center">
          <div className="skeleton-brutal h-8 w-48 mx-auto mb-4" />
          <div className="skeleton-brutal h-4 w-64 mx-auto" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout minimalHeader>
      <section className="py-12 border-b-2 border-foreground">
        <div className="section-container">
          <button
            type="button"
            onClick={() => navigate("/cart")}
            className="text-sm text-muted-foreground hover:text-foreground mb-3 inline-flex items-center gap-1"
          >
            ← Back to Cart
          </button>
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
                                  <span className="text-xs bg-foreground text-background px-2 py-0.5">
                                    DEFAULT
                                  </span>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  ({addr.label})
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">{addr.phone}</p>
                              <p className="text-xs text-muted-foreground">
                                {addr.street}, {addr.barangay}, {addr.city}, {addr.province}{" "}
                                {addr.zip_code}
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

                {/* Payment Method */}
                <div>
                  <label className="font-heading text-sm uppercase tracking-wide mb-3 block">
                    Payment Method
                  </label>
                  <div className="space-y-2">
                    {(
                      [
                        {
                          value: "cod",
                          label: "Cash on Delivery (COD)",
                          desc: "Pay when you receive your order",
                        },
                        { value: "gcash", label: "GCash", desc: "Upload proof of payment" },
                        {
                          value: "bank_transfer",
                          label: "Bank Transfer",
                          desc: "Upload proof of payment",
                        },
                      ] as const
                    ).map((method) => (
                      <label
                        key={method.value}
                        className={`block p-3 border-2 cursor-pointer transition-colors ${
                          paymentMethod === method.value
                            ? "border-foreground bg-secondary/50"
                            : "border-border-subtle hover:border-foreground/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="paymentMethod"
                            checked={paymentMethod === method.value}
                            onChange={() => {
                              setPaymentMethod(method.value);
                              setPaymentProofFile(null);
                            }}
                          />
                          <div>
                            <span className="font-heading text-sm">{method.label}</span>
                            <p className="text-xs text-muted-foreground">{method.desc}</p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Payment Proof Upload for GCash/Bank Transfer */}
                  {paymentMethod !== "cod" && (
                    <div className="mt-4">
                      <label className="font-heading text-xs uppercase mb-3 block">
                        Upload Proof of Payment <span className="text-destructive">*</span>
                      </label>
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDragging(false);
                          const file = e.dataTransfer.files?.[0];
                          if (file && file.type.startsWith("image/")) {
                            setPaymentProofFile(file);
                          }
                        }}
                        className={`relative border-2 border-dashed p-8 transition-all text-center ${
                          isDragging
                            ? "border-foreground bg-secondary"
                            : "border-border-subtle hover:border-foreground/50"
                        } ${paymentProofFile ? "bg-secondary/20" : ""}`}
                      >
                        {!paymentProofFile ? (
                          <div className="space-y-4">
                            <div className="w-12 h-12 bg-secondary flex items-center justify-center mx-auto rounded-full">
                              <Upload className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <div className="space-y-1">
                              <p className="font-heading text-sm uppercase">
                                Drag & Drop Proof Here
                              </p>
                              <p className="text-xs text-muted-foreground">
                                or click to browse from device
                              </p>
                            </div>
                            <input
                              id="payment-upload"
                              type="file"
                              accept="image/*"
                              onChange={(e) => setPaymentProofFile(e.target.files?.[0] || null)}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="pt-2">
                              <span className="btn-brutal py-1.5 px-4 text-[10px]">
                                Select File
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="relative group max-w-[200px] mx-auto">
                            <img
                              src={URL.createObjectURL(paymentProofFile)}
                              alt="Payment proof preview"
                              className="w-full aspect-[3/4] object-cover border-2 border-foreground"
                            />
                            <button
                              type="button"
                              onClick={() => setPaymentProofFile(null)}
                              className="absolute -top-2 -right-2 w-8 h-8 bg-destructive text-destructive-foreground border-2 border-foreground flex items-center justify-center hover:scale-110 transition-transform shadow-brutal"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <p className="mt-3 text-[10px] font-heading uppercase truncate">
                              {paymentProofFile.name}
                            </p>
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-3 italic">
                        Upload a clear screenshot of your{" "}
                        {paymentMethod === "gcash" ? "GCash" : "bank"} transaction.
                      </p>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="font-heading text-sm uppercase tracking-wide mb-2 block">
                    Order Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="input-brutal min-h-[80px]"
                    placeholder="Any special instructions..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={
                    loading ||
                    checkoutItems.length === 0 ||
                    !selectedAddress ||
                    (paymentMethod !== "cod" && !paymentProofFile)
                  }
                  className="btn-brutal w-full"
                >
                  {loading
                    ? uploadingProof
                      ? "Uploading payment proof..."
                      : "Placing Order..."
                    : "Place Order"}
                </button>
              </form>
            </div>

            {/* Order Summary */}
            <div>
              <h2 className="font-heading text-2xl uppercase mb-6">Order Summary</h2>
              <div className="card-brutal p-6">
                {/* Items by brand */}
                {Object.entries(groupedItems).map(([brandId, group]) => (
                  <div
                    key={brandId}
                    className="pb-6 mb-6 border-b border-border-subtle last:border-0 last:pb-0 last:mb-0"
                  >
                    <h3 className="font-heading uppercase mb-4">
                      {group.brand?.name || "Unknown Brand"}
                    </h3>
                    <div className="space-y-3">
                      {group.items.map((item: any) => {
                        const product = item.variant?.product;
                        return (
                          <div key={item.id} className="flex gap-4">
                            <div className="w-14 h-18 bg-muted flex-shrink-0 border border-border-subtle overflow-hidden">
                              {product?.image_url && (
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = "/placeholder.svg";
                                  }}
                                />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {product?.name || "Unknown Product"}
                              </p>
                              {item.size && (
                                <p className="text-xs text-muted-foreground">Size: {item.size}</p>
                              )}
                              <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                            </div>
                            <div className="text-sm font-mono">
                              {formatPrice(Number(product?.price || 0) * item.quantity)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-4 pt-3 border-t border-dashed border-border-subtle space-y-2 text-sm bg-secondary/20 p-3 card-brutal">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Seller Location</span>
                        <span>{group.brand?.location || "Albay"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Vendor Subtotal</span>
                        <span>{formatPrice(group.subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Shipping Fee</span>
                        <span>
                          {brandCalculations[brandId]?.shippingDiscountShare > 0 ? (
                            <span className="space-x-1.5">
                              <span className="line-through text-muted-foreground">
                                {formatPrice(brandCalculations[brandId].originalShipping)}
                              </span>
                              <span className="text-success font-bold">
                                {formatPrice(brandCalculations[brandId].shippingFee)}
                              </span>
                            </span>
                          ) : (
                            formatPrice(brandCalculations[brandId]?.originalShipping || 0)
                          )}
                        </span>
                      </div>
                      {(brandCalculations[brandId]?.discountAmount || 0) > 0 && (
                        <div className="flex justify-between text-success">
                          <span>Discount Share</span>
                          <span>-{formatPrice(brandCalculations[brandId].discountAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-1 border-t border-dashed border-foreground/20 font-bold">
                        <span className="font-heading uppercase text-xs">Vendor Total</span>
                        <span>{formatPrice(brandCalculations[brandId]?.vendorTotal || 0)}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Promo Code */}
                <div className="pt-4 border-t-2 border-foreground space-y-4">
                  <div>
                    <label className="font-heading text-xs uppercase tracking-wide mb-2 block">
                      Promo Code
                    </label>
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
                      {showVouchers ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    {showVouchers && (
                      <div className="border-2 border-t-0 border-foreground max-h-64 overflow-y-auto">
                        {pesoVouchers.length > 0 && (
                          <div>
                            <div className="px-3 py-2 bg-muted text-xs font-heading uppercase">
                              Discount Vouchers (stackable)
                            </div>
                            {pesoVouchers.map((v) => {
                              const isSelected = selectedVouchers.some((sv) => sv.id === v.id);
                              const meetsMin =
                                !v.min_order_amount ||
                                productSubtotal >= Number(v.min_order_amount);
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
                                        {v.discount_type === "percentage"
                                          ? `${v.discount_value}% OFF`
                                          : formatPrice(Number(v.discount_value))}
                                      </span>
                                      <p className="text-xs text-muted-foreground">{v.name}</p>
                                      {!meetsMin && (
                                        <p className="text-xs text-destructive">
                                          Min: {formatPrice(Number(v.min_order_amount))}
                                        </p>
                                      )}
                                    </div>
                                    {isSelected && (
                                      <span className="text-success text-xs font-heading">
                                        ✓ APPLIED
                                      </span>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                        {shippingVouchers.length > 0 && (
                          <div>
                            <div className="px-3 py-2 bg-muted text-xs font-heading uppercase">
                              Shipping Vouchers (max 1)
                            </div>
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
                                      <p className="text-xs text-muted-foreground">
                                        {v.name} · ₱{v.discount_value} off shipping
                                      </p>
                                    </div>
                                    {isSelected && (
                                      <span className="text-success text-xs font-heading">
                                        ✓ APPLIED
                                      </span>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                        {pesoVouchers.length === 0 && shippingVouchers.length === 0 && (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            No vouchers available
                          </div>
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
                      <span>
                        Voucher Discount
                        {selectedVouchers.length > 1 ? `s (${selectedVouchers.length})` : ""}
                      </span>
                      <span>-{formatPrice(pesoVoucherDeduction)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-border-subtle">
                    <span className="font-heading uppercase">Grand Total</span>
                    <span className="font-heading text-2xl">{formatPrice(grandTotal)}</span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-secondary">
                  <h4 className="font-heading text-sm uppercase mb-2">Payment Method</h4>
                  <p className="text-sm text-muted-foreground">
                    {paymentMethod === "cod"
                      ? "Cash on Delivery — pay when you receive your order."
                      : paymentMethod === "gcash"
                        ? "GCash — your payment proof will be sent to the vendor for verification."
                        : "Bank Transfer — your payment proof will be sent to the vendor for verification."}
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
