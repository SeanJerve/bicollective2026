import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DollarSign, AlertCircle, TrendingUp, History, Upload, Info, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import DocumentUpload from "@/components/vendor/DocumentUpload";
import { addMonths, format } from "date-fns";

const VendorFinances = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [paymentProofUrl, setPaymentProofUrl] = useState<string | null>(null);
  const [amount, setAmount] = useState("");

  const { data: brand, refetch: refetchBrand } = useQuery({
    queryKey: ["vendor-brand-finances", user?.id],
    queryFn: async () => {
      const { data, error } = await ((supabase as any)
        .from("brands")
        .select("id, name, platform_debt, commission_rate, subscription_tier") as any)
        .eq("owner_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: orderFees } = useQuery({
    queryKey: ["vendor-order-fees", brand?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_orders")
        .select(`
          order_id, 
          created_at, 
          subtotal, 
          platform_commission, 
          platform_shipping_margin, 
          total_platform_fee, 
          status,
          order:orders(
            payments(payment_method)
          )
        `)
        .eq("brand_id", brand!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!brand,
  });

  const { data: transactions, refetch: refetchTransactions } = useQuery({
    queryKey: ["vendor-transactions", brand?.id],
    queryFn: async () => {
      const { data, error } = await ((supabase as any)
        .from("platform_transactions")
        .select("*") as any)
        .eq("brand_id", brand!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!brand,
  });

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentProofUrl || !amount || Number(amount) <= 0) {
      toast({ title: "Invalid input", description: "Please provide an amount and payment proof.", variant: "destructive" });
      return;
    }

    try {
      const { error: transError } = await ((supabase as any).from("platform_transactions")).insert({
        brand_id: brand!.id,
        amount: Number(amount),
        transaction_type: "debt_payment",
        payment_proof_url: paymentProofUrl,
        status: "pending",
      });
      if (transError) throw transError;
 
      toast({ title: "Payment submitted", description: "Our admin will verify your payment shortly." });
      setPaymentProofUrl(null);
      setAmount("");
      refetchTransactions();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount);

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div>
        <h1 className="font-heading text-2xl md:text-4xl uppercase">Platform Finances</h1>
        <p className="text-muted-foreground mt-1">Manage your platform fees and payments</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`card-brutal p-6 ${Number(brand?.platform_debt) > 0 ? "bg-destructive/10" : "bg-success/5"}`}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-heading uppercase text-muted-foreground">Current Platform Debt</span>
            <AlertCircle className={`w-5 h-5 ${Number(brand?.platform_debt) > 0 ? "text-destructive" : "text-success"}`} />
          </div>
          <p className="text-3xl font-heading">{formatPrice(Number(brand?.platform_debt || 0))}</p>
          <p className="text-xs text-muted-foreground mt-2 font-medium">
            {Number(brand?.platform_debt) > 0 ? (
              <span className="text-destructive animate-pulse uppercase">
                Deadline: {format(addMonths(new Date(), 1), "MMM do, yyyy")}
              </span>
            ) : (
              "Settled - No outstanding debt."
            )}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1 font-heading uppercase">
            Mandatory: 1-Month Settlement Cycle
          </p>
        </div>

        <div className="card-brutal p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-heading uppercase text-muted-foreground">Your Commission Rate</span>
            <TrendingUp className="w-5 h-5 text-secondary-foreground" />
          </div>
          <p className="text-3xl font-heading">{brand?.commission_rate || 5}%</p>
          <p className="text-xs text-muted-foreground mt-2">
            {brand?.subscription_tier === "premium" ? "Premium rate applied!" : "Upgrade to Premium for 3% rate."}
          </p>
        </div>

        <div className="card-brutal p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-heading uppercase text-muted-foreground">Fixed Shipping Margin</span>
            <Info className="w-5 h-5 text-secondary-foreground" />
          </div>
          <p className="text-3xl font-heading">₱20.00</p>
          <p className="text-xs text-muted-foreground mt-2">Platform fee per successful order shipment.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Form */}
        <div className="card-brutal p-6">
          <h2 className="font-heading text-xl uppercase mb-6 flex items-center gap-2">
            <DollarSign className="w-5 h-5" /> Pay Off Debt
          </h2>
          <div className="bg-secondary p-4 mb-6 border-2 border-foreground/10 text-sm space-y-2">
            <p className="font-heading uppercase text-xs">Payment Instructions:</p>
            <p>1. Send the amount via GCash: **09XX-XXX-XXXX** (Jane Doe)</p>
            <p>2. Save the screenshot of the transaction.</p>
            <p>3. Upload the proof below and enter the exact amount sent.</p>
          </div>
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-heading uppercase mb-1">Amount Sent (₱)</label>
              <input 
                type="number" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)}
                className="input-brutal w-full" 
                placeholder="0.00"
                required
              />
            </div>
            <DocumentUpload
              label="Payment Proof (Screenshot)"
              description="Upload the GCash/Bank transfer confirmation"
              bucket="payment-proofs"
              folder={brand?.id || "unknown"}
              value={paymentProofUrl || undefined}
              onChange={(url) => setPaymentProofUrl(url)}
              required
            />
            <button 
              type="submit" 
              disabled={uploading}
              className="btn-brutal w-full flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {uploading ? "Uploading..." : "Submit Payment Proof"}
            </button>
          </form>
        </div>

        {/* Transaction History */}
        <div className="card-brutal flex flex-col">
          <div className="p-6 border-b-2 border-foreground flex items-center justify-between">
            <h2 className="font-heading text-xl uppercase flex items-center gap-2">
              <History className="w-5 h-5" /> Recent Payments
            </h2>
          </div>
          <div className="flex-1 overflow-auto max-h-[400px]">
            {transactions && transactions.length > 0 ? (
              <table className="w-full text-left text-sm">
                <thead className="bg-muted text-xs font-heading uppercase">
                  <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="p-4 text-muted-foreground">
                        {new Date(t.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4 font-heading">{formatPrice(t.amount)}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-[10px] font-heading uppercase ${
                          t.status === "approved" ? "bg-success text-success-foreground" :
                          t.status === "rejected" ? "bg-destructive text-destructive-foreground" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="p-4">
                        {t.payment_proof_url ? (
                          <a 
                            href={t.payment_proof_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-accent hover:underline flex items-center gap-1 font-heading text-[10px]"
                          >
                            <Upload className="w-3 h-3" /> View
                          </a>
                        ) : (
                          <span className="text-muted-foreground opacity-40">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-muted-foreground">No payment history yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Fee Breakdown */}
      <div className="card-brutal overflow-hidden">
        <div className="p-6 border-b-2 border-foreground bg-muted/50">
          <h2 className="font-heading text-xl uppercase">Order Fee History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-xs font-heading uppercase">
              <tr>
                <th className="p-4">Order Details</th>
                <th className="p-4 text-right">Subtotal</th>
                <th className="p-4 text-right">Commission ({brand?.commission_rate}%)</th>
                <th className="p-4 text-right">Shipping Margin</th>
                <th className="p-4 text-right">Total Fee</th>
                <th className="p-4">Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {orderFees?.map((o) => (
                <tr key={o.order_id} className="hover:bg-secondary/30 transition-colors">
                  <td className="p-4">
                    <p className="font-heading text-xs uppercase truncate max-w-[120px]">{o.order_id}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</p>
                  </td>
                  <td className="p-4 text-right">{formatPrice(Number(o.subtotal))}</td>
                  <td className="p-4 text-right text-destructive">{o.platform_commission ? `-${formatPrice(Number(o.platform_commission))}` : "₱0.00"}</td>
                  <td className="p-4 text-right text-destructive">{o.platform_shipping_margin ? `-${formatPrice(Number(o.platform_shipping_margin))}` : "₱0.00"}</td>
                  <td className="p-4 text-right font-heading">
                    {formatPrice(Number(o.total_platform_fee || 0))}
                  </td>
                  <td className="p-4">
                    <span className="text-[10px] font-heading uppercase opacity-60">
                      {o.order?.payments?.[0]?.payment_method === 0 ? "COD" : (o.order?.payments?.[0]?.payment_method === 1 ? "GCash" : (o.order?.payments?.[0]?.payment_method === 2 ? "Bank Transfer" : "N/A"))}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!orderFees || orderFees.length === 0) && (
            <div className="p-8 text-center text-muted-foreground">No order fees recorded yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorFinances;
