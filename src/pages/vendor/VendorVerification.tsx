import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BadgeCheck, ArrowLeft, Loader2, Check, Clock, AlertCircle } from "lucide-react";
import DocumentUpload from "@/components/vendor/DocumentUpload";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const VendorVerification = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [brand, setBrand] = useState<any>(null);
  const [verification, setVerification] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    dtiRegistrationUrl: null as string | null,
    birCertificateUrl: null as string | null,
    mayorPermitUrl: null as string | null,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Fetch brand
        const { data: brandData } = await supabase
          .from("brands")
          .select("*")
          .eq("owner_id", user.id)
          .maybeSingle();

        if (!brandData) {
          setLoading(false);
          return;
        }

        setBrand(brandData);

        // Check existing verification
        const { data: verificationData } = await supabase
          .from("vendor_verifications")
          .select("*")
          .eq("brand_id", brandData.id)
          .order("submitted_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (verificationData) {
          setVerification(verificationData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleSubmit = async () => {
    if (!brand) return;

    if (!formData.dtiRegistrationUrl && !formData.birCertificateUrl && !formData.mayorPermitUrl) {
      toast({
        title: "No documents uploaded",
        description: "Please upload at least one verification document",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.from("vendor_verifications").insert({
        brand_id: brand.id,
        dti_registration_url: formData.dtiRegistrationUrl,
        bir_certificate_url: formData.birCertificateUrl,
        mayor_permit_url: formData.mayorPermitUrl,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Verification submitted!",
        description: "We'll review your documents and update your status.",
      });

      // Refresh verification status
      const { data: newVerification } = await supabase
        .from("vendor_verifications")
        .select("*")
        .eq("brand_id", brand.id)
        .order("submitted_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setVerification(newVerification);
    } catch (error: any) {
      console.error("Error submitting verification:", error);
      toast({
        title: "Submission failed",
        description: error.message || "Failed to submit verification",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
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
            You need to set up your store before applying for verification.
          </p>
          <Link to="/vendor/store" className="btn-brutal">
            Set Up Store
          </Link>
        </div>
      </div>
    );
  }

  if (brand.status === "verified") {
    return (
      <div className="p-4 md:p-8">
        <div className="card-brutal p-8 text-center bg-success/10">
          <BadgeCheck className="w-16 h-16 mx-auto mb-4 text-success" />
          <h2 className="font-heading text-2xl uppercase mb-2">You're Verified!</h2>
          <p className="text-muted-foreground">
            Your brand has been verified. The verified badge is now displayed on your store.
          </p>
        </div>
      </div>
    );
  }

  // Show existing verification status
  if (verification && verification.status !== "needs_resubmission") {
    const isPending = verification.status === "pending";
    const isRejected = verification.status === "rejected";

    return (
      <div className="p-4 md:p-8">
        <h1 className="font-heading text-2xl md:text-4xl uppercase mb-6 md:mb-8">
          Verification Status
        </h1>

        <div
          className={`card-brutal p-6 md:p-8 ${
            isPending ? "bg-warning/10" : isRejected ? "bg-destructive/10" : ""
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`p-3 border-2 border-foreground bg-background`}>
              {isPending ? (
                <Clock className="w-6 h-6 text-warning" />
              ) : (
                <AlertCircle className="w-6 h-6 text-destructive" />
              )}
            </div>
            <div>
              <h2 className="font-heading text-xl uppercase mb-2">
                {isPending ? "Verification Under Review" : "Verification Not Approved"}
              </h2>
              <p className="text-muted-foreground text-sm">
                {isPending
                  ? "We're reviewing your documents. This usually takes 1-3 business days."
                  : "Your verification request was not approved."}
              </p>
              <p className="text-sm mt-2 text-muted-foreground">
                Submitted: {format(new Date(verification.submitted_at), "PPP")}
              </p>
            </div>
          </div>

          {verification.admin_notes && (
            <div className="mt-6 p-4 bg-background border-2 border-foreground">
              <h3 className="font-heading text-sm uppercase mb-2">Admin Notes</h3>
              <p className="text-sm">{verification.admin_notes}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="font-heading text-2xl md:text-4xl uppercase mb-2">
        Get Verified
      </h1>
      <p className="text-muted-foreground mb-6 md:mb-8 text-sm md:text-base">
        Upload official business documents to earn the verified badge
      </p>

      {verification?.status === "needs_resubmission" && (
        <div className="card-brutal p-4 bg-warning/10 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-heading text-sm uppercase mb-1">Resubmission Required</h3>
              <p className="text-sm text-muted-foreground">{verification.admin_notes}</p>
            </div>
          </div>
        </div>
      )}

      <div className="card-brutal p-6">
        <div className="space-y-6">
          <div className="p-4 bg-secondary">
            <h3 className="font-heading text-sm uppercase mb-2">Why get verified?</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Display a verified badge on your store</li>
              <li>• Build trust with customers</li>
              <li>• Get featured in verified seller listings</li>
            </ul>
          </div>

          <DocumentUpload
            label="DTI/SEC Registration"
            description="Department of Trade and Industry or SEC certificate"
            bucket="vendor-documents"
            folder={user!.id}
            value={formData.dtiRegistrationUrl || undefined}
            onChange={(url) => setFormData({ ...formData, dtiRegistrationUrl: url })}
          />

          <DocumentUpload
            label="BIR Certificate of Registration"
            description="Bureau of Internal Revenue registration"
            bucket="vendor-documents"
            folder={user!.id}
            value={formData.birCertificateUrl || undefined}
            onChange={(url) => setFormData({ ...formData, birCertificateUrl: url })}
          />

          <DocumentUpload
            label="Mayor's/Business Permit"
            description="Current year's business permit from your LGU"
            bucket="vendor-documents"
            folder={user!.id}
            value={formData.mayorPermitUrl || undefined}
            onChange={(url) => setFormData({ ...formData, mayorPermitUrl: url })}
          />

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-brutal w-full flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit for Verification
                <Check className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VendorVerification;
