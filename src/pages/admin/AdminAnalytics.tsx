import { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Package,
  ShoppingCart,
  DollarSign,
  Ticket,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  deliveredOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  totalProducts: number;
  activeProducts: number;
  totalVouchers: number;
  usedVouchers: number;
  totalPromotions: number;
  activePromotions: number;
  ordersByStatus: Record<string, number>;
  topProducts: Array<{ name: string; count: number }>;
}

const AdminAnalytics = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Get orders stats
        const { data: orders } = await supabase
          .from("vendor_orders")
          .select("status, subtotal, shipping_fee");

        const ordersByStatus: Record<string, number> = {};
        let totalRevenue = 0;
        let deliveredOrders = 0;
        let pendingOrders = 0;
        let cancelledOrders = 0;

        orders?.forEach((order) => {
          ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
          if (order.status === "delivered") {
            totalRevenue += Number(order.subtotal) + Number(order.shipping_fee || 0);
            deliveredOrders++;
          }
          if (["pending_payment", "payment_uploaded", "processing"].includes(order.status)) {
            pendingOrders++;
          }
          if (order.status === "cancelled") {
            cancelledOrders++;
          }
        });

        // Get products stats
        const { count: totalProducts } = await supabase
          .from("products")
          .select("*", { count: "exact", head: true });

        const { count: activeProducts } = await supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true);

        // Get vouchers stats
        const { count: totalVouchers } = await (
          supabase.from("user_discount_claims") as any
        ).select("*", { count: "exact", head: true });

        const { count: usedVouchers } = await (supabase.from("user_discount_claims") as any)
          .select("*", { count: "exact", head: true })
          .eq("status", "used");

        // Get promotions stats
        const { count: totalPromotions } = await (supabase.from("platform_promos") as any).select(
          "*",
          { count: "exact", head: true }
        );

        const { data: promoData } = await (supabase.from("platform_promos") as any).select(
          "discounts(is_active)"
        );

        const activePromotions = (promoData || []).filter(
          (p: any) => p.discounts?.is_active
        ).length;

        // Get top products
        const { data: orderItems } = await supabase
          .from("order_items")
          .select("product_name, quantity");

        const productCounts: Record<string, number> = {};
        orderItems?.forEach((item) => {
          productCounts[item.product_name] =
            (productCounts[item.product_name] || 0) + item.quantity;
        });

        const topProducts = Object.entries(productCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, count]) => ({ name, count }));

        setData({
          totalRevenue,
          totalOrders: orders?.length || 0,
          deliveredOrders,
          pendingOrders,
          cancelledOrders,
          totalProducts: totalProducts || 0,
          activeProducts: activeProducts || 0,
          totalVouchers: totalVouchers || 0,
          usedVouchers: usedVouchers || 0,
          totalPromotions: totalPromotions || 0,
          activePromotions: activePromotions || 0,
          ordersByStatus,
          topProducts,
        });
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount);

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 skeleton-brutal" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 skeleton-brutal" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="font-heading text-2xl md:text-4xl uppercase mb-4">Analytics</h1>
      <p className="text-muted-foreground mb-8">Platform performance insights and statistics</p>

      {/* Revenue Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card-brutal p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-success/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="font-heading text-xl">{formatPrice(data?.totalRevenue || 0)}</p>
            </div>
          </div>
        </div>

        <div className="card-brutal p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-secondary flex items-center justify-center">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="font-heading text-xl">{data?.totalOrders || 0}</p>
            </div>
          </div>
        </div>

        <div className="card-brutal p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-secondary flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Products</p>
              <p className="font-heading text-xl">
                {data?.activeProducts}/{data?.totalProducts}
              </p>
            </div>
          </div>
        </div>

        <div className="card-brutal p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-secondary flex items-center justify-center">
              <Ticket className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Vouchers Used</p>
              <p className="font-heading text-xl">
                {data?.usedVouchers}/{data?.totalVouchers}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Status Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card-brutal p-6">
          <h2 className="font-heading text-lg uppercase mb-4">Orders by Status</h2>
          <div className="space-y-3">
            {Object.entries(data?.ordersByStatus || {}).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm capitalize">{status.replace(/_/g, " ")}</span>
                <span className="font-heading">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card-brutal p-6">
          <h2 className="font-heading text-lg uppercase mb-4">Top Products</h2>
          {data?.topProducts && data.topProducts.length > 0 ? (
            <div className="space-y-3">
              {data.topProducts.map((product, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm truncate flex-1">{product.name}</span>
                  <span className="font-heading ml-2">{product.count} sold</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No sales data yet</p>
          )}
        </div>
      </div>

      {/* Promotion Stats */}
      <div className="card-brutal p-6">
        <h2 className="font-heading text-lg uppercase mb-4">Promotions & Vouchers</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-secondary">
            <p className="font-heading text-2xl">{data?.activePromotions}</p>
            <p className="text-xs text-muted-foreground">Active Promos</p>
          </div>
          <div className="text-center p-4 bg-secondary">
            <p className="font-heading text-2xl">{data?.totalPromotions}</p>
            <p className="text-xs text-muted-foreground">Total Promos</p>
          </div>
          <div className="text-center p-4 bg-secondary">
            <p className="font-heading text-2xl">{data?.usedVouchers}</p>
            <p className="text-xs text-muted-foreground">Vouchers Used</p>
          </div>
          <div className="text-center p-4 bg-secondary">
            <p className="font-heading text-2xl">{data?.totalVouchers}</p>
            <p className="text-xs text-muted-foreground">Total Vouchers</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
