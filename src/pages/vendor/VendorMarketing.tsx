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
  Rocket,
  Clock,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import DocumentUpload from "@/components/vendor/DocumentUpload";

interface Product {
  id: string;
  name: string;
  image_url: string;
  price: number;
}

const VendorMarketing = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"boost" | "premium">(
    tabParam === "premium" ? "premium" : "boost"
  );

  useEffect(() => {
    if (tabParam === "premium") setActiveTab("premium");
  }, [tabParam]);

  const switchTab = (tab: "boost" | "premium") => {
    setActiveTab(tab);
    setSearchParams(tab === "premium" ? { tab: "premium" } : {}, { replace: true });
  };
  const [paymentProofUrl, setPaymentProofUrl] = useState<string | null>(null);
  const [premiumProofUrl, setPremiumProofUrl] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [boostType, setBoostType] = useState<"daily" | "weekly" | "monthly">("daily");
  const [uploading, setUploading] = useState(false);

  const { data: brand } = useQuery({
    queryKey: ["vendor-brand-marketing", user?.id],
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

  const { data: products } = useQuery({
    queryKey: ["vendor-products-marketing", brand?.id],
    queryFn: async () => {
      const { data, error } = await (
        supabase.from("products").select("id, name, image_url, price") as any
      )
        .eq("brand_id", brand!.id)
        .eq("is_active", true);
      if (error) throw error;
      return data as Product[];
    },
    enabled: !!brand,
  });

  const { data: boosts, refetch: refetchBoosts } = useQuery({
    queryKey: ["vendor-boosts", brand?.id],
    queryFn: async () => {
      const { data, error } = await (
        (supabase as any).from("ad_boosts").select("*, product:products(name)") as any
      )
        .eq("brand_id", brand!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!brand,
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

  const boostOptions = {
    daily: { label: "24 Hours", price: 49, icon: Clock },
    weekly: { label: "7 Days", price: 299, icon: Zap },
    monthly: { label: "30 Days", price: 999, icon: Rocket },
  };

  const handleBoostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !paymentProofUrl) {
      toast({
        title: "Error",
        description: "Select a product and upload payment proof.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error: boostError } = await (supabase as any).from("ad_boosts").insert({
        brand_id: brand!.id,
        product_id: selectedProduct.id,
        boost_type: boostType,
        amount_paid: boostOptions[boostType].price,
        payment_proof_url: paymentProofUrl,
        status: "pending",
      });
      if (boostError) throw boostError;

      toast({
        title: "Boost Request Sent!",
        description: "Admin will review and activate your boost soon.",
      });
      setSelectedProduct(null);
      setPaymentProofUrl(null);
      refetchBoosts();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleUpgradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!premiumProofUrl) {
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
        payment_proof_url: premiumProofUrl,
        status: "pending",
      });
      if (transError) throw transError;

      toast({
        title: "Upgrade Request Sent!",
        description: "Admin will activate your Premium status soon.",
      });
      setPremiumProofUrl(null);
      refetchSubs();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount);

  const isPremium = brand?.subscription_tier === "premium";
  const expiresAt = brand?.subscription_expires_at ? new Date(brand.subscription_expires_at) : null;
  const isExpired = expiresAt && expiresAt < new Date();

  const premiumBenefits = [
    { icon: TrendingUp, label: "5% Commission", desc: "Lower platform fees from 10% to 5%." },
    { icon: Award, label: "Premium Badge", desc: "Showcase your credibility with a premium store badge." },
    { icon: Zap, label: "Priority Listing", desc: "Appear at the top of brand and category results." },
    { icon: CheckCircle2, label: "1 Free Monthly Boost", desc: "One 24hr ad boost included every month." },
  ];

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div>
        <h1 className="font-heading text-2xl md:text-4xl uppercase">Marketing & Premium</h1>
        <p className="text-muted-foreground mt-1">
          Boost your visibility and unlock premium benefits for your store.
        </p>
      </div>

      {/* Premium Status Banner */}
      {isPremium && !isExpired && (
        <div className="card-brutal p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 text-amber-600" />
            <div>
              <p className="font-heading uppercase text-sm text-amber-800">Active Premium Vendor</p>
              {expiresAt && (
                <p className="text-xs text-amber-600">Renews: {expiresAt.toLocaleDateString()}</p>
              )}
            </div>
          </div>
          <span className="badge-premium px-3 py-1 text-xs">PREMIUM</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b-2 border-foreground">
        <button
          onClick={() => switchTab("boost")}
          className={`px-6 py-3 font-heading uppercase text-sm transition-colors ${
            activeTab === "boost"
              ? "bg-foreground text-background"
              : "hover:bg-secondary"
          }`}
        >
          <Rocket className="w-4 h-4 inline mr-2" />
          Ad Boosting
        </button>
        <button
          onClick={() => switchTab("premium")}
          className={`px-6 py-3 font-heading uppercase text-sm transition-colors ${
            activeTab === "premium"
              ? "bg-foreground text-background"
              : "hover:bg-secondary"
          }`}
        >
          <Crown className="w-4 h-4 inline mr-2" />
          Premium Plan
        </button>
      </div>

      {/* ===================== AD BOOSTING TAB ===================== */}
      {activeTab === "boost" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Ad Boost Form */}
          <div className="card-brutal p-6 space-y-6">
            <h2 className="font-heading text-xl uppercase mb-2 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-success" /> Sponsored Products
            </h2>
            <p className="text-sm text-muted-foreground">
              Boosted products appear at the top of search results and category pages.
            </p>

            <form onSubmit={handleBoostSubmit} className="space-y-6">
              {/* Product Selection */}
              <div>
                <label className="text-xs font-heading uppercase mb-2 block">
                  1. Select Product to Boost
                </label>
                <div className="grid grid-cols-2 gap-3 max-h-[250px] overflow-y-auto p-2 border-2 border-foreground/10 bg-secondary/20">
                  {products?.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedProduct(p)}
                      className={`flex items-center gap-2 p-2 text-left transition-colors border-2 ${
                        selectedProduct?.id === p.id
                          ? "border-foreground bg-secondary"
                          : "border-transparent hover:border-foreground/30"
                      }`}
                    >
                      <img
                        src={p.image_url || "/placeholder.svg"}
                        className="w-10 h-10 object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg";
                        }}
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-heading uppercase truncate">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground">{formatPrice(p.price)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Boost Type */}
              <div>
                <label className="text-xs font-heading uppercase mb-2 block">
                  2. Select Duration
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {Object.entries(boostOptions).map(([key, opt]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setBoostType(key as any)}
                      className={`p-3 border-2 text-center transition-colors ${
                        boostType === key
                          ? "border-foreground bg-secondary"
                          : "border-border-subtle hover:border-foreground/30"
                      }`}
                    >
                      <opt.icon className="w-5 h-5 mx-auto mb-2" />
                      <p className="text-xs font-heading uppercase">{opt.label}</p>
                      <p className="text-sm font-heading">{formatPrice(opt.price)}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Info */}
              <DocumentUpload
                label="Boost Payment Proof"
                description={`Send ₱${boostOptions[boostType].price} to 09XX-XXX-XXXX via GCash and upload the receipt.`}
                bucket="payment-proofs"
                folder={brand?.id || "unknown"}
                value={paymentProofUrl || undefined}
                onChange={(url) => setPaymentProofUrl(url)}
                required
              />

              <button
                type="submit"
                disabled={uploading || !selectedProduct}
                className="btn-brutal w-full flex items-center justify-center gap-2"
              >
                <Rocket className="w-4 h-4" />
                {uploading ? "Processing..." : `Boost ${selectedProduct?.name || "Product"}`}
              </button>
            </form>
          </div>

          {/* Current Boosts */}
          <div className="card-brutal flex flex-col">
            <div className="p-6 border-b-2 border-foreground">
              <h2 className="font-heading text-xl uppercase flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-success" /> Active / Pending Boosts
              </h2>
            </div>
            <div className="flex-1 overflow-auto max-h-[600px]">
              {boosts && boosts.length > 0 ? (
                <div className="divide-y-2 divide-foreground/10">
                  {boosts.map((b: any) => (
                    <div key={b.id} className="p-6 flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-heading uppercase text-sm mb-1">{b.product?.name}</h3>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1 capitalize">
                            {boostOptions[b.boost_type as keyof typeof boostOptions]?.label ||
                              b.boost_type}
                          </span>
                          <span className="opacity-30">|</span>
                          <span>{new Date(b.created_at).toLocaleDateString()}</span>
                        </div>
                        {b.status === "active" && b.ends_at && (
                          <p className="text-[10px] text-success font-heading uppercase mt-2">
                            Ends: {new Date(b.ends_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <span
                        className={`px-2 py-1 text-[10px] font-heading uppercase ${
                          b.status === "active"
                            ? "bg-success text-success-foreground"
                            : b.status === "pending"
                              ? "bg-muted text-muted-foreground"
                              : "bg-destructive text-destructive-foreground opacity-50"
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-muted-foreground space-y-4">
                  <AlertCircle className="w-12 h-12 mx-auto opacity-20" />
                  <p>No boosting history found. Start promoting your products!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================== PREMIUM PLAN TAB ===================== */}
      {activeTab === "premium" && (
        <div className="space-y-8">
          {/* Hero */}
          <div className="text-center space-y-4 py-8 bg-secondary/20 border-2 border-foreground/5 rounded-2xl">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-foreground text-background rounded-full mb-2">
              <Crown className="w-10 h-10" />
            </div>
            <h2 className="font-heading text-3xl md:text-5xl uppercase">Bicollective Premium</h2>
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
                {premiumBenefits.map((b) => (
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
                      value={premiumProofUrl || undefined}
                      onChange={(url) => setPremiumProofUrl(url)}
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

              {/* Subscription History */}
              <div className="card-brutal flex flex-col">
                <div className="p-4 border-b-2 border-foreground text-xs font-heading uppercase">
                  Subscription History
                </div>
                <div className="max-h-[300px] overflow-auto">
                  {subscriptions && subscriptions.length > 0 ? (
                    <div className="divide-y divide-foreground/10">
                      {subscriptions.map((s: any) => (
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
      )}
    </div>
  );
};

export default VendorMarketing;
