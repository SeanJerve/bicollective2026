import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, MessageSquare, Clock, CheckCircle, XCircle } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

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
  resolved_refund: "Resolved - Refund",
  resolved_replacement: "Resolved - Replacement",
  resolved_dismissed: "Dismissed",
  escalated: "Escalated",
};

const Disputes = () => {
  const { user } = useAuth();

  const { data: disputes, isLoading } = useQuery({
    queryKey: ["customer-disputes", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("disputes")
        .select(
          `
          *,
          vendor_order:vendor_orders(
            id,
            brand:brands(name, slug)
          )
        `
        )
        .eq("customer_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <PageLayout>
        <div className="section-container py-12 text-center">
          <p className="text-muted-foreground">Please log in to view your disputes.</p>
          <Link to="/login" className="btn-brutal mt-4 inline-block">
            Sign In
          </Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <section className="py-8 md:py-12 border-b-2 border-foreground">
        <div className="section-container">
          <nav className="text-xs md:text-sm mb-3 md:mb-4">
            <Link to="/" className="text-muted-foreground hover:text-foreground">
              Home
            </Link>
            <span className="mx-2 text-muted-foreground">/</span>
            <span>My Disputes</span>
          </nav>
          <h1 className="font-heading text-4xl md:text-6xl uppercase">My Disputes</h1>
        </div>
      </section>

      <section className="py-8 md:py-12">
        <div className="section-container max-w-4xl">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="card-brutal p-6 skeleton-brutal h-32" />
              ))}
            </div>
          ) : disputes && disputes.length > 0 ? (
            <div className="space-y-4">
              {disputes.map((dispute: any) => (
                <div key={dispute.id} className="card-brutal p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-warning/20 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-5 h-5 text-warning" />
                      </div>
                      <div>
                        <p className="font-heading text-sm uppercase">
                          Dispute #{dispute.id.slice(0, 8)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(dispute.created_at), "PPP 'at' p")}
                        </p>
                        {dispute.vendor_order?.brand && (
                          <Link
                            to={`/brands/${dispute.vendor_order.brand.slug}`}
                            className="text-xs text-primary hover:underline"
                          >
                            {dispute.vendor_order.brand.name}
                          </Link>
                        )}
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs uppercase ${
                        statusColors[dispute.status] || "bg-secondary"
                      }`}
                    >
                      {statusLabels[dispute.status] || dispute.status}
                    </span>
                  </div>

                  <div className="bg-secondary p-4 mb-4">
                    <p className="font-medium text-sm mb-1">Reason:</p>
                    <p className="text-sm">{dispute.reason}</p>
                    {dispute.description && (
                      <>
                        <p className="font-medium text-sm mt-3 mb-1">Details:</p>
                        <p className="text-sm text-muted-foreground">{dispute.description}</p>
                      </>
                    )}
                  </div>

                  {dispute.evidence_urls && dispute.evidence_urls.length > 0 && (
                    <div className="mb-4">
                      <p className="font-medium text-sm mb-2">Evidence Attached:</p>
                      <div className="flex gap-2 flex-wrap">
                        {dispute.evidence_urls.map((url: string, i: number) => (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-16 h-16 bg-muted border-2 border-border-subtle hover:border-primary transition-colors"
                          >
                            <img
                              src={url}
                              alt={`Evidence ${i + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {dispute.resolution_notes && (
                    <div className="border-t-2 border-border-subtle pt-4">
                      <p className="font-medium text-sm mb-1 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Resolution Notes:
                      </p>
                      <p className="text-sm text-muted-foreground">{dispute.resolution_notes}</p>
                      {dispute.refund_amount && (
                        <p className="text-sm text-success mt-2">
                          Refund Amount: ₱{Number(dispute.refund_amount).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="card-brutal p-12 text-center">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-success" />
              <h2 className="font-heading text-xl uppercase mb-2">No Disputes</h2>
              <p className="text-muted-foreground mb-6">
                You haven't filed any disputes. If you have issues with an order, you can report
                them from your order details page.
              </p>
              <Link to="/account/orders" className="btn-brutal-secondary">
                View Orders
              </Link>
            </div>
          )}
        </div>
      </section>
    </PageLayout>
  );
};

export default Disputes;
