import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Clock, CheckCircle, AlertCircle, XCircle, RefreshCw, Loader2 } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
      } catch (error) {
        console.error("Error fetching application:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [user]);

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

          {/* Application Details */}
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

          {/* Actions */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            {application.status === "approved" && (
              <Link to="/vendor" className="btn-brutal flex-1 text-center">
                Go to Dashboard
              </Link>
            )}
            {application.status === "needs_resubmission" && (
              <Link to="/vendor/register" className="btn-brutal flex-1 text-center flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Update Application
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
