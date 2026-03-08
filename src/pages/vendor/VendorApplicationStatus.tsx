import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, CheckCircle, AlertCircle, XCircle, RefreshCw, Loader2, Save } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import DocumentUpload from "@/components/vendor/DocumentUpload";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const statusConfig = {
  pending: {
    icon: Clock,
    color: "text-warning",
    bgColor: "bg-warning/10",
    title: "Application Under Review",
    description: "We're reviewing your application. This usually takes 1-3 business days.",
  },
  approved: {
    icon: CheckCircle,
    color: "text-success",
    bgColor: "bg-success/10",
    title: "Application Approved!",
    description: "Congratulations! Your application has been approved. You can now access your vendor dashboard.",
  },
  needs_resubmission: {
    icon: AlertCircle,
    color: "text-warning",
    bgColor: "bg-warning/10",
    title: "Additional Information Needed",
    description: "We need some additional information before we can approve your application.",
  },
  rejected: {
    icon: XCircle,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    title: "Application Not Approved",
    description: "Unfortunately, we couldn't approve your application at this time.",
  },
};

const VendorApplicationStatus = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Resubmission form state
  const [showResubmitForm, setShowResubmitForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    business_name: "",
    location: "",
    contact_phone: "",
    description: "",
    valid_id_url: null as string | null,
    business_permit_url: null as string | null,
    proof_of_products_url: null as string | null,
  });

  useEffect(() => {
    const fetchApplication = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("vendor_applications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        setApplication(data);

        // Pre-fill form with existing data
        if (data) {
          setFormData({
            business_name: data.business_name || "",
            location: data.location || "",
            contact_phone: data.contact_phone || "",
            description: data.description || "",
            valid_id_url: data.valid_id_url,
            business_permit_url: data.business_permit_url,
            proof_of_products_url: data.proof_of_products_url,
          });

          // Auto-show form if needs resubmission
          if (data.status === "needs_resubmission") {
            setShowResubmitForm(true);
          }
        }
      } catch (error) {
        console.error("Error fetching application:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [user]);

  const handleResubmit = async () => {
    if (!application || !user) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("vendor_applications")
        .update({
          business_name: formData.business_name.trim(),
          location: formData.location.trim(),
          contact_phone: formData.contact_phone.trim(),
          description: formData.description.trim(),
          valid_id_url: formData.valid_id_url,
          business_permit_url: formData.business_permit_url,
          proof_of_products_url: formData.proof_of_products_url,
          status: "pending" as any,
          updated_at: new Date().toISOString(),
        })
        .eq("id", application.id);

      if (error) throw error;

      setApplication({ ...application, ...formData, status: "pending" });
      setShowResubmitForm(false);

      toast({
        title: "Application resubmitted",
        description: "Your updated application has been submitted for review.",
      });
    } catch (error: any) {
      console.error("Error resubmitting:", error);
      toast({
        title: "Resubmission failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <PageLayout>
        <div className="section-container py-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        </div>
      </PageLayout>
    );
  }

  if (!user) {
    return (
      <PageLayout>
        <div className="section-container py-16 text-center">
          <h1 className="font-heading text-3xl uppercase mb-4">Sign In Required</h1>
          <p className="text-muted-foreground mb-8">
            Please sign in to view your application status.
          </p>
          <Link to="/login?redirect=/vendor/application-status" className="btn-brutal">
            Sign In
          </Link>
        </div>
      </PageLayout>
    );
  }

  if (!application) {
    return (
      <PageLayout>
        <div className="section-container py-16 text-center">
          <h1 className="font-heading text-3xl uppercase mb-4">No Application Found</h1>
          <p className="text-muted-foreground mb-8">
            You haven't submitted a vendor application yet.
          </p>
          <Link to="/vendor/register" className="btn-brutal">
            Apply Now
          </Link>
        </div>
      </PageLayout>
    );
  }

  const status = statusConfig[application.status as keyof typeof statusConfig];
  const StatusIcon = status.icon;

  return (
    <PageLayout>
      <section className="py-8 md:py-12 border-b-2 border-foreground">
        <div className="section-container">
          <h1 className="font-heading text-3xl md:text-5xl uppercase">
            Application Status
          </h1>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">
            Track the status of your vendor application
          </p>
        </div>
      </section>

      <section className="py-8 md:py-12">
        <div className="section-container max-w-2xl">
          {/* Status Card */}
          <div className={`card-brutal p-6 md:p-8 ${status.bgColor}`}>
            <div className="flex items-start gap-4">
              <div className={`p-3 bg-background border-2 border-foreground ${status.color}`}>
                <StatusIcon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h2 className="font-heading text-xl uppercase mb-2">{status.title}</h2>
                <p className="text-muted-foreground text-sm">{status.description}</p>
              </div>
            </div>

            {application.admin_notes && (
              <div className="mt-6 p-4 bg-background border-2 border-foreground">
                <h3 className="font-heading text-sm uppercase mb-2">Admin Notes</h3>
                <p className="text-sm">{application.admin_notes}</p>
              </div>
            )}
          </div>

          {/* Inline Resubmission Form */}
          {application.status === "needs_resubmission" && showResubmitForm && (
            <div className="card-brutal p-6 mt-6">
              <h3 className="font-heading text-lg uppercase mb-4 flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                Update Your Documents
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Please re-upload or update the required documents based on the admin notes above, then resubmit.
              </p>

              <div className="space-y-5">

                <DocumentUpload
                  label="Valid ID"
                  description="Re-upload your government-issued ID if requested"
                  bucket="vendor-documents"
                  folder={`applications/${user.id}`}
                  value={formData.valid_id_url || undefined}
                  onChange={(url) => setFormData((f) => ({ ...f, valid_id_url: url }))}
                />

                <DocumentUpload
                  label="Business Permit"
                  description="DTI/SEC registration or barangay business permit"
                  bucket="vendor-documents"
                  folder={`applications/${user.id}`}
                  value={formData.business_permit_url || undefined}
                  onChange={(url) => setFormData((f) => ({ ...f, business_permit_url: url }))}
                />

                <DocumentUpload
                  label="Proof of Products"
                  description="Photos of your products or catalog"
                  bucket="vendor-documents"
                  folder={`applications/${user.id}`}
                  accept="image/*"
                  value={formData.proof_of_products_url || undefined}
                  onChange={(url) => setFormData((f) => ({ ...f, proof_of_products_url: url }))}
                />

                <button
                  onClick={handleResubmit}
                  disabled={submitting}
                  className="btn-brutal w-full flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {submitting ? "Submitting..." : "Resubmit Application"}
                </button>
              </div>
            </div>
          )}

          {/* Application Details (show when not editing) */}
          {!(application.status === "needs_resubmission" && showResubmitForm) && (
            <div className="card-brutal p-6 mt-6">
              <h3 className="font-heading text-lg uppercase mb-4">Application Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Business Name</span>
                  <p className="font-medium">{application.business_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Business Type</span>
                  <p className="font-medium capitalize">{application.business_type}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Location</span>
                  <p className="font-medium">{application.location}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Submitted</span>
                  <p className="font-medium">
                    {format(new Date(application.created_at), "PPP")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            {application.status === "approved" && (
              <Link to="/vendor" className="btn-brutal flex-1 text-center">
                Go to Dashboard
              </Link>
            )}
            {application.status === "rejected" && (
              <Link to="/vendor/register" className="btn-brutal-secondary flex-1 text-center">
                Apply Again
              </Link>
            )}
            <Link to="/" className="btn-brutal-secondary flex-1 text-center">
              Back to Home
            </Link>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default VendorApplicationStatus;
