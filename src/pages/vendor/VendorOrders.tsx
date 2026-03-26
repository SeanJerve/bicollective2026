import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, Truck, Package, Loader2, HandMetal, MapPin, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import OrderChat from "@/components/chat/OrderChat";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// Helper to render payment proof with signed URL
const VendorPaymentProofImage = ({ path, paymentMethod }: { path: string; paymentMethod: string }) => {
  const { data: url } = useQuery({
    queryKey: ["signed-url", path],
    queryFn: async () => {
      if (path.startsWith("http")) return path;
      const { data } = await supabase.storage.from("payment-proofs").createSignedUrl(path, 3600);
      return data?.signedUrl || null;
    },
    staleTime: 30 * 60 * 1000,
  });
  if (!url) return null;
  const label = paymentMethod === "gcash" ? "GCash" : paymentMethod === "bank_transfer" ? "Bank Transfer" : "COD";
  return (
    <div className="mb-4 md:mb-6">
      <h4 className="font-heading text-xs md:text-sm uppercase mb-2">Payment Proof ({label})</h4>
      <a href={url} target="_blank" rel="noopener noreferrer">
        <img src={url} alt="Payment proof" className="w-32 h-32 object-cover border border-border-subtle" />
      </a>
    </div>
  );
};

const VendorOrders = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});
  const [updatingTracking, setUpdatingTracking] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const toggleOrder = (orderId: string) => {
    setExpandedOrder(prev => prev === orderId ? null : orderId);
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
        .select(`
          *,
          order:orders (
            id,
            customer_id,
            shipping_name,
            shipping_phone,
            shipping_address,
            notes,
            created_at
          ),
          items:order_items (
            id,
            product_name,
            product_price,
            quantity,
            size
          )
        `)
        .eq("brand_id", brand!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!brand,
  });

  const loading = brandLoading || ordersLoading;

  const updateOrderStatus = async (orderId: string, status: string, timestampField?: string) => {
    try {
      const updateData: any = { status };
      if (timestampField) {
        updateData[timestampField] = new Date().toISOString();
      }

      const { error } = await supabase
        .from("vendor_orders")
        .update(updateData)
        .eq("id", orderId);

      if (error) throw error;

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
      case "disputed":
        return "bg-warning text-warning-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filter === "all") return true;
    return o.status === filter;
  });

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
            You haven't set up your vendor store yet. Set up your store first to start receiving orders.
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
        <h1 className="font-heading text-2xl md:text-4xl uppercase">Orders</h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Manage your customer orders
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { value: "all", label: "All" },
          { value: "pending_payment", label: "Pending Payment" },
          { value: "payment_uploaded", label: "Payment Uploaded" },
          { value: "confirmed", label: "COD Confirmed" },
          { value: "paid", label: "Paid" },
          { value: "processing", label: "Processing" },
          { value: "shipped", label: "Shipped" },
          { value: "delivered", label: "Delivered" },
          { value: "cancelled", label: "Cancelled" },
          { value: "disputed", label: "Disputed" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 font-heading text-sm uppercase ${
              filter === f.value
                ? "bg-foreground text-background"
                : "bg-secondary hover:bg-accent"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filteredOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isExpanded = expandedOrder === order.id;
            
            return (
            <div key={order.id} className="card-brutal">
              <div 
                className={`p-4 md:p-6 cursor-pointer hover:bg-secondary/50 transition-colors ${isExpanded ? 'border-b border-border-subtle bg-secondary/30' : ''}`}
                onClick={() => toggleOrder(order.id)}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-heading uppercase text-sm md:text-base">
                        {order.order?.shipping_name}
                      </p>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                    {order.payment_method && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Payment: {order.payment_method === "cod" ? "COD" : order.payment_method === "gcash" ? "GCash" : "Bank Transfer"}
                      </p>
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
                    <p className="font-heading text-base md:text-lg sm:mt-2">
                      {formatPrice(Number(order.subtotal))}
                    </p>
                  </div>
                </div>
              </div>

              {isExpanded && (
              <div className="p-4 md:p-6 animate-fade-in">
                {/* Order Items */}
                <div className="mb-4 md:mb-6">
                  <h4 className="font-heading text-xs md:text-sm uppercase mb-2 md:mb-3">Items</h4>
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
                {order.order?.shipping_address && (
                  <div className="mb-4 md:mb-6 p-3 md:p-4 bg-secondary">
                    <h4 className="font-heading text-xs md:text-sm uppercase mb-2">Shipping</h4>
                    <p className="text-xs md:text-sm">{order.order?.shipping_address}</p>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      {order.order?.shipping_phone}
                    </p>
                  </div>
                )}

                {/* Payment Proof */}
                {order.payment_proof_url && (
                  <VendorPaymentProofImage path={order.payment_proof_url} paymentMethod={order.payment_method} />
                )}

                {/* Actions — Full Pipeline */}
                <div className="flex flex-wrap gap-2">
                  {order.status === "payment_uploaded" && (
                    <button
                      onClick={() => updateOrderStatus(order.id, "paid")}
                      className="btn-brutal flex items-center gap-2 text-sm"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Verify Payment
                    </button>
                  )}
                  {order.status === "confirmed" && (
                    <button
                      onClick={() => updateOrderStatus(order.id, "processing")}
                      className="btn-brutal flex items-center gap-2 text-sm"
                    >
                      <Package className="w-4 h-4" />
                      Confirm &amp; Process (COD)
                    </button>
                  )}
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
                      onClick={() => updateOrderStatus(order.id, "handed_to_courier", "handed_to_courier_at")}
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
                                description: "Please enter and save a tracking number below first.",
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
                          onClick={() => toast({ title: "Scanner unavailable", description: "The tracking scanner is not available in your region yet." })}
                          className="btn-brutal-secondary flex items-center gap-2 text-sm"
                        >
                          <MapPin className="w-4 h-4" />
                          Scan Tracking Number
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tracking Number Input */}
                {["processing", "handed_to_courier", "for_delivery", "shipped"].includes(order.status) && (
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
          <h3 className="font-heading text-xl md:text-2xl uppercase mb-4">No Orders Yet</h3>
          <p className="text-muted-foreground text-sm md:text-base">
            Orders will appear here when customers purchase your products.
          </p>
        </div>
      )}
    </div>
  );
};

export default VendorOrders;
