import { useEffect, useState, useCallback } from "react";
import {
  CheckCircle,
  XCircle,
  Trash2,
  AlertTriangle,
  X,
  Flag,
  Eye,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface DeleteConfirmState {
  reportId: string;
  reviewId: string;
  reviewComment: string | null;
  reportReason: string;
}

const AdminReports = () => {
  const { toast } = useToast();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Delete confirmation modal state
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("reports")
        .select(
          `
          *,
          product:products (name, slug),
          brand:brands (name, slug),
          review:reviews (comment, rating, is_visible)
        `
        )
        .order("created_at", { ascending: false });

      setReports(data || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();

    // Real-time: refresh when a new report is inserted
    const channel = supabase
      .channel("admin-reports-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "reports" }, () => {
        fetchReports();
        toast({
          title: "🚩 New Report Received",
          description: "A vendor has submitted a new review report.",
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchReports, toast]);

  const resolveReport = async (reportId: string, status: string, notes?: string) => {
    setActionLoading(reportId + status);
    try {
      const { error } = await supabase
        .from("reports")
        .update({
          status,
          admin_notes: notes || null,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", reportId);

      if (error) throw error;

      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId
            ? { ...r, status, admin_notes: notes, resolved_at: new Date().toISOString() }
            : r
        )
      );

      toast({
        title: status === "resolved" ? "Report resolved" : "Report dismissed",
        description: `Report has been marked as ${status}.`,
      });
    } catch (error) {
      console.error("Error resolving report:", error);
      toast({
        title: "Error",
        description: "Failed to update report status",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const confirmDeleteReview = (report: any) => {
    setDeleteConfirm({
      reportId: report.id,
      reviewId: report.review_id,
      reviewComment: report.review?.comment || null,
      reportReason: report.reason,
    });
  };

  const executeDeleteReview = async () => {
    if (!deleteConfirm) return;
    setDeleteLoading(true);

    try {
      // 1. Hide the review (set is_visible = false)
      const { error: reviewError } = await supabase
        .from("reviews")
        .update({ is_visible: false })
        .eq("id", deleteConfirm.reviewId);

      if (reviewError) throw reviewError;

      // 2. Mark the report as resolved
      const { error } = await supabase
        .from("reports")
        .update({
          status: "resolved",
          admin_notes: "Review removed: violated community guidelines.",
          resolved_at: new Date().toISOString(),
        })
        .eq("id", deleteConfirm.reportId);

      if (error) throw error;

      setReports((prev) =>
        prev.map((r) =>
          r.id === deleteConfirm.reportId
            ? {
                ...r,
                status: "resolved",
                admin_notes: "Review removed: violated community guidelines.",
                resolved_at: new Date().toISOString(),
                review: r.review ? { ...r.review, is_visible: false } : r.review,
              }
            : r
        )
      );

      toast({
        title: "Review deleted",
        description: "The review is now hidden from the product page. Report marked as resolved.",
      });

      setDeleteConfirm(null);
    } catch (error: any) {
      console.error("Error deleting review:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete review",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (filter === "all") return true;
    return r.status === filter;
  });

  const pendingCount = reports.filter((r) => r.status === "pending").length;

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 skeleton-brutal" />
          <div className="h-64 skeleton-brutal" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="font-heading text-2xl md:text-4xl uppercase">Reports</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Review and moderate reported content
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 px-4 py-2">
            <Flag className="w-4 h-4 text-destructive" />
            <span className="font-heading text-sm uppercase text-destructive">
              {pendingCount} pending {pendingCount === 1 ? "report" : "reports"}
            </span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          {
            value: "pending",
            label: "Pending",
            count: reports.filter((r) => r.status === "pending").length,
          },
          {
            value: "resolved",
            label: "Resolved",
            count: reports.filter((r) => r.status === "resolved").length,
          },
          {
            value: "dismissed",
            label: "Dismissed",
            count: reports.filter((r) => r.status === "dismissed").length,
          },
          { value: "all", label: "All", count: reports.length },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 font-heading text-sm uppercase flex items-center gap-2 ${
              filter === f.value ? "bg-foreground text-background" : "bg-secondary hover:bg-accent"
            }`}
          >
            {f.label}
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full ${
                filter === f.value ? "bg-background/20" : "bg-foreground/10"
              }`}
            >
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {filteredReports.length > 0 ? (
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <div key={report.id} className="card-brutal p-4 md:p-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                <div className="flex items-start gap-3">
                  {/* Type badge */}
                  <div className="w-8 h-8 flex-shrink-0 bg-foreground text-background flex items-center justify-center">
                    {report.review_id ? <Flag className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="font-heading uppercase text-xs md:text-sm mb-0.5">
                      {report.review_id && "Review Report"}
                      {!report.review_id && report.product_id && "Product Report"}
                      {!report.review_id && !report.product_id && report.brand_id && "Brand Report"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(report.created_at), "PPp")}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 text-xs uppercase font-heading flex-shrink-0 ${
                    report.status === "pending"
                      ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                      : report.status === "resolved"
                        ? "bg-green-100 text-green-800 border border-green-300"
                        : "bg-muted text-muted-foreground border border-border-subtle"
                  }`}
                >
                  {report.status}
                </span>
              </div>

              {/* Reason */}
              <div className="mb-4 p-3 md:p-4 bg-secondary border-l-4 border-foreground">
                <h4 className="font-heading text-xs uppercase mb-1 text-muted-foreground">
                  Reported Reason
                </h4>
                <p className="text-sm font-medium">{report.reason}</p>
              </div>

              {/* Linked content */}
              {report.review && (
                <div className="mb-4 p-3 bg-muted/50 border border-border-subtle">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-heading text-xs uppercase text-muted-foreground">
                      Reported Review
                    </h4>
                    {report.review.is_visible === false && (
                      <span className="text-xs text-destructive font-heading uppercase bg-destructive/10 px-2 py-0.5">
                        Deleted
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground italic">
                    "{report.review.comment || "(No comment)"}"
                  </p>
                  {report.review.rating && (
                    <div className="flex items-center gap-0.5 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`text-xs ${i < report.review.rating ? "text-foreground" : "text-muted"}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {report.product && (
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground uppercase font-heading">
                    Product:
                  </span>
                  <a
                    href={`/products/${report.product.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:underline flex items-center gap-1"
                  >
                    {report.product.name}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {report.brand && (
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground uppercase font-heading">
                    Brand:
                  </span>
                  <a
                    href={`/brands/${report.brand.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:underline flex items-center gap-1"
                  >
                    {report.brand.name}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {report.admin_notes && (
                <div className="mb-4 p-3 bg-muted">
                  <h4 className="font-heading text-xs uppercase mb-1 text-muted-foreground">
                    Admin Notes
                  </h4>
                  <p className="text-sm">{report.admin_notes}</p>
                </div>
              )}

              {/* Actions */}
              {report.status === "pending" && (
                <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-border-subtle">
                  <button
                    onClick={() => resolveReport(report.id, "resolved", "Reviewed. Action taken.")}
                    disabled={actionLoading === report.id + "resolved"}
                    className="btn-brutal flex items-center justify-center gap-2 text-sm"
                  >
                    {actionLoading === report.id + "resolved" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Resolve
                  </button>

                  {report.review_id && report.review?.is_visible !== false && (
                    <button
                      onClick={() => confirmDeleteReview(report)}
                      className="flex items-center justify-center gap-2 text-sm font-heading uppercase px-4 py-2 border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Review
                    </button>
                  )}

                  <button
                    onClick={() =>
                      resolveReport(report.id, "dismissed", "Report reviewed. No action required.")
                    }
                    disabled={actionLoading === report.id + "dismissed"}
                    className="btn-brutal-secondary flex items-center justify-center gap-2 text-sm"
                  >
                    {actionLoading === report.id + "dismissed" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card-brutal p-8 md:p-12 text-center">
          <Flag className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-heading text-xl md:text-2xl uppercase mb-2">No Reports</h3>
          <p className="text-muted-foreground text-sm md:text-base">
            {filter === "pending"
              ? "No pending reports. All clear!"
              : `No ${filter} reports found.`}
          </p>
        </div>
      )}

      {/* Delete Review Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="card-brutal p-6 md:p-8 w-full max-w-md">
            {/* Modal Header */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-destructive text-destructive-foreground flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-heading text-lg uppercase">Delete Review</h2>
                  <p className="text-xs text-muted-foreground">This action cannot be undone</p>
                </div>
              </div>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="hover:opacity-60 transition-opacity"
                disabled={deleteLoading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Review preview */}
            <div className="bg-secondary border-l-4 border-destructive p-4 mb-5">
              <p className="text-xs font-heading uppercase text-muted-foreground mb-2">
                Review to be deleted
              </p>
              <p className="text-sm italic text-muted-foreground">
                "{deleteConfirm.reviewComment || "(No comment)"}"
              </p>
            </div>

            {/* Report reason */}
            <div className="mb-5">
              <p className="text-xs font-heading uppercase text-muted-foreground mb-1">
                Reported for
              </p>
              <p className="text-sm">{deleteConfirm.reportReason}</p>
            </div>

            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              This will <strong>permanently hide</strong> the review from the product page and mark
              this report as <strong>resolved</strong>. The review will no longer be visible to
              shoppers or appear in the vendor's review list.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleteLoading}
                className="btn-brutal-secondary flex-1 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={executeDeleteReview}
                disabled={deleteLoading}
                className="flex-1 text-sm font-heading uppercase px-4 py-3 border-2 border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors flex items-center justify-center gap-2"
              >
                {deleteLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {deleteLoading ? "Deleting..." : "Yes, Delete Review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReports;
