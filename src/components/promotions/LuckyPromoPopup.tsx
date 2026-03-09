import { useState, useEffect } from "react";
import { Gift, X, Star, Loader2, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const LuckyPromoPopup = () => {
  const { user, isAdmin, isVendor } = useAuth();
  const { toast } = useToast();
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [reward, setReward] = useState<{ code: string; value: number; type: "discount" | "free_shipping" } | null>(null);

  useEffect(() => {
    if (!user || isAdmin || isVendor) return;

    const init = async () => {
      // Fetch public promo info via secure function
      const { data: settings } = await supabase.rpc("get_lucky_promo_public_info");

      if (!settings || settings.length === 0 || !settings[0].is_active) return;
      const s = settings[0];

      // Check active hours
      if (s.active_hours_start && s.active_hours_end) {
        const now = new Date();
        const h = now.getHours().toString().padStart(2, "0");
        const m = now.getMinutes().toString().padStart(2, "0");
        const current = `${h}:${m}`;
        if (current < s.active_hours_start || current > s.active_hours_end) return;
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

        if ((count || 0) < s.daily_claim_limit) {
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
      // Use secure server-side function for claiming
      const { data, error } = await supabase.rpc("claim_lucky_promo", { _user_id: user.id });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setReward({
        code: data.code,
        value: data.value,
        type: data.type === "free_shipping" ? "free_shipping" : "discount",
      });
      setClaimed(true);

      toast({
        title: "🎉 Lucky reward claimed!",
        description: data.type === "free_shipping"
          ? "You got free shipping! Check your vouchers."
          : `You got ₱${data.value} off! Check your vouchers.`,
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
            <button onClick={handleClaim} disabled={loading} className="btn-brutal w-full text-lg flex items-center justify-center gap-2">
              {loading ? (<><Loader2 className="w-5 h-5 animate-spin" />Opening...</>) : (<><Gift className="w-5 h-5" />Claim Your Reward</>)}
            </button>
          </>
        ) : (
          <>
            <div className="w-20 h-20 mx-auto mb-4 bg-success flex items-center justify-center">
              {reward?.type === "free_shipping" ? <Truck className="w-10 h-10 text-white" /> : <Gift className="w-10 h-10 text-white" />}
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