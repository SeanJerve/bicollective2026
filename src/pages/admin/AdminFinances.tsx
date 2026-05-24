import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Check, X, Eye, DollarSign, Crown, Zap, AlertCircle, Clock, Calendar, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { format } from "date-fns";
import { PREMIUM_COMMISSION_RATE } from "@/lib/platformFees";

const ResolvedProofImage = ({ path }: { path: string }) => {
  const { data: url, isLoading } = useQuery({
    queryKey: ["proof-url-resolved", path],
    queryFn: async () => {
      if (!path) return null;
      if (path.startsWith("http")) return path;
      const { data } = await supabase.storage.from("payment-proofs").createSignedUrl(path, 3600);
      return data?.signedUrl || null;
    },
    enabled: !!path,
  });

  if (isLoading) {
    return (
      <div className="w-full h-72 bg-secondary flex items-center justify-center border-2 border-dashed border-foreground/20 animate-pulse">
        <span className="text-xs text-muted-foreground uppercase font-heading">Loading receipt proof...</span>
      </div>
    );
  }

  if (!url) {
    return (
      <div className="w-full h-72 bg-secondary flex items-center justify-center border-2 border-dashed border-foreground/20">
        <span className="text-xs text-muted-foreground uppercase font-heading">No receipt uploaded</span>
      </div>
    );
  }

  return (
    <div className="border-2 border-foreground bg-background p-1 shadow-brutal relative group overflow-hidden">
      <img
        src={url}
        alt="Payment Proof Receipt"
        className="w-full h-96 object-contain cursor-zoom-in group-hover:scale-[1.01] transition-transform duration-200"
        onClick={() => window.open(url, "_blank")}
        onError={(e) => {
          e.currentTarget.src = "/placeholder.svg";
        }}
      />
      <div className="absolute inset-x-0 bottom-0 bg-foreground/90 text-background text-center py-2 font-heading text-[10px] uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        Click image to open full resolution in new tab
      </div>
    </div>
  );
};

const AdminFinances = () => {
  const { toast } = useToast();
  const [activeTxn, setActiveTxn] = useState<any | null>(null);
  const [activeBoost, setActiveBoost] = useState<any | null>(null);
  const [actionPending, setActionPending] = useState<string | null>(null);

  const { data: transactions, refetch: refetchTrans } = useQuery({
    queryKey: ["admin-pending-transactions"],
    queryFn: async () => {
      const { data, error } = await (
        (supabase as any)
          .from("platform_transactions")
          .select("*, brand:brands(id, name, logo, logo_url, platform_debt)") as any
      )
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: boosts, refetch: refetchBoosts } = useQuery({
    queryKey: ["admin-pending-boosts"],
    queryFn: async () => {
      const { data, error } = await (
        (supabase as any)
          .from("ad_boosts")
          .select("*, brand:brands(id, name, logo, logo_url), product:products(name, image_url)") as any
      )
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const handleApproveTransaction = async (trans: any) => {
    setActionPending("approve-txn");
    try {
      // 1. Update brand fields based on transaction type
      if (trans.transaction_type === "debt_payment") {
        // Debt recalculation is now handled automatically by the tr_recalc_debt_txn trigger
        // when we mark this transaction as 'approved' below.
      } else if (trans.transaction_type === "subscription_purchase") {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);
        const { error: brandErr } = await supabase
          .from("brands")
          .update({
            subscription_tier: "premium",
            subscription_expires_at: expiresAt.toISOString(),
            commission_rate: PREMIUM_COMMISSION_RATE,
          } as any)
          .eq("id", trans.brand_id);
        if (brandErr) throw brandErr;
      }

      // 2. Mark transaction as approved
      const { error: updateErr } = await (supabase as any)
        .from("platform_transactions")
        .update({ status: "approved" } as any)
        .eq("id", trans.id);
      if (updateErr) throw updateErr;

      toast({ title: "Approved", description: "Transaction successfully approved." });
      setActiveTxn(null);
      refetchTrans();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActionPending(null);
    }
  };

  const handleApproveBoost = async (boost: any) => {
    setActionPending("approve-boost");
    try {
      const startsAt = new Date();
      const endsAt = new Date();
      if (boost.boost_type === "24h") endsAt.setDate(endsAt.getDate() + 1);
      else if (boost.boost_type === "7d") endsAt.setDate(endsAt.getDate() + 7);
      else if (boost.boost_type === "30d") endsAt.setDate(endsAt.getDate() + 30);

      const { error: updateErr } = await (supabase as any)
        .from("ad_boosts")
        .update({
          status: "active",
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString(),
        } as any)
        .eq("id", boost.id);
      if (updateErr) throw updateErr;

      toast({ title: "Boost Activated!", description: "The product is now sponsored." });
      setActiveBoost(null);
      refetchBoosts();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActionPending(null);
    }
  };

  const handleReject = async (table: string, id: string) => {
    setActionPending("reject");
    try {
      const { error } = await (supabase.from(table as any) as any)
        .update({ status: "rejected" } as any)
        .eq("id", id);
      if (error) throw error;
      toast({ title: "Rejected", description: "Request has been declined." });
      setActiveTxn(null);
      setActiveBoost(null);
      if (table === "platform_transactions") refetchTrans();
      else refetchBoosts();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActionPending(null);
    }
  };

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount);

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl md:text-4xl uppercase">Financial Management</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Verify payments for platform debt, subscriptions, and boosts.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Pending Payments & Subscriptions */}
        <section className="card-brutal p-6 space-y-6">
          <h2 className="font-heading text-xl uppercase flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-success" /> Pending Brand Payments
          </h2>
          <div className="space-y-4">
            {transactions?.length ? (
              transactions.map((t: any) => (
                <div
                  key={t.id}
                  onClick={() => setActiveTxn(t)}
                  className="p-4 border-2 border-foreground hover:bg-secondary/40 cursor-pointer flex items-center justify-between transition-colors shadow-brutal-sm hover:-translate-y-0.5 active:translate-y-0 select-none bg-background"
                >
                  <div className="space-y-1">
                    <p className="font-heading text-sm uppercase leading-tight">{t.brand?.name}</p>
                    <p className="text-xs font-heading text-muted-foreground uppercase">
                      {t.transaction_type === "debt_payment" ? "Debt Settlement" : "Premium Sub"} —
                      ₱{t.amount}
                    </p>
                    <span className="inline-flex items-center gap-1 text-[10px] text-accent font-bold uppercase hover:underline pt-1">
                      <Eye className="w-3 h-3" /> View Verification Details
                    </span>
                  </div>
                  <div className="w-10 h-10 border-2 border-foreground bg-secondary flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center italic">
                No pending payments.
              </p>
            )}
          </div>
        </section>

        {/* Pending Ad Boosts */}
        <section className="card-brutal p-6 space-y-6">
          <h2 className="font-heading text-xl uppercase flex items-center gap-2">
            <Zap className="w-5 h-5 text-warning" /> Pending Ad Boosts
          </h2>
          <div className="space-y-4">
            {boosts?.length ? (
              boosts.map((b: any) => (
                <div
                  key={b.id}
                  onClick={() => setActiveBoost(b)}
                  className="p-4 border-2 border-foreground hover:bg-secondary/40 cursor-pointer flex items-center justify-between transition-colors shadow-brutal-sm hover:-translate-y-0.5 active:translate-y-0 select-none bg-background"
                >
                  <div className="flex gap-3">
                    <img
                      src={b.product?.image_url}
                      className="w-12 h-12 object-cover border-2 border-foreground"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg";
                      }}
                    />
                    <div className="space-y-1">
                      <p className="font-heading text-sm uppercase leading-tight">
                        {b.product?.name}
                      </p>
                      <p className="text-[10px] opacity-60 uppercase font-heading">
                        {b.brand?.name} • {b.boost_type} Boost
                      </p>
                      <span className="inline-flex items-center gap-1 text-[10px] text-accent font-bold uppercase hover:underline">
                        <Eye className="w-3 h-3" /> View Boost Details
                      </span>
                    </div>
                  </div>
                  <div className="w-10 h-10 border-2 border-foreground bg-secondary flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-warning" />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center italic">
                No pending boost requests.
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Transaction Details Modal */}
      {activeTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="card-brutal p-6 md:p-8 w-full max-w-2xl bg-background max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setActiveTxn(null)}
              className="absolute top-4 right-4 w-8 h-8 bg-background border-2 border-foreground rounded-full flex items-center justify-center font-heading hover:bg-secondary transition-colors"
            >
              ✕
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 border-b-2 border-foreground pb-4 mb-6">
              <div className="w-12 h-12 bg-success/20 flex items-center justify-center border-2 border-foreground">
                <DollarSign className="w-6 h-6 text-success" />
              </div>
              <div>
                <h2 className="font-heading text-lg md:text-xl uppercase">Payment Verification</h2>
                <p className="text-xs text-muted-foreground font-mono">Txn ID: {activeTxn.id}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Left Column: Metadata */}
              <div className="space-y-4">
                {/* Brand Card */}
                <div className="bg-secondary p-4 border-2 border-foreground shadow-brutal-sm">
                  <h3 className="text-xs font-heading uppercase text-muted-foreground mb-3">Sender Brand Info</h3>
                  <div className="flex items-center gap-3">
                    <img
                      src={activeTxn.brand?.logo_url || activeTxn.brand?.logo || "/placeholder.svg"}
                      alt=""
                      className="w-10 h-10 object-cover border border-foreground bg-background"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg";
                      }}
                    />
                    <div className="min-w-0">
                      <p className="font-heading uppercase text-sm truncate">{activeTxn.brand?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Current Debt: <span className="font-heading text-destructive">{formatPrice(activeTxn.brand?.platform_debt || 0)}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Details Card */}
                <div className="border-2 border-foreground p-4 space-y-3 bg-background">
                  <h3 className="text-xs font-heading uppercase text-muted-foreground border-b border-foreground/10 pb-1">Payment Specs</h3>
                  
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground uppercase">Txn Type</span>
                    <span className="font-heading uppercase bg-foreground text-background px-2 py-0.5">
                      {activeTxn.transaction_type === "debt_payment" ? "Debt Settlement" : "Premium Subscription"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground uppercase">Amount Submitted</span>
                    <span className="font-heading text-sm text-success font-bold">{formatPrice(activeTxn.amount)}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground uppercase">Submitted At</span>
                    <span className="font-mono text-muted-foreground">{format(new Date(activeTxn.created_at), "PPpp")}</span>
                  </div>
                </div>

                {/* Warning message */}
                <div className="flex items-start gap-2 p-3 bg-amber-50 text-amber-800 border-2 border-amber-500 text-xs">
                  <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Verify the amount in GCash matches Bicollective's ledger. Approvals instantly settle debt or unlock store privileges.
                  </p>
                </div>
              </div>

              {/* Right Column: Original Receipt Image */}
              <div className="space-y-2">
                <h3 className="text-xs font-heading uppercase text-muted-foreground">Uploaded Proof of Payment</h3>
                <ResolvedProofImage path={activeTxn.payment_proof_url} />
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex gap-4 pt-4 border-t-2 border-foreground justify-end">
              <button
                onClick={() => handleReject("platform_transactions", activeTxn.id)}
                disabled={actionPending !== null}
                className="btn-brutal-secondary text-sm px-6 py-3"
              >
                Reject Request
              </button>
              <button
                onClick={() => handleApproveTransaction(activeTxn)}
                disabled={actionPending !== null}
                className="btn-brutal text-sm px-8 py-3 flex items-center gap-2"
              >
                {actionPending === "approve-txn" ? "Approving..." : <><Check className="w-4 h-4" /> Approve & Credit</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ad Boost Details Modal */}
      {activeBoost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="card-brutal p-6 md:p-8 w-full max-w-2xl bg-background max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setActiveBoost(null)}
              className="absolute top-4 right-4 w-8 h-8 bg-background border-2 border-foreground rounded-full flex items-center justify-center font-heading hover:bg-secondary transition-colors"
            >
              ✕
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 border-b-2 border-foreground pb-4 mb-6">
              <div className="w-12 h-12 bg-warning/20 flex items-center justify-center border-2 border-foreground">
                <Zap className="w-6 h-6 text-warning" />
              </div>
              <div>
                <h2 className="font-heading text-lg md:text-xl uppercase">Ad Boost Authorization</h2>
                <p className="text-xs text-muted-foreground font-mono">Request ID: {activeBoost.id}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Left Column: Metadata */}
              <div className="space-y-4">
                {/* Brand & Product Card */}
                <div className="bg-secondary p-4 border-2 border-foreground shadow-brutal-sm">
                  <h3 className="text-xs font-heading uppercase text-muted-foreground mb-3">Sponsored Details</h3>
                  <div className="flex gap-3">
                    <img
                      src={activeBoost.product?.image_url}
                      alt=""
                      className="w-16 h-16 object-cover border-2 border-foreground bg-background"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg";
                      }}
                    />
                    <div className="min-w-0 flex flex-col justify-center">
                      <p className="font-heading uppercase text-sm truncate">{activeBoost.product?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">by {activeBoost.brand?.name}</p>
                    </div>
                  </div>
                </div>

                {/* Details Card */}
                <div className="border-2 border-foreground p-4 space-y-3 bg-background">
                  <h3 className="text-xs font-heading uppercase text-muted-foreground border-b border-foreground/10 pb-1">Boost Plan</h3>
                  
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground uppercase">Boost Tier</span>
                    <span className="font-heading uppercase bg-foreground text-background px-2 py-0.5">
                      {activeBoost.boost_type} Plan
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground uppercase">Estimated Value</span>
                    <span className="font-heading text-sm text-success font-bold">
                      {activeBoost.boost_type === "24h" ? "₱49.00" : activeBoost.boost_type === "7d" ? "₱299.00" : "₱999.00"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground uppercase">Requested At</span>
                    <span className="font-mono text-muted-foreground">{format(new Date(activeBoost.created_at), "PPpp")}</span>
                  </div>
                </div>

                {/* Info message */}
                <div className="flex items-start gap-2 p-3 bg-blue-50 text-blue-800 border-2 border-blue-500 text-xs">
                  <Clock className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Approval immediately schedules and boosts this product visibility across categories and search pages for the specified duration.
                  </p>
                </div>
              </div>

              {/* Right Column: Original Receipt Image */}
              <div className="space-y-2">
                <h3 className="text-xs font-heading uppercase text-muted-foreground">Boost Payment proof</h3>
                <ResolvedProofImage path={activeBoost.payment_proof_url} />
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex gap-4 pt-4 border-t-2 border-foreground justify-end">
              <button
                onClick={() => handleReject("ad_boosts", activeBoost.id)}
                disabled={actionPending !== null}
                className="btn-brutal-secondary text-sm px-6 py-3"
              >
                Reject Request
              </button>
              <button
                onClick={() => handleApproveBoost(activeBoost)}
                disabled={actionPending !== null}
                className="btn-brutal text-sm px-8 py-3 flex items-center gap-2"
              >
                {actionPending === "approve-boost" ? "Activating..." : <><Check className="w-4 h-4" /> Approve & Activate</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFinances;
