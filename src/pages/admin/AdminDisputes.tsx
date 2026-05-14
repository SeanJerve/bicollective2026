import { useEffect, useState } from "react";
import { AlertTriangle, Loader2, Search, CheckCircle, XCircle, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import Pagination from "@/components/admin/Pagination";

const ITEMS_PER_PAGE = 15;

const statusColors: Record<string, string> = {
  pending: "bg-warning text-warning-foreground",
  under_review: "bg-info text-info-foreground",
  resolved_refund: "bg-success text-success-foreground",
  resolved_replacement: "bg-success text-success-foreground",
  resolved_dismissed: "bg-muted text-muted-foreground",
  escalated: "bg-destructive text-destructive-foreground",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  under_review: "Under Review",
  resolved_refund: "Refunded",
  resolved_replacement: "Replaced",
  resolved_dismissed: "Dismissed",
  escalated: "Escalated",
};

const AdminDisputes = () => {
  const { toast } = useToast();
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDispute, setSelectedDispute] = useState<any | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    fetchDisputes();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("disputes")
        .select(
          `
          *,
          vendor_order:vendor_orders(
            id, subtotal, status,
            brand:brands(name),
            order:orders(id, address:addresses(*))
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDisputes(data || []);
    } catch (error) {
      console.error("Error fetching disputes:", error);
    } finally {
      setLoading(false);
    }
  };

  const resolveDispute = async (disputeId: string, resolution: string) => {
    setResolving(true);
    try {
      const updateData: any = {
        status: resolution,
        resolution_notes: resolutionNotes,
        resolved_at: new Date().toISOString(),
      };
      if (resolution === "resolved_refund" && refundAmount) {
        updateData.refund_amount = parseFloat(refundAmount);
      }

      const { error } = await supabase.from("disputes").update(updateData).eq("id", disputeId);
      if (error) throw error;

      toast({ title: `Dispute ${statusLabels[resolution]?.toLowerCase() || "resolved"}` });
      setSelectedDispute(null);
      setResolutionNotes("");
      setRefundAmount("");
      fetchDisputes();
    } catch {
      toast({ title: "Error resolving dispute", variant: "destructive" });
    } finally {
      setResolving(false);
    }
  };

  const markUnderReview = async (disputeId: string) => {
    try {
      await supabase.from("disputes").update({ status: "under_review" }).eq("id", disputeId);
      toast({ title: "Dispute marked as under review" });
      fetchDisputes();
    } catch {
      toast({ title: "Error updating dispute", variant: "destructive" });
    }
  };

  const filtered = disputes.filter((d) => {
    const matchesFilter = filter === "all" || d.status === filter;
    const matchesSearch =
      d.reason.toLowerCase().includes(search.toLowerCase()) ||
      d.vendor_order?.order?.address?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      d.vendor_order?.brand?.name?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount);

  return (
    <div className="p-4 md:p-8">
      <h1 className="font-heading text-2xl md:text-4xl uppercase mb-1">Dispute Resolution</h1>
      <p className="text-muted-foreground mb-6 text-sm md:text-base">
        Review and resolve customer disputes ({filtered.length} total)
      </p>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by reason, customer, vendor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-brutal w-full pl-10"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input-brutal w-full sm:w-auto"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="under_review">Under Review</option>
          <option value="resolved_refund">Refunded</option>
          <option value="resolved_replacement">Replaced</option>
          <option value="resolved_dismissed">Dismissed</option>
          <option value="escalated">Escalated</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : paginated.length === 0 ? (
        <div className="card-brutal p-12 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No disputes to review</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {paginated.map((dispute) => (
              <div key={dispute.id} className="card-brutal p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-2 py-0.5 text-xs uppercase ${statusColors[dispute.status] || "bg-muted"}`}
                      >
                        {statusLabels[dispute.status] || dispute.status}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(dispute.created_at), "PPp")}
                      </span>
                    </div>
                    <h3 className="font-heading text-lg uppercase">{dispute.reason}</h3>
                    {dispute.description && (
                      <p className="text-sm text-muted-foreground mt-1">{dispute.description}</p>
                    )}
                    <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-sm">
                      <span>
                        <strong>Customer:</strong>{" "}
                        {dispute.vendor_order?.order?.address?.full_name || "Unknown"}
                      </span>
                      <span>
                        <strong>Vendor:</strong> {dispute.vendor_order?.brand?.name || "Unknown"}
                      </span>
                      <span>
                        <strong>Order Amount:</strong>{" "}
                        {formatPrice(Number(dispute.vendor_order?.subtotal || 0))}
                      </span>
                    </div>
                    {dispute.evidence_urls?.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {dispute.evidence_urls.map((url: string, i: number) => (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-16 h-16 bg-muted overflow-hidden block"
                          >
                            <img
                              src={url}
                              alt={`Evidence ${i + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    )}
                    {dispute.resolution_notes && (
                      <div className="mt-3 p-3 bg-secondary text-sm">
                        <strong>Resolution:</strong> {dispute.resolution_notes}
                        {dispute.refund_amount && (
                          <span className="ml-2">({formatPrice(dispute.refund_amount)})</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {(dispute.status === "pending" ||
                    dispute.status === "under_review" ||
                    dispute.status === "escalated") && (
                    <div className="flex flex-wrap gap-2 md:flex-col md:w-40 flex-shrink-0">
                      {dispute.status === "pending" && (
                        <button
                          onClick={() => markUnderReview(dispute.id)}
                          className="btn-brutal text-xs w-full"
                        >
                          <Eye className="w-3 h-3 mr-1 inline" /> Review
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedDispute(dispute);
                          setRefundAmount(String(dispute.vendor_order?.subtotal || ""));
                        }}
                        className="btn-brutal text-xs w-full bg-success text-success-foreground"
                      >
                        <CheckCircle className="w-3 h-3 mr-1 inline" /> Resolve
                      </button>
                      <button
                        onClick={() => resolveDispute(dispute.id, "resolved_dismissed")}
                        className="btn-brutal text-xs w-full bg-muted text-muted-foreground"
                      >
                        <XCircle className="w-3 h-3 mr-1 inline" /> Dismiss
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {/* Resolution Modal */}
      {selectedDispute && (
        <div
          className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedDispute(null)}
        >
          <div
            className="bg-background card-brutal p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-heading text-xl uppercase mb-4">Resolve Dispute</h2>
            <p className="text-sm text-muted-foreground mb-4">Reason: {selectedDispute.reason}</p>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">Resolution Notes</label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="input-brutal w-full h-24"
                  placeholder="Describe the resolution..."
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Refund Amount (optional)</label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="input-brutal w-full"
                  placeholder="0.00"
                />
              </div>
              <div className="flex gap-3">
                <button
                  disabled={resolving}
                  onClick={() => resolveDispute(selectedDispute.id, "resolved_refund")}
                  className="btn-brutal flex-1 bg-success text-success-foreground text-sm"
                >
                  {resolving ? "..." : "Refund"}
                </button>
                <button
                  disabled={resolving}
                  onClick={() => resolveDispute(selectedDispute.id, "resolved_replacement")}
                  className="btn-brutal flex-1 text-sm"
                >
                  {resolving ? "..." : "Replace"}
                </button>
                <button
                  onClick={() => setSelectedDispute(null)}
                  className="btn-brutal flex-1 bg-muted text-muted-foreground text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDisputes;
