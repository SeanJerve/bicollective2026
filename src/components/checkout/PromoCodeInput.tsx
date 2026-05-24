import { useState } from "react";
import { Tag, Check, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PromoCodeInputProps {
  onApply: (
    promo: {
      id: string;
      code: string;
      discount_type: string;
      discount_value: number;
      max_discount_amount: number | null;
      scope: string;
    } | null
  ) => void;
  appliedCode: string | null;
  orderTotal: number;
}

const PromoCodeInput = ({ onApply, appliedCode, orderTotal }: PromoCodeInputProps) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleApply = async () => {
    if (!code.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const now = new Date().toISOString();

      // Check platform_promos first
      let { data: platformPromo } = await (supabase.from("platform_promos") as any)
        .select(
          `
          *,
          discounts:discounts(*)
        `
        )
        .eq("code", code.toUpperCase().trim())
        .maybeSingle();

      let promoData: any = platformPromo;

      // If not found in platform, check vendor_vouchers
      if (!promoData) {
        const { data: vendorVoucher } = await (supabase.from("vendor_vouchers") as any)
          .select(
            `
            *,
            discounts:discounts(*)
          `
          )
          .eq("code", code.toUpperCase().trim())
          .maybeSingle();

        promoData = vendorVoucher;
      }

      if (!promoData || !promoData.discounts) {
        setError("Invalid or expired promo code");
        return;
      }

      const discount = promoData.discounts;

      const nowTime = new Date().getTime();
      const startsTime = new Date(discount.starts_at).getTime();
      const endsTime = new Date(discount.ends_at).getTime();

      // Check isActive
      if (!discount.is_active || nowTime < startsTime || nowTime > endsTime) {
        setError("This promo code is currently inactive or expired");
        return;
      }

      // Check usage limits
      if (discount.max_uses && discount.current_uses >= discount.max_uses) {
        setError("This promo code has reached its usage limit");
        return;
      }

      // Check minimum order amount
      if (discount.min_order_amount && orderTotal < Number(discount.min_order_amount)) {
        setError(
          `Minimum order of ₱${Number(discount.min_order_amount).toLocaleString()} required`
        );
        return;
      }

      onApply({
        id: discount.id,
        code: code.toUpperCase().trim(),
        discount_type: discount.discount_type,
        discount_value: Number(discount.discount_value),
        max_discount_amount: discount.max_discount_amount
          ? Number(discount.max_discount_amount)
          : null,
        scope: (promoData as any).scope || "vendor",
      });

      toast({
        title: "Promo applied!",
        description: `${discount.name} has been applied to your order`,
      });
    } catch (err: any) {
      console.error("Promo code error:", err);
      setError("Failed to apply promo code");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setCode("");
    setError(null);
    onApply(null);
  };

  if (appliedCode) {
    return (
      <div className="flex items-center justify-between bg-success/10 border-2 border-success p-3">
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-success" />
          <span className="font-mono text-sm">{appliedCode}</span>
        </div>
        <button
          onClick={handleRemove}
          className="text-muted-foreground hover:text-destructive transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError(null);
            }}
            placeholder="Enter promo code"
            className="input-brutal pl-10 text-sm font-mono"
          />
        </div>
        <button
          onClick={handleApply}
          disabled={loading || !code.trim()}
          className="btn-brutal-secondary px-4 text-sm disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
        </button>
      </div>
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <X className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
};

export default PromoCodeInput;
