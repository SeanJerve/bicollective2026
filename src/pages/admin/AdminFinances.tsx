import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Check, X, Eye, DollarSign, Crown, Zap, AlertCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminFinances = () => {
  const { toast } = useToast();

  const { data: transactions, refetch: refetchTrans } = useQuery({
    queryKey: ["admin-pending-transactions"],
    queryFn: async () => {
      const { data, error } = await ((supabase as any)
        .from("platform_transactions")
        .select("*, brand:brands(id, name, logo_url, platform_debt)") as any)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: boosts, refetch: refetchBoosts } = useQuery({
    queryKey: ["admin-pending-boosts"],
    queryFn: async () => {
      const { data, error } = await ((supabase as any)
        .from("ad_boosts")
        .select("*, brand:brands(id, name), product:products(name, image_url)") as any)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const handleApproveTransaction = async (trans: any) => {
    try {
      // 1. Update brand fields based on transaction type
      if (trans.transaction_type === "debt_payment") {
        const { error: debtErr } = await (supabase.rpc as any)("increment_brand_debt", {
          brand_id_param: trans.brand_id,
          amount_param: -trans.amount
        });
        if (debtErr) throw debtErr;
      } else if (trans.transaction_type === "subscription_purchase") {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);
        const { error: brandErr } = await (supabase
          .from("brands")
          .update({ 
            subscription_tier: "premium", 
            subscription_expires_at: expiresAt.toISOString(),
            commission_rate: 3 
          } as any)
          .eq("id", trans.brand_id));
        if (brandErr) throw brandErr;
      }

      // 2. Mark transaction as approved
      const { error: updateErr } = await ((supabase as any)
        .from("platform_transactions")
        .update({ status: "approved" } as any)
        .eq("id", trans.id));
      if (updateErr) throw updateErr;

      toast({ title: "Approved", description: "Transaction successfully updated." });
      refetchTrans();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleApproveBoost = async (boost: any) => {
    try {
      const startsAt = new Date();
      const endsAt = new Date();
      if (boost.boost_type === "24h") endsAt.setDate(endsAt.getDate() + 1);
      else if (boost.boost_type === "7d") endsAt.setDate(endsAt.getDate() + 7);
      else if (boost.boost_type === "30d") endsAt.setDate(endsAt.getDate() + 30);

      const { error: updateErr } = await ((supabase as any)
        .from("ad_boosts")
        .update({ 
          status: "active", 
          starts_at: startsAt.toISOString(), 
          ends_at: endsAt.toISOString() 
        } as any)
        .eq("id", boost.id));
      if (updateErr) throw updateErr;

      toast({ title: "Boost Activated!", description: "The product is now sponsored." });
      refetchBoosts();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleReject = async (table: string, id: string) => {
    try {
      const { error } = await ((supabase.from(table as any) as any).update({ status: "rejected" } as any).eq("id", id));
      if (error) throw error;
      toast({ title: "Rejected", description: "Request has been declined." });
      if (table === "platform_transactions") refetchTrans();
      else refetchBoosts();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl uppercase">Financial Management</h1>
          <p className="text-muted-foreground">Verify payments for platform debt, subscriptions, and boosts.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Pending Payments & Subscriptions */}
        <section className="card-brutal p-6 space-y-6">
          <h2 className="font-heading text-xl uppercase flex items-center gap-2">
            <DollarSign className="w-5 h-5" /> Pending Brand Payments
          </h2>
          <div className="space-y-4">
            {transactions?.length ? transactions.map((t: any) => (
              <div key={t.id} className="p-4 border-2 border-foreground/10 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-heading text-sm uppercase leading-tight">{t.brand?.name}</p>
                  <p className="text-xs font-heading text-muted-foreground uppercase">
                    {t.transaction_type === 'debt_payment' ? 'Debt Settlement' : 'Premium Sub'} - ₱{t.amount}
                  </p>
                  <a href={`${supabase.storage.from('payment-proofs').getPublicUrl(t.payment_proof_url).data.publicUrl}`} target="_blank" className="text-[10px] text-accent font-bold uppercase hover:underline flex items-center gap-1">
                    <Eye className="w-3 h-3" /> View Receipt
                  </a>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleApproveTransaction(t)} className="p-2 bg-success text-success-foreground border border-foreground hover:scale-110 transition-transform">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleReject('platform_transactions', t.id)} className="p-2 bg-destructive text-destructive-foreground border border-foreground hover:scale-110 transition-transform">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )) : <p className="text-sm text-muted-foreground py-8 text-center italic">No pending payments.</p>}
          </div>
        </section>

        {/* Pending Ad Boosts */}
        <section className="card-brutal p-6 space-y-6">
          <h2 className="font-heading text-xl uppercase flex items-center gap-2">
            <Zap className="w-5 h-5" /> Pending Ad Boosts
          </h2>
          <div className="space-y-4">
            {boosts?.length ? boosts.map((b: any) => (
              <div key={b.id} className="p-4 border-2 border-foreground/10 flex items-center justify-between">
                <div className="flex gap-3">
                  <img src={b.product?.image_url} className="w-12 h-12 object-cover border border-foreground" />
                  <div className="space-y-1">
                    <p className="font-heading text-sm uppercase leading-tight">{b.product?.name}</p>
                    <p className="text-[10px] opacity-60 uppercase font-heading">{b.brand?.name} • {b.boost_type} Boost</p>
                    <a href={`${supabase.storage.from('payment-proofs').getPublicUrl(b.payment_proof_url).data.publicUrl}`} target="_blank" className="text-[10px] text-accent font-bold uppercase hover:underline flex items-center gap-1">
                      <Eye className="w-3 h-3" /> View Receipt
                    </a>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleApproveBoost(b)} className="p-2 bg-success text-success-foreground border border-foreground hover:scale-110 transition-transform">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleReject('ad_boosts', b.id)} className="p-2 bg-destructive text-destructive-foreground border border-foreground hover:scale-110 transition-transform">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )) : <p className="text-sm text-muted-foreground py-8 text-center italic">No pending boost requests.</p>}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminFinances;
