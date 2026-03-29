import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Zap, TrendingUp, Clock, CheckCircle2, AlertCircle, Rocket, Info, Upload } from "lucide-react";
import { useState } from "react";
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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [boostType, setBoostType] = useState<"daily" | "weekly" | "monthly">("daily");
  const [paymentProofUrl, setPaymentProofUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: brand } = useQuery({
    queryKey: ["vendor-brand-marketing", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("brands")
        .select("id, name") as any)
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
      const { data, error } = await (supabase
        .from("products")
        .select("id, name, image_url, price") as any)
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
      const { data, error } = await ((supabase as any)
        .from("ad_boosts")
        .select("*, product:products(name)") as any)
        .eq("brand_id", brand!.id)
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
      toast({ title: "Error", description: "Select a product and upload payment proof.", variant: "destructive" });
      return;
    }

    try {
      const { error: boostError } = await ((supabase as any).from("ad_boosts")).insert({
        brand_id: brand!.id,
        product_id: selectedProduct.id,
        boost_type: boostType,
        amount_paid: boostOptions[boostType].price,
        payment_proof_url: paymentProofUrl,
        status: "pending",
      });
      if (boostError) throw boostError;
 
      toast({ title: "Boost Request Sent!", description: "Admin will review and activate your boost soon." });
      setSelectedProduct(null);
      setPaymentProofUrl(null);
      refetchBoosts();
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
        <h1 className="font-heading text-2xl md:text-4xl uppercase">Marketing & Ad Boosting</h1>
        <p className="text-muted-foreground mt-1">Boost your visibility and reach more customers in the Bicol region.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Ad Boost Form */}
        <div className="card-brutal p-6 space-y-6">
          <h2 className="font-heading text-xl uppercase mb-2 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-success" /> Sponsored Products
          </h2>
          <p className="text-sm text-muted-foreground">Boosted products appear at the top of search results and category pages.</p>
          
          <form onSubmit={handleBoostSubmit} className="space-y-6">
            {/* Product Selection */}
            <div>
              <label className="text-xs font-heading uppercase mb-2 block">1. Select Product to Boost</label>
              <div className="grid grid-cols-2 gap-3 max-h-[250px] overflow-y-auto p-2 border-2 border-foreground/10 bg-secondary/20">
                {products?.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedProduct(p)}
                    className={`flex items-center gap-2 p-2 text-left transition-colors border-2 ${
                      selectedProduct?.id === p.id ? "border-foreground bg-secondary" : "border-transparent hover:border-foreground/30"
                    }`}
                  >
                    <img src={p.image_url || "/placeholder.svg"} className="w-10 h-10 object-cover" />
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
              <label className="text-xs font-heading uppercase mb-2 block">2. Select Duration</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {Object.entries(boostOptions).map(([key, opt]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setBoostType(key as any)}
                    className={`p-3 border-2 text-center transition-colors ${
                      boostType === key ? "border-foreground bg-secondary" : "border-border-subtle hover:border-foreground/30"
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
                {boosts.map((b) => (
                  <div key={b.id} className="p-6 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-heading uppercase text-sm mb-1">{b.product?.name}</h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 capitalize">
                          {boostOptions[b.boost_type as keyof typeof boostOptions]?.label || b.boost_type}
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
                    <span className={`px-2 py-1 text-[10px] font-heading uppercase ${
                      b.status === "active" ? "bg-success text-success-foreground" :
                      b.status === "pending" ? "bg-muted text-muted-foreground" :
                      "bg-destructive text-destructive-foreground opacity-50"
                    }`}>
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
    </div>
  );
};

export default VendorMarketing;
