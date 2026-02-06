import { useState, useEffect } from "react";
import { Gift, X, Sparkles, Loader2, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const LuckyPromoPopup = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [reward, setReward] = useState<{ code: string; value: number; type: "discount" | "free_shipping" } | null>(null);

  useEffect(() => {
    if (!user) return;

    const init = async () => {
      // Fetch admin settings
      const { data: settings } = await supabase
        .from("lucky_promo_settings")
        .select("*")
        .limit(1)
        .single();

      if (!settings || !settings.is_active) return;

      // Check probability
      if (Math.random() * 100 > settings.probability_percent) return;

      // Check active hours
      if (settings.active_hours_start && settings.active_hours_end) {
        const now = new Date();
        const h = now.getHours().toString().padStart(2, "0");
        const m = now.getMinutes().toString().padStart(2, "0");
        const current = `${h}:${m}`;
        if (current < settings.active_hours_start || current > settings.active_hours_end) return;
      }

      // Random delay between 1s and 10min
      const delay = Math.floor(Math.random() * 599000) + 1000;

      const timer = setTimeout(async () => {
        // Check daily claim limit
        const today = new Date().toISOString().split("T")[0];
        const { count } = await supabase
          .from("lucky_promo_claims")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("claimed_date", today);

        if ((count || 0) < settings.daily_claim_limit) {
          setIsVisible(true);
        }
      }, delay);

      return () => clearTimeout(timer);
    };

    init();
  }, [user]);

  const handleClaim = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch settings for reward generation
      const { data: settings } = await supabase
        .from("lucky_promo_settings")
        .select("*")
        .limit(1)
        .single();

      if (!settings) throw new Error("Settings not found");

      const isFreeShipping = Math.random() * 100 < settings.shipping_voucher_chance;
      const discountValue = isFreeShipping
        ? settings.shipping_voucher_amount
        : Math.floor(Math.random() * (settings.max_discount - settings.min_discount + 1)) + settings.min_discount;
      const voucherCode = `LUCKY-${Date.now().toString(36).toUpperCase()}`;

      const { data: voucher, error: voucherError } = await supabase
        .from("vouchers")
        .insert({
          user_id: user.id,
          name: isFreeShipping ? "Lucky Free Shipping" : "Lucky Daily Reward",
          description: isFreeShipping
            ? `Free shipping on your next order! ₱${settings.shipping_voucher_amount} off shipping fees.`
            : "You got lucky! Use this discount on your next purchase.",
          code: voucherCode,
          type: isFreeShipping ? "free_shipping" : "fixed_discount",
          discount_value: discountValue,
          source: "lucky_promo",
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (voucherError) throw voucherError;

      const { error: claimError } = await supabase
        .from("lucky_promo_claims")
        .insert({ user_id: user.id, voucher_id: voucher.id });

      if (claimError) throw claimError;

      setReward({
        code: voucherCode,
        value: discountValue,
        type: isFreeShipping ? "free_shipping" : "discount",
      });
      setClaimed(true);

      toast({
        title: "🎉 Lucky reward claimed!",
        description: isFreeShipping
          ? "You got free shipping! Check your vouchers."
          : `You got ₱${discountValue} off! Check your vouchers.`,
      });
    } catch (error: any) {
      console.error("Claim error:", error);
      toast({ title: "Claim failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="card-brutal p-6 md:p-8 max-w-sm w-full text-center relative overflow-hidden">
        <Sparkles className="absolute top-4 left-4 w-6 h-6 text-warning animate-pulse" />
        <Sparkles className="absolute top-4 right-4 w-6 h-6 text-accent animate-pulse" />
        <Sparkles className="absolute bottom-4 left-8 w-4 h-4 text-primary animate-pulse" />
        <Sparkles className="absolute bottom-4 right-8 w-4 h-4 text-success animate-pulse" />

        <button onClick={() => setIsVisible(false)} className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-5 h-5" />
        </button>

        {!claimed ? (
          <>
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-warning to-accent flex items-center justify-center animate-bounce">
              <Gift className="w-10 h-10 text-white" />
            </div>
            <h2 className="font-heading text-2xl uppercase mb-2">Lucky You!</h2>
            <p className="text-muted-foreground mb-6">You've been browsing for a while. Here's a special reward just for you!</p>
            <button onClick={handleClaim} disabled={loading} className="btn-brutal w-full text-lg">
              {loading ? (<><Loader2 className="w-5 h-5 animate-spin mr-2" />Opening...</>) : (<><Gift className="w-5 h-5 mr-2" />Claim Your Reward</>)}
            </button>
          </>
        ) : (
          <>
            <div className="w-20 h-20 mx-auto mb-4 bg-success flex items-center justify-center">
              {reward?.type === "free_shipping" ? <Truck className="w-10 h-10 text-white" /> : <Sparkles className="w-10 h-10 text-white" />}
            </div>
            <h2 className="font-heading text-2xl uppercase mb-2">Congratulations!</h2>
            <div className="bg-secondary p-4 mb-4">
              {reward?.type === "free_shipping" ? (
                <><Truck className="w-8 h-8 mx-auto text-success mb-1" /><p className="text-xl font-heading text-success">FREE SHIPPING</p><p className="text-sm text-muted-foreground">₱{reward.value} off shipping fees</p></>
              ) : (
                <><p className="text-3xl font-heading text-success">₱{reward?.value}</p><p className="text-sm text-muted-foreground">discount voucher</p></>
              )}
            </div>
            <code className="block bg-foreground text-background px-4 py-2 font-mono text-lg mb-4">{reward?.code}</code>
            <p className="text-xs text-muted-foreground mb-4">Valid for 24 hours. Check "My Vouchers" to use it!</p>
            <button onClick={() => setIsVisible(false)} className="btn-brutal-secondary w-full">Continue Shopping</button>
          </>
        )}
      </div>
    </div>
  );
};

export default LuckyPromoPopup;
