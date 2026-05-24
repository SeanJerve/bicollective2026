import { useState, useEffect } from "react";
import { X, Tag, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  differenceInSeconds,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
} from "date-fns";

interface Promotion {
  id: string;
  name: string;
  description: string | null;
  code: string | null;
  type: string;
  discount_value: number;
  ends_at: string;
  scope: string;
}

const SaleBanner = () => {
  const [dismissed, setDismissed] = useState(false);
  const [countdown, setCountdown] = useState("");

  const { data: activePromo } = useQuery({
    queryKey: ["active-platform-promo"],
    queryFn: async () => {
      const now = new Date().toISOString();

      const { data, error } = await (supabase
        .from("platform_promos")
        .select(
          `
          *,
          discounts:discounts!inner(*)
        `
        )
        .eq("deployment_target", "sale_banner")
        .eq("discounts.is_active", true)
        .lte("discounts.starts_at", now)
        .gte("discounts.ends_at", now) as any);

      if (error) throw error;
      if (!data || data.length === 0) return null;

      // Map and sort chronologically (newest first)
      const mapped = data.map((p: any) => ({
        ...p.discounts,
        code: p.code,
        id: p.id,
        type: p.discounts.discount_type,
        created_at: p.discounts.created_at,
      }));

      mapped.sort((a: any, b: any) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });

      return mapped[0] as Promotion | null;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  useEffect(() => {
    if (!activePromo || dismissed) return;

    const updateCountdown = () => {
      const now = new Date();
      const endDate = new Date(activePromo.ends_at);

      if (now >= endDate) {
        setCountdown("ENDED");
        return;
      }

      const days = differenceInDays(endDate, now);
      const hours = differenceInHours(endDate, now) % 24;
      const minutes = differenceInMinutes(endDate, now) % 60;
      const seconds = differenceInSeconds(endDate, now) % 60;

      if (days > 0) {
        setCountdown(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setCountdown(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setCountdown(`${minutes}m ${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [activePromo, dismissed]);

  if (dismissed || !activePromo) return null;

  const getDiscountText = () => {
    if (activePromo.type === "percentage_discount") {
      return `${activePromo.discount_value}% OFF`;
    } else if (activePromo.type === "free_shipping") {
      return "FREE SHIPPING";
    } else {
      return `₱${activePromo.discount_value} OFF`;
    }
  };

  return (
    <div className="bg-primary text-primary-foreground relative overflow-hidden">
      <div className="section-container py-2 md:py-3">
        <div className="flex items-center justify-center gap-2 md:gap-4 text-center text-xs md:text-sm">
          <Tag className="w-4 h-4 flex-shrink-0 animate-bounce" />
          <div className="flex flex-wrap items-center justify-center gap-1 md:gap-2">
            <span className="font-heading uppercase">{activePromo.name}:</span>
            <span className="font-bold">{getDiscountText()}</span>
            {activePromo.code && (
              <code className="bg-background/20 px-2 py-0.5 font-mono text-xs">
                {activePromo.code}
              </code>
            )}
            <span className="hidden md:inline text-primary-foreground/80">•</span>
            <span className="flex items-center gap-1 text-primary-foreground/90">
              <Clock className="w-3 h-3" />
              Ends in {countdown}
            </span>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="absolute right-2 md:right-4 p-1 hover:bg-background/20 transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaleBanner;
