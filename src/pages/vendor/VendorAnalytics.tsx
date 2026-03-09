import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, TrendingUp, Package, ShoppingCart, DollarSign, Star, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

const CHART_COLORS = [
  "#3b82f6", // blue
  "#22c55e", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#f97316", // orange
  "#ec4899", // pink
];

const VendorAnalytics = () => {
  const { user } = useAuth();
  const [brand, setBrand] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [revenueByMonth, setRevenueByMonth] = useState<any[]>([]);
  const [ordersByStatus, setOrdersByStatus] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [stats, setStats] = useState({ revenue: 0, orders: 0, avgOrder: 0, rating: 0 });

  useEffect(() => {
    if (!user) return;
    fetchAnalytics();
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      const { data: brandData } = await supabase
        .from("brands")
        .select("*")
        .eq("owner_id", user!.id)
        .single();

      if (!brandData) { setLoading(false); return; }
      setBrand(brandData);

      // Fetch all vendor orders
      const { data: orders } = await supabase
        .from("vendor_orders")
        .select("*, order:orders(created_at)")
        .eq("brand_id", brandData.id);

      // Revenue by month
      const monthlyRevenue: Record<string, number> = {};
      let totalRevenue = 0;
      let deliveredCount = 0;

      orders?.forEach((o) => {
        if (o.status === "delivered") {
          const date = new Date(o.order?.created_at || o.created_at);
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          monthlyRevenue[key] = (monthlyRevenue[key] || 0) + Number(o.subtotal);
          totalRevenue += Number(o.subtotal);
          deliveredCount++;
        }
      });

      const sortedMonths = Object.entries(monthlyRevenue)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([month, revenue]) => ({
          month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short" }),
          revenue,
        }));

      // Orders by status
      const statusCounts: Record<string, number> = {};
      orders?.forEach((o) => {
        const label = o.status.replace(/_/g, " ");
        statusCounts[label] = (statusCounts[label] || 0) + 1;
      });
      const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

      // Top products
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("product_name, quantity, vendor_order_id");

      const orderIdSet = new Set(orders?.map((o) => o.id));
      const productSales: Record<string, number> = {};
      orderItems?.forEach((item) => {
        if (orderIdSet.has(item.vendor_order_id)) {
          productSales[item.product_name] = (productSales[item.product_name] || 0) + item.quantity;
        }
      });
      const topProds = Object.entries(productSales)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, sold]) => ({ name, sold }));

      setRevenueByMonth(sortedMonths);
      setOrdersByStatus(statusData);
      setTopProducts(topProds);
      setStats({
        revenue: totalRevenue,
        orders: orders?.length || 0,
        avgOrder: deliveredCount > 0 ? totalRevenue / deliveredCount : 0,
        rating: brandData.rating || 0,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount);

  if (loading) {
    return (
      <div className="p-4 md:p-8 flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="p-4 md:p-8">
        <div className="card-brutal p-12 text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No store found. Set up your store first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="font-heading text-2xl md:text-4xl uppercase mb-1">Analytics</h1>
      <p className="text-muted-foreground mb-6 text-sm md:text-base">Performance insights for {brand.name}</p>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
        <div className="card-brutal p-4 md:p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-success/20 flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-5 h-5 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-xs md:text-sm text-muted-foreground">Revenue</p>
              <p className="font-heading text-lg md:text-xl">{formatPrice(stats.revenue)}</p>
            </div>
          </div>
        </div>
        <div className="card-brutal p-4 md:p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary flex items-center justify-center flex-shrink-0">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs md:text-sm text-muted-foreground">Total Orders</p>
              <p className="font-heading text-lg md:text-xl">{stats.orders}</p>
            </div>
          </div>
        </div>
        <div className="card-brutal p-4 md:p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs md:text-sm text-muted-foreground">Avg Order</p>
              <p className="font-heading text-lg md:text-xl">{formatPrice(stats.avgOrder)}</p>
            </div>
          </div>
        </div>
        <div className="card-brutal p-4 md:p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary flex items-center justify-center flex-shrink-0">
              <Star className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs md:text-sm text-muted-foreground">Rating</p>
              <p className="font-heading text-lg md:text-xl">{stats.rating.toFixed(1)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue Chart */}
        <div className="card-brutal p-4 md:p-6">
          <h2 className="font-heading text-lg uppercase mb-4">Monthly Revenue</h2>
          {revenueByMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border-subtle))" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `₱${v}`} />
                <Tooltip formatter={(v: number) => formatPrice(v)} />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-12">No revenue data yet</p>
          )}
        </div>

        {/* Orders by Status */}
        <div className="card-brutal p-4 md:p-6">
          <h2 className="font-heading text-lg uppercase mb-4">Orders by Status</h2>
          {ordersByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={ordersByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                  {ordersByStatus.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-12">No order data yet</p>
          )}
        </div>
      </div>

      {/* Top Products */}
      <div className="card-brutal p-4 md:p-6">
        <h2 className="font-heading text-lg uppercase mb-4">Top Products by Sales</h2>
        {topProducts.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border-subtle))" />
              <XAxis type="number" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={150} />
              <Tooltip />
              <Bar dataKey="sold" fill="#22c55e" radius={[0, 2, 2, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-muted-foreground text-sm text-center py-12">No sales data yet</p>
        )}
      </div>
    </div>
  );
};

export default VendorAnalytics;
