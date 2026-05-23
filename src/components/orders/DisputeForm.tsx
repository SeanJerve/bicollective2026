import { useState } from "react";
import { AlertTriangle, Upload, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface DisputeFormProps {
  vendorOrderId: string;
  vendorId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const DISPUTE_REASONS = [
  "Item not received",
  "Item damaged during delivery",
  "Wrong item received",
  "Item significantly different from description",
  "Missing items in order",
  "Quality issues",
  "Other",
];

const DisputeForm = ({ vendorOrderId, vendorId, onSuccess, onCancel }: DisputeFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    setUploading(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split(".").pop();
        const array = new Uint32Array(1);
        window.crypto.getRandomValues(array);
        const randomStr = array[0].toString(36);
        const fileName = `${user.id}/${vendorOrderId}/${Date.now()}-${randomStr}.${fileExt}`;

        const { error: uploadError, data } = await supabase.storage
          .from("payment-proofs") // Reusing existing bucket for dispute evidence
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("payment-proofs").getPublicUrl(fileName);

        return urlData.publicUrl;
      });

      const urls = await Promise.all(uploadPromises);
      setEvidenceUrls((prev) => [...prev, ...urls]);

      toast({
        title: "Evidence uploaded",
        description: `${files.length} file(s) uploaded successfully`,
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload evidence",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeEvidence = (index: number) => {
    setEvidenceUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !reason) {
      toast({
        title: "Missing information",
        description: "Please select a reason for your dispute",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("disputes").insert({
        vendor_order_id: vendorOrderId,
        customer_id: user.id,
        vendor_id: vendorId,
        reason,
        description: description || null,
        evidence_urls: evidenceUrls.length > 0 ? evidenceUrls : null,
      });

      if (error) throw error;

      toast({
        title: "Dispute submitted",
        description: "We'll review your case and get back to you soon",
      });

      onSuccess();
    } catch (error: any) {
      console.error("Dispute submission error:", error);
      toast({
        title: "Submission failed",
        description: error.message || "Failed to submit dispute",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 text-warning mb-4">
        <AlertTriangle className="w-5 h-5" />
        <span className="font-heading text-sm uppercase">Report an Issue</span>
      </div>

      <div>
        <label className="font-heading text-xs uppercase tracking-wide mb-2 block">
          What went wrong? *
        </label>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="input-brutal"
          required
        >
          <option value="">Select a reason...</option>
          {DISPUTE_REASONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="font-heading text-xs uppercase tracking-wide mb-2 block">
          Additional Details
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Please provide more details about your issue..."
          className="input-brutal min-h-[100px]"
        />
      </div>

      <div>
        <label className="font-heading text-xs uppercase tracking-wide mb-2 block">
          Evidence (Photos)
        </label>
        <div className="space-y-2">
          {evidenceUrls.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {evidenceUrls.map((url, i) => (
                <div key={i} className="relative w-16 h-16 group">
                  <img
                    src={url}
                    alt={`Evidence ${i + 1}`}
                    className="w-full h-full object-cover border-2 border-foreground"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeEvidence(i)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <label className="btn-brutal-secondary inline-flex items-center gap-2 cursor-pointer">
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {uploading ? "Uploading..." : "Add Photos"}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
          <p className="text-xs text-muted-foreground">
            Upload photos showing the issue (optional but recommended)
          </p>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="btn-brutal-secondary flex-1"
          disabled={loading}
        >
          Cancel
        </button>
        <button type="submit" className="btn-brutal flex-1" disabled={loading || !reason}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Submitting...
            </>
          ) : (
            "Submit Dispute"
          )}
        </button>
      </div>
    </form>
  );
};

export default DisputeForm;
