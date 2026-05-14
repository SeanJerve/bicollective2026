import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  Truck,
  Package,
  Loader2,
  HandMetal,
  MapPin,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Image,
  ExternalLink,
  X,
} from "lucide-react";
import OrderChat from "@/components/chat/OrderChat";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// Helper to render payment proof with signed URL
const VendorPaymentProofImage = ({
  path,
  paymentMethod,
}: {
  path: string;
  paymentMethod: string;
}) => {
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const { data: url } = useQuery({
    queryKey: ["payment-proof", path],
    queryFn: async () => {
      if (!path) return null;
      const { data, error } = await supabase.storage
        .from("payment-proofs")
        .createSignedUrl(path, 3600);
      if (error) throw error;
      return data.signedUrl;
    },
    enabled: !!path,
  });

  if (!url) return null;

  return (
    <div className="mt-4 md:mt-6 border-2 border-foreground p-3 md:p-4 bg-secondary">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
        <h4 className="font-heading text-xs md:text-sm uppercase flex items-center gap-2">
          <Image className="w-4 h-4" />
          Proof of Payment ({paymentMethod.replace(/_/g, " ")})
        </h4>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] md:text-xs font-heading uppercase text-foreground hover:underline flex items-center gap-1 bg-background px-2 py-1 border border-foreground"
        >
          View Full Image <ExternalLink className="w-3 h-3" />
        </a>
      </div>
      <div
        className="relative aspect-video md:aspect-auto md:h-48 overflow-hidden border border-border-subtle cursor-pointer group"
        onClick={() => setViewingImage(url)}
      >
        <img
          src={url}
          alt="Payment Proof"
          className="w-full h-full object-contain bg-background transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <span className="bg-background px-3 py-1.5 border border-foreground font-heading text-[10px] uppercase shadow-brutal">
            Click to focus
          </span>
        </div>
      </div>

      {/* Modal View */}
      {viewingImage && (
        <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm p-4 md:p-12 flex flex-col animate-in fade-in zoom-in duration-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-heading text-lg md:text-xl uppercase">Proof Preview</h3>
            <button
              onClick={() => setViewingImage(null)}
              className="p-2 border-2 border-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 min-h-0 border-4 border-foreground bg-secondary flex items-center justify-center relative shadow-brutal-lg">
            <img
              src={viewingImage}
              alt="Full Proof"
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <div className="mt-6 flex justify-center">
            <button onClick={() => setViewingImage(null)} className="btn-brutal px-12">
              CLOSE PREVIEW
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Filter definition
type FilterValue =
  | "all"
  | "pending_payment"
  | "payment_uploaded"
  | "confirmed"
  | "processing"
  | "paid_delivered"
  | "cancelled";

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending_payment", label: "Pending Payment" },
  { value: "payment_uploaded", label: "Payment Uploaded" },
  { value: "confirmed", label: "COD Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "paid_delivered", label: "Paid / Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

// Statuses that map to each filter tab
const PROCESSING_STATUSES = ["paid", "processing", "handed_to_courier", "shipped", "for_delivery"];
const PAID_DELIVERED_STATUSES = ["delivered"];

const matchesFilter = (status: string, filter: FilterValue): boolean => {
  if (filter === "all") return true;
  if (filter === "processing") return PROCESSING_STATUSES.includes(status);
  if (filter === "paid_delivered") return PAID_DELIVERED_STATUSES.includes(status);
  return status === filter;
};

const VendorOrders = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterValue>("all");
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});
  const [updatingTracking, setUpdatingTracking] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [refusingOrderId, setRefusingOrderId] = useState<string | null>(null);

  const toggleOrder = (orderId: string) => {
    setExpandedOrder((prev) => (prev === orderId ? null : orderId));
  };

  const { data: brand, isLoading: brandLoading } = useQuery({
    queryKey: ["vendor-brand", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("*")
        .eq("owner_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["vendor-orders", brand?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_orders")
        .select("*")
        .eq("brand_id", brand!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!brand,
  });

  // 1. Fetch parent orders in batch
  const orderIds = useMemo(() => Array.from(new Set(orders.map((vo) => vo.order_id))), [orders]);
  const { data: parentOrders = {} } = useQuery({
    queryKey: ["vendor-order-parents", orderIds],
    queryFn: async () => {
      if (orderIds.length === 0) return {};
      const { data, error } = await supabase.from("orders").select("*").in("id", orderIds);
      if (error) throw error;
      return (data || []).reduce((acc: any, o: any) => ({ ...acc, [o.id]: o }), {});
    },
    enabled: orderIds.length > 0,
  });

  // 2. Fetch payments for those orders in batch
  const { data: orderPayments = {} } = useQuery({
    queryKey: ["vendor-order-payments", orderIds],
    queryFn: async () => {
      if (orderIds.length === 0) return {};
      const { data, error } = await supabase.from("payments").select("*").in("order_id", orderIds);
      if (error) throw error;
      const map: any = {};
      (data || []).forEach((p: any) => {
        if (!map[p.order_id]) map[p.order_id] = [];
        map[p.order_id].push(p);
      });
      return map;
    },
    enabled: orderIds.length > 0,
  });

  // 2a. Fetch verifications for those payments in batch
  const paymentIds = useMemo(() => {
    return Array.from(
      new Set(
        Object.values(orderPayments)
          .flat()
          .map((p: any) => p.id)
      )
    ) as string[];
  }, [orderPayments]);

  const { data: paymentVerifications = {} } = useQuery({
    queryKey: ["vendor-payment-verifications", paymentIds],
    queryFn: async () => {
      if (paymentIds.length === 0) return {};
      const { data, error } = await supabase
        .from("payment_verifications")
        .select("*")
        .in("payment_id", paymentIds);
      if (error) throw error;
      const map: any = {};
      (data || []).forEach((v: any) => {
        if (!map[v.payment_id]) map[v.payment_id] = [];
        map[v.payment_id].push(v);
      });
      return map;
    },
    enabled: paymentIds.length > 0,
  });

  // 3. Fetch items for all vendor_orders in batch
  const vendorOrderIds = useMemo(() => orders.map((vo) => vo.id), [orders]);
  const { data: vendorOrderItems = {} } = useQuery({
    queryKey: ["vendor-order-items", vendorOrderIds],
    queryFn: async () => {
      if (vendorOrderIds.length === 0) return {};
      const { data, error } = await supabase
        .from("order_items")
        .select("*")
        .in("vendor_order_id", vendorOrderIds);
      if (error) throw error;
      const map: any = {};
      (data || []).forEach((item: any) => {
        if (!map[item.vendor_order_id]) map[item.vendor_order_id] = [];
        map[item.vendor_order_id].push(item);
      });
      return map;
    },
    enabled: vendorOrderIds.length > 0,
  });

  // 4. Batch fetch addresses for orders
  const addressIds = useMemo(() => {
    return Array.from(
      new Set(
        Object.values(parentOrders)
          .map((o: any) => o.shipping_address_id)
          .filter(Boolean)
      )
    ) as string[];
  }, [parentOrders]);

  const { data: orderAddresses = {}, isLoading: addressesLoading } = useQuery({
    queryKey: ["vendor-order-addresses", addressIds],
    queryFn: async () => {
      if (addressIds.length === 0) return {};
      const { data, error } = await supabase.from("addresses").select("*").in("id", addressIds);
      if (error) throw error;
      return (data || []).reduce((acc: any, addr: any) => ({ ...acc, [addr.id]: addr }), {});
    },
    enabled: addressIds.length > 0,
  });

  // 5. Build enriched vendor orders for the UI
  const enrichedOrders = useMemo(() => {
    return orders.map((vo) => {
      const parent = parentOrders[vo.order_id];
      const payments = (orderPayments[vo.order_id] || []).map((p: any) => ({
        ...p,
        payment_verifications: paymentVerifications[p.id] || [],
      }));

      return {
        ...vo,
        order: parent
          ? {
              ...parent,
              payments,
            }
          : null,
        items: vendorOrderItems[vo.id] || [],
      };
    });
  }, [orders, parentOrders, orderPayments, paymentVerifications, vendorOrderItems]);

  const loading = brandLoading || ordersLoading || addressesLoading;

  const updateOrderStatus = async (orderId: string, status: string, timestampField?: string) => {
    try {
      const updateData: any = { status };
      if (timestampField) {
        updateData[timestampField] = new Date().toISOString();
      }

      const { error } = await supabase.from("vendor_orders").update(updateData).eq("id", orderId);

      if (error) throw error;

      // --- 3NF AUTO-VERIFICATION SYNC ---
      // If vendor confirms/ships, auto-verify the payment in 3NF
      if (["confirmed", "paid", "processing", "shipped"].includes(status)) {
        const order = orders.find((o) => o.id === orderId);
        if (order) {
          // Correctly access the orderPayments MAP (it's not an array)
          const payments = (orderPayments as any)[order.order_id] || [];
          const payment = payments[0]; // Take the primary payment

          if (payment && payment.status !== "verified") {
            await supabase.from("payments").update({ status: "verified" }).eq("id", payment.id);

            // Also notify the verification table (it's also a MAP)
            const verifications = (paymentVerifications as any)[payment.id] || [];
            const verification = verifications[0];

            if (verification && !verification.verified_at) {
              await supabase
                .from("payment_verifications")
                .update({ verified_at: new Date().toISOString() })
                .eq("id", verification.id);
            }
          }
        }
      }
      // ----------------------------------

      // Send auto system message to buyer
      const order = orders.find((o) => o.id === orderId);
      if (order && user) {
        const statusMessages: Record<string, string> = {
          paid: "✅ Your payment has been verified. We're preparing your order!",
          processing: "📦 Your order is now being processed.",
          confirmed: "✅ Your order has been confirmed!",
          handed_to_courier: "📦 Your order has been handed to the courier.",
          shipped: "🚚 Your order is on its way!",
          delivered: "✅ Your order has been delivered. Thank you for shopping!",
        };
        const msg = statusMessages[status];
        if (msg) {
          const { data: parentOrder } = await supabase
            .from("orders")
            .select("customer_id")
            .eq("id", order.order_id)
            .single();

          if (parentOrder) {
            await supabase.from("messages").insert({
              sender_id: user.id,
              receiver_id: parentOrder.customer_id,
              vendor_order_id: orderId,
              content: msg,
              is_system_message: true,
            });
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ["vendor-orders", brand?.id] });

      toast({
        title: "Order updated",
        description: `Order status changed to ${status.replace(/_/g, " ")}`,
      });
    } catch (error) {
      console.error("Error updating order:", error);
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive",
      });
    }
  };

  const handleRefusePayment = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("vendor_orders")
        .update({ status: "pending_payment" }) // Removed non-existent payment_proof_url column
        .eq("id", orderId);

      if (error) throw error;

      const order = orders.find((o) => o.id === orderId);
      if (order && user) {
        const { data: parentOrder } = await supabase
          .from("orders")
          .select("customer_id")
          .eq("id", order.order_id)
          .single();

        if (parentOrder) {
          await supabase.from("messages").insert({
            sender_id: user.id,
            receiver_id: parentOrder.customer_id,
            vendor_order_id: orderId,
            content:
              "❌ Your payment proof was not accepted. Please re-upload a clear screenshot of your payment and try again.",
            is_system_message: true,
          });
        }
      }

      queryClient.invalidateQueries({ queryKey: ["vendor-orders", brand?.id] });
      setRefusingOrderId(null);

      toast({
        title: "Payment refused",
        description: "The customer has been notified to re-upload their proof.",
      });
    } catch (error) {
      console.error("Error refusing payment:", error);
      toast({
        title: "Error",
        description: "Failed to refuse payment",
        variant: "destructive",
      });
    }
  };

  const updateTrackingNumber = async (orderId: string) => {
    const trackingNumber = trackingInputs[orderId]?.trim();
    if (!trackingNumber) {
      toast({
        title: "Enter tracking number",
        description: "Please enter a tracking number",
        variant: "destructive",
      });
      return;
    }

    setUpdatingTracking(orderId);

    try {
      const { error } = await supabase
        .from("vendor_orders")
        .update({ tracking_number: trackingNumber })
        .eq("id", orderId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["vendor-orders", brand?.id] });

      toast({
        title: "Tracking updated",
        description: "Tracking number has been saved",
      });
    } catch (error) {
      console.error("Error updating tracking:", error);
      toast({
        title: "Error",
        description: "Failed to update tracking number",
        variant: "destructive",
      });
    } finally {
      setUpdatingTracking(null);
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending_payment":
        return "bg-muted text-muted-foreground";
      case "payment_uploaded":
        return "bg-secondary text-secondary-foreground border-2 border-foreground";
      case "confirmed":
        return "bg-info text-info-foreground";
      case "paid":
        return "bg-success text-success-foreground";
      case "processing":
        return "bg-primary text-primary-foreground";
      case "handed_to_courier":
        return "bg-primary text-primary-foreground";
      case "shipped":
        return "bg-primary text-primary-foreground";
      case "for_delivery":
        return "bg-primary text-primary-foreground";
      case "delivered":
        return "bg-success text-success-foreground";
      case "cancelled":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const filteredOrders = enrichedOrders.filter((order) => matchesFilter(order.status, filter));

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 skeleton-brutal" />
          <div className="h-64 skeleton-brutal" />
        </div>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="p-4 md:p-8">
        <div className="card-brutal p-6 md:p-8 text-center">
          <AlertCircle className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="font-heading text-xl md:text-2xl uppercase mb-4">No Store Found</h2>
          <p className="text-muted-foreground mb-6 text-sm md:text-base">
            You haven't set up your vendor store yet. Set up your store first to start receiving
            orders.
          </p>
          <Link to="/vendor/store" className="btn-brutal">
            Set Up Store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="font-heading text-2xl md:text-4xl uppercase">Manage Customer Orders</h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Track and manage your customer orders
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map((f) => {
          const count = orders.filter((o) => matchesFilter(o.status, f.value)).length;
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-2 font-heading text-xs uppercase flex items-center gap-1.5 ${
                filter === f.value
                  ? "bg-foreground text-background"
                  : "bg-secondary hover:bg-accent"
              }`}
            >
              {f.label}
              {f.value !== "all" && count > 0 && (
                <span
                  className={`min-w-[18px] h-[18px] text-[10px] font-bold flex items-center justify-center rounded-full px-1 ${
                    filter === f.value
                      ? "bg-background text-foreground"
                      : "bg-foreground text-background"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {filteredOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isExpanded = expandedOrder === order.id;

            return (
              <div key={order.id} className="card-brutal">
                <div
                  className={`p-4 md:p-6 cursor-pointer hover:bg-secondary/50 transition-colors ${isExpanded ? "border-b border-border-subtle bg-secondary/30" : ""}`}
                  onClick={() => toggleOrder(order.id)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-heading uppercase text-sm md:text-base">
                          <span className="font-heading uppercase">Shipping Address:</span>{" "}
                          {order.order?.shipping_name || "Customer"}:{" "}
                          {orderAddresses[order.order?.shipping_address_id]
                            ? `${orderAddresses[order.order.shipping_address_id].street}, ${orderAddresses[order.order.shipping_address_id].barangay}, ${orderAddresses[order.order.shipping_address_id].city}`
                            : order.order?.shipping_address || "Address snapshot"}
                        </p>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-xs md:text-sm text-muted-foreground mt-1">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                      {order.order?.payments?.[0] && (
                        <>
                          <p className="text-xs text-muted-foreground mt-1">
                            Phone:{" "}
                            {orderAddresses[order.order?.shipping_address_id]?.phone ||
                              order.order?.shipping_phone ||
                              "N/A"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Payment:{" "}
                            {order.order.payments[0].payment_method === 0
                              ? "COD"
                              : order.order.payments[0].payment_method === 1
                                ? "GCash"
                                : "Bank Transfer"}
                          </p>
                        </>
                      )}
                    </div>
                    <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-0">
                      <span
                        className={`inline-block px-2 md:px-3 py-1 text-xs uppercase ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status.replace(/_/g, " ")}
                      </span>
                      {order.order?.payments?.[0] && (
                        <span
                          className={`inline-block px-2 py-0.5 mt-1 text-[10px] font-bold border border-foreground ${
                            order.order.payments[0].status === "verified" ||
                            ["shipped", "for_delivery", "delivered", "confirmed"].includes(
                              order.status
                            )
                              ? "bg-success"
                              : "bg-warning"
                          }`}
                        >
                          {order.order.payments[0].status === "verified" ||
                          ["shipped", "for_delivery", "delivered", "confirmed"].includes(
                            order.status
                          )
                            ? "PAID"
                            : "WAITING VERIFICATION"}
                        </span>
                      )}
                      <p className="font-heading text-base md:text-lg sm:mt-2 text-right">
                        {formatPrice(
                          Number(order.subtotal) +
                            Number(order.shipping_fee || 0) -
                            Number(order.discount_amount || 0)
                        )}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase font-heading text-right">
                        Vendor Total
                      </p>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 md:p-6 animate-fade-in">
                    {/* Order Items */}
                    <div className="mb-4 md:mb-6">
                      <h4 className="font-heading text-xs md:text-sm uppercase mb-2 md:mb-3">
                        Items
                      </h4>
                      <div className="space-y-2">
                        {order.items?.map((item: any) => (
                          <div key={item.id} className="flex justify-between text-xs md:text-sm">
                            <span>
                              {item.product_name} x{item.quantity}
                              {item.size && ` (${item.size})`}
                            </span>
                            <span>{formatPrice(Number(item.product_price) * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Shipping Info */}
                    {(order.order?.shipping_address_id || order.order?.shipping_address) && (
                      <div className="mb-4 md:mb-6 p-3 md:p-4 bg-secondary">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-heading text-xs md:text-sm uppercase mb-2">
                              Shipping Information
                            </h4>
                            <p className="text-xs md:text-sm">
                              {orderAddresses[order.order?.shipping_address_id] ? (
                                <span className="font-medium text-foreground">
                                  {orderAddresses[order.order.shipping_address_id].street},{" "}
                                  {orderAddresses[order.order.shipping_address_id].barangay},{" "}
                                  {orderAddresses[order.order.shipping_address_id].city},{" "}
                                  {orderAddresses[order.order.shipping_address_id].province}{" "}
                                  {orderAddresses[order.order.shipping_address_id].zip_code}
                                </span>
                              ) : (
                                <span className="text-muted-foreground italic">
                                  {order.order?.shipping_address || "Address snapshot"}
                                </span>
                              )}
                            </p>
                            <p className="text-xs md:text-sm text-muted-foreground mt-1">
                              Recipient:{" "}
                              {orderAddresses[order.order?.shipping_address_id]?.full_name ||
                                order.order?.shipping_name}{" "}
                              | Phone:{" "}
                              {orderAddresses[order.order?.shipping_address_id]?.phone ||
                                order.order?.shipping_phone}
                            </p>
                          </div>
                          <div>
                            <h4 className="font-heading text-xs md:text-sm uppercase mb-2">
                              Payment Details
                            </h4>
                            <div className="space-y-1 text-xs md:text-sm">
                              <div className="flex justify-between">
                                <span>Items Subtotal:</span>
                                <span>{formatPrice(order.subtotal)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Shipping Fee:</span>
                                <span>{formatPrice(order.shipping_fee || 0)}</span>
                              </div>
                              {Number(order.discount_amount) > 0 && (
                                <div className="flex justify-between text-destructive">
                                  <span>Voucher Deduction:</span>
                                  <span>-{formatPrice(order.discount_amount)}</span>
                                </div>
                              )}
                              <div className="flex justify-between pt-1 border-t border-border-subtle font-bold">
                                <span className="uppercase text-[10px] md:text-xs tracking-wider">
                                  Your Total:
                                </span>
                                <span>
                                  {formatPrice(
                                    Number(order.subtotal) +
                                      Number(order.shipping_fee || 0) -
                                      Number(order.discount_amount || 0)
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Payment Proof Discovery (Dual Path) */}
                    {(() => {
                      const verifications = Object.values(order.order?.payments || [])
                        .flatMap((p: any) => p.payment_verifications || [])
                        .map((v: any) => v.proof_image_url)
                        .filter(Boolean);
                      const legacyPath = (order as any).payment_proof_url;
                      const finalPath = verifications[0] || legacyPath;
                      const hasProof = !!finalPath;
                      const isUploaded = order.status === "payment_uploaded";

                      if (!hasProof && isUploaded) {
                        return (
                          <div className="mt-4 p-3 border-2 border-warning bg-warning/5 animate-pulse">
                            <p className="text-[10px] font-heading uppercase text-warning flex items-center gap-2">
                              <AlertCircle className="w-3 h-3" />
                              Status: Payment Uploaded | Data Source: Missing Proof Path
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              The system hasn't found an image record in the database for this order
                              yet.
                            </p>
                          </div>
                        );
                      }

                      if (hasProof) {
                        return (
                          <VendorPaymentProofImage
                            path={finalPath}
                            paymentMethod={
                              order.order?.payments?.[0]?.payment_method === 1
                                ? "gcash"
                                : "bank_transfer"
                            }
                          />
                        );
                      }

                      return null;
                    })()}

                    {/* Actions — Full Pipeline */}
                    <div className="flex flex-wrap gap-2 mt-6">
                      {/* GCash/Bank: Accept OR Refuse when proof uploaded */}
                      {order.status === "payment_uploaded" &&
                        order.order?.payments?.[0]?.payment_method !== 0 && (
                          <div className="w-full space-y-2">
                            {refusingOrderId === order.id ? (
                              <div className="p-3 border-2 border-destructive bg-destructive/10 animate-fade-in">
                                <p className="text-xs font-heading uppercase text-destructive mb-2">
                                  Refuse this payment? The customer will be notified to resubmit.
                                </p>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setRefusingOrderId(null)}
                                    className="flex-1 btn-brutal-secondary text-xs"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleRefusePayment(order.id)}
                                    className="flex-1 btn-brutal bg-destructive text-destructive-foreground text-xs flex items-center justify-center gap-1"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    Confirm Refuse
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                <button
                                  onClick={() => updateOrderStatus(order.id, "paid")}
                                  className="btn-brutal flex items-center gap-2 text-sm"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  Accept Payment
                                </button>
                                <button
                                  onClick={() => setRefusingOrderId(order.id)}
                                  className="flex items-center gap-2 px-4 py-2 border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors font-heading text-sm uppercase"
                                >
                                  <XCircle className="w-4 h-4" />
                                  Refuse Payment
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                      {/* COD confirmed → process */}
                      {order.status === "confirmed" && (
                        <button
                          onClick={() => updateOrderStatus(order.id, "processing")}
                          className="btn-brutal flex items-center gap-2 text-sm"
                        >
                          <Package className="w-4 h-4" />
                          Confirm & Process (COD)
                        </button>
                      )}

                      {/* Paid (GCash/Bank verified) → start processing */}
                      {order.status === "paid" && (
                        <button
                          onClick={() => updateOrderStatus(order.id, "processing")}
                          className="btn-brutal flex items-center gap-2 text-sm"
                        >
                          <Package className="w-4 h-4" />
                          Start Processing
                        </button>
                      )}

                      {order.status === "processing" && (
                        <button
                          onClick={() =>
                            updateOrderStatus(order.id, "handed_to_courier", "handed_to_courier_at")
                          }
                          className="btn-brutal flex items-center gap-2 text-sm"
                        >
                          <HandMetal className="w-4 h-4" />
                          Hand to Courier
                        </button>
                      )}

                      {order.status === "handed_to_courier" && (
                        <div className="w-full space-y-3">
                          {!order.tracking_number && (
                            <div className="p-3 bg-warning/10 border border-warning text-warning text-xs uppercase font-heading">
                              Please add a tracking number below before shipping
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => {
                                if (!order.tracking_number) {
                                  toast({
                                    title: "Tracking number required",
                                    description:
                                      "Please enter and save a tracking number below first.",
                                    variant: "destructive",
                                  });
                                  return;
                                }
                                updateOrderStatus(order.id, "shipped", "shipped_at");
                              }}
                              className={`btn-brutal flex items-center gap-2 text-sm ${!order.tracking_number ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                              <Truck className="w-4 h-4" />
                              Order Shipped
                            </button>
                            <button
                              onClick={() =>
                                toast({
                                  title: "Scanner unavailable",
                                  description:
                                    "The tracking scanner is not available in your region yet.",
                                })
                              }
                              className="btn-brutal-secondary flex items-center gap-2 text-sm"
                            >
                              <MapPin className="w-4 h-4" />
                              Scan Tracking Number
                            </button>
                          </div>
                        </div>
                      )}

                      {["shipped", "for_delivery"].includes(order.status) && (
                        <div className="w-full mt-2">
                          <button
                            onClick={() => updateOrderStatus(order.id, "delivered", "delivered_at")}
                            className="btn-brutal bg-success text-success-foreground flex items-center gap-2 text-sm"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Mark as Delivered
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Tracking Number Input */}
                    {["processing", "handed_to_courier", "for_delivery", "shipped"].includes(
                      order.status
                    ) && (
                      <div className="mt-4 pt-4 border-t border-border-subtle">
                        <h4 className="font-heading text-xs md:text-sm uppercase mb-2">
                          Tracking Number
                        </h4>
                        {order.tracking_number ? (
                          <p className="text-sm font-mono bg-secondary px-3 py-2 inline-block">
                            {order.tracking_number}
                          </p>
                        ) : (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={trackingInputs[order.id] || ""}
                              onChange={(e) =>
                                setTrackingInputs({ ...trackingInputs, [order.id]: e.target.value })
                              }
                              placeholder="Enter tracking number"
                              className="input-brutal flex-1 text-sm"
                            />
                            <button
                              onClick={() => updateTrackingNumber(order.id)}
                              disabled={updatingTracking === order.id}
                              className="btn-brutal-secondary text-sm flex items-center gap-2"
                            >
                              {updatingTracking === order.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                "Save"
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Chat with buyer */}
                    <div className="mt-4 pt-4 border-t border-border-subtle flex justify-end">
                      <OrderChat
                        vendorOrderId={order.id}
                        otherUserId={order.order?.customer_id || ""}
                        otherUserName={order.order?.shipping_name || "Customer"}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card-brutal p-8 md:p-12 text-center">
          <h3 className="font-heading text-xl md:text-2xl uppercase mb-4">No Orders</h3>
          <p className="text-muted-foreground text-sm md:text-base">
            {filter === "all"
              ? "Orders will appear here when customers purchase your products."
              : `No orders with status "${FILTERS.find((f) => f.value === filter)?.label}".`}
          </p>
        </div>
      )}
    </div>
  );
};

export default VendorOrders;
