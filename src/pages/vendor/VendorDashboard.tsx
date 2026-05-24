import { Link } from "react-router-dom";
import {
  Package,
  ShoppingCart,
  DollarSign,
  Star,
  TrendingUp,
  AlertCircle,
  Clock,
  Truck,
  MessageSquare,
  Award,
  ArrowRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import LowStockAlert from "@/components/vendor/LowStockAlert";
import { useNotifications } from "@/hooks/useNotifications";
import { calcVendorPlatformFees } from "@/lib/platformFees";

const VendorDashboard = () => {
  const { user } = useAuth();
  const { counts } = useNotifications();

  const { data: brand, isLoading: brandLoading } = useQuery({
    queryKey: ["vendor-brand", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("*")
        .eq("owner_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: stats } = useQuery({
    queryKey: ["vendor-dashboard-pipeline-stats", brand?.id],
    queryFn: async () => {
      if (!brand) return null;
      const brandId = brand.id;

      // Query active vendor orders
      const { data: orders, error } = await supabase
        .from("vendor_orders")
        .select("status, subtotal")
        .eq("brand_id", brandId);

      if (error) throw error;

      // Categorize pipeline
      let awaitingPayment = 0;
      let pendingDispatch = 0;
      let inTransit = 0;

      orders?.forEach((o) => {
        if (o.status === "pending_payment" || o.status === "payment_uploaded") {
          awaitingPayment++;
        } else if (o.status === "processing") {
          pendingDispatch++;
        } else if (o.status === "shipped") {
          inTransit++;
        }
      });

      // Count unread reviews
      const { count: pendingReviewsCount } = await supabase
        .from("reviews")
        .select("*", { count: "exact", head: true })
        .eq("brand_id", brandId)
        .is("reply_comment", null); // Unreplied reviews need attention

      return {
        awaitingPayment,
        pendingDispatch,
        inTransit,
        pendingReviewsCount: pendingReviewsCount || 0,
      };
    },
    enabled: !!brand,
  });

  const { data: financeStats } = useQuery({
    queryKey: ["vendor-dashboard-finance", brand?.id],
    queryFn: async () => {
      const { data: orders, error } = await supabase
        .from("vendor_orders")
        .select("subtotal, total_platform_fee, platform_commission, platform_shipping_margin")
        .eq("brand_id", brand!.id)
        .eq("status", "delivered");
      if (error) throw error;

      let totalIncome = 0;
      let totalFees = 0;
      orders?.forEach((o) => {
        const subtotal = Number(o.subtotal);
        totalIncome += subtotal;
        totalFees += calcVendorPlatformFees(subtotal, brand!.commission_rate, o.platform_shipping_margin);
      });
      return { totalIncome, totalFees, netProfit: totalIncome - totalFees };
    },
    enabled: !!brand?.id,
  });

  const { data: recentOrders } = useQuery({
    queryKey: ["vendor-recent-orders", brand?.id],
    queryFn: async () => {
      if (!brand) return [];
      const { data, error } = await supabase
        .from("vendor_orders")
        .select("*, order:orders(shipping_name, created_at)")
        .eq("brand_id", brand.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: !!brand,
  });

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending_payment":
        return "bg-muted text-muted-foreground";
      case "payment_uploaded":
        return "bg-secondary text-secondary-foreground border border-foreground/15";
      case "processing":
        return "bg-amber-100 text-amber-800 border border-amber-300";
      case "shipped":
        return "bg-blue-100 text-blue-800 border border-blue-300";
      case "delivered":
        return "bg-green-100 text-green-800 border border-green-300";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (brandLoading) {
    return (
      <div className="p-4 md:p-8">
        <div className="animate-pulse space-y-6 md:space-y-8">
          <div className="h-8 w-48 skeleton-brutal" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 md:h-32 skeleton-brutal" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="p-4 md:p-8">
        <div className="card-brutal p-6 md:p-8 text-center">
          <AlertCircle className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="font-heading text-xl md:text-2xl uppercase mb-4">No Store Found</h2>
          <p className="text-muted-foreground mb-6 text-sm md:text-base">
            You haven't set up your vendor store yet.
          </p>
          <Link to="/vendor/store" className="btn-brutal">
            Set Up Store
          </Link>
        </div>
      </div>
    );
  }

  const s = stats || {
    awaitingPayment: 0,
    pendingDispatch: 0,
    inTransit: 0,
    pendingReviewsCount: 0,
  };

  const hasDebt = Number(brand.platform_debt || 0) > 0;

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Title */}
      <div>
        <h1 className="font-heading text-2xl md:text-4xl uppercase">Store Operations Command</h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Fulfill order pipelines, manage inventory health, and reply to customers.
        </p>
      </div>

      <LowStockAlert brandId={brand.id} />

      {/* Revenue summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-brutal p-5 bg-background">
          <p className="text-[10px] uppercase font-heading text-muted-foreground flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5" /> Total Income
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Delivered sales (gross)</p>
          <p className="font-heading text-2xl font-bold mt-2">
            {formatPrice(financeStats?.totalIncome ?? 0)}
          </p>
        </div>
        <div className="card-brutal p-5 bg-background">
          <p className="text-[10px] uppercase font-heading text-muted-foreground">Platform Fees</p>
          <p className="text-xs text-muted-foreground mt-0.5">At your current rate + shipping margins</p>
          <p className="font-heading text-2xl font-bold mt-2 text-destructive">
            {formatPrice(financeStats?.totalFees ?? 0)}
          </p>
        </div>
        <div className="card-brutal p-5 bg-background border-green-600/30">
          <p className="text-[10px] uppercase font-heading text-muted-foreground flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-green-600" /> Your Profit
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Income after fees</p>
          <p className="font-heading text-2xl font-bold mt-2 text-green-600">
            {formatPrice(financeStats?.netProfit ?? 0)}
          </p>
        </div>
      </div>

      {/* Main Grid: Store Health vs Fulfillment Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Store Health & Tier Card */}
        <div className="card-brutal p-6 bg-background space-y-6 lg:col-span-1">
          <h2 className="font-heading text-lg uppercase border-b-2 border-foreground pb-2 flex items-center gap-2">
            <Award className="w-5 h-5 text-accent" /> Store Status
          </h2>

          {/* Tier specs */}
          <div className="flex items-center justify-between p-3 border-2 border-foreground bg-secondary/15">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-heading">Subscription Tier</p>
              <p className="font-heading uppercase text-sm font-bold flex items-center gap-1 mt-0.5">
                {brand.subscription_tier === "premium" ? (
                  <><Star className="w-4 h-4 fill-warning text-warning" /> PREMIUM VENDOR</>
                ) : (
                  "STANDARD FREE"
                )}
              </p>
            </div>
            {brand.subscription_tier !== "premium" && (
              <Link to="/vendor/marketing?tab=premium" className="text-xs font-heading uppercase text-accent hover:underline">
                Upgrade
              </Link>
            )}
          </div>

          {/* Platform Debt specs */}
          <div className={`p-4 border-2 ${hasDebt ? "border-destructive bg-destructive/5" : "border-foreground bg-success/5"} space-y-2`}>
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-heading text-muted-foreground">Outstanding Debt</span>
              <AlertCircle className={`w-4 h-4 ${hasDebt ? "text-destructive" : "text-success"}`} />
            </div>
            <p className="font-heading text-2xl font-bold">
              {formatPrice(Number(brand.platform_debt || 0))}
            </p>
            {hasDebt ? (
              <p className="text-[10px] text-destructive uppercase font-heading">
                Monthly payout cycle settlement required
              </p>
            ) : (
              <p className="text-[10px] text-success uppercase font-heading">
                Good standing. No debt accrued
              </p>
            )}
            <Link to="/vendor/finances" className="block text-xs font-heading uppercase text-foreground underline pt-1">
              Go to Payments Ledger
            </Link>
          </div>
        </div>

        {/* Fulfillment Pipeline widgets */}
        <div className="card-brutal p-6 bg-background lg:col-span-2 space-y-4">
          <h2 className="font-heading text-lg uppercase border-b-2 border-foreground pb-2 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-success" /> Order Fulfillment Pipeline
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="border-2 border-foreground p-4 bg-secondary/10 flex flex-col justify-between h-28">
              <span className="text-[10px] uppercase font-heading text-muted-foreground flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" /> Verification Pending
              </span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="font-heading text-3xl font-bold">{s.awaitingPayment}</span>
                <Link to="/vendor/orders" className="text-xs font-heading uppercase text-accent hover:underline">
                  View
                </Link>
              </div>
            </div>

            <div className="border-2 border-foreground p-4 bg-amber-50/50 border-amber-300 flex flex-col justify-between h-28">
              <span className="text-[10px] uppercase font-heading text-amber-700 flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-amber-500" /> Dispatch Required
              </span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="font-heading text-3xl text-amber-700 font-bold">{s.pendingDispatch}</span>
                <Link to="/vendor/orders" className="text-xs font-heading uppercase text-amber-700 hover:underline">
                  Ship
                </Link>
              </div>
            </div>

            <div className="border-2 border-foreground p-4 bg-blue-50/50 border-blue-300 flex flex-col justify-between h-28">
              <span className="text-[10px] uppercase font-heading text-blue-700 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-blue-500" /> In Transit
              </span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="font-heading text-3xl text-blue-700 font-bold">{s.inTransit}</span>
                <Link to="/vendor/orders" className="text-xs font-heading uppercase text-blue-700 hover:underline">
                  Track
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer interaction highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/account/messages" className="card-brutal p-5 flex items-center justify-between hover:bg-secondary/40 transition-colors bg-background">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border-2 border-foreground flex items-center justify-center bg-secondary">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="font-heading uppercase text-sm">Customer Chats</p>
              <p className="text-[10px] text-muted-foreground uppercase mt-0.5">Unread messages in inbox</p>
            </div>
          </div>
          <span className={`w-6 h-6 flex items-center justify-center font-heading text-xs font-bold ${
            (counts.unreadMessages || 0) > 0 ? "bg-destructive text-destructive-foreground animate-bounce" : "bg-muted text-muted-foreground"
          }`}>
            {counts.unreadMessages || 0}
          </span>
        </Link>

        <Link to="/vendor/reviews" className="card-brutal p-5 flex items-center justify-between hover:bg-secondary/40 transition-colors bg-background">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border-2 border-foreground flex items-center justify-center bg-secondary">
              <Star className="w-5 h-5" />
            </div>
            <div>
              <p className="font-heading uppercase text-sm">Pending Reviews</p>
              <p className="text-[10px] text-muted-foreground uppercase mt-0.5">Feedback needing replies</p>
            </div>
          </div>
          <span className={`w-6 h-6 flex items-center justify-center font-heading text-xs font-bold ${
            s.pendingReviewsCount > 0 ? "bg-destructive text-destructive-foreground animate-bounce" : "bg-muted text-muted-foreground"
          }`}>
            {s.pendingReviewsCount}
          </span>
        </Link>

        <Link to="/vendor/marketing" className="card-brutal p-5 flex items-center justify-between hover:bg-secondary/40 transition-colors bg-background">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border-2 border-foreground flex items-center justify-center bg-secondary">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="font-heading uppercase text-sm">Store Marketing</p>
              <p className="text-[10px] text-muted-foreground uppercase mt-0.5">Vouchers & Promos</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
        </Link>
      </div>

      {/* Recent Orders List */}
      <div className="card-brutal bg-background">
        <div className="p-6 border-b-2 border-foreground bg-muted/15 flex items-center justify-between">
          <h2 className="font-heading text-xl uppercase">Recent Order Feed</h2>
          <Link to="/vendor/orders" className="text-sm font-heading uppercase text-muted-foreground hover:text-foreground">
            Fulfill All
          </Link>
        </div>
        {(recentOrders || []).length > 0 ? (
          <div className="divide-y divide-border-subtle">
            {(recentOrders || []).map((order: any) => (
              <div key={order.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-secondary/15 transition-colors">
                <div>
                  <p className="font-heading uppercase text-sm">
                    {order.order?.shipping_name || "Bicollective Customer"}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    Order ID: {order.order_id} • Placed {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-left sm:text-right flex items-center sm:flex-col gap-2 sm:gap-1 justify-between">
                  <p className="font-heading text-sm font-bold text-foreground">{formatPrice(Number(order.subtotal))}</p>
                  <span className={`px-2 py-0.5 text-[9px] uppercase font-heading ${getStatusColor(order.status)}`}>
                    {order.status.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground italic text-sm">No recent orders yet.</div>
        )}
      </div>
    </div>
  );
};

export default VendorDashboard;
