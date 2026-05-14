import { useState } from "react";
import { Ticket, Check, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow, isPast } from "date-fns";

interface Voucher {
  id: string;
  name: string;
  code: string;
  type: string;
  discount_value: number;
  max_discount_amount: number | null;
  min_order_amount: number;
  expires_at: string;
}

interface VoucherSelectorProps {
  onSelect: (voucher: Voucher | null) => void;
  selectedVoucherId: string | null;
  orderTotal: number;
}

const VoucherSelector = ({ onSelect, selectedVoucherId, orderTotal }: VoucherSelectorProps) => {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: vouchers, isLoading } = useQuery({
    queryKey: ["available-vouchers", user?.id],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await (supabase.from("user_discount_claims") as any)
        .select(
          `
          *,
          discounts!inner(*)
        `
        )
        .eq("user_id", user!.id)
        .eq("status", "active")
        .gte("discounts.ends_at", now)
        .order("discounts(discount_value)", { ascending: false });

      if (error) throw error;
      return (data || []).map((v: any) => ({
        ...v.discounts,
        id: v.discount_id, // Important: use discount_id for application
        claim_id: v.id,
        type: v.discounts.discount_type,
      })) as Voucher[];
    },
    enabled: !!user,
  });

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount);

  const getDiscountDisplay = (voucher: Voucher) => {
    if (voucher.type === "percentage_discount") {
      return `${voucher.discount_value}% OFF`;
    } else if (voucher.type === "free_shipping") {
      return "FREE SHIPPING";
    } else {
      return formatPrice(voucher.discount_value);
    }
  };

  const isVoucherApplicable = (voucher: Voucher) => {
    return orderTotal >= Number(voucher.min_order_amount);
  };

  const selectedVoucher = vouchers?.find((v) => v.id === selectedVoucherId);
  const applicableVouchers = vouchers?.filter(isVoucherApplicable) || [];
  const nonApplicableVouchers = vouchers?.filter((v) => !isVoucherApplicable(v)) || [];

  if (isLoading) {
    return <div className="skeleton-brutal h-12 w-full" />;
  }

  if (!vouchers || vouchers.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-3 bg-muted/30 border-2 border-dashed border-border-subtle">
        <div className="flex items-center gap-2">
          <Ticket className="w-4 h-4" />
          No vouchers available
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-foreground">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Ticket className="w-4 h-4" />
          {selectedVoucher ? (
            <span className="text-sm">
              <span className="font-medium">{getDiscountDisplay(selectedVoucher)}</span>
              <span className="text-muted-foreground ml-2">applied</span>
            </span>
          ) : (
            <span className="text-sm">
              Select a voucher ({applicableVouchers.length} available)
            </span>
          )}
        </div>
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {isExpanded && (
        <div className="border-t-2 border-foreground max-h-64 overflow-y-auto">
          {/* No voucher option */}
          <button
            onClick={() => {
              onSelect(null);
              setIsExpanded(false);
            }}
            className={`w-full p-3 text-left hover:bg-secondary/50 transition-colors flex items-center justify-between ${
              !selectedVoucherId ? "bg-secondary" : ""
            }`}
          >
            <span className="text-sm text-muted-foreground">Don't use a voucher</span>
            {!selectedVoucherId && <Check className="w-4 h-4 text-success" />}
          </button>

          {/* Applicable vouchers */}
          {applicableVouchers.map((voucher) => (
            <button
              key={voucher.id}
              onClick={() => {
                onSelect(voucher);
                setIsExpanded(false);
              }}
              className={`w-full p-3 text-left hover:bg-secondary/50 transition-colors border-t border-border-subtle ${
                selectedVoucherId === voucher.id ? "bg-success/10" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-heading text-sm">{getDiscountDisplay(voucher)}</div>
                  <div className="text-xs text-muted-foreground">{voucher.name}</div>
                  <div className="text-xs text-warning flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(voucher.expires_at), { addSuffix: true })}
                  </div>
                </div>
                {selectedVoucherId === voucher.id && <Check className="w-4 h-4 text-success" />}
              </div>
            </button>
          ))}

          {/* Non-applicable vouchers */}
          {nonApplicableVouchers.length > 0 && (
            <>
              <div className="px-3 py-2 bg-muted text-xs text-muted-foreground">
                Not applicable (minimum not met)
              </div>
              {nonApplicableVouchers.map((voucher) => (
                <div
                  key={voucher.id}
                  className="w-full p-3 text-left opacity-50 border-t border-border-subtle"
                >
                  <div className="font-heading text-sm">{getDiscountDisplay(voucher)}</div>
                  <div className="text-xs text-muted-foreground">{voucher.name}</div>
                  <div className="text-xs text-destructive mt-1">
                    Min. order: {formatPrice(Number(voucher.min_order_amount))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default VoucherSelector;
