import { useState, useEffect } from "react";
import { Gift, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LuckySettings {
  id: string;
  probability_percent: number;
  min_discount: number;
  max_discount: number;
  shipping_voucher_chance: number;
  shipping_voucher_amount: number;
  active_hours_start: string | null;
  active_hours_end: string | null;
  daily_claim_limit: number;
  is_active: boolean;
}

const AdminLuckyPromo = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<LuckySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from("lucky_promo_settings")
        .select("*")
        .limit(1)
        .single();
      if (data) setSettings(data as any);
      setLoading(false);
    };
    fetch();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    const { error } = await supabase
      .from("lucky_promo_settings")
      .update({
        probability_percent: settings.probability_percent,
        min_discount: settings.min_discount,
        max_discount: settings.max_discount,
        shipping_voucher_chance: settings.shipping_voucher_chance,
        shipping_voucher_amount: settings.shipping_voucher_amount,
        active_hours_start: settings.active_hours_start || null,
        active_hours_end: settings.active_hours_end || null,
        daily_claim_limit: settings.daily_claim_limit,
        is_active: settings.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", settings.id);
    
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Lucky promo settings saved!" });
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8"><div className="h-64 skeleton-brutal" /></div>;

  if (!settings) return <div className="p-8 text-muted-foreground">No settings found</div>;

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl md:text-4xl uppercase">Lucky Promo Config</h1>
          <p className="text-muted-foreground text-sm">Configure the random daily reward popup for logged-in users</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-brutal">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Settings
        </button>
      </div>

      <div className="card-brutal p-6">
        {/* Master Toggle */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border-subtle">
          <div>
            <span className="font-heading uppercase">System Active</span>
            <p className="text-xs text-muted-foreground">Enable or disable the lucky promo popup globally</p>
          </div>
          <button
            onClick={() => setSettings({ ...settings, is_active: !settings.is_active })}
            className={`px-4 py-2 text-sm font-heading uppercase border-2 border-foreground ${settings.is_active ? "bg-success text-success-foreground" : "bg-muted"}`}
          >
            {settings.is_active ? "ACTIVE" : "DISABLED"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="font-heading text-xs uppercase tracking-wide mb-1 block">Trigger Probability (%)</label>
            <input type="number" className="input-brutal" min={0} max={100} value={settings.probability_percent} onChange={(e) => setSettings({ ...settings, probability_percent: Number(e.target.value) })} />
            <p className="text-xs text-muted-foreground mt-1">Chance the popup shows when conditions are met (0-100)</p>
          </div>

          <div>
            <label className="font-heading text-xs uppercase tracking-wide mb-1 block">Daily Claim Limit</label>
            <input type="number" className="input-brutal" min={1} value={settings.daily_claim_limit} onChange={(e) => setSettings({ ...settings, daily_claim_limit: Number(e.target.value) })} />
            <p className="text-xs text-muted-foreground mt-1">Max claims per user per day</p>
          </div>

          <div>
            <label className="font-heading text-xs uppercase tracking-wide mb-1 block">Min Discount (₱)</label>
            <input type="number" className="input-brutal" value={settings.min_discount} onChange={(e) => setSettings({ ...settings, min_discount: Number(e.target.value) })} />
          </div>

          <div>
            <label className="font-heading text-xs uppercase tracking-wide mb-1 block">Max Discount (₱)</label>
            <input type="number" className="input-brutal" value={settings.max_discount} onChange={(e) => setSettings({ ...settings, max_discount: Number(e.target.value) })} />
          </div>

          <div>
            <label className="font-heading text-xs uppercase tracking-wide mb-1 block">Shipping Voucher Chance (%)</label>
            <input type="number" className="input-brutal" min={0} max={100} value={settings.shipping_voucher_chance} onChange={(e) => setSettings({ ...settings, shipping_voucher_chance: Number(e.target.value) })} />
            <p className="text-xs text-muted-foreground mt-1">% chance of free shipping vs peso discount</p>
          </div>

          <div>
            <label className="font-heading text-xs uppercase tracking-wide mb-1 block">Shipping Voucher Amount (₱)</label>
            <input type="number" className="input-brutal" value={settings.shipping_voucher_amount} onChange={(e) => setSettings({ ...settings, shipping_voucher_amount: Number(e.target.value) })} />
          </div>

          <div>
            <label className="font-heading text-xs uppercase tracking-wide mb-1 block">Active Hours Start</label>
            <input type="time" className="input-brutal" value={settings.active_hours_start || ""} onChange={(e) => setSettings({ ...settings, active_hours_start: e.target.value || null })} />
            <p className="text-xs text-muted-foreground mt-1">Leave empty for 24h availability</p>
          </div>

          <div>
            <label className="font-heading text-xs uppercase tracking-wide mb-1 block">Active Hours End</label>
            <input type="time" className="input-brutal" value={settings.active_hours_end || ""} onChange={(e) => setSettings({ ...settings, active_hours_end: e.target.value || null })} />
          </div>
        </div>

        {/* Preview */}
        <div className="mt-6 p-4 bg-secondary">
          <h3 className="font-heading text-sm uppercase mb-2">Current Configuration Summary</h3>
          <div className="text-sm space-y-1 text-muted-foreground">
            <p>• {settings.probability_percent}% chance of popup appearing</p>
            <p>• Discount range: ₱{settings.min_discount} – ₱{settings.max_discount}</p>
            <p>• {settings.shipping_voucher_chance}% chance of free shipping (₱{settings.shipping_voucher_amount} deduction)</p>
            <p>• {100 - settings.shipping_voucher_chance}% chance of peso discount</p>
            <p>• {settings.daily_claim_limit} claim(s) per user per day</p>
            <p>• Hours: {settings.active_hours_start && settings.active_hours_end ? `${settings.active_hours_start} - ${settings.active_hours_end}` : "24/7"}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLuckyPromo;
