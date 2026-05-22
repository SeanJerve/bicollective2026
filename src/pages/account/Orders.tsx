import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Package, ChevronRight, XCircle, Loader2, RotateCcw, Star, Upload, X, Image as ImageIcon } from "lucide-react";
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
};

interface PendingReviewCardProps {
  item: any;
  onSubmitted: () => void;
}

const PendingReviewCard = ({ item, onSubmitted }: PendingReviewCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setMediaFiles((prev) => [...prev, ...files].slice(0, 5));
  };

  const removeMedia = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount);

  const handleSubmitReview = async () => {
    if (!user || rating === 0) return;

    setSubmitting(true);
    try {
      const mediaUrls: string[] = [];
      if (mediaFiles.length > 0) {
        setUploadingMedia(true);
        for (const file of mediaFiles) {
          const ext = file.name.split(".").pop();
          const array = new Uint32Array(1);
          window.crypto.getRandomValues(array);
          const randomString = array[0].toString(36);
          const path = `${user.id}/${item.vendor_order_id}/${Date.now()}-${randomString}.${ext}`;
          
          const { error: uploadError } = await supabase.storage
            .from("review-media")
            .upload(path, file);
          if (uploadError) throw uploadError;
          
          const { data: urlData } = supabase.storage.from("review-media").getPublicUrl(path);
          mediaUrls.push(urlData.publicUrl);
        }
        setUploadingMedia(false);
      }

      const { error } = await supabase.from("reviews").insert({
        user_id: user.id,
        product_id: item.product_id,
        brand_id: item.brand_id,
        vendor_order_id: item.vendor_order_id,
        rating,
        comment: comment.trim() || null,
        media_urls: mediaUrls.length > 0 ? mediaUrls : [],
        is_visible: true,
      } as any);

      if (error) throw error;

      toast({ title: "Review submitted!", description: "Thank you for your feedback!" });
      setIsExpanded(false);
      setRating(0);
      setComment("");
      setMediaFiles([]);
      onSubmitted();
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast({
        title: "Failed to submit review",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
      setUploadingMedia(false);
    }
  };

  return (
    <div className="card-brutal p-4 md:p-6 bg-background">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-border-subtle">
        <Link
          to={`/brands/${item.brand?.slug}`}
          className="font-heading uppercase hover:opacity-60 text-sm md:text-base"
        >
          {item.brand?.name}
        </Link>
        <span className="text-xs text-muted-foreground">
          Delivered: {new Date(item.created_at).toLocaleDateString()}
        </span>
      </div>

      <div className="flex justify-between items-start gap-4 mb-4">
        <div>
          <h3 className="font-heading uppercase text-sm md:text-base">{item.product_name}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Quantity: {item.quantity} {item.size ? `| Size: ${item.size}` : ""}
          </p>
        </div>
        <span className="font-heading text-sm md:text-base">
          {formatPrice(Number(item.product_price) * item.quantity)}
        </span>
      </div>

      {isExpanded ? (
        <div className="border-t border-border-subtle pt-4 space-y-4 animate-fade-in">
          <div>
            <label className="block text-xs md:text-sm font-heading uppercase mb-2">Your Rating</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1"
                >
                  <Star
                    className={`w-6 h-6 md:w-8 md:h-8 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? "fill-foreground stroke-foreground"
                        : "fill-muted stroke-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-heading uppercase mb-2">
              Your Review (optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this product..."
              className="input-brutal w-full h-24 resize-none text-sm p-3"
              maxLength={500}
            />
            <p className="text-right text-[10px] md:text-xs text-muted-foreground mt-1">{comment.length}/500</p>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-heading uppercase mb-2">
              Photos/Videos (optional, max 5)
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {mediaFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="relative w-16 h-16 border-2 border-border-subtle bg-muted"
                >
                  {file.type.startsWith("image/") ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground p-1 text-center leading-none">
                      Video
                    </div>
                  )}
                  <button
                    onClick={() => removeMedia(idx)}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {mediaFiles.length < 5 && (
                <label className="w-16 h-16 border-2 border-dashed border-border-subtle flex flex-col items-center justify-center cursor-pointer hover:bg-secondary transition-colors">
                  <ImageIcon className="w-5 h-5 text-muted-foreground" />
                  <span className="text-[8px] text-muted-foreground mt-1">Upload</span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={handleMediaSelect}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => {
                setIsExpanded(false);
                setRating(0);
                setComment("");
                setMediaFiles([]);
              }}
              className="btn-brutal-secondary flex-1 text-xs md:text-sm"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitReview}
              disabled={submitting || rating === 0}
              className="btn-brutal flex-1 text-xs md:text-sm flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                </>
              ) : (
                "Submit Review"
              )}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => {
            setIsExpanded(true);
          }}
          className="btn-brutal-secondary w-full flex items-center justify-center gap-2 text-xs md:text-sm py-2"
        >
          <Star className="w-4 h-4" />
          Write a Review
        </button>
      )}
    </div>
  );
};

const Orders = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [cancellingOrder, setCancellingOrder] = useState<string | null>(null);
  const [buyingAgain, setBuyingAgain] = useState<string | null>(null);
  const filter = searchParams.get("filter") || "all";
  const [limit, setLimit] = useState(5);

  const filters = [
    { label: "All", value: "all" },
    { label: "To Pay", value: "pending_payment" },
    { label: "To Ship", value: "paid_confirmed" },
    { label: "To Receive", value: "to_receive" },
    { label: "To Review", value: "to_review" },
    { label: "Completed", value: "delivered" },
    { label: "Cancelled", value: "cancelled" },
  ];

  const cancellableStatuses = ["pending_payment", "payment_uploaded", "confirmed"];

  const [showConfirmId, setShowConfirmId] = useState<string | null>(null);

  const handleCancelOrder = async (vendorOrderId: string) => {
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
      queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
      setShowConfirmId(null);
    } catch (err) {
      console.error("Cancel error:", err);
      toast({ title: "Error", description: "Failed to cancel order.", variant: "destructive" });
    } finally {
      setCancellingOrder(null);
    }
  };

  const handleBuyAgain = async (e: React.MouseEvent, orderItems: any[]) => {
    e.preventDefault();
    e.stopPropagation();
    const loadingKey = orderItems[0]?.product_id || "loading";
    setBuyingAgain(loadingKey);
    try {
      let added = 0;
      for (const item of orderItems || []) {
        if (item.variant_id) {
          await addToCart(item.variant_id, 1);
          added++;
        }
      }
      if (added > 0) {
        toast({
          title: "Items added to cart",
          description: `Added ${added} item(s) to your cart.`,
        });
      } else {
        toast({
          title: "Notice",
          description: "No items could be ordered again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to add items to cart." });
    } finally {
      setBuyingAgain(null);
    }
  };

  const { data: orders, isLoading } = useQuery({
    queryKey: ["customer-orders", user?.id, filter],
    queryFn: async () => {
      if (filter === "to_review") {
        const { data: vendorOrders, error: voError } = await supabase
          .from("vendor_orders")
          .select(`
            id,
            brand_id,
            status,
            created_at,
            brand:brands(id, name, slug),
            order:orders!inner(customer_id),
            items:order_items(id, product_name, product_price, quantity, size, product_id, variant_id)
          `)
          .eq("status", "delivered")
          .eq("order.customer_id", user!.id)
          .order("created_at", { ascending: false });

        if (voError) throw voError;

        const { data: reviewsData, error: rError } = await supabase
          .from("reviews")
          .select("vendor_order_id, product_id")
          .eq("user_id", user!.id);

        if (rError) throw rError;

        const reviewedSet = new Set(
          reviewsData?.map((r) => `${r.vendor_order_id}_${r.product_id}`) || []
        );

        const pendingItems: any[] = [];
        vendorOrders?.forEach((vo: any) => {
          vo.items?.forEach((item: any) => {
            const key = `${vo.id}_${item.product_id}`;
            if (!reviewedSet.has(key)) {
              pendingItems.push({
                ...item,
                vendor_order_id: vo.id,
                brand_id: vo.brand_id,
                brand: vo.brand,
                created_at: vo.created_at,
              });
            }
          });
        });
        return pendingItems;
      }

      let supabaseQuery = supabase
        .from("vendor_orders")
        .select(`
          id,
          status,
          subtotal,
          shipping_fee,
          discount_amount,
          tracking_number,
          created_at,
          brand:brands(name, logo_url),
          order:orders!inner(
            id,
            customer_id,
            created_at,
            shipping_name,
            shipping_phone,
            shipping_address:addresses(*)
          ),
          order_items(product_id, variant_id, product_name, product_price, size, quantity)
        `)
        .eq("order.customer_id", user!.id);

      if (filter !== "all") {
        if (filter === "paid_confirmed") {
          supabaseQuery = supabaseQuery.in("status", ["paid", "confirmed", "processing"]);
        } else if (filter === "to_receive") {
          supabaseQuery = supabaseQuery.in("status", ["handed_to_courier", "for_delivery", "shipped"]);
        } else {
          supabaseQuery = supabaseQuery.eq("status", filter);
        }
      }

      const { data, error } = await supabaseQuery.order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
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
              onClick={() => {
                setSearchParams({ filter: f.value });
                setLimit(5);
              }}
              className={`px-4 py-2 text-xs md:text-sm font-heading uppercase whitespace-nowrap border-2 transition-colors ${
                filter === f.value
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background text-muted-foreground border-transparent hover:border-foreground/20"
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
          ) : filter === "to_review" ? (
            <div className="space-y-6">
              {(orders as any[] || []).slice(0, limit).map((item) => (
                <PendingReviewCard
                  key={`${item.vendor_order_id}_${item.product_id}`}
                  item={item}
                  onSubmitted={() => queryClient.invalidateQueries({ queryKey: ["customer-orders"] })}
                />
              ))}
              {(orders as any[] || []).length === 0 && (
                <div className="card-brutal p-12 text-center">
                  <Star className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h2 className="font-heading text-xl uppercase mb-2">All Caught Up!</h2>
                  <p className="text-muted-foreground text-sm mb-6">
                    You don't have any pending reviews right now.
                  </p>
                  <Link to="/products" className="btn-brutal">
                    Continue Shopping
                  </Link>
                </div>
              )}
              {(orders as any[] || []).length > limit && (
                <div className="pt-6 text-center">
                  <button
                    onClick={() => setLimit((prev) => prev + 5)}
                    className="btn-brutal px-8 py-3 text-sm"
                  >
                    See More Items
                  </button>
                </div>
              )}
            </div>
          ) : orders && orders.length > 0 ? (
            <div className="space-y-4">
              {orders.slice(0, limit).map((vendorOrder) => {
                const totalAmount = Number(vendorOrder.subtotal) + Number(vendorOrder.shipping_fee) - Number(vendorOrder.discount_amount || 0);
                const canCancel = cancellableStatuses.includes(vendorOrder.status);
                const orderDate = vendorOrder.created_at || vendorOrder.order?.created_at;
                const shippingAddress = vendorOrder.order?.shipping_address;
                const customerName = shippingAddress?.full_name || vendorOrder.order?.shipping_name;

                return (
                  <div
                    key={vendorOrder.id}
                    className="card-brutal hover:shadow-brutal-hover transition-shadow"
                  >
                    <Link
                      to={`/account/orders/${vendorOrder.id}`}
                      className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 block"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-secondary flex items-center justify-center flex-shrink-0">
                          <Package className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-heading text-sm uppercase">
                            Order #{vendorOrder.id.slice(0, 8)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {orderDate ? format(new Date(orderDate), "PPP") : ""}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Ship to: {customerName}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="text-xs bg-secondary px-2 py-0.5 font-heading uppercase">
                              {vendorOrder.brand?.name}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-heading">{formatPrice(totalAmount)}</p>
                          <span
                            className={`inline-block mt-1 px-2 py-0.5 text-xs uppercase ${
                              statusColors[vendorOrder.status] || "bg-secondary"
                            }`}
                          >
                            {statusLabels[vendorOrder.status] || vendorOrder.status}
                          </span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </Link>
                    {canCancel && (
                      <div className="px-4 md:px-6 pb-4 md:pb-6 pt-0 border-t border-border-subtle pt-4">
                        {showConfirmId === vendorOrder.id ? (
                          <div className="space-y-3 animate-fade-in p-3 bg-destructive/10 border-2 border-destructive">
                            <p className="text-sm font-heading uppercase text-center text-destructive">
                              Cancel this order? This cannot be undone.
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setShowConfirmId(null);
                                }}
                                className="btn-brutal-secondary flex-1"
                              >
                                Keep Order
                              </button>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleCancelOrder(vendorOrder.id);
                                }}
                                disabled={cancellingOrder === vendorOrder.id}
                                className="btn-brutal-secondary flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                              >
                                {cancellingOrder === vendorOrder.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin text-destructive-foreground" />
                                ) : (
                                  "Confirm Cancel"
                                )}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                               e.preventDefault();
                               e.stopPropagation();
                               setShowConfirmId(vendorOrder.id);
                            }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors font-heading uppercase"
                          >
                            <XCircle className="w-4 h-4" />
                            Cancel Order
                          </button>
                        )}
                      </div>
                    )}
                    {vendorOrder.status === "delivered" && (
                      <div className="px-4 md:px-6 pb-4 md:pb-6 pt-0 flex gap-2">
                        <button
                          onClick={(e) => handleBuyAgain(e, vendorOrder.order_items || [])}
                          disabled={buyingAgain === (vendorOrder.order_items?.[0]?.product_id || "loading")}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm border-2 border-primary text-foreground hover:bg-secondary transition-colors font-heading uppercase"
                        >
                          {buyingAgain === (vendorOrder.order_items?.[0]?.product_id || "loading") ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RotateCcw className="w-4 h-4" />
                          )}
                          Buy Again
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSearchParams({ filter: "to_review" });
                          }}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm border-2 border-foreground bg-foreground text-background hover:bg-foreground/90 transition-colors font-heading uppercase"
                        >
                          <Star className="w-4 h-4" />
                          Write a Review
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {orders.length > limit && (
                <div className="pt-6 text-center">
                  <button
                    onClick={() => setLimit((prev) => prev + 5)}
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
