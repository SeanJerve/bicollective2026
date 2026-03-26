import { Link } from "react-router-dom";
import { Star, MessageSquare, Loader2, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

const VendorReviews = () => {
  const { user } = useAuth();

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

  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ["vendor-reviews", brand?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          *,
          product:products(name, slug),
          reviewer:profiles!reviews_user_id_fkey(full_name, avatar_url)
        `)
        .eq("brand_id", brand!.id)
        .eq("is_visible", true)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!brand,
  });

  const loading = brandLoading || reviewsLoading;

  const stats = reviews && reviews.length > 0
    ? { average: reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length, total: reviews.length }
    : { average: 0, total: 0 };

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <Loader2 className="w-8 h-8 animate-spin mx-auto" />
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="p-4 md:p-8">
        <div className="card-brutal p-8 text-center">
          <h2 className="font-heading text-xl uppercase mb-4">Store Not Found</h2>
          <p className="text-muted-foreground mb-6">Set up your store to start receiving reviews.</p>
          <Link to="/vendor/store" className="btn-brutal">Set Up Store</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="font-heading text-2xl md:text-4xl uppercase">Reviews</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">Customer feedback for your products</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6 md:mb-8">
        <div className="card-brutal p-4 md:p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Star className="w-5 h-5 md:w-6 md:h-6 fill-foreground" />
            <span className="font-heading text-2xl md:text-3xl">{stats.average.toFixed(1)}</span>
          </div>
          <p className="text-sm text-muted-foreground">Average Rating</p>
        </div>
        <div className="card-brutal p-4 md:p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <MessageSquare className="w-5 h-5 md:w-6 md:h-6" />
            <span className="font-heading text-2xl md:text-3xl">{stats.total}</span>
          </div>
          <p className="text-sm text-muted-foreground">Total Reviews</p>
        </div>
      </div>

      {/* Reviews List */}
      {(reviews || []).length > 0 ? (
        <div className="space-y-4">
          {(reviews || []).map((review: any) => (
            <div key={review.id} className="card-brutal p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                <div>
                  {review.product && (
                    <Link to={`/products/${review.product.slug}`} className="font-medium text-sm hover:underline">
                      {review.product.name}
                    </Link>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 md:w-4 md:h-4 ${
                            i < review.rating ? "fill-foreground" : "fill-muted stroke-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{format(new Date(review.created_at), "PP")}</span>
              </div>

              {/* Reviewer info */}
              <div className="flex items-center gap-2 mb-2">
                {review.reviewer?.avatar_url ? (
                  <img src={review.reviewer.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                ) : (
                  <div className="w-5 h-5 bg-muted flex items-center justify-center rounded-full">
                    <User className="w-3 h-3 text-muted-foreground" />
                  </div>
                )}
                <span className="text-xs text-muted-foreground">
                  {review.reviewer?.full_name || "Anonymous"}
                </span>
              </div>

              {review.comment && (
                <p className="text-sm text-muted-foreground">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card-brutal p-8 md:p-12 text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-heading text-xl uppercase mb-2">No Reviews Yet</h3>
          <p className="text-muted-foreground text-sm">Reviews will appear here once customers leave feedback on your products.</p>
        </div>
      )}
    </div>
  );
};

export default VendorReviews;
