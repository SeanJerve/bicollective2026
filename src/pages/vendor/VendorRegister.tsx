import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Building2, Rocket, Loader2 } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import DocumentUpload from "@/components/vendor/DocumentUpload";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const BICOL_LOCATIONS = [
  "Legazpi City, Albay",
  "Naga City, Camarines Sur",
  "Iriga City, Camarines Sur",
  "Sorsogon City, Sorsogon",
  "Tabaco City, Albay",
  "Daet, Camarines Norte",
  "Virac, Catanduanes",
  "Masbate City, Masbate",
  "Ligao City, Albay",
  "Other",
];

type BusinessType = "established" | "aspiring";

interface FormData {
  businessName: string;
  businessType: BusinessType | null;
  location: string;
  contactPhone: string;
  description: string;
  businessPermitUrl: string | null;
  validIdUrl: string | null;
  proofOfProductsUrl: string | null;
}

const VendorRegister = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [existingApplication, setExistingApplication] = useState<any>(null);
  const [checkingApplication, setCheckingApplication] = useState(true);

  const [formData, setFormData] = useState<FormData>({
    businessName: "",
    businessType: null,
    location: "",
    contactPhone: "",
    description: "",
    businessPermitUrl: null,
    validIdUrl: null,
    proofOfProductsUrl: null,
  });

  useEffect(() => {
    const checkExistingApplication = async () => {
      if (!user) {
        setCheckingApplication(false);
        return;
      }

      try {
        // Check for existing application
        const { data: application } = await supabase
          .from("vendor_applications")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (application) {
          setExistingApplication(application);
          // Pre-fill form if needs_resubmission
          if (application.status === "needs_resubmission") {
            setFormData({
              businessName: application.business_name || "",
              businessType: application.business_type as BusinessType,
              location: application.location || "",
              contactPhone: application.contact_phone || "",
              description: application.description || "",
              businessPermitUrl: application.business_permit_url || null,
              validIdUrl: application.valid_id_url || null,
              proofOfProductsUrl: application.proof_of_products_url || null,
            });
          }
        }

        // Check if already a vendor
        const { data: brand } = await supabase
          .from("brands")
          .select("id")
          .eq("owner_id", user.id)
          .maybeSingle();

        if (brand) {
          navigate("/vendor");
          return;
        }
      } catch (error) {
        console.error("Error checking application:", error);
      } finally {
        setCheckingApplication(false);
      }
    };

    checkExistingApplication();
  }, [user, navigate]);

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to apply as a vendor",
        variant: "destructive",
      });
      navigate("/login?redirect=/vendor/register");
      return;
    }

    if (!formData.businessType || !formData.businessName || !formData.location || !formData.contactPhone) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!formData.validIdUrl) {
      toast({
        title: "Missing document",
        description: "Please upload a valid ID",
        variant: "destructive",
      });
      return;
    }

    if (formData.businessType === "established" && !formData.businessPermitUrl) {
      toast({
        title: "Missing document",
        description: "Established businesses must upload a business permit",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const applicationData = {
        user_id: user.id,
        business_name: formData.businessName,
        business_type: formData.businessType,
        location: formData.location,
        contact_phone: formData.contactPhone,
        description: formData.description,
        business_permit_url: formData.businessPermitUrl,
        valid_id_url: formData.validIdUrl,
        proof_of_products_url: formData.proofOfProductsUrl,
        status: "pending" as const,
      };

      let error;
      if (existingApplication?.status === "needs_resubmission") {
        // Update existing application
        ({ error } = await supabase
          .from("vendor_applications")
          .update(applicationData)
          .eq("id", existingApplication.id));
      } else {
        // Insert new application
        ({ error } = await supabase.from("vendor_applications").insert(applicationData));
      }

      if (error) throw error;

      toast({
        title: existingApplication ? "Application resubmitted!" : "Application submitted!",
        description: "We'll review your application and get back to you soon.",
      });

      navigate("/vendor/application-status");
    } catch (error: any) {
      console.error("Error submitting application:", error);
      toast({
        title: "Submission failed",
        description: error.message || "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || checkingApplication) {
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
          <h1 className="font-heading text-3xl md:text-4xl uppercase mb-4">
            Become a Seller
          </h1>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Join the Bicollective marketplace and reach customers across Bicol.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login?redirect=/vendor/register" className="btn-brutal">
              Sign In to Apply
            </Link>
            <Link to="/register?redirect=/vendor/register" className="btn-brutal-secondary">
              Create Account
            </Link>
          </div>
        </div>
      </PageLayout>
    );
  }

  // If needs_resubmission, allow editing; otherwise redirect to status
  if (existingApplication && existingApplication.status !== "needs_resubmission") {
    return (
      <PageLayout>
        <div className="section-container py-16 text-center">
          <h1 className="font-heading text-3xl md:text-4xl uppercase mb-4">
            Application Submitted
          </h1>
          <p className="text-muted-foreground mb-8">
            You already have a pending application. Check your status below.
          </p>
          <Link to="/vendor/application-status" className="btn-brutal">
            View Application Status
          </Link>
        </div>
      </PageLayout>
    );
  }

  const totalSteps = 4;

  return (
    <PageLayout>
      {/* Header */}
      <section className="py-8 md:py-12 border-b-2 border-foreground">
        <div className="section-container">
          <Link to="/" className="inline-flex items-center gap-2 text-sm mb-4 hover:underline">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="font-heading text-3xl md:text-5xl uppercase">
            Become a Seller
          </h1>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">
            Join the Bicollective marketplace
          </p>
        </div>
      </section>

      {/* Progress */}
      <section className="py-6 border-b border-border-subtle">
        <div className="section-container">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center border-2 font-heading text-sm ${
                    step > s
                      ? "bg-foreground text-background border-foreground"
                      : step === s
                      ? "border-foreground"
                      : "border-border-subtle text-muted-foreground"
                  }`}
                >
                  {step > s ? <Check className="w-4 h-4" /> : s}
                </div>
                {s < totalSteps && (
                  <div
                    className={`w-12 md:w-24 h-0.5 ${
                      step > s ? "bg-foreground" : "bg-border-subtle"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="py-8 md:py-12">
        <div className="section-container max-w-2xl">
          {/* Step 1: Business Type */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-heading text-2xl uppercase mb-2">
                  What type of seller are you?
                </h2>
                <p className="text-muted-foreground text-sm">
                  This helps us understand what documents you'll need to submit.
                </p>
              </div>

              <div className="grid gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, businessType: "established" });
                    setStep(2);
                  }}
                  className={`card-brutal p-6 text-left hover:bg-secondary transition-colors ${
                    formData.businessType === "established" ? "ring-2 ring-foreground" : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-foreground text-background flex items-center justify-center">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-heading uppercase mb-1">Established Business</h3>
                      <p className="text-sm text-muted-foreground">
                        I have a registered business with permits and licenses. I'm ready to provide business documents.
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, businessType: "aspiring" });
                    setStep(2);
                  }}
                  className={`card-brutal p-6 text-left hover:bg-secondary transition-colors ${
                    formData.businessType === "aspiring" ? "ring-2 ring-foreground" : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-foreground text-background flex items-center justify-center">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-heading uppercase mb-1">Aspiring Seller</h3>
                      <p className="text-sm text-muted-foreground">
                        I'm just starting out or selling informally. I want to grow my business on Bicollective.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Business Info */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-heading text-2xl uppercase mb-2">
                  Business Information
                </h2>
                <p className="text-muted-foreground text-sm">
                  Tell us about your brand or business.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block font-heading text-sm uppercase mb-2">
                    Brand / Business Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="input-brutal w-full"
                    placeholder="Your brand name"
                    required
                  />
                </div>

                <div>
                  <label className="block font-heading text-sm uppercase mb-2">
                    Location <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="input-brutal w-full"
                    required
                  >
                    <option value="">Select location</option>
                    {BICOL_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-heading text-sm uppercase mb-2">
                    Contact Phone <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="input-brutal w-full"
                    placeholder="09XX XXX XXXX"
                    required
                  />
                </div>

                <div>
                  <label className="block font-heading text-sm uppercase mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-brutal w-full h-32 resize-none"
                    placeholder="Tell us about your brand, what you sell, and your story..."
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-brutal-secondary flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!formData.businessName || !formData.location || !formData.contactPhone) {
                      toast({
                        title: "Missing information",
                        description: "Please fill in all required fields",
                        variant: "destructive",
                      });
                      return;
                    }
                    setStep(3);
                  }}
                  className="btn-brutal flex items-center gap-2 flex-1"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Documents */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-heading text-2xl uppercase mb-2">
                  Upload Documents
                </h2>
                <p className="text-muted-foreground text-sm">
                  {formData.businessType === "established"
                    ? "As an established business, please provide the following documents."
                    : "As an aspiring seller, we just need a valid ID and photos of your products."}
                </p>
              </div>

              <div className="space-y-6">
                <DocumentUpload
                  label="Valid Government ID"
                  description="Driver's license, passport, or any government-issued ID"
                  bucket="vendor-documents"
                  folder={user!.id}
                  value={formData.validIdUrl || undefined}
                  onChange={(url) => setFormData({ ...formData, validIdUrl: url })}
                  required
                />

                {formData.businessType === "established" && (
                  <DocumentUpload
                    label="Business Permit"
                    description="Mayor's permit, DTI registration, or SEC certificate"
                    bucket="vendor-documents"
                    folder={user!.id}
                    value={formData.businessPermitUrl || undefined}
                    onChange={(url) => setFormData({ ...formData, businessPermitUrl: url })}
                    required
                  />
                )}

                <DocumentUpload
                  label="Product Photos"
                  description="Show us samples of products you plan to sell"
                  bucket="vendor-documents"
                  folder={user!.id}
                  value={formData.proofOfProductsUrl || undefined}
                  onChange={(url) => setFormData({ ...formData, proofOfProductsUrl: url })}
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn-brutal-secondary flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="btn-brutal flex items-center gap-2 flex-1"
                >
                  Review Application
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-heading text-2xl uppercase mb-2">
                  Review Your Application
                </h2>
                <p className="text-muted-foreground text-sm">
                  Please review your information before submitting.
                </p>
              </div>

              <div className="card-brutal p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Business Type</span>
                    <p className="font-medium capitalize">{formData.businessType}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Brand Name</span>
                    <p className="font-medium">{formData.businessName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Location</span>
                    <p className="font-medium">{formData.location}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone</span>
                    <p className="font-medium">{formData.contactPhone}</p>
                  </div>
                </div>
                {formData.description && (
                  <div className="pt-4 border-t border-border-subtle">
                    <span className="text-muted-foreground text-sm">Description</span>
                    <p className="text-sm mt-1">{formData.description}</p>
                  </div>
                )}
                <div className="pt-4 border-t border-border-subtle">
                  <span className="text-muted-foreground text-sm">Documents</span>
                  <div className="mt-2 space-y-1 text-sm">
                    <p>✓ Valid ID uploaded</p>
                    {formData.businessPermitUrl && <p>✓ Business Permit uploaded</p>}
                    {formData.proofOfProductsUrl && <p>✓ Product Photos uploaded</p>}
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="btn-brutal-secondary flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="btn-brutal flex items-center gap-2 flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Application
                      <Check className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </PageLayout>
  );
};

export default VendorRegister;
