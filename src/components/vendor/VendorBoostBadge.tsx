import { hasActiveAdBoost, hasPendingAdBoost } from "@/lib/adBoosts";

interface VendorBoostBadgeProps {
  adBoosts?: { status?: string; starts_at?: string | null; ends_at?: string | null }[] | null;
  className?: string;
}

/** Sponsored / pending labels — vendor portal only (not shown to customers). */
const VendorBoostBadge = ({ adBoosts, className = "" }: VendorBoostBadgeProps) => {
  if (hasActiveAdBoost(adBoosts)) {
    return (
      <span
        className={`px-2 py-0.5 text-[10px] font-heading uppercase bg-foreground text-background border border-foreground ${className}`}
      >
        Sponsored
      </span>
    );
  }
  if (hasPendingAdBoost(adBoosts)) {
    return (
      <span
        className={`px-2 py-0.5 text-[10px] font-heading uppercase bg-warning text-warning-foreground border border-foreground ${className}`}
      >
        Boost Pending
      </span>
    );
  }
  return null;
};

export default VendorBoostBadge;
