import { useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface ReviewFormProps {
  productId?: string;
  brandId: string;
  vendorOrderId: string;
  onSuccess: () => void;
}

const ReviewForm = ({ productId, brandId, vendorOrderId, onSuccess }: ReviewFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to leave a review",
        variant: "destructive",
      });
      return;
    }

    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a star rating",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.from("reviews").insert({
        user_id: user.id,
        product_id: productId || null,
        brand_id: brandId,
        vendor_order_id: vendorOrderId,
        rating,
        comment: comment.trim() || null,
      });

      if (error) throw error;

      toast({
        title: "Review submitted",
        description: "Thank you for your feedback!",
      });

      onSuccess();
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast({
        title: "Failed to submit review",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      <div>
        <label className="block text-sm font-medium mb-2">Your Review (optional)</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this product..."
          className="input-brutal w-full h-24 resize-none"
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground mt-1">{comment.length}/500</p>
      </div>

      <button
        type="submit"
        disabled={submitting || rating === 0}
        className="btn-brutal w-full flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit Review"
        )}
      </button>
    </form>
  );
};

export default ReviewForm;
