import { useState } from "react";
import { Link } from "react-router-dom";
import { Package, ChevronRight, XCircle, Loader2, RotateCcw } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  pending_payment: "bg-warning text-warning-foreground",
  payment_uploaded: "bg-info text-info-foreground",
  paid: "bg-info text-info-foreground",
  confirmed: "bg-info text-info-foreground",
  processing: "bg-info text-info-foreground",
  handed_to_courier: "bg-primary text-primary-foreground",
  for_delivery: "bg-primary text-primary-foreground",
  shipped: "bg-primary text-primary-foreground",
  delivered: "bg-success text-success-foreground",
  cancelled: "bg-destructive text-destructive-foreground",
  disputed: "bg-destructive text-destructive-foreground",
};

const statusLabels: Record<string, string> = {
  pending_payment: "Pending Payment",
  payment_uploaded: "Payment Uploaded",
  paid: "Paid",
  confirmed: "Order Confirmed",
  processing: "Processing",
  handed_to_courier: "Handed to Courier",
  for_delivery: "For Delivery",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  disputed: "Disputed",
};

const Orders = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [cancellingOrder, setCancellingOrder] = useState<string | null>(null);
  const [buyingAgain, setBuyingAgain] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [limit, setLimit] = useState(5);

  const filters = [
    { label: "All", value: "all" },
    { label: "To Pay", value: "pending_payment" },
    { label: "To Ship", value: "paid_confirmed" },
    { label: "To Receive", value: "to_receive" },
    { label: "Completed", value: "delivered" },
    { label: "Cancelled", value: "cancelled" },
  ];

  const cancellableStatuses = ["pending_payment", "payment_uploaded", "confirmed"];

  const [showConfirmId, setShowConfirmId] = useState<string | null>(null);

  const handleCancelOrder = async (orderId: string, vendorOrders: any[]) => {
    setCancellingOrder(orderId);
    try {
      for (const vo of vendorOrders) {
        if (cancellableStatuses.includes(vo.status)) {
          const { error } = await supabase
            .from("vendor_orders")
            .update({ status: "cancelled" })
            .eq("id", vo.id);
          if (error) throw error;
        }
      }
      toast({ title: "Order cancelled", description: "Your order has been cancelled successfully." });
      queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
      setShowConfirmId(null);
    } catch (err) {
      console.error("Cancel error:", err);
      toast({ title: "Error", description: "Failed to cancel order.", variant: "destructive" });
    } finally {
      setCancellingOrder(null);
    }
  };

  const handleBuyAgain = async (e: React.MouseEvent, orderId: string, vendorOrders: any[]) => {
    e.preventDefault();
    e.stopPropagation();
    setBuyingAgain(orderId);
    try {
      let added = 0;
      for (const vo of vendorOrders) {
        for (const item of vo.order_items || []) {
          if (item.product_id) {
            await addToCart(item.product_id, 1, item.size || undefined);
            added++;
          }
        }
      }
      if (added > 0) {
        toast({ title: "Items added to cart", description: `Added ${added} item(s) to your cart.` });
      } else {
        toast({ title: "Notice", description: "No items could be ordered again.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to add items to cart." });
    } finally {
      setBuyingAgain(null);
    }
  };

  const { data: orders, isLoading } = useQuery({
    queryKey: ["customer-orders", user?.id],
    queryFn: async () => {
      let supabaseQuery = supabase
        .from("orders")
        .select(`
          *,
          vendor_orders!inner(
            id,
            status,
            subtotal,
            tracking_number,
            brand:brands(name, logo_url),
            order_items(product_id, product_name, product_price, size, quantity)
          )
        `)
        .eq("customer_id", user!.id);

      if (filter !== "all") {
        if (filter === "paid_confirmed") {
          supabaseQuery = supabaseQuery.filter("vendor_orders.status", "in", '("paid","confirmed","processing")');
        } else if (filter === "to_receive") {
          supabaseQuery = supabaseQuery.filter("vendor_orders.status", "in", '("handed_to_courier","for_delivery","shipped")');
        } else {
          supabaseQuery = supabaseQuery.eq("vendor_orders.status", filter as any);
        }
      }

      const { data, error } = await supabaseQuery
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Secondary filter in JS for categories that match multiple raw statuses
      let filteredData = data || [];
      if (filter === "paid_confirmed") {
        filteredData = filteredData.filter(o => o.vendor_orders.some((vo: any) => ["paid", "confirmed", "processing"].includes(vo.status)));
      } else if (filter === "to_receive") {
        filteredData = filteredData.filter(o => o.vendor_orders.some((vo: any) => ["handed_to_courier", "for_delivery", "shipped"].includes(vo.status)));
      } else if (filter !== "all") {
        filteredData = filteredData.filter(o => o.vendor_orders.some((vo: any) => (vo.status as string) === filter));
      }

      return filteredData;
    },
    enabled: !!user,
  });

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount);

  if (!user) {
    return (
      <PageLayout>
        <div className="section-container py-12 text-center">
          <p className="text-muted-foreground">Please log in to view your orders.</p>
          <Link to="/login" className="btn-brutal mt-4 inline-block">
            Sign In
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
            <span>My Orders</span>
          </nav>
          <h1 className="font-heading text-4xl md:text-6xl uppercase">My Orders</h1>
        </div>
      </section>

      <section className="py-4 border-b-2 border-foreground bg-secondary/20 overflow-x-auto scrollbar-hide">
        <div className="section-container flex gap-2 md:gap-4 no-wrap pb-2">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => { setFilter(f.value); setLimit(5); }}
              className={`px-4 py-2 text-xs md:text-sm font-heading uppercase whitespace-nowrap border-2 transition-colors ${
                filter === f.value ? "bg-foreground text-background border-foreground" : "bg-background text-muted-foreground border-transparent hover:border-foreground/20"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </section>

      <section className="py-8 md:py-12">
        <div className="section-container max-w-4xl">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="card-brutal p-6 skeleton-brutal h-32" />
              ))}
            </div>
          ) : orders && orders.length > 0 ? (
            <div className="space-y-4">
              {orders.slice(0, limit).map((order) => {
                const overallStatus =
                  order.vendor_orders?.[0]?.status || "pending_payment";
                const canCancel = order.vendor_orders?.some((vo: any) =>
                  cancellableStatuses.includes(vo.status)
                );
                return (
                  <div key={order.id} className="card-brutal hover:shadow-brutal-hover transition-shadow">
                    <Link
                      to={`/account/orders/${order.id}`}
                      className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 block"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-secondary flex items-center justify-center flex-shrink-0">
                          <Package className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-heading text-sm uppercase">
                            Order #{order.id.slice(0, 8)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(order.created_at), "PPP")}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {order.vendor_orders?.map((vo: any) => (
                              <span
                                key={vo.id}
                                className="text-xs bg-secondary px-2 py-0.5"
                              >
                                {vo.brand?.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-heading">{formatPrice(Number(order.total_amount))}</p>
                          <span
                            className={`inline-block mt-1 px-2 py-0.5 text-xs uppercase ${
                              statusColors[overallStatus] || "bg-secondary"
                            }`}
                          >
                            {statusLabels[overallStatus] || overallStatus}
                          </span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </Link>
                    {canCancel && (
                      <div className="px-4 md:px-6 pb-4 md:pb-6 pt-0 border-t border-border-subtle pt-4">
                        {showConfirmId === order.id ? (
                          <div className="space-y-3 animate-fade-in p-3 bg-destructive/10 border-2 border-destructive">
                             <p className="text-sm font-heading uppercase text-center text-destructive">
                              Cancel this entire order? This cannot be undone.
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowConfirmId(null); }}
                                className="btn-brutal-secondary flex-1"
                              >
                                Keep Order
                              </button>
                              <button
                                onClick={(e) => { 
                                  e.preventDefault(); 
                                  e.stopPropagation(); 
                                  handleCancelOrder(order.id, order.vendor_orders || []);
                                }}
                                disabled={cancellingOrder === order.id}
                                className="btn-brutal-secondary flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                              >
                                {cancellingOrder === order.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin text-destructive-foreground" />
                                ) : (
                                  "Confirm Cancel"
                                )}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowConfirmId(order.id); }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors font-heading uppercase"
                          >
                            <XCircle className="w-4 h-4" />
                            Cancel Entire Order
                          </button>
                        )}
                      </div>
                    )}
                    {overallStatus === "delivered" && (
                      <div className="px-4 md:px-6 pb-4 md:pb-6 pt-0">
                        <button
                          onClick={(e) => handleBuyAgain(e, order.id, order.vendor_orders || [])}
                          disabled={buyingAgain === order.id}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm border-2 border-primary text-foreground hover:bg-secondary transition-colors font-heading uppercase"
                        >
                          {buyingAgain === order.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RotateCcw className="w-4 h-4" />
                          )}
                          Buy Again
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              
              {orders.length > limit && (
                <div className="pt-6 text-center">
                  <button 
                    onClick={() => setLimit(prev => prev + 5)}
                    className="btn-brutal px-8 py-3 text-sm"
                  >
                    See More Orders
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="card-brutal p-12 text-center">
              <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="font-heading text-xl uppercase mb-2">No Orders Yet</h2>
              <p className="text-muted-foreground mb-6">
                Once you make a purchase, your orders will appear here.
              </p>
              <Link to="/products" className="btn-brutal">
                Start Shopping
              </Link>
            </div>
          )}
        </div>
      </section>
    </PageLayout>
  );
};

export default Orders;
