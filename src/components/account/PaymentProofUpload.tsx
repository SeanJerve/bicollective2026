import { useState, useRef, useCallback } from "react";
import { Upload, Loader2, Image, CloudUpload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PaymentProofUploadProps {
  paymentId: string;
  currentProofUrl?: string | null;
  onUploadSuccess: () => void;
}

const PaymentProofUpload = ({
  paymentId,
  currentProofUrl,
  onUploadSuccess,
}: PaymentProofUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [proofUrl, setProofUrl] = useState(currentProofUrl);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const processFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 5MB",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${paymentId}-${Date.now()}.${fileExt}`;
      const filePath = `verifications/${paymentId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Update/Insert verification
      const { error: verError } = await (supabase.from("payment_verifications").upsert({
        payment_id: paymentId,
        proof_image_url: filePath,
      } as any) as any);

      if (verError) throw verError;

      // Update payment status
      await supabase
        .from("payments")
        .update({ status: "pending" }) // Wait for vendor/admin to verify
        .eq("id", paymentId);

      setProofUrl(filePath);

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processFile(file);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file) await processFile(file);
    },
    [paymentId]
  );

  if (proofUrl) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Payment proof uploaded</p>
        <div className="flex items-center gap-3 p-3 border-2 border-success bg-success/10">
          <Image className="w-5 h-5 flex-shrink-0 text-success" />
          <span className="flex-1 text-sm text-success">
            Proof submitted — awaiting verification
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground font-heading uppercase tracking-wide">
        Upload Payment Screenshot
      </p>

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed p-6 text-center transition-all duration-150 ${
          isDragging
            ? "border-foreground bg-secondary scale-[1.01]"
            : "border-warning bg-warning/5 hover:border-foreground hover:bg-secondary/30"
        }`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-heading uppercase">
              Uploading...
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <CloudUpload
              className={`w-8 h-8 transition-colors ${isDragging ? "text-foreground" : "text-warning"}`}
            />
            <div>
              <p className="text-sm font-heading uppercase font-medium">
                {isDragging ? "Drop file here" : "Drag & Drop your screenshot"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP — max 5MB</p>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 w-full max-w-[200px]">
              <div className="flex-1 h-px bg-border-subtle" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-border-subtle" />
            </div>

            {/* Select button */}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 border-2 border-foreground font-heading text-xs uppercase hover:bg-foreground hover:text-background transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Select File
            </button>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={uploading}
      />
    </div>
  );
};

export default PaymentProofUpload;
