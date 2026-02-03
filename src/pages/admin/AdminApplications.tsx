import { useEffect, useState } from "react";
import { Eye, Check, X, RotateCcw, Loader2, FileText, Building2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const statusColors = {
  pending: "bg-warning text-warning-foreground",
  approved: "bg-success text-success-foreground",
  needs_resubmission: "bg-info text-info-foreground",
  rejected: "bg-destructive text-destructive-foreground",
};

const AdminApplications = () => {
  const { toast } = useToast();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState<string>("pending");

  useEffect(() => {
    fetchApplications();
  }, [filter]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("vendor_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (filter !== "all" && (filter === "pending" || filter === "approved" || filter === "needs_resubmission" || filter === "rejected")) {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: "approved" | "needs_resubmission" | "rejected") => {
    if (!selectedApp) return;

    setProcessing(true);

    try {
      if (action === "approved") {
        // Create brand for approved application
        const slug = selectedApp.business_name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");

        const { error: brandError } = await supabase.from("brands").insert({
          owner_id: selectedApp.user_id,
          name: selectedApp.business_name,
          slug: `${slug}-${Date.now().toString(36)}`,
          location: selectedApp.location,
          description: selectedApp.description,
          status: "approved",
        });

        if (brandError) throw brandError;

        // Add vendor role
        const { error: roleError } = await supabase.from("user_roles").insert({
          user_id: selectedApp.user_id,
          role: "vendor",
        });

        if (roleError && !roleError.message.includes("duplicate")) {
          throw roleError;
        }
      }

      // Update application status
      const { error } = await supabase
        .from("vendor_applications")
        .update({
          status: action,
          admin_notes: adminNotes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedApp.id);

      if (error) throw error;

      toast({
        title: action === "approved" ? "Application Approved" : action === "rejected" ? "Application Rejected" : "Resubmission Requested",
        description: action === "approved" 
          ? "Vendor account created successfully" 
          : "Application status updated",
      });

      setSelectedApp(null);
      setAdminNotes("");
      fetchApplications();
    } catch (error: any) {
      console.error("Error processing application:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to process application",
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
          <h1 className="font-heading text-2xl md:text-4xl uppercase">Applications</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Review vendor applications
          </p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input-brutal w-full sm:w-auto"
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="needs_resubmission">Needs Resubmission</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : applications.length === 0 ? (
        <div className="card-brutal p-8 md:p-12 text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-heading text-xl uppercase mb-2">No Applications</h3>
          <p className="text-muted-foreground text-sm">
            {filter === "pending" ? "No pending applications to review" : "No applications found"}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {applications.map((app) => (
              <div key={app.id} className="card-brutal p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {app.business_type === "established" ? (
                        <Building2 className="w-4 h-4" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      <span className="font-medium">{app.business_name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{app.location}</p>
                  </div>
                  <span className={`px-2 py-0.5 text-xs uppercase ${statusColors[app.status as keyof typeof statusColors]}`}>
                    {app.status.replace("_", " ")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{format(new Date(app.created_at), "PP")}</span>
                  <button
                    onClick={() => setSelectedApp(app)}
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
                    <th className="text-left p-4 font-heading text-sm uppercase">Business</th>
                    <th className="text-left p-4 font-heading text-sm uppercase">Type</th>
                    <th className="text-left p-4 font-heading text-sm uppercase">Location</th>
                    <th className="text-left p-4 font-heading text-sm uppercase">Submitted</th>
                    <th className="text-left p-4 font-heading text-sm uppercase">Status</th>
                    <th className="text-right p-4 font-heading text-sm uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {applications.map((app) => (
                    <tr key={app.id}>
                      <td className="p-4 font-medium">{app.business_name}</td>
                      <td className="p-4">
                        <span className="flex items-center gap-2 capitalize">
                          {app.business_type === "established" ? (
                            <Building2 className="w-4 h-4" />
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                          {app.business_type}
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground">{app.location}</td>
                      <td className="p-4 text-muted-foreground">
                        {format(new Date(app.created_at), "PP")}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-xs uppercase ${statusColors[app.status as keyof typeof statusColors]}`}>
                          {app.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => setSelectedApp(app)}
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
      {selectedApp && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background border-2 border-foreground w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 md:p-6 border-b border-border-subtle">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-xl uppercase">Application Details</h2>
                <button onClick={() => setSelectedApp(null)} className="p-2 hover:bg-secondary">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 md:p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Business Name</span>
                  <p className="font-medium">{selectedApp.business_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Business Type</span>
                  <p className="font-medium capitalize">{selectedApp.business_type}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Location</span>
                  <p className="font-medium">{selectedApp.location}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone</span>
                  <p className="font-medium">{selectedApp.contact_phone}</p>
                </div>
              </div>

              {selectedApp.description && (
                <div>
                  <span className="text-muted-foreground text-sm">Description</span>
                  <p className="text-sm mt-1">{selectedApp.description}</p>
                </div>
              )}

              <div>
                <span className="text-muted-foreground text-sm">Documents</span>
                <div className="mt-2 space-y-2">
                  {selectedApp.valid_id_url && (
                    <a
                      href={selectedApp.valid_id_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm hover:underline"
                    >
                      <FileText className="w-4 h-4" />
                      Valid ID
                    </a>
                  )}
                  {selectedApp.business_permit_url && (
                    <a
                      href={selectedApp.business_permit_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm hover:underline"
                    >
                      <FileText className="w-4 h-4" />
                      Business Permit
                    </a>
                  )}
                  {selectedApp.proof_of_products_url && (
                    <a
                      href={selectedApp.proof_of_products_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm hover:underline"
                    >
                      <FileText className="w-4 h-4" />
                      Product Photos
                    </a>
                  )}
                </div>
              </div>

              {selectedApp.status === "pending" && (
                <>
                  <div>
                    <label className="block font-heading text-sm uppercase mb-2">
                      Admin Notes (optional)
                    </label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      className="input-brutal w-full h-24 resize-none"
                      placeholder="Add notes for the applicant..."
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => handleAction("approved")}
                      disabled={processing}
                      className="btn-brutal flex items-center justify-center gap-2 flex-1"
                    >
                      {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Approve
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

export default AdminApplications;
