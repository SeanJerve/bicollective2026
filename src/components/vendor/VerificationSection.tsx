import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import DocumentUpload from "@/components/vendor/DocumentUpload";
import { CheckCircle2, Clock, XCircle, AlertTriangle, ShieldCheck, RotateCcw } from "lucide-react";

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  pending: {
    label: "Under Review",
    icon: Clock,
    color: "text-yellow-600",
    bg: "bg-yellow-50 border-yellow-300",
  },
  verified: {
    label: "Verified",
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-50 border-green-300",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-50 border-red-300",
  },
  resubmission_required: {
    label: "Resubmission Required",
    icon: AlertTriangle,
    color: "text-orange-600",
    bg: "bg-orange-50 border-orange-300",
  },
};

const VerificationSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [brand, setBrand] = useState<any>(null);
  const [verification, setVerification] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [dtiUrl, setDtiUrl] = useState("");
  const [birUrl, setBirUrl] = useState("");
  const [mayorUrl, setMayorUrl] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const { data: brandData } = await supabase
          .from("brands")
          .select("id, name")
          .eq("owner_id", user.id)
          .single();

        if (brandData) {
          setBrand(brandData);
          const { data: verData } = await supabase
            .from("vendor_verifications")
            .select("*")
            .eq("brand_id", brandData.id)
            .order("submitted_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (verData) {
            setVerification(verData);
            setDtiUrl(verData.dti_registration_url || "");
            setBirUrl(verData.bir_certificate_url || "");
            setMayorUrl(verData.mayor_permit_url || "");
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const canSubmit =
    !verification ||
    verification.status === "rejected" ||
    verification.status === "resubmission_required";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand || !user) return;
    if (!dtiUrl && !birUrl && !mayorUrl) {
      toast({
        title: "At least one document required",
        description: "Please upload at least one verification document.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      if (verification && canSubmit) {
        const { error } = await supabase
          .from("vendor_verifications")
          .update({
            dti_registration_url: dtiUrl || null,
            bir_certificate_url: birUrl || null,
            mayor_permit_url: mayorUrl || null,
            status: "pending",
            submitted_at: new Date().toISOString(),
          })
          .eq("id", verification.id);
        if (error) throw error;
      } else if (!verification) {
        const { error } = await supabase.from("vendor_verifications").insert({
          brand_id: brand.id,
          dti_registration_url: dtiUrl || null,
          bir_certificate_url: birUrl || null,
          mayor_permit_url: mayorUrl || null,
          status: "pending",
        } as any);
        if (error) throw error;
      }

      toast({
        title: "Documents submitted!",
        description: "We'll review your verification documents soon.",
      });

      // Refresh
      const { data: updated } = await supabase
        .from("vendor_verifications")
        .select("*")
        .eq("brand_id", brand.id)
        .order("submitted_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setVerification(updated);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error",
        description: err.message || "Failed to submit",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-16 skeleton-brutal" />
        <div className="h-24 skeleton-brutal" />
        <div className="h-24 skeleton-brutal" />
      </div>
    );
  }

  const statusInfo = verification
    ? (STATUS_CONFIG[verification.status] ?? STATUS_CONFIG.pending)
    : null;
  const StatusIcon = statusInfo?.icon;

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-2 mb-2">
        <ShieldCheck className="w-5 h-5" />
        <h2 className="font-heading text-xl uppercase">Store Verification</h2>
      </div>
      <p className="text-sm text-muted-foreground -mt-2">
        Submit your business documents to get your store verified.
      </p>

      {/* Status Banner */}
      {statusInfo && StatusIcon && (
        <div className={`flex items-start gap-3 p-4 border-2 ${statusInfo.bg}`}>
          <StatusIcon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${statusInfo.color}`} />
          <div>
            <p className={`font-heading text-sm uppercase font-bold ${statusInfo.color}`}>
              {statusInfo.label}
            </p>
            {verification.status === "pending" && (
              <p className="text-sm text-muted-foreground mt-0.5">
                Under review — usually takes 1–3 business days.
              </p>
            )}
            {verification.status === "verified" && (
              <p className="text-sm text-muted-foreground mt-0.5">
                Your store is verified! A badge is displayed on your store profile.
              </p>
            )}
            {verification.status === "rejected" && (
              <p className="text-sm text-muted-foreground mt-0.5">
                Submission rejected. Please resubmit with valid documents.
              </p>
            )}
            {verification.status === "resubmission_required" && (
              <p className="text-sm text-muted-foreground mt-0.5">
                Our team has requested corrections. Please resubmit your documents.
              </p>
            )}
          </div>
        </div>
      )}

      {!verification && (
        <div className="flex items-start gap-3 p-4 border-2 border-foreground/20 bg-secondary">
          <ShieldCheck className="w-5 h-5 mt-0.5 flex-shrink-0 text-muted-foreground" />
          <div>
            <p className="font-heading text-sm uppercase font-bold">Not Yet Submitted</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Submit your business documents to become a verified seller.
            </p>
          </div>
        </div>
      )}

      {/* Required Docs Info */}
      <div className="card-brutal p-4">
        <h3 className="font-heading text-sm uppercase mb-2">Required Documents</h3>
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-foreground rounded-full flex-shrink-0" />
            <span>
              <strong>DTI / SEC Registration</strong> — Proof of business registration
            </span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-foreground rounded-full flex-shrink-0" />
            <span>
              <strong>BIR Certificate</strong> — Bureau of Internal Revenue registration
            </span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-foreground rounded-full flex-shrink-0" />
            <span>
              <strong>Mayor's Permit</strong> — Local government business permit
            </span>
          </li>
        </ul>
        <p className="text-xs text-muted-foreground mt-2">
          At least one document required. Upload clear scans (JPG, PNG, or PDF).
        </p>
      </div>

      {/* Upload Form */}
      <form onSubmit={handleSubmit} className="card-brutal p-4 space-y-5">
        <h3 className="font-heading text-sm uppercase">
          {canSubmit
            ? verification
              ? "Resubmit Documents"
              : "Upload Documents"
            : "Submitted Documents"}
        </h3>

        <DocumentUpload
          label="DTI / SEC Registration"
          description="Image or PDF."
          bucket="vendor-documents"
          folder={user?.id || "unknown"}
          accept="image/*,application/pdf"
          value={dtiUrl || undefined}
          onChange={(url) => canSubmit && setDtiUrl(url || "")}
        />

        <DocumentUpload
          label="BIR Certificate"
          description="Image or PDF."
          bucket="vendor-documents"
          folder={user?.id || "unknown"}
          accept="image/*,application/pdf"
          value={birUrl || undefined}
          onChange={(url) => canSubmit && setBirUrl(url || "")}
        />

        <DocumentUpload
          label="Mayor's Permit / Business Permit"
          description="Image or PDF."
          bucket="vendor-documents"
          folder={user?.id || "unknown"}
          accept="image/*,application/pdf"
          value={mayorUrl || undefined}
          onChange={(url) => canSubmit && setMayorUrl(url || "")}
        />

        {canSubmit && (
          <button
            type="submit"
            disabled={submitting}
            className="btn-brutal w-full flex items-center justify-center gap-2 text-sm"
          >
            {submitting ? (
              "Submitting..."
            ) : verification ? (
              <>
                <RotateCcw className="w-4 h-4" />
                Resubmit Documents
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                Submit for Verification
              </>
            )}
          </button>
        )}

        {!canSubmit && verification?.status === "pending" && (
          <p className="text-xs text-center text-muted-foreground">
            Under review — you cannot edit documents while review is in progress.
          </p>
        )}
        {!canSubmit && verification?.status === "verified" && (
          <p className="text-xs text-center text-muted-foreground">
            Your store is already verified. Contact support to update documents.
          </p>
        )}
      </form>
    </div>
  );
};

export default VerificationSection;
