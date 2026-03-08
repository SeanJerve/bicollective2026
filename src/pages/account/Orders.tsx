import { useState } from "react";
import { Link } from "react-router-dom";
import { Package, ChevronRight, XCircle, Loader2 } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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

  const { data: orders, isLoading } = useQuery({
    queryKey: ["customer-orders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          vendor_orders(
            id,
            status,
            subtotal,
            tracking_number,
            brand:brands(name)
          )
        `)
        .eq("customer_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
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
              {orders.map((order) => {
                const overallStatus =
                  order.vendor_orders?.[0]?.status || "pending_payment";
                return (
                  <Link
                    key={order.id}
                    to={`/account/orders/${order.id}`}
                    className="card-brutal p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-brutal-hover transition-shadow"
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
                );
              })}
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
