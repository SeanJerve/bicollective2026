import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AdminReports = () => {
  const { toast } = useToast();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("pending");

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const { data } = await supabase
          .from("reports")
          .select(`
            *,
            product:products (name, slug),
            brand:brands (name, slug),
            review:reviews (comment)
          `)
          .order("created_at", { ascending: false });

        setReports(data || []);
      } catch (error) {
        console.error("Error fetching reports:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const resolveReport = async (reportId: string, status: string, notes?: string) => {
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
        title: "Report resolved",
        description: `Report marked as ${status}`,
      });
    } catch (error) {
      console.error("Error resolving report:", error);
      toast({
        title: "Error",
        description: "Failed to resolve report",
        variant: "destructive",
      });
    }
  };

  const filteredReports = reports.filter((r) => {
    if (filter === "all") return true;
    return r.status === filter;
  });

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
      <div className="mb-6 md:mb-8">
        <h1 className="font-heading text-2xl md:text-4xl uppercase">Reports</h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Review and moderate user reports
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { value: "pending", label: "Pending" },
          { value: "resolved", label: "Resolved" },
          { value: "dismissed", label: "Dismissed" },
          { value: "all", label: "All" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 font-heading text-sm uppercase ${
              filter === f.value
                ? "bg-foreground text-background"
                : "bg-secondary hover:bg-accent"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filteredReports.length > 0 ? (
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <div key={report.id} className="card-brutal p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                <div>
                  <p className="font-heading uppercase text-xs md:text-sm mb-1">
                    {report.product_id && "Product Report"}
                    {report.brand_id && "Brand Report"}
                    {report.review_id && "Review Report"}
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    {new Date(report.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`px-2 md:px-3 py-1 text-xs uppercase ${
                    report.status === "pending"
                      ? "bg-muted text-muted-foreground"
                      : report.status === "resolved"
                      ? "bg-success text-success-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {report.status}
                </span>
              </div>

              <div className="mb-4 p-3 md:p-4 bg-secondary">
                <h4 className="font-heading text-xs md:text-sm uppercase mb-2">Reason</h4>
                <p className="text-xs md:text-sm">{report.reason}</p>
              </div>

              {report.product && (
                <div className="mb-3 md:mb-4">
                  <span className="text-xs md:text-sm text-muted-foreground">Product: </span>
                  <a
                    href={`/products/${report.product.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs md:text-sm hover:underline"
                  >
                    {report.product.name}
                  </a>
                </div>
              )}

              {report.brand && (
                <div className="mb-3 md:mb-4">
                  <span className="text-xs md:text-sm text-muted-foreground">Brand: </span>
                  <a
                    href={`/brands/${report.brand.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs md:text-sm hover:underline"
                  >
                    {report.brand.name}
                  </a>
                </div>
              )}

              {report.review && (
                <div className="mb-3 md:mb-4">
                  <span className="text-xs md:text-sm text-muted-foreground">Review: </span>
                  <span className="text-xs md:text-sm">"{report.review.comment}"</span>
                </div>
              )}

              {report.admin_notes && (
                <div className="mb-4 p-3 md:p-4 bg-muted">
                  <h4 className="font-heading text-xs md:text-sm uppercase mb-2">Admin Notes</h4>
                  <p className="text-xs md:text-sm">{report.admin_notes}</p>
                </div>
              )}

              {report.status === "pending" && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => resolveReport(report.id, "resolved", "Action taken")}
                    className="btn-brutal flex items-center justify-center gap-2 text-sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Resolve
                  </button>
                  <button
                    onClick={() => resolveReport(report.id, "dismissed", "No action needed")}
                    className="btn-brutal-secondary flex items-center justify-center gap-2 text-sm"
                  >
                    <XCircle className="w-4 h-4" />
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card-brutal p-8 md:p-12 text-center">
          <h3 className="font-heading text-xl md:text-2xl uppercase mb-4">No Reports</h3>
          <p className="text-muted-foreground text-sm md:text-base">
            No reports match the current filter.
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminReports;
