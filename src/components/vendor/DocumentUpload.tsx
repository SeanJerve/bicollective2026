import { useState, useRef } from "react";
import { Upload, X, FileText, Loader2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DocumentUploadProps {
  label: string;
  description?: string;
  bucket: string;
  folder: string;
  accept?: string;
  value?: string;
  onChange: (url: string | null) => void;
  required?: boolean;
}

const DocumentUpload = ({
  label,
  description,
  bucket,
  folder,
  accept = "image/*,.pdf",
  value,
  onChange,
  required = false,
}: DocumentUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);

      onChange(urlData.publicUrl);

      toast({
        title: "File uploaded",
        description: "Document uploaded successfully",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    onChange(null);
  };

  const getFileName = (url: string) => {
    try {
      const parts = url.split("/");
      return parts[parts.length - 1];
    } catch {
      return "Uploaded file";
    }
  };

  return (
    <div className="space-y-2">
      <label className="block font-heading text-sm uppercase">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}

      {value ? (
        <div className="flex items-center gap-2 p-3 border-2 border-foreground bg-secondary group">
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 flex-1 min-w-0 hover:opacity-70 transition-opacity"
            title="Click to view document"
          >
            <FileText className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1 text-sm truncate">{getFileName(value)}</span>
            <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
          </a>
          <button
            type="button"
            onClick={handleRemove}
            className="p-1 hover:bg-background transition-colors flex-shrink-0"
            title="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-border-subtle p-6 text-center cursor-pointer hover:border-foreground transition-colors"
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Uploading...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Click to upload or drag and drop
              </span>
              <span className="text-xs text-muted-foreground">PDF, JPG, PNG (max 10MB)</span>
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleUpload}
        className="hidden"
        disabled={uploading}
      />
    </div>
  );
};

export default DocumentUpload;
