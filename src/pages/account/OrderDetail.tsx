import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Package, Truck, MapPin, Phone, Clock, Star } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import ReviewForm from "@/components/account/ReviewForm";
import OrderChat from "@/components/chat/OrderChat";
import PaymentProofUpload from "@/components/account/PaymentProofUpload";

const statusColors: Record<string, string> = {
  pending_payment: "bg-warning text-warning-foreground",
  payment_uploaded: "bg-info text-info-foreground",
  paid: "bg-info text-info-foreground",
  processing: "bg-info text-info-foreground",
  shipped: "bg-primary text-primary-foreground",
  delivered: "bg-success text-success-foreground",
  cancelled: "bg-destructive text-destructive-foreground",
};

const statusLabels: Record<string, string> = {
  pending_payment: "Pending Payment",
  payment_uploaded: "Payment Uploaded",
  paid: "Paid",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const OrderDetail = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [reviewingVendorOrder, setReviewingVendorOrder] = useState<string | null>(null);

  const { data: order, isLoading } = useQuery({
    queryKey: ["order-detail", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          vendor_orders(
            id,
            status,
            subtotal,
            shipping_fee,
            tracking_number,
            payment_proof_url,
            brand:brands(id, name, slug, owner_id),
            order_items(id, product_name, product_price, quantity, size, product_id)
          )
        `)
        .eq("id", orderId!)
        .eq("customer_id", user!.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!orderId && !!user,
  });

  const { data: existingReviews } = useQuery({
    queryKey: ["order-reviews", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("vendor_order_id")
        .eq("user_id", user!.id);

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

  if (!order) {
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
          <h1 className="font-heading text-3xl md:text-5xl uppercase">
            Order #{order.id.slice(0, 8)}
          </h1>
          <p className="text-muted-foreground mt-2">
            Placed on {format(new Date(order.created_at), "PPP 'at' p")}
          </p>
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
                <p className="font-medium">{order.shipping_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Phone</p>
                <p className="font-medium flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {order.shipping_phone}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-muted-foreground">Address</p>
                <p className="font-medium">{order.shipping_address}</p>
              </div>
              {order.notes && (
                <div className="md:col-span-2">
                  <p className="text-muted-foreground">Notes</p>
                  <p>{order.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Vendor Orders */}
          {order.vendor_orders?.map((vo: any) => (
            <div key={vo.id} className="card-brutal p-4 md:p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <Link
                    to={`/brands/${vo.brand?.slug}`}
                    className="font-heading uppercase hover:underline"
                  >
                    {vo.brand?.name}
                  </Link>
                  <span
                    className={`ml-3 inline-block px-2 py-0.5 text-xs uppercase ${
                      statusColors[vo.status] || "bg-secondary"
                    }`}
                  >
                    {statusLabels[vo.status] || vo.status}
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
                  <div key={item.id} className="py-3 flex justify-between items-center">
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
                ))}
              </div>

              <div className="border-t border-border-subtle pt-4 mt-4 flex justify-between text-sm">
                <span>Subtotal</span>
                <span className="font-heading">{formatPrice(Number(vo.subtotal))}</span>
              </div>
              {vo.shipping_fee > 0 && (
                <div className="flex justify-between text-sm mt-1">
                  <span>Shipping</span>
                  <span>{formatPrice(Number(vo.shipping_fee))}</span>
                </div>
              )}

              {/* Payment proof display */}
              {vo.payment_proof_url && (
                <div className="border-t border-border-subtle pt-4 mt-4">
                  <h4 className="font-heading text-sm uppercase mb-2">Payment Proof</h4>
                  <a href={vo.payment_proof_url} target="_blank" rel="noopener noreferrer">
                    <img src={vo.payment_proof_url} alt="Payment proof" className="w-32 h-32 object-cover border border-border-subtle" />
                  </a>
                </div>
              )}

              {/* Chat */}
              <div className="border-t border-border-subtle pt-4 mt-4 flex justify-end">
                <OrderChat
                  vendorOrderId={vo.id}
                  otherUserId={vo.brand?.owner_id || ""}
                  otherUserName={vo.brand?.name || "Vendor"}
                />
              </div>

              {/* Review section for delivered orders */}
              {vo.status === "delivered" && !existingReviews?.includes(vo.id) && (
                <div className="border-t border-border-subtle pt-4 mt-4">
                  {reviewingVendorOrder === vo.id ? (
                    <div>
                      <h4 className="font-heading text-sm uppercase mb-3 flex items-center gap-2">
                        <Star className="w-4 h-4" />
                        Leave a Review
                      </h4>
                      <ReviewForm
                        brandId={vo.brand?.id}
                        vendorOrderId={vo.id}
                        onSuccess={() => {
                          setReviewingVendorOrder(null);
                          queryClient.invalidateQueries({ queryKey: ["order-reviews", orderId] });
                        }}
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => setReviewingVendorOrder(vo.id)}
                      className="btn-brutal-secondary w-full flex items-center justify-center gap-2"
                    >
                      <Star className="w-4 h-4" />
                      Leave a Review
                    </button>
                  )}
                </div>
              )}

              {vo.status === "delivered" && existingReviews?.includes(vo.id) && (
                <div className="border-t border-border-subtle pt-4 mt-4">
                  <p className="text-sm text-success flex items-center gap-2">
                    <Star className="w-4 h-4 fill-success" />
                    You've reviewed this order
                  </p>
                </div>
              )}
            </div>
          ))}

          {/* Total */}
          <div className="card-brutal p-4 md:p-6 bg-secondary">
            <div className="flex justify-between items-center">
              <span className="font-heading uppercase">Order Total</span>
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
