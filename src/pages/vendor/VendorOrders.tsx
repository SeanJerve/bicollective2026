import { useEffect, useState } from "react";
import { Eye, CheckCircle, Truck, Package, Loader2, MessageSquare } from "lucide-react";
import OrderChat from "@/components/chat/OrderChat";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const VendorOrders = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [brand, setBrand] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});
  const [updatingTracking, setUpdatingTracking] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;

      try {
        const { data: brandData } = await supabase
          .from("brands")
          .select("*")
          .eq("owner_id", user.id)
          .single();

        if (!brandData) {
          setLoading(false);
          return;
        }

        setBrand(brandData);

        const { data: ordersData } = await supabase
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
          .eq("brand_id", brandData.id)
          .order("created_at", { ascending: false });

        setOrders(ordersData || []);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  const updateOrderStatus = async (orderId: string, status: "pending_payment" | "payment_uploaded" | "paid" | "processing" | "shipped" | "delivered" | "cancelled") => {
    try {
      const { error } = await supabase
        .from("vendor_orders")
        .update({ status })
        .eq("id", orderId);

      if (error) throw error;

      // Send auto system message to buyer
      const order = orders.find((o) => o.id === orderId);
      if (order && user) {
        const statusMessages: Record<string, string> = {
          paid: "✅ Your payment has been verified. We're preparing your order!",
          processing: "📦 Your order is now being processed.",
          shipped: `🚚 Your order has been shipped! Tracking: ${order.tracking_number || "N/A"}`,
          delivered: "✅ Your order has been marked as delivered. Thank you for shopping!",
        };
        const msg = statusMessages[status];
        if (msg) {
          // Get customer_id from parent order
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

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );

      toast({
        title: "Order updated",
        description: `Order status changed to ${status.replace("_", " ")}`,
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

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, tracking_number: trackingNumber } : o))
      );

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
      case "paid":
        return "bg-success text-success-foreground";
      case "processing":
        return "bg-primary text-primary-foreground";
      case "shipped":
        return "bg-primary text-primary-foreground";
      case "delivered":
        return "bg-success text-success-foreground";
      case "cancelled":
        return "bg-destructive text-destructive-foreground";
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
          {filteredOrders.map((order) => (
            <div key={order.id} className="card-brutal">
              <div className="p-4 md:p-6 border-b border-border-subtle">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <p className="font-heading uppercase text-sm md:text-base">
                      {order.order?.shipping_name}
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
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

              <div className="p-4 md:p-6">
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
                <div className="mb-4 md:mb-6 p-3 md:p-4 bg-secondary">
                  <h4 className="font-heading text-xs md:text-sm uppercase mb-2">Shipping</h4>
                  <p className="text-xs md:text-sm">{order.order?.shipping_address}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    {order.order?.shipping_phone}
                  </p>
                </div>

                {/* Payment Proof */}
                {order.payment_proof_url && (
                  <div className="mb-4 md:mb-6">
                    <h4 className="font-heading text-xs md:text-sm uppercase mb-2">
                      Payment Proof ({order.payment_method === "gcash" ? "GCash" : order.payment_method === "bank_transfer" ? "Bank Transfer" : "COD"})
                    </h4>
                    <a href={order.payment_proof_url} target="_blank" rel="noopener noreferrer">
                      <img src={order.payment_proof_url} alt="Payment proof" className="w-32 h-32 object-cover border border-border-subtle" />
                    </a>
                  </div>
                )}

                {/* Actions */}
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
                      onClick={() => {
                        if (!order.tracking_number) {
                          toast({
                            title: "Tracking number required",
                            description: "Please enter and save a tracking number before marking as shipped",
                            variant: "destructive",
                          });
                          return;
                        }
                        updateOrderStatus(order.id, "shipped");
                      }}
                      className={`btn-brutal flex items-center gap-2 text-sm ${!order.tracking_number ? "opacity-60" : ""}`}
                    >
                      <Truck className="w-4 h-4" />
                      Mark as Shipped
                    </button>
                  )}
                  {order.status === "shipped" && (
                    <button
                      onClick={() => updateOrderStatus(order.id, "delivered")}
                      className="btn-brutal flex items-center gap-2 text-sm"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Mark as Delivered
                    </button>
                  )}
                </div>

                {/* Tracking Number Input */}
                {(order.status === "processing" || order.status === "shipped") && (
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
            </div>
          ))}
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
