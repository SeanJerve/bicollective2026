import { useState } from "react";
import { Link } from "react-router-dom";
import { Star, Loader2, Upload, X, Image as ImageIcon } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ToReview = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeReview, setActiveReview] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // Fetch delivered vendor orders with items
  const { data: deliveredOrders, isLoading } = useQuery({
    queryKey: ["to-review-orders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_orders")
        .select(
          `
          id,
          brand_id,
          status,
          created_at,
          brand:brands(id, name, slug),
          order:orders!inner(customer_id),
          items:order_items(id, product_name, product_price, quantity, size, product_id)
        `
        )
        .eq("status", "delivered")
        .eq("order.customer_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch existing reviews
  const { data: existingReviews } = useQuery({
    queryKey: ["existing-reviews", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("vendor_order_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return new Set(data?.map((r) => r.vendor_order_id) || []);
    },
    enabled: !!user,
  });

  const pendingReviews = deliveredOrders?.filter((vo) => !existingReviews?.has(vo.id));

  const handleSubmitReview = async (vendorOrder: any) => {
    if (!user || rating === 0) return;

    setSubmitting(true);
    try {
      // Upload media files first
      const mediaUrls: string[] = [];
      if (mediaFiles.length > 0) {
        setUploadingMedia(true);
        for (const file of mediaFiles) {
          const ext = file.name.split(".").pop();
          const path = `${user.id}/${vendorOrder.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from("review-media")
            .upload(path, file);
          if (uploadError) throw uploadError;
          const { data: urlData } = supabase.storage.from("review-media").getPublicUrl(path);
          mediaUrls.push(urlData.publicUrl);
        }
        setUploadingMedia(false);
      }

      // Get first product id from items
      const firstItem = vendorOrder.items?.[0];

      const { error } = await supabase.from("reviews").insert({
        user_id: user.id,
        product_id: firstItem?.product_id || null,
        brand_id: vendorOrder.brand_id,
        vendor_order_id: vendorOrder.id,
        rating,
        comment: comment.trim() || null,
        media_urls: mediaUrls.length > 0 ? mediaUrls : [],
      } as any);

      if (error) throw error;

      toast({ title: "Review submitted!", description: "Thank you for your feedback!" });
      setActiveReview(null);
      setRating(0);
      setComment("");
      setMediaFiles([]);
      queryClient.invalidateQueries({ queryKey: ["existing-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["to-review-orders"] });
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

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setMediaFiles((prev) => [...prev, ...files].slice(0, 5));
  };

  const removeMedia = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount);

  if (!user) {
    return (
      <PageLayout>
        <div className="section-container py-16 text-center">
          <p className="text-muted-foreground mb-4">Please sign in to view reviews.</p>
          <Link to="/login" className="btn-brutal">
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
          <h1 className="font-heading text-3xl md:text-5xl uppercase">To Review</h1>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">
            Leave reviews for your delivered orders
          </p>
        </div>
      </section>

      <section className="py-8 md:py-12">
        <div className="section-container max-w-3xl">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton-brutal h-32" />
              ))}
            </div>
          ) : pendingReviews && pendingReviews.length > 0 ? (
            <div className="space-y-6">
              {pendingReviews.map((vo: any) => (
                <div key={vo.id} className="card-brutal p-4 md:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Link
                      to={`/brands/${vo.brand?.slug}`}
                      className="font-heading uppercase hover:opacity-60"
                    >
                      {vo.brand?.name}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {new Date(vo.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Items */}
                  <div className="space-y-2 mb-4">
                    {vo.items?.map((item: any) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>
                          {item.product_name} x{item.quantity}
                          {item.size && ` (${item.size})`}
                        </span>
                        <span>{formatPrice(Number(item.product_price) * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  {activeReview === vo.id ? (
                    <div className="border-t border-border-subtle pt-4 space-y-4">
                      {/* Star Rating */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Your Rating</label>
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
                                className={`w-6 h-6 transition-colors ${
                                  star <= (hoveredRating || rating)
                                    ? "fill-foreground stroke-foreground"
                                    : "fill-muted stroke-muted-foreground"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Comment */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Your Review (optional)
                        </label>
                        <textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Share your experience..."
                          className="input-brutal w-full h-24 resize-none"
                          maxLength={500}
                        />
                        <p className="text-xs text-muted-foreground mt-1">{comment.length}/500</p>
                      </div>

                      {/* Media Upload */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
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
                                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
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
                            <label className="w-16 h-16 border-2 border-dashed border-border-subtle flex items-center justify-center cursor-pointer hover:bg-secondary">
                              <ImageIcon className="w-5 h-5 text-muted-foreground" />
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

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setActiveReview(null);
                            setRating(0);
                            setComment("");
                            setMediaFiles([]);
                          }}
                          className="btn-brutal-secondary flex-1"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSubmitReview(vo)}
                          disabled={submitting || rating === 0}
                          className="btn-brutal flex-1 flex items-center justify-center gap-2"
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
                        setActiveReview(vo.id);
                        setRating(0);
                        setComment("");
                        setMediaFiles([]);
                      }}
                      className="btn-brutal-secondary w-full flex items-center justify-center gap-2"
                    >
                      <Star className="w-4 h-4" />
                      Write a Review
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="card-brutal p-8 md:p-12 text-center">
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
        </div>
      </section>
    </PageLayout>
  );
};

export default ToReview;
