import { useState } from "react";
import { Link } from "react-router-dom";
import { Star, MessageSquare, Loader2, User, Flag, X, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const REPORT_REASONS = [
  "Inappropriate or offensive content",
  "False or misleading information",
  "Spam or promotional content",
  "Harassment or bullying",
  "Defamatory content",
  "Other",
];

const VendorReviews = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Report modal state
  const [reportingReview, setReportingReview] = useState<any | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());

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
        .select(
          `
          *,
          product:products(name, slug)
        `
        )
        .eq("brand_id", brand!.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      if (!data) return [];

      // Manual enrichment for profiles
      const userIds = [...new Set(data.map((r) => r.user_id))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", userIds);

        const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
        return data.map((r) => ({
          ...r,
          reviewer: profileMap.get(r.user_id) || { full_name: "Anonymous", avatar_url: null },
        }));
      }

      return data;
    },
    enabled: !!brand,
  });

  // Also fetch existing reports from this vendor to know which are already reported
  const { data: existingReports } = useQuery({
    queryKey: ["vendor-review-reports", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("reports")
        .select("review_id")
        .eq("reporter_id", user!.id)
        .not("review_id", "is", null);
      return new Set((data || []).map((r: any) => r.review_id));
    },
    enabled: !!user,
  });

  const handleReport = async () => {
    if (!reportingReview || !reportReason) return;
    if (!brand) return;

    const finalReason = reportReason === "Other" ? customReason : reportReason;
    if (!finalReason.trim()) {
      toast({ title: "Please provide a reason", variant: "destructive" });
      return;
    }

    setReportLoading(true);
    try {
      const { error } = await supabase.from("reports").insert({
        reporter_id: user!.id,
        review_id: reportingReview.id,
        brand_id: brand.id,
        reason: finalReason,
        status: "pending",
      });

      if (error) throw error;

      setReportedIds((prev) => new Set([...prev, reportingReview.id]));
      toast({
        title: "Review reported",
        description: "Our admin team will review your report and take appropriate action.",
      });
      setReportingReview(null);
      setReportReason("");
      setCustomReason("");
      queryClient.invalidateQueries({ queryKey: ["vendor-review-reports"] });
    } catch (err: any) {
      console.error("Error reporting review:", err);
      toast({
        title: "Failed to submit report",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setReportLoading(false);
    }
  };

  const loading = brandLoading || reviewsLoading;

  const stats =
    reviews && reviews.length > 0
      ? {
          average: reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length,
          total: reviews.length,
        }
      : { average: 0, total: 0 };

  const alreadyReported = (reviewId: string) =>
    reportedIds.has(reviewId) || (existingReports?.has(reviewId) ?? false);

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
          <p className="text-muted-foreground mb-6">
            Set up your store to start receiving reviews.
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="font-heading text-2xl md:text-4xl uppercase">Reviews</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Customer feedback for your products
          </p>
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
                    <Link
                      to={`/products/${review.product.slug}`}
                      className="font-medium text-sm hover:underline"
                    >
                      {review.product.name}
                    </Link>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 md:w-4 md:h-4 ${
                            i < review.rating
                              ? "fill-foreground"
                              : "fill-muted stroke-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(review.created_at), "PP")}
                  </span>
                  {/* Report Button */}
                  {alreadyReported(review.id) ? (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground border border-border-subtle px-2 py-1">
                      <Flag className="w-3 h-3" />
                      Reported
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        setReportingReview(review);
                        setReportReason("");
                        setCustomReason("");
                      }}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive border border-border-subtle hover:border-destructive px-2 py-1 transition-colors"
                      title="Report this review"
                    >
                      <Flag className="w-3 h-3" />
                      Report
                    </button>
                  )}
                </div>
              </div>

              {/* Reviewer info */}
              <div className="flex items-center gap-2 mb-2">
                {review.reviewer?.avatar_url ? (
                  <img
                    src={review.reviewer.avatar_url}
                    alt=""
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-5 h-5 bg-muted flex items-center justify-center rounded-full">
                    <User className="w-3 h-3 text-muted-foreground" />
                  </div>
                )}
                <span className="text-xs text-muted-foreground">
                  {review.reviewer?.full_name || "Anonymous"}
                </span>
              </div>

              {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
            </div>
          ))}
        </div>
      ) : (
        <div className="card-brutal p-8 md:p-12 text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-heading text-xl uppercase mb-2">No Reviews Yet</h3>
          <p className="text-muted-foreground text-sm">
            Reviews will appear here once customers leave feedback on your products.
          </p>
        </div>
      )}

      {/* Report Modal */}
      {reportingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="card-brutal p-6 md:p-8 w-full max-w-md">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <h2 className="font-heading text-lg uppercase">Report Review</h2>
              </div>
              <button onClick={() => setReportingReview(null)} className="hover:opacity-60">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Review preview */}
            <div className="bg-secondary p-3 mb-6 text-sm">
              <div className="flex items-center gap-1 mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${i < reportingReview.rating ? "fill-foreground" : "fill-muted"}`}
                  />
                ))}
              </div>
              <p className="text-muted-foreground line-clamp-3">
                {reportingReview.comment || "(No comment)"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                by {reportingReview.reviewer?.full_name || "Anonymous"}
              </p>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Select a reason for reporting this review. Our admin team will review and take action
              within 24–48 hours.
            </p>

            <div className="space-y-2 mb-4">
              {REPORT_REASONS.map((reason) => (
                <label key={reason} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="report-reason"
                    value={reason}
                    checked={reportReason === reason}
                    onChange={() => setReportReason(reason)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm group-hover:text-foreground transition-colors">
                    {reason}
                  </span>
                </label>
              ))}
            </div>

            {reportReason === "Other" && (
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="input-brutal w-full h-20 resize-none text-sm mb-4"
                placeholder="Describe why this review is inappropriate..."
              />
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setReportingReview(null)}
                className="btn-brutal-secondary flex-1 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleReport}
                disabled={reportLoading || !reportReason}
                className="btn-brutal flex-1 text-sm flex items-center justify-center gap-2"
              >
                {reportLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Flag className="w-4 h-4" />
                )}
                {reportLoading ? "Submitting..." : "Submit Report"}
              </button>
            </div>

            <p className="text-xs text-muted-foreground mt-3 text-center">
              Only admins can hide or delete reported reviews.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorReviews;
