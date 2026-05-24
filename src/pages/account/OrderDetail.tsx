import { useState, useEffect, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  Package,
  Truck,
  MapPin,
  Phone,
  Clock,
  Star,
  XCircle,
  Loader2,
  CheckCircle2,
  RotateCcw,
  MessageSquare,
} from "lucide-react";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import PageLayout from "@/components/layout/PageLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import ReviewForm from "@/components/account/ReviewForm";
import PaymentProofUpload from "@/components/account/PaymentProofUpload";
import { formatStatusLabel } from "@/lib/formatStatus";

const statusColors: Record<string, string> = {
  pending_payment: "bg-warning text-warning-foreground",
  payment_uploaded: "bg-info text-info-foreground",
  confirmed: "bg-info text-info-foreground",
  paid: "bg-info text-info-foreground",
  processing: "bg-info text-info-foreground",
  handed_to_courier: "bg-primary text-primary-foreground",
  for_delivery: "bg-primary text-primary-foreground",
  shipped: "bg-primary text-primary-foreground",
  delivered: "bg-success text-success-foreground",
  cancelled: "bg-destructive text-destructive-foreground",
  disputed: "bg-warning text-warning-foreground",
};

const statusLabels: Record<string, string> = {
  pending_payment: "Pending Payment",
  payment_uploaded: "Payment Uploaded",
  confirmed: "Confirmed",
  paid: "Paid",
  processing: "Processing",
  handed_to_courier: "With Courier",
  for_delivery: "Shipped",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  disputed: "Disputed",
};

const paymentStatusLabels: Record<string, string> = {
  pending: "Pending Verification",
  pending_verification: "Pending Verification",
  verified: "Verified",
  rejected: "Rejected",
  failed: "Failed",
};

// Helper to render payment proof with signed URL
const PaymentProofImage = ({ path }: { path: string }) => {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    // If path is already a full URL (legacy), use directly
    if (path.startsWith("http")) {
      setUrl(path);
      return;
    }
    supabase.storage
      .from("payment-proofs")
      .createSignedUrl(path, 3600)
      .then(({ data }) => {
        if (data) setUrl(data.signedUrl);
      });
  }, [path]);
  if (!url) return null;
  return (
    <div className="border-t border-border-subtle pt-4 mt-4">
      <h4 className="font-heading text-sm uppercase mb-2">Payment Proof</h4>
      <a href={url} target="_blank" rel="noopener noreferrer">
        <img
          src={url}
          alt="Payment proof"
          className="w-32 h-32 object-cover border border-border-subtle"
          onError={(e) => {
            e.currentTarget.src = "/placeholder.svg";
          }}
        />
      </a>
    </div>
  );
};
const OrderDetail = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const queryClient = useQueryClient();
  const [reviewingOrderItem, setReviewingOrderItem] = useState<string | null>(null);
  const [confirmingOrder, setConfirmingOrder] = useState<string | null>(null);
  const [showConfirmId, setShowConfirmId] = useState<string | null>(null);
  const [showCancelConfirmId, setShowCancelConfirmId] = useState<string | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState<string | null>(null);
  const { toast } = useToast();

  const cancellableStatuses = ["pending_payment", "payment_uploaded", "confirmed"];

  const handleCancelVendorOrder = async (vendorOrderId: string) => {
    setCancellingOrder(vendorOrderId);
    try {
      const { error } = await (supabase.rpc as any)("cancel_vendor_order_customer", {
        vo_id: vendorOrderId,
      });
      if (error) throw error;
      toast({
        title: "Order cancelled",
        description: "Your order has been cancelled successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["order-detail", orderId] });
      setShowCancelConfirmId(null);
    } catch (err) {
      console.error("Cancel error:", err);
      toast({
        title: "Error",
        description: "Failed to cancel order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCancellingOrder(null);
    }
  };

  const handleConfirmDelivery = async (vendorOrderId: string) => {
    setConfirmingOrder(vendorOrderId);
    try {
      // Step 1: Call the "Harmony" Pipeline (RPC)
      // This verifies both Order status and Payment status atomically.
      const { error } = await (supabase as any).rpc("confirm_delivery", {
        target_order_id: vendorOrderId,
      });

      if (error) throw error;

      toast({ title: "Order received", description: "Thank you for confirming your delivery!" });
      queryClient.invalidateQueries({ queryKey: ["order-detail", orderId] });
      queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
      setShowConfirmId(null);

      // Redirect to the "Completed" orders tab
      setTimeout(() => {
        navigate("/account/orders?filter=delivered");
      }, 1500);
    } catch (err: any) {
      console.error("Confirm error:", err);
      // Show actual error message for diagnostics
      const errMsg = err.message || "Failed to confirm delivery. Please try again.";
      toast({ title: "Error", description: errMsg, variant: "destructive" });
    } finally {
      setConfirmingOrder(null);
    }
  };

  const handleBuyAgain = async (items: any[]) => {
    let added = 0;
    for (const item of items) {
      if (item.variant_id) {
        await addToCart(item.variant_id, item.quantity);
        added++;
      }
    }

    if (added > 0) {
      toast({
        title: "Added to cart",
        description: `Added ${added} item(s) from this order back to your cart.`,
      });
    } else {
      toast({
        title: "Cannot buy again",
        description: "Products may no longer be available.",
        variant: "destructive",
      });
    }
  };

  const { data: vendorOrder, isLoading } = useQuery({
    queryKey: ["order-detail", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_orders")
        .select(`
          *,
          brand:brands(id, name, slug, owner_id, status),
          discount:discounts(*),
          order:orders!inner(
            id,
            customer_id,
            total_amount,
            total_shipping,
            total_discount,
            shipping_name,
            shipping_phone,
            shipping_address_id,
            shipping_address,
            notes,
            created_at
          )
        `)
        .eq("id", orderId!)
        .eq("order.customer_id", user!.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!orderId && !!user,
  });

  const order = vendorOrder?.order;

  // Fetch payments separately
  const { data: payments = [] } = useQuery({
    queryKey: ["order-payments", order?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, payment_verifications(*)")
        .eq("order_id", order!.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!order?.id,
  });

  // Fetch order_items separately
  const { data: orderItems = [] } = useQuery({
    queryKey: ["order-items", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select("*, variant:product_variants(product_id)")
        .eq("vendor_order_id", orderId!);
      if (error) throw error;
      return (data || []).map((item: any) => ({
        ...item,
        product_id: item.product_id || item.variant?.product_id || null,
      }));
    },
    enabled: !!orderId,
  });

  // Secondary query for address
  const { data: fetchedAddress } = useQuery({
    queryKey: ["order-address-lookup", order?.shipping_address_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("id", order!.shipping_address_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!order?.shipping_address_id,
  });

  const address = fetchedAddress;

  // Manual assembly of the combined order object for UI compatibility
  const enrichedOrder = useMemo(() => {
    if (!vendorOrder || !order) return null;
    return {
      ...order,
      discount: (vendorOrder as any).discount || null,
      payments,
      vendor_orders: [
        {
          ...vendorOrder,
          order_items: orderItems,
        }
      ],
    } as any;
  }, [vendorOrder, order, payments, orderItems]);

  // Auto-confirm logic: if order is "shipped" or "for_delivery" and > 3 days have passed, auto-confirm to delivered
  useEffect(() => {
    if (enrichedOrder?.vendor_orders) {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      enrichedOrder.vendor_orders.forEach(async (vo: any) => {
        if (
          (vo.status === "shipped" || vo.status === "for_delivery") &&
          new Date(vo.updated_at) < threeDaysAgo
        ) {
          await supabase
            .from("vendor_orders")
            .update({ status: "delivered", delivered_at: new Date().toISOString() })
            .eq("id", vo.id);
          queryClient.invalidateQueries({ queryKey: ["order-detail", orderId] });
          queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
        }
      });
    }
  }, [enrichedOrder, orderId, queryClient]);

  const { data: existingReviews } = useQuery({
    queryKey: ["order-reviews", orderId],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("reviews")
        .select("vendor_order_id")
        .eq("user_id", user!.id) as any);

      if (error) throw error;
      return data?.map((r) => r.vendor_order_id) || [];
    },
    enabled: !!user,
  });

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount);

  if (!user) {
    return (
      <PageLayout>
        <div className="section-container py-12 text-center">
          <p className="text-muted-foreground">Please log in to view this order.</p>
          <Link to="/login" className="btn-brutal mt-4 inline-block">
            Sign In
          </Link>
        </div>
      </PageLayout>
    );
  }

  if (isLoading) {
    return (
      <PageLayout>
        <div className="section-container py-12">
          <div className="skeleton-brutal h-8 w-48 mb-4" />
          <div className="skeleton-brutal h-64" />
        </div>
      </PageLayout>
    );
  }

  if (!enrichedOrder) {
    return (
      <PageLayout>
        <div className="section-container py-12 text-center">
          <h1 className="font-heading text-2xl uppercase mb-4">Order Not Found</h1>
          <Link to="/account/orders" className="btn-brutal-secondary">
            Back to Orders
          </Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <section className="py-8 md:py-12 border-b-2 border-foreground">
        <div className="section-container">
          <nav className="text-xs md:text-sm mb-3 md:mb-4">
            <Link to="/" className="text-muted-foreground hover:text-foreground">
              Home
            </Link>
            <span className="mx-2 text-muted-foreground">/</span>
            <Link to="/account/orders" className="text-muted-foreground hover:text-foreground">
              My Orders
            </Link>
            <span className="mx-2 text-muted-foreground">/</span>
            <span>Order Details</span>
          </nav>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="font-heading text-3xl md:text-4xl uppercase tracking-tighter">
                Order Detail
              </h1>
              <p className="text-muted-foreground mt-1 font-heading uppercase text-xs">
                Order: <span className="font-mono text-primary font-bold">#{orderId?.slice(0, 8)}</span> •{" "}
                {new Date(enrichedOrder.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Link
                to="/account/orders"
                className="btn-brutal-secondary flex-1 md:flex-none text-center text-sm px-4 py-2"
              >
                Back to Orders
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 md:py-12">
        <div className="section-container max-w-4xl">
          {/* Shipping Info */}
          <div className="card-brutal p-4 md:p-6 mb-6">
            <h2 className="font-heading text-lg uppercase mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Shipping Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Recipient</p>
                <p className="font-medium">{address?.full_name || enrichedOrder.shipping_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Phone</p>
                <p className="font-medium flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {address?.phone || enrichedOrder.shipping_phone}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-muted-foreground font-heading uppercase text-xs">Address</p>
                <div className="font-medium mt-1">
                  {address ? (
                    <p className="text-sm">
                      {address.street}, {address.barangay}, {address.city}, {address.province}{" "}
                      {address.zip_code}
                    </p>
                  ) : enrichedOrder.shipping_address ? (
                    <p className="text-sm">{enrichedOrder.shipping_address}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Address details not found.
                    </p>
                  )}
                </div>
              </div>
              {enrichedOrder.notes && (
                <div className="md:col-span-2">
                  <p className="text-muted-foreground">Notes</p>
                  <p>{enrichedOrder.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Vendor Orders */}
          {enrichedOrder.vendor_orders?.map((vo: any) => (
            <div key={vo.id} className="card-brutal p-4 md:p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Link
                    to={`/brands/${vo.brand?.slug}`}
                    className="font-heading uppercase hover:underline flex items-center gap-1.5"
                  >
                    {vo.brand?.name}
                    {vo.brand?.status === "verified" && <VerifiedBadge size="sm" />}
                  </Link>
                  <span
                    className={`inline-block px-2 py-0.5 text-[10px] md:text-xs uppercase font-bold border border-foreground shadow-brutal-xs ${
                      statusColors[vo.status] || "bg-secondary"
                    }`}
                  >
                    {statusLabels[vo.status] || formatStatusLabel(vo.status)}
                  </span>
                </div>
                {vo.tracking_number && (
                  <div className="flex items-center gap-2 text-sm">
                    <Truck className="w-4 h-4" />
                    <span className="text-muted-foreground">Tracking:</span>
                    <span className="font-mono">{vo.tracking_number}</span>
                  </div>
                )}
              </div>

              <div className="divide-y divide-border-subtle">
                {vo.order_items?.map((item: any) => (
                  <div key={item.id} className="py-3 border-b border-border-subtle last:border-0">
                    <div className="flex justify-between items-center mb-1">
                      <div>
                        <p className="font-medium text-sm">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.size && `Size: ${item.size} · `}Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="font-heading text-sm">
                        {formatPrice(Number(item.product_price) * item.quantity)}
                      </p>
                    </div>

                    {/* Per-item Review Section */}
                    {vo.status === "delivered" && item.product_id && (
                      <div className="mt-2">
                        {existingReviews?.includes(item.product_id) ? (
                          <p className="text-xs text-success flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Item reviewed
                          </p>
                        ) : reviewingOrderItem === item.id ? (
                          <div className="mt-4 p-4 bg-secondary/5 border border-foreground/10 animate-fade-in">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-heading text-xs uppercase flex items-center gap-2">
                                <Star className="w-3.5 h-3.5" />
                                Reviewing {item.product_name}
                              </h4>
                              <button
                                onClick={() => setReviewingOrderItem(null)}
                                className="text-[10px] font-heading uppercase underline hover:text-destructive"
                              >
                                Cancel
                              </button>
                            </div>
                            <ReviewForm
                              productId={item.product_id}
                              brandId={vo.brand_id}
                              vendorOrderId={vo.id}
                              onSuccess={() => {
                                setReviewingOrderItem(null);
                                queryClient.invalidateQueries({
                                  queryKey: ["order-reviews", orderId],
                                });
                                queryClient.invalidateQueries({ queryKey: ["vendor-brand"] });
                                queryClient.invalidateQueries({ queryKey: ["vendor-reviews"] });
                                queryClient.invalidateQueries({ queryKey: ["vendor-stats"] });
                                queryClient.invalidateQueries({ queryKey: ["product-reviews"] });
                              }}
                            />
                          </div>
                        ) : (
                          <button
                            onClick={() => setReviewingOrderItem(item.id)}
                            className="text-xs font-heading uppercase flex items-center gap-1.5 px-3 py-1.5 border border-foreground hover:bg-foreground hover:text-background transition-colors"
                          >
                            <Star className="w-3.5 h-3.5" />
                            Review Item
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Tracking History Log */}
              <div className="mt-6 pt-4 border-t border-border-subtle">
                <h4 className="font-heading text-sm uppercase mb-4">Tracking History</h4>
                <div className="relative border-l-2 border-border-subtle ml-2 space-y-4 pb-2">
                  {(() => {
                    const trackingEvents = [
                      { label: "Order Placed", date: vo.created_at, color: "bg-secondary border-2 border-foreground" },
                      vo.confirmed_at && { label: "Order Confirmed", date: vo.confirmed_at, color: "bg-secondary border-2 border-foreground" },
                      vo.shipped_at && { label: "Shipped", date: vo.shipped_at, color: "bg-info border-2 border-background" },
                      vo.handed_to_courier_at && { label: "Handed to Courier", date: vo.handed_to_courier_at, color: "bg-info border-2 border-background" },
                      vo.for_delivery_at && { label: "Out for Delivery", date: vo.for_delivery_at, color: "bg-primary border-2 border-background" },
                      vo.delivered_at && { label: "Delivered", date: vo.delivered_at, color: "bg-success border-2 border-background" }
                    ].filter(Boolean) as { label: string; date: string; color: string }[];

                    // Sort chronologically (oldest to newest)
                    trackingEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                    return trackingEvents.map((evt, idx) => (
                      <div key={idx} className="relative pl-6">
                        <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full ${evt.color} shadow-brutal-xs`} />
                        <p className="text-sm font-bold">{evt.label}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(evt.date).toLocaleString()}
                        </p>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Final Totals & Payments Section */}
              {/* Sub-order Summary */}
              <div className="mt-6 pt-4 border-t-2 border-border-subtle space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground uppercase text-[10px] font-bold">
                    Items Subtotal
                  </span>
                  <span className="font-heading">{formatPrice(Number(vo.subtotal))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground uppercase text-[10px] font-bold">
                    Shipping Fee
                  </span>
                  <span className="font-heading">
                    {formatPrice(Number(vo.shipping_fee_original || vo.shipping_fee))}
                  </span>
                </div>
                {vo.free_shipping_applied && (
                  <div className="flex justify-between text-sm text-success">
                    <span className="uppercase text-[10px] font-bold">Free Shipping Applied</span>
                    <span className="font-heading">
                      -
                      {formatPrice(
                        Number(vo.shipping_fee_original || vo.shipping_fee) -
                          Number(vo.shipping_fee)
                      )}
                    </span>
                  </div>
                )}
                {Number(vo.discount_amount) > 0 && (
                  <div className="flex justify-between text-sm text-success">
                    <span className="uppercase text-[10px] font-bold">
                      Voucher Discount {vo.discount?.name ? `(${vo.discount.name})` : ""}
                    </span>
                    <span className="font-heading">-{formatPrice(Number(vo.discount_amount))}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2">
                  <span className="font-heading uppercase text-xs">Sub-Order Total</span>
                  <span className="font-heading">
                    {formatPrice(
                      Number(vo.subtotal) + Number(vo.shipping_fee) - Number(vo.discount_amount)
                    )}
                  </span>
                </div>
              </div>

              {/* Chat */}
              <div className="border-t border-border-subtle pt-4 mt-4 flex justify-end">
                <Link
                  to={`/account/messages?vendorOrderId=${vo.id}&otherUserId=${vo.brand?.owner_id || ""}&otherUserName=${encodeURIComponent(
                    vo.brand?.name || "Vendor"
                  )}&orderId=${orderId}&role=customer`}
                  className="inline-flex items-center gap-1.5 text-xs font-heading uppercase py-2 px-3 border-2 border-foreground hover:bg-secondary transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  Chat about Order
                </Link>
              </div>

              {/* Cancel button for cancellable orders */}
              {cancellableStatuses.includes(vo.status) && (
                <div className="border-t border-border-subtle pt-4 mt-4">
                  {showCancelConfirmId === vo.id ? (
                    <div className="space-y-3 animate-fade-in p-3 bg-destructive/10 border-2 border-destructive">
                      <p className="text-sm font-heading uppercase text-center text-destructive">
                        Cancel this order? This cannot be undone.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowCancelConfirmId(null)}
                          className="btn-brutal-secondary flex-1"
                        >
                          Keep Order
                        </button>
                        <button
                          onClick={() => handleCancelVendorOrder(vo.id)}
                          disabled={cancellingOrder === vo.id}
                          className="btn-brutal-secondary flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                        >
                          {cancellingOrder === vo.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-destructive-foreground" />
                          ) : (
                            "Confirm Cancel"
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowCancelConfirmId(vo.id)}
                      disabled={cancellingOrder === vo.id}
                      className="btn-brutal-secondary w-full flex items-center justify-center gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Cancel This Order
                    </button>
                  )}
                </div>
              )}
              {vo.status === "processing" && (
                <div className="border-t border-border-subtle pt-4 mt-4">
                  <p className="text-xs text-muted-foreground italic">
                    This order is being processed and can no longer be cancelled.
                  </p>
                </div>
              )}

              {/* Confirm Delivery Action */}
              {(vo.status === "shipped" || vo.status === "for_delivery") && (
                <div className="border-t border-border-subtle pt-4 mt-4">
                  {showConfirmId === vo.id ? (
                    <div className="space-y-3 animate-fade-in">
                      <p className="text-sm font-heading uppercase text-center text-primary">
                        Confirm that you have received this order?
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowConfirmId(null)}
                          className="btn-brutal-secondary flex-1"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleConfirmDelivery(vo.id)}
                          disabled={confirmingOrder === vo.id}
                          className="btn-brutal flex-1"
                        >
                          {confirmingOrder === vo.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Yes, Received"
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowConfirmId(vo.id)}
                      className="btn-brutal w-full flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Order Received
                    </button>
                  )}
                </div>
              )}

              {/* Buy Again Action */}
              {vo.status === "delivered" && (
                <div className="border-t border-border-subtle pt-4 mt-4">
                  <button
                    onClick={() => handleBuyAgain(vo.order_items || [])}
                    className="btn-brutal-secondary w-full flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Buy Again
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Final Grand Totals & Payments Section */}
          <div className="card-brutal p-4 md:p-6 bg-secondary mb-6">
            <h3 className="font-heading text-lg uppercase mb-4">Payment & Discount Summary</h3>

            {enrichedOrder.payments?.map((payment: any) => (
              <div
                key={payment.id}
                className="mb-4 pb-4 border-b border-foreground/10 last:border-0 last:pb-0 last:mb-0"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-heading uppercase">
                    {payment.payment_method === 0
                      ? "Cash on Delivery"
                      : payment.payment_method === 1
                        ? "GCash"
                        : "Bank Transfer"}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold border border-foreground ${
                      payment.status === "verified" ||
                      enrichedOrder.vendor_orders?.some((vo: any) =>
                        ["shipped", "for_delivery", "delivered", "confirmed"].includes(vo.status)
                      )
                        ? "bg-success"
                        : "bg-warning"
                    }`}
                  >
                    {payment.status === "verified" ||
                    enrichedOrder.vendor_orders?.some((vo: any) =>
                      ["shipped", "for_delivery", "delivered", "confirmed"].includes(vo.status)
                    )
                      ? "Verified / Paid"
                      : paymentStatusLabels[payment.status] || formatStatusLabel(payment.status)}
                  </span>
                </div>
                {payment.payment_verifications?.[0]?.proof_image_url && (
                  <PaymentProofImage path={payment.payment_verifications[0].proof_image_url} />
                )}
              </div>
            ))}

            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground uppercase text-[10px] font-bold">
                  Global Items Subtotal
                </span>
                <span className="font-heading">
                  {formatPrice(
                    Number(order.total_amount) +
                      Number(order.total_discount) -
                      Number(order.total_shipping)
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground uppercase text-[10px] font-bold">
                  Global Shipping Fee
                </span>
                <span className="font-heading">
                  {formatPrice(
                    Number(order.total_shipping) +
                      enrichedOrder.vendor_orders.reduce(
                        (acc: number, vo: any) =>
                          acc +
                          (vo.free_shipping_applied
                            ? (Number(vo.shipping_fee_original) || 0) - Number(vo.shipping_fee)
                            : 0),
                        0
                      )
                  )}
                </span>
              </div>

              {/* Specific Discount Labels */}
              {enrichedOrder.discount && (
                <div className="flex justify-between text-sm text-success">
                  <span className="uppercase text-[10px] font-bold">
                    Platform Promo ({enrichedOrder.discount.name})
                  </span>
                  <span className="font-heading">
                    -{formatPrice(Number(enrichedOrder.discount.discount_value))}
                  </span>
                </div>
              )}
              {enrichedOrder.vendor_orders?.map((vo: any) => {
                return (
                  <div key={`discount-${vo.id}`}>
                    {vo.free_shipping_applied && (
                      <div className="flex justify-between text-sm text-success mt-1">
                        <span className="uppercase text-[10px] font-bold">
                          Free Shipping ({vo.brand?.name})
                        </span>
                        <span className="font-heading">
                          -
                          {formatPrice(
                            Number(vo.shipping_fee_original || vo.shipping_fee) -
                              Number(vo.shipping_fee)
                          )}
                        </span>
                      </div>
                    )}
                    {Number(vo.discount_amount) > 0 && (
                      <div className="flex justify-between text-sm text-success mt-1">
                        <span className="uppercase text-[10px] font-bold">
                          Voucher ({vo.brand?.name}
                          {vo.discount?.name ? ` - ${vo.discount.name}` : ""})
                        </span>
                        <span className="font-heading">
                          -{formatPrice(Number(vo.discount_amount))}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-4 border-t-2 border-foreground">
              <span className="font-heading uppercase">Grand Order Total</span>
              <span className="font-heading text-xl md:text-2xl">
                {formatPrice(Number(order.total_amount))}
              </span>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link to="/account/orders" className="btn-brutal-secondary">
              Back to Orders
            </Link>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default OrderDetail;
