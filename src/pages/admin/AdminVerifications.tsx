import { useEffect, useState } from "react";
import { Eye, Check, X, RotateCcw, Loader2, FileText, BadgeCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const statusColors = {
  pending: "bg-warning text-warning-foreground",
  verified: "bg-success text-success-foreground",
  needs_resubmission: "bg-info text-info-foreground",
  rejected: "bg-destructive text-destructive-foreground",
};

const AdminVerifications = () => {
  const { toast } = useToast();
  const [verifications, setVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState<string>("pending");

  useEffect(() => {
    fetchVerifications();
  }, [filter]);

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      const validStatuses = ["pending", "verified", "needs_resubmission", "rejected"] as const;
      let query = supabase
        .from("vendor_verifications")
        .select(`
          *,
          brand:brands(id, name, slug, status)
        `)
        .order("submitted_at", { ascending: false });

      if (filter !== "all" && validStatuses.includes(filter as any)) {
        query = query.eq("status", filter as "pending" | "verified" | "needs_resubmission" | "rejected");
      }

      const { data, error } = await query;
      if (error) throw error;
      setVerifications(data || []);
    } catch (error) {
      console.error("Error fetching verifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: "verified" | "needs_resubmission" | "rejected") => {
    if (!selectedVerification) return;

    setProcessing(true);

    try {
      // Update verification status
      const { error: verificationError } = await supabase
        .from("vendor_verifications")
        .update({
          status: action,
          admin_notes: adminNotes || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", selectedVerification.id);

      if (verificationError) throw verificationError;

      // If verified, update brand status
      if (action === "verified") {
        const { error: brandError } = await supabase
          .from("brands")
          .update({ status: "verified" })
          .eq("id", selectedVerification.brand_id);

        if (brandError) throw brandError;
      }

      toast({
        title: action === "verified" ? "Brand Verified" : action === "rejected" ? "Verification Rejected" : "Resubmission Requested",
        description: action === "verified" 
          ? "Brand is now verified with badge" 
          : "Verification status updated",
      });

      setSelectedVerification(null);
      setAdminNotes("");
      fetchVerifications();
    } catch (error: any) {
      console.error("Error processing verification:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to process verification",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="font-heading text-2xl md:text-4xl uppercase">Verifications</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Review vendor verification requests
          </p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input-brutal w-full sm:w-auto"
        >
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="needs_resubmission">Needs Resubmission</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : verifications.length === 0 ? (
        <div className="card-brutal p-8 md:p-12 text-center">
          <BadgeCheck className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-heading text-xl uppercase mb-2">No Verifications</h3>
          <p className="text-muted-foreground text-sm">
            {filter === "pending" ? "No pending verification requests" : "No verifications found"}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {verifications.map((v) => (
              <div key={v.id} className="card-brutal p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="font-medium">{v.brand?.name || "Unknown Brand"}</span>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(v.submitted_at), "PP")}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 text-xs uppercase ${statusColors[v.status as keyof typeof statusColors]}`}>
                    {v.status.replace("_", " ")}
                  </span>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => setSelectedVerification(v)}
                    className="p-2 hover:bg-secondary"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block card-brutal overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary">
                  <tr>
                    <th className="text-left p-4 font-heading text-sm uppercase">Brand</th>
                    <th className="text-left p-4 font-heading text-sm uppercase">Submitted</th>
                    <th className="text-left p-4 font-heading text-sm uppercase">Documents</th>
                    <th className="text-left p-4 font-heading text-sm uppercase">Status</th>
                    <th className="text-right p-4 font-heading text-sm uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {verifications.map((v) => (
                    <tr key={v.id}>
                      <td className="p-4 font-medium">{v.brand?.name || "Unknown"}</td>
                      <td className="p-4 text-muted-foreground">
                        {format(new Date(v.submitted_at), "PP")}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {[
                          v.dti_registration_url && "DTI",
                          v.bir_certificate_url && "BIR",
                          v.mayor_permit_url && "Permit",
                        ]
                          .filter(Boolean)
                          .join(", ") || "None"}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-xs uppercase ${statusColors[v.status as keyof typeof statusColors]}`}>
                          {v.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => setSelectedVerification(v)}
                            className="p-2 hover:bg-secondary"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Detail Modal */}
      {selectedVerification && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background border-2 border-foreground w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 md:p-6 border-b border-border-subtle">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-xl uppercase">Verification Details</h2>
                <button onClick={() => setSelectedVerification(null)} className="p-2 hover:bg-secondary">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 md:p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Brand</span>
                  <p className="font-medium">{selectedVerification.brand?.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Submitted</span>
                  <p className="font-medium">{format(new Date(selectedVerification.submitted_at), "PPP")}</p>
                </div>
              </div>

              <div>
                <span className="text-muted-foreground text-sm">Documents</span>
                <div className="mt-2 space-y-2">
                  {selectedVerification.dti_registration_url && (
                    <a
                      href={selectedVerification.dti_registration_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm hover:underline"
                    >
                      <FileText className="w-4 h-4" />
                      DTI/SEC Registration
                    </a>
                  )}
                  {selectedVerification.bir_certificate_url && (
                    <a
                      href={selectedVerification.bir_certificate_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm hover:underline"
                    >
                      <FileText className="w-4 h-4" />
                      BIR Certificate
                    </a>
                  )}
                  {selectedVerification.mayor_permit_url && (
                    <a
                      href={selectedVerification.mayor_permit_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm hover:underline"
                    >
                      <FileText className="w-4 h-4" />
                      Mayor's/Business Permit
                    </a>
                  )}
                </div>
              </div>

              {selectedVerification.status === "pending" && (
                <>
                  <div>
                    <label className="block font-heading text-sm uppercase mb-2">
                      Admin Notes (optional)
                    </label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      className="input-brutal w-full h-24 resize-none"
                      placeholder="Add notes for the vendor..."
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => handleAction("verified")}
                      disabled={processing}
                      className="btn-brutal flex items-center justify-center gap-2 flex-1"
                    >
                      {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <BadgeCheck className="w-4 h-4" />}
                      Verify
                    </button>
                    <button
                      onClick={() => handleAction("needs_resubmission")}
                      disabled={processing}
                      className="btn-brutal-secondary flex items-center justify-center gap-2 flex-1"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Request Resubmission
                    </button>
                    <button
                      onClick={() => handleAction("rejected")}
                      disabled={processing}
                      className="border-2 border-destructive text-destructive px-4 py-2 font-heading uppercase text-sm hover:bg-destructive hover:text-destructive-foreground transition-colors flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVerifications;
