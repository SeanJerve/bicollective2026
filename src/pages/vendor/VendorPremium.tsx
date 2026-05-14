import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Award,
  CheckCircle2,
  Crown,
  Zap,
  TrendingUp,
  Info,
  Upload,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import DocumentUpload from "@/components/vendor/DocumentUpload";

const VendorPremium = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [paymentProofUrl, setPaymentProofUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: brand, refetch: refetchBrand } = useQuery({
    queryKey: ["vendor-brand-premium", user?.id],
    queryFn: async () => {
      const { data, error } = await (
        (supabase as any)
          .from("brands")
          .select("id, name, subscription_tier, subscription_expires_at") as any
      )
        .eq("owner_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: subscriptions, refetch: refetchSubs } = useQuery({
    queryKey: ["vendor-subscriptions", brand?.id],
    queryFn: async () => {
      const { data, error } = await (
        (supabase as any).from("platform_transactions").select("*") as any
      )
        .eq("brand_id", brand!.id)
        .eq("transaction_type", "subscription_purchase")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!brand,
  });

  const handleUpgradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentProofUrl) {
      toast({
        title: "Error",
        description: "Please upload proof of payment.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error: transError } = await (supabase as any).from("platform_transactions").insert({
        brand_id: brand!.id,
        amount: 499,
        transaction_type: "subscription_purchase",
        payment_proof_url: paymentProofUrl,
        status: "pending",
      });
      if (transError) throw transError;

      toast({
        title: "Upgrade Request Sent!",
        description: "Admin will activate your Premium status soon.",
      });
      setPaymentProofUrl(null);
      refetchSubs();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const benefits = [
    { icon: TrendingUp, label: "3% Commission", desc: "Lower platform fees from 5% to 3%." },
    {
      icon: Award,
      label: "Premium Badge",
      desc: "Showcase your credibility with a premium store badge.",
    },
    {
      icon: Zap,
      label: "Priority Listing",
      desc: "Appear at the top of brand and category results.",
    },
    {
      icon: CheckCircle2,
      label: "1 Free Monthly Boost",
      desc: "One 24hr ad boost included every month.",
    },
  ];

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount);

  const isPremium = brand?.subscription_tier === "premium";
  const expiresAt = brand?.subscription_expires_at ? new Date(brand.subscription_expires_at) : null;
  const isExpired = expiresAt && expiresAt < new Date();

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-6xl mx-auto">
      <div className="text-center space-y-4 py-8 bg-secondary/20 border-2 border-foreground/5 rounded-2xl">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-foreground text-background rounded-full mb-2">
          <Crown className="w-10 h-10" />
        </div>
        <h1 className="font-heading text-3xl md:text-5xl uppercase">Bicollective Premium</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Scale your business across the Bicol region with exclusive tools and lower fees.
        </p>

        {isPremium && !isExpired ? (
          <div className="badge-premium inline-block px-4 py-2 text-lg">
            Active Premium Vendor
            {expiresAt && (
              <span className="block text-xs font-normal opacity-70">
                Renews: {expiresAt.toLocaleDateString()}
              </span>
            )}
          </div>
        ) : (
          <div className="flex justify-center gap-4 pt-4">
            <span className="font-heading text-2xl">₱499.00 / month</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Benefits Section */}
        <div className="card-brutal p-8 space-y-8">
          <h2 className="font-heading text-2xl uppercase">Premium Privileges</h2>
          <div className="space-y-6">
            {benefits.map((b) => (
              <div key={b.label} className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-secondary flex items-center justify-center text-foreground">
                  <b.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-heading text-lg leading-tight mb-1">{b.label}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upgrade Form */}
        <div className="space-y-8">
          <div className="card-brutal p-8">
            <h2 className="font-heading text-xl uppercase mb-6 flex items-center gap-2">
              <Upload className="w-5 h-5" /> Upgrade My Store
            </h2>
            <div className="bg-secondary p-4 mb-6 border-2 border-foreground/10 text-sm space-y-2">
              <p className="font-heading uppercase text-xs">Payment Instructions:</p>
              <p>Send ₱499.00 via GCash: **09XX-XXX-XXXX** (Jane Doe)</p>
              <p>Upload your transaction screenshot below.</p>
            </div>
            <form onSubmit={handleUpgradeSubmit} className="space-y-6">
              <div className="space-y-4">
                <DocumentUpload
                  label="Subscription Payment Proof"
                  description="Send ₱499.00 via GCash to 09XX-XXX-XXXX and upload the receipt."
                  bucket="payment-proofs"
                  folder={brand?.id || "unknown"}
                  value={paymentProofUrl || undefined}
                  onChange={(url) => setPaymentProofUrl(url)}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={uploading || (isPremium && !isExpired)}
                className="btn-brutal w-full py-4 text-lg"
              >
                {uploading
                  ? "Uploading..."
                  : isPremium && !isExpired
                    ? "Premium Active"
                    : "Go Premium Now"}
              </button>
            </form>
          </div>

          {/* History */}
          <div className="card-brutal flex flex-col">
            <div className="p-4 border-b-2 border-foreground text-xs font-heading uppercase">
              Subscription History
            </div>
            <div className="max-h-[300px] overflow-auto">
              {subscriptions && subscriptions.length > 0 ? (
                <div className="divide-y divide-foreground/10">
                  {subscriptions.map((s) => (
                    <div key={s.id} className="p-4 flex items-center justify-between">
                      <div className="text-xs">
                        <p className="font-heading uppercase">₱{s.amount} Monthly Plan</p>
                        <p className="opacity-60">{new Date(s.created_at).toLocaleDateString()}</p>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-heading uppercase ${
                          s.status === "approved"
                            ? "bg-success text-success-foreground"
                            : s.status === "rejected"
                              ? "bg-destructive text-destructive-foreground"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {s.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No subscription records found.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorPremium;
