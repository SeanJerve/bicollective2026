import { Link } from "react-router-dom";
import { Ticket, Clock, CheckCircle, XCircle, Gift } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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

  const { data: vouchers, isLoading } = useQuery({
    queryKey: ["user-vouchers", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vouchers")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: loyaltyProgress } = useQuery({
    queryKey: ["loyalty-progress", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loyalty_progress")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount);

  const getVoucherTypeLabel = (type: string) => {
    switch (type) {
      case "percentage_discount":
        return "% OFF";
      case "fixed_discount":
        return "DISCOUNT";
      case "free_shipping":
        return "FREE SHIP";
      default:
        return type;
    }
  };

  const activeVouchers = vouchers?.filter((v) => v.status === "active" && !isPast(new Date(v.expires_at))) || [];
  const usedVouchers = vouchers?.filter((v) => v.status === "used") || [];
  const expiredVouchers = vouchers?.filter((v) => v.status === "expired" || (v.status === "active" && isPast(new Date(v.expires_at)))) || [];

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

      {/* Loyalty Progress Section */}
      <section className="py-6 border-b-2 border-border-subtle">
        <div className="section-container max-w-4xl">
          <div className="card-brutal p-4 md:p-6 bg-gradient-to-r from-primary/10 to-accent/10">
            <h2 className="font-heading text-lg uppercase mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5" />
              Loyalty Progress
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 5 Deliveries Milestone */}
              <div className="bg-background p-4 border-2 border-foreground">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-heading text-sm uppercase">5 Deliveries</span>
                  {loyaltyProgress?.milestone_5_deliveries_claimed ? (
                    <span className="text-xs bg-success text-success-foreground px-2 py-0.5">CLAIMED</span>
                  ) : (
                    <span className="text-xs bg-secondary px-2 py-0.5">
                      {loyaltyProgress?.total_delivered_orders || 0}/5
                    </span>
                  )}
                </div>
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all"
                    style={{
                      width: `${Math.min(100, ((loyaltyProgress?.total_delivered_orders || 0) / 5) * 100)}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Earn ₱100 voucher after 5 delivered orders
                </p>
              </div>

              {/* 10 Unique Sellers Milestone */}
              <div className="bg-background p-4 border-2 border-foreground">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-heading text-sm uppercase">10 Sellers</span>
                  {loyaltyProgress?.milestone_10_sellers_claimed ? (
                    <span className="text-xs bg-success text-success-foreground px-2 py-0.5">CLAIMED</span>
                  ) : (
                    <span className="text-xs bg-secondary px-2 py-0.5">
                      {loyaltyProgress?.unique_sellers_purchased?.length || 0}/10
                    </span>
                  )}
                </div>
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-accent h-full transition-all"
                    style={{
                      width: `${Math.min(100, ((loyaltyProgress?.unique_sellers_purchased?.length || 0) / 10) * 100)}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Earn ₱500 voucher after buying from 10 different sellers
                </p>
              </div>
            </div>
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
              {/* Active Vouchers */}
              {activeVouchers.length > 0 && (
                <div>
                  <h2 className="font-heading text-xl uppercase mb-4 flex items-center gap-2">
                    <Ticket className="w-5 h-5" />
                    Available ({activeVouchers.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeVouchers.map((voucher) => (
                      <div
                        key={voucher.id}
                        className="card-brutal p-4 border-2 border-primary bg-primary/5"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <span className="font-heading text-2xl text-primary">
                              {voucher.type === "percentage_discount"
                                ? `${voucher.discount_value}%`
                                : formatPrice(Number(voucher.discount_value))}
                            </span>
                            <span className="ml-2 text-xs uppercase text-muted-foreground">
                              {getVoucherTypeLabel(voucher.type)}
                            </span>
                          </div>
                          <span className={`px-2 py-0.5 text-xs uppercase ${statusColors.active}`}>
                            {statusIcons.active} Active
                          </span>
                        </div>
                        <p className="font-medium text-sm mb-1">{voucher.name}</p>
                        {voucher.description && (
                          <p className="text-xs text-muted-foreground mb-2">
                            {voucher.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs">
                          <code className="bg-secondary px-2 py-1 font-mono">
                            {voucher.code}
                          </code>
                          <span className="text-warning flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(voucher.expires_at), { addSuffix: true })}
                          </span>
                        </div>
                        {voucher.min_order_amount && Number(voucher.min_order_amount) > 0 && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Min. order: {formatPrice(Number(voucher.min_order_amount))}
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
                    {usedVouchers.map((voucher) => (
                      <div
                        key={voucher.id}
                        className="card-brutal p-4 bg-muted/30 opacity-60"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-heading text-lg line-through">
                            {voucher.type === "percentage_discount"
                              ? `${voucher.discount_value}%`
                              : formatPrice(Number(voucher.discount_value))}
                          </span>
                          <span className={`px-2 py-0.5 text-xs uppercase ${statusColors.used}`}>
                            Used
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{voucher.name}</p>
                        {voucher.used_at && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Used on {format(new Date(voucher.used_at), "PPP")}
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
                    {expiredVouchers.map((voucher) => (
                      <div
                        key={voucher.id}
                        className="card-brutal p-4 bg-destructive/5 opacity-50"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-heading text-lg line-through">
                            {voucher.type === "percentage_discount"
                              ? `${voucher.discount_value}%`
                              : formatPrice(Number(voucher.discount_value))}
                          </span>
                          <span className={`px-2 py-0.5 text-xs uppercase ${statusColors.expired}`}>
                            Expired
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{voucher.name}</p>
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