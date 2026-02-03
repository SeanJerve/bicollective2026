import { useState, useRef } from "react";
import { Upload, X, Loader2, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PaymentProofUploadProps {
  vendorOrderId: string;
  currentProofUrl?: string | null;
  onUploadSuccess: () => void;
}

const PaymentProofUpload = ({
  vendorOrderId,
  currentProofUrl,
  onUploadSuccess,
}: PaymentProofUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [proofUrl, setProofUrl] = useState(currentProofUrl);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 5MB",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${vendorOrderId}-${Date.now()}.${fileExt}`;
      const filePath = `${vendorOrderId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("payment-proofs")
        .getPublicUrl(filePath);

      // Update vendor order with proof URL and status
      const { error: updateError } = await supabase
        .from("vendor_orders")
        .update({
          payment_proof_url: urlData.publicUrl,
          status: "payment_uploaded",
        })
        .eq("id", vendorOrderId);

      if (updateError) throw updateError;

      setProofUrl(urlData.publicUrl);

      toast({
        title: "Payment proof uploaded",
        description: "We'll verify your payment shortly",
      });

      onUploadSuccess();
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload payment proof. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  if (proofUrl) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Payment proof uploaded</p>
        <div className="flex items-center gap-3 p-3 border-2 border-success bg-success/10">
          <Image className="w-5 h-5 flex-shrink-0 text-success" />
          <span className="flex-1 text-sm text-success">Proof submitted</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Upload payment screenshot</p>
      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-warning p-4 text-center cursor-pointer hover:border-foreground transition-colors bg-warning/5"
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Uploading...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-6 h-6 text-warning" />
            <span className="text-xs font-medium">Upload Payment Proof</span>
            <span className="text-xs text-muted-foreground">JPG, PNG (max 5MB)</span>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
        disabled={uploading}
      />
    </div>
  );
};

export default PaymentProofUpload;
