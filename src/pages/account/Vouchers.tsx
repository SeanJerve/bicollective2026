import { Link } from "react-router-dom";
import { Ticket, Clock, CheckCircle, XCircle, Gift } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow, isPast } from "date-fns";

const statusColors: Record<string, string> = {
  active: "bg-success text-success-foreground",
  used: "bg-muted text-muted-foreground",
  expired: "bg-destructive/20 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
};

const statusIcons: Record<string, React.ReactNode> = {
  active: <Clock className="w-4 h-4" />,
  used: <CheckCircle className="w-4 h-4" />,
  expired: <XCircle className="w-4 h-4" />,
  cancelled: <XCircle className="w-4 h-4" />,
};

const Vouchers = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const {
    data: vouchers,
    isLoading,
    refetch: refetchVouchers,
  } = useQuery({
    queryKey: ["user-vouchers-new", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_discount_claims")
        .select(
          `
          *,
          discounts:discounts(*)
        `
        )
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const {
    data: availablePromos,
    isLoading: promosLoading,
    refetch: refetchPromos,
  } = useQuery({
    queryKey: ["available-promos", user?.id],
    queryFn: async () => {
      const now = new Date().toISOString();

      // Get all active discounts that have a code (i.e. are either platform or vendor vouchers)
      // And filter out those already claimed by the user.
      const { data: claimed } = await supabase
        .from("user_discount_claims")
        .select("discount_id")
        .eq("user_id", user!.id);

      const claimedIds = (claimed || []).map((c) => c.discount_id);

      // Fetch platform promos (using !inner to filter by joined table)
      const { data: platformPromos } = await (supabase
        .from("platform_promos")
        .select("*, discounts!inner(*)")
        .eq("discounts.is_active", true)
        .gte("discounts.ends_at", now) as any);

      // Fetch vendor vouchers
      const { data: vendorPromos } = await (supabase
        .from("vendor_vouchers")
        .select("*, discounts!inner(*)")
        .eq("discounts.is_active", true)
        .gte("discounts.ends_at", now) as any);

      const allPromos = [...(platformPromos || []), ...(vendorPromos || [])]
        .map((p) => ({ ...p.discounts, code: p.code }))
        .filter((p) => p && !claimedIds.includes(p.id));

      return allPromos;
    },
    enabled: !!user && !!vouchers,
  });

  const queryClient = useQueryClient();

  const claimMutation = useMutation({
    mutationFn: async (discount: any) => {
      const { error } = await supabase.from("user_discount_claims").insert({
        user_id: user!.id,
        discount_id: discount.id,
        code: discount.code,
        status: "active",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-vouchers-new"] });
      queryClient.invalidateQueries({ queryKey: ["available-promos"] });
      queryClient.invalidateQueries({ queryKey: ["checkout-vouchers-claimed"] });
      toast({
        title: "Voucher Claimed!",
        description: "You can now use this voucher at checkout.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Claim Failed",
        description: err.message || "Could not claim voucher",
        variant: "destructive",
      });
    },
  });

  const { data: loyaltyProgress } = useQuery({
    queryKey: ["loyalty-progress-new", user?.id],
    queryFn: async () => {
      // Get main progress
      const { data: progress, error: pError } = await supabase
        .from("loyalty_progress")
        .select(
          "id, user_id, total_delivered_orders, milestone_5_deliveries_claimed, milestone_10_sellers_claimed, created_at, updated_at"
        )
        .eq("user_id", user!.id)
        .maybeSingle();

      if (pError) throw pError;

      // Get unique sellers count from junction table
      const { count, error: cError } = await (supabase as any)
        .from("user_purchased_sellers")
        .select("*", { count: "exact", head: true })
        .eq("loyalty_id", (progress as any)?.id || "");

      if (cError) throw cError;

      return {
        ...progress,
        unique_sellers_count: count || 0,
      };
    },
    enabled: !!user,
  });

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount);

  const getVoucherTypeLabel = (type: string) => {
    switch (type) {
      case "percentage":
        return "% OFF";
      case "fixed":
        return "DISCOUNT";
      case "free_shipping":
        return "FREE SHIP";
      default:
        return type;
    }
  };

  const activeVouchers =
    (vouchers as any[])?.filter(
      (v) => v.status === "active" && !isPast(new Date(v.discounts?.ends_at))
    ) || [];
  const usedVouchers = (vouchers as any[])?.filter((v) => v.status === "used") || [];
  const expiredVouchers =
    (vouchers as any[])?.filter(
      (v) =>
        v.status === "expired" || (v.status === "active" && isPast(new Date(v.discounts?.ends_at)))
    ) || [];

  if (!user) {
    return (
      <PageLayout>
        <div className="section-container py-12 text-center">
          <p className="text-muted-foreground">Please log in to view your vouchers.</p>
          <Link to="/login" className="btn-brutal mt-4 inline-block">
            Sign In
          </Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <section className="py-8 md:py-12 border-b-2 border-foreground">
        <div className="section-container">
          <nav className="text-xs md:text-sm mb-3 md:mb-4">
            <Link to="/" className="text-muted-foreground hover:text-foreground">
              Home
            </Link>
            <span className="mx-2 text-muted-foreground">/</span>
            <span>My Vouchers</span>
          </nav>
          <h1 className="font-heading text-4xl md:text-6xl uppercase">My Vouchers</h1>
        </div>
      </section>

      {/* Loyalty Progress Section — open HP bar layout */}
      <section className="py-8 border-b-2 border-foreground/10">
        <div className="section-container max-w-4xl">
          <h2 className="font-heading text-sm uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
            <Gift className="w-4 h-4" />
            Loyalty Progress
          </h2>

          {/* 5 Deliveries Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="font-heading text-base md:text-lg uppercase">5 Deliveries</span>
              <div className="flex items-center gap-2">
                {loyaltyProgress?.milestone_5_deliveries_claimed ? (
                  <span className="text-xs bg-success text-success-foreground px-2 py-0.5 font-heading uppercase">Claimed</span>
                ) : (
                  <span className="font-heading text-sm tabular-nums">
                    {loyaltyProgress?.total_delivered_orders || 0}
                    <span className="text-muted-foreground"> / 5</span>
                  </span>
                )}
              </div>
            </div>
            <div className="w-full bg-muted h-3 overflow-hidden">
              <div
                className="bg-foreground h-full transition-all duration-500"
                style={{ width: `${Math.min(100, ((loyaltyProgress?.total_delivered_orders || 0) / 5) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Earn ₱100 voucher after 5 delivered orders</p>
          </div>

          {/* 10 Sellers Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-heading text-base md:text-lg uppercase">10 Sellers</span>
              <div className="flex items-center gap-2">
                {loyaltyProgress?.milestone_10_sellers_claimed ? (
                  <span className="text-xs bg-success text-success-foreground px-2 py-0.5 font-heading uppercase">Claimed</span>
                ) : (
                  <span className="font-heading text-sm tabular-nums">
                    {loyaltyProgress?.unique_sellers_count || 0}
                    <span className="text-muted-foreground"> / 10</span>
                  </span>
                )}
              </div>
            </div>
            <div className="w-full bg-muted h-3 overflow-hidden">
              <div
                className="bg-foreground h-full transition-all duration-500"
                style={{ width: `${Math.min(100, ((loyaltyProgress?.unique_sellers_count || 0) / 10) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Earn ₱500 voucher after buying from 10 different sellers</p>
          </div>
        </div>
      </section>

      <section className="py-8 md:py-12">
        <div className="section-container max-w-4xl">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="card-brutal p-6 skeleton-brutal h-40" />
              ))}
            </div>
          ) : vouchers && vouchers.length > 0 ? (
            <div className="space-y-8">
              {/* Available to Claim */}
              {availablePromos && availablePromos.length > 0 && (
                <div className="bg-secondary/30 p-6 md:p-8 border-2 border-dashed border-foreground mb-8">
                  <h2 className="font-heading text-xl md:text-2xl uppercase mb-6 flex items-center gap-2">
                    <Gift className="w-6 h-6 text-primary" />
                    Available Store Offers
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {availablePromos.map((promo: any) => (
                      <div
                        key={promo.id}
                        className="card-brutal p-5 bg-background hover:translate-x-1 hover:-translate-y-1 transition-transform"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="bg-primary text-primary-foreground px-3 py-1 font-heading text-lg">
                            {promo.discount_type === "percentage"
                              ? `${promo.discount_value}% OFF`
                              : formatPrice(Number(promo.discount_value || 0)) + " OFF"}
                          </div>
                          <code className="text-xs font-mono bg-muted px-2 py-1 border border-border-subtle">
                            {promo.code}
                          </code>
                        </div>
                        <h3 className="font-heading text-sm uppercase mb-1">{promo.name}</h3>
                        {promo.description && (
                          <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
                            {promo.description}
                          </p>
                        )}
                        <button
                          onClick={() => claimMutation.mutate(promo)}
                          disabled={claimMutation.isPending}
                          className="btn-brutal w-full py-2 text-xs flex items-center justify-center gap-2"
                        >
                          {claimMutation.isPending ? "Claiming..." : "Add to My Vouchers"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Vouchers */}
              {activeVouchers.length > 0 && (
                <div>
                  <h2 className="font-heading text-xl uppercase mb-4 flex items-center gap-2 text-muted-foreground">
                    <Ticket className="w-5 h-5" />
                    In My Wallet ({activeVouchers.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeVouchers.map((v) => (
                      <div
                        key={v.id}
                        className="card-brutal p-4 border-2 border-primary bg-primary/5"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <span className="font-heading text-2xl text-primary">
                              {v.discounts?.discount_type === "percentage"
                                ? `${v.discounts.discount_value}%`
                                : formatPrice(Number(v.discounts?.discount_value || 0))}
                            </span>
                            <span className="ml-2 text-xs uppercase text-muted-foreground">
                              {getVoucherTypeLabel(v.discounts?.discount_type || "")}
                            </span>
                          </div>
                          <span className={`px-2 py-0.5 text-xs uppercase ${statusColors.active}`}>
                            {statusIcons.active} Active
                          </span>
                        </div>
                        <p className="font-medium text-sm mb-1">{v.discounts?.name}</p>
                        {v.discounts?.description && (
                          <p className="text-xs text-muted-foreground mb-2">
                            {v.discounts.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs">
                          {v.discounts?.ends_at && (
                            <span className="text-warning flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDistanceToNow(new Date(v.discounts.ends_at), {
                                addSuffix: true,
                              })}
                            </span>
                          )}
                        </div>
                        {v.discounts?.min_order_amount &&
                          Number(v.discounts.min_order_amount) > 0 && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Min. order: {formatPrice(Number(v.discounts.min_order_amount))}
                            </p>
                          )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Used Vouchers */}
              {usedVouchers.length > 0 && (
                <div>
                  <h2 className="font-heading text-lg uppercase mb-4 text-muted-foreground">
                    Used ({usedVouchers.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {usedVouchers.map((v) => (
                      <div key={v.id} className="card-brutal p-4 bg-muted/30 opacity-60">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-heading text-lg line-through">
                            {v.discounts?.discount_type === "percentage"
                              ? `${v.discounts.discount_value}%`
                              : formatPrice(Number(v.discounts?.discount_value || 0))}
                          </span>
                          <span className={`px-2 py-0.5 text-xs uppercase ${statusColors.used}`}>
                            Used
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{v.discounts?.name}</p>
                        {v.used_at && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Used on {format(new Date(v.used_at), "PPP")}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expired Vouchers */}
              {expiredVouchers.length > 0 && (
                <div>
                  <h2 className="font-heading text-lg uppercase mb-4 text-muted-foreground">
                    Expired ({expiredVouchers.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {expiredVouchers.map((v) => (
                      <div key={v.id} className="card-brutal p-4 bg-destructive/5 opacity-50">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-heading text-lg line-through">
                            {v.discounts?.discount_type === "percentage"
                              ? `${v.discounts.discount_value}%`
                              : formatPrice(Number(v.discounts?.discount_value || 0))}
                          </span>
                          <span className={`px-2 py-0.5 text-xs uppercase ${statusColors.expired}`}>
                            Expired
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{v.discounts?.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card-brutal p-12 text-center">
              <Ticket className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="font-heading text-xl uppercase mb-2">No Vouchers Yet</h2>
              <p className="text-muted-foreground mb-6">
                Keep shopping to earn loyalty rewards and vouchers!
              </p>
              <Link to="/products" className="btn-brutal">
                Start Shopping
              </Link>
            </div>
          )}
        </div>
      </section>
    </PageLayout>
  );
};

export default Vouchers;
