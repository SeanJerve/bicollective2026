import { useState, useRef } from "react";
import { Star, Loader2, ImagePlus, X } from "lucide-react";
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
  const [images, setImages] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [triedSubmitting, setTriedSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (images.length + newFiles.length > 3) {
        toast({
          title: "Too many images",
          description: "You can only upload up to 3 images",
          variant: "destructive",
        });
        return;
      }
      setImages((prev) => [...prev, ...newFiles]);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTriedSubmitting(true);

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
      const mediaUrls: string[] = [];

      // Upload images if any
      if (images.length > 0) {
        for (const file of images) {
          const fileExt = file.name.split(".").pop();
          const array = new Uint32Array(1);
          window.crypto.getRandomValues(array);
          const randomStr = array[0].toString(36);
          const filePath = `${user.id}/${Date.now()}-${randomStr}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from("review-images")
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data } = supabase.storage.from("review-images").getPublicUrl(filePath);
          mediaUrls.push(data.publicUrl);
        }
      }

      const { data: newReview, error } = await (supabase
        .from("reviews")
        .insert({
          user_id: user.id,
          product_id: productId || null,
          brand_id: brandId,
          vendor_order_id: vendorOrderId,
          rating,
          comment: comment.trim() || null,
          is_visible: true,
        })
        .select("id")
        .single() as any);

      if (error) throw error;

      if (mediaUrls.length > 0 && newReview) {
        const mediaInserts = mediaUrls.map((url) => ({
          review_id: newReview.id,
          media_url: url,
        }));
        const { error: mError } = await supabase.from("review_media").insert(mediaInserts);
        if (mError) throw mError;
      }

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
        {triedSubmitting && rating === 0 && (
          <p className="text-destructive text-xs font-heading uppercase mt-2 animate-in fade-in slide-in-from-top-1">
            Please select a rating from 1-5 stars
          </p>
        )}
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

      <div>
        <label className="block text-sm font-medium mb-2">Upload Photos (Optional, max 3)</label>
        <div className="flex flex-wrap gap-2">
          {images.map((img, i) => (
            <div key={i} className="relative w-24 h-24 border border-border-subtle group">
              <img
                src={URL.createObjectURL(img)}
                alt="Upload preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 p-1 bg-background/80 hover:bg-destructive hover:text-destructive-foreground transition-colors rounded-sm opacity-0 group-hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          {images.length < 3 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border-subtle text-muted-foreground hover:bg-secondary/50 transition-colors"
            >
              <ImagePlus className="w-6 h-6" />
              <span className="text-[10px] uppercase font-heading text-center leading-tight">
                Add Photo
              </span>
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleImageSelect}
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
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
