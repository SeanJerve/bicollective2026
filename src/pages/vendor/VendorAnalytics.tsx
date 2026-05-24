import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  TrendingUp,
  Package,
  ShoppingCart,
  DollarSign,
  Star,
  Loader2,
  Download,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { calcVendorPlatformFees } from "@/lib/platformFees";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

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
  const { toast } = useToast();
  const [brand, setBrand] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [revenueByMonth, setRevenueByMonth] = useState<any[]>([]);
  const [ordersByStatus, setOrdersByStatus] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [stats, setStats] = useState({ revenue: 0, orders: 0, avgOrder: 0, rating: 0, totalFees: 0, netIncome: 0 });

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

      if (!brandData) {
        setLoading(false);
        return;
      }
      setBrand(brandData);

      // Fetch all vendor orders
      const { data: orders } = await supabase
        .from("vendor_orders")
        .select("*, order:orders(created_at)")
        .eq("brand_id", brandData.id);

      // Revenue by month
      const monthlyRevenue: Record<string, number> = {};
      let totalRevenue = 0;
      let totalFees = 0;
      let deliveredCount = 0;

      orders?.forEach((o) => {
        if (o.status === "delivered") {
          const date = new Date(o.order?.created_at || o.created_at);
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          monthlyRevenue[key] = (monthlyRevenue[key] || 0) + Number(o.subtotal);
          const subtotal = Number(o.subtotal);
          totalRevenue += subtotal;
          totalFees += calcVendorPlatformFees(
            subtotal,
            brandData.commission_rate,
            o.platform_shipping_margin
          );
          deliveredCount++;
        }
      });

      const sortedMonths = Object.entries(monthlyRevenue)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([month, revenue]) => ({
          month: new Date(month + "-02").toLocaleDateString("en-US", { month: "short" }),
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
        rating: (brandData as any).rating || 0,
        totalFees,
        netIncome: totalRevenue - totalFees,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  // Detailed product performance query
  const { data: productPerformance, isLoading: perfLoading } = useQuery({
    queryKey: ["vendor-products-performance", brand?.id],
    queryFn: async () => {
      if (!brand) return [];
      const { data: products, error } = await supabase
        .from("products")
        .select(`
          id, 
          name, 
          price, 
          product_variants(stock_quantity)
        `)
        .eq("brand_id", brand.id);
      if (error) throw error;
      
      const { data: items } = await supabase
        .from("order_items")
        .select("product_name, quantity");
        
      const salesMap: Record<string, number> = {};
      items?.forEach((item) => {
        salesMap[item.product_name] = (salesMap[item.product_name] || 0) + item.quantity;
      });

      return (products || []).map((p: any) => {
        const sold = salesMap[p.name] || 0;
        const revenue = sold * Number(p.price || 0);
        const stock = p.product_variants ? p.product_variants.reduce((sum: number, v: any) => sum + (v.stock_quantity || 0), 0) : 0;
        return {
          id: p.id,
          name: p.name,
          price: p.price,
          sold,
          revenue,
          stock
        };
      });
    },
    enabled: !!brand?.id,
  });

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount);

  const handleExportCSV = () => {
    if (!brand || !stats) return;
    const csvRows = [
      ["Metric", "Value"],
      ["Store Name", brand.name],
      ["Total Store Revenue", stats.revenue],
      ["Total Store Orders", stats.orders],
      ["Average Order Value", stats.avgOrder],
      ["Store Rating", stats.rating],
    ];
    
    if (productPerformance) {
      csvRows.push([]);
      csvRows.push(["Product Performance Details"]);
      csvRows.push(["Product Name", "Price", "Items Sold", "Revenue Generated", "Stock Remaining"]);
      productPerformance.forEach((p: any) => {
        csvRows.push([p.name, p.price, p.sold, p.revenue, p.stock]);
      });
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + csvRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${brand.name.toLowerCase().replace(/ /g, "_")}_performance_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Report Exported", description: "CSV report downloaded successfully." });
  };

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
    <div className="p-4 md:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-4xl uppercase">Analytics</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Performance insights and analytics logs for {brand.name}
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="btn-brutal text-sm self-start flex items-center gap-2"
        >
          <Download className="w-4 h-4" /> Export Store CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-brutal p-6 bg-background">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-success/20 flex items-center justify-center border-2 border-foreground flex-shrink-0">
              <DollarSign className="w-5 h-5 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground uppercase font-heading">Store Revenue</p>
              <p className="font-heading text-lg md:text-xl mt-0.5">{formatPrice(stats.revenue)}</p>
            </div>
          </div>
        </div>
        <div className="card-brutal p-6 bg-background">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary flex items-center justify-center border-2 border-foreground flex-shrink-0">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground uppercase font-heading">Total Orders</p>
              <p className="font-heading text-lg md:text-xl mt-0.5">{stats.orders}</p>
            </div>
          </div>
        </div>
        <div className="card-brutal p-6 bg-background">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary flex items-center justify-center border-2 border-foreground flex-shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground uppercase font-heading">Avg Order Value</p>
              <p className="font-heading text-lg md:text-xl mt-0.5">{formatPrice(stats.avgOrder)}</p>
            </div>
          </div>
        </div>
        <div className="card-brutal p-6 bg-background">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary flex items-center justify-center border-2 border-foreground flex-shrink-0">
              <Star className="w-5 h-5 text-warning fill-warning" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground uppercase font-heading">Store Rating</p>
              <p className="font-heading text-lg md:text-xl mt-0.5">{stats.rating.toFixed(1)} / 5.0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Income Breakdown */}
      <div className="card-brutal p-6 bg-background">
        <h2 className="font-heading text-lg uppercase mb-4 border-b-2 border-foreground pb-2 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-success" /> Income Breakdown
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="border-2 border-foreground p-4 bg-blue-50/30">
            <p className="text-[10px] text-muted-foreground uppercase font-heading">Gross Revenue</p>
            <p className="text-xs text-muted-foreground">Total sales from delivered orders</p>
            <p className="font-heading text-2xl mt-2">{formatPrice(stats.revenue)}</p>
          </div>
          <div className="border-2 border-foreground p-4 bg-red-50/30">
            <p className="text-[10px] text-muted-foreground uppercase font-heading">Platform Fees</p>
            <p className="text-xs text-muted-foreground">At your current rate + shipping margins</p>
            <p className="font-heading text-2xl mt-2 text-destructive">-{formatPrice(stats.totalFees)}</p>
          </div>
          <div className="border-2 border-foreground p-4 bg-green-50/30">
            <p className="text-[10px] text-muted-foreground uppercase font-heading">Net Income</p>
            <p className="text-xs text-muted-foreground">Your actual take-home profit</p>
            <p className="font-heading text-2xl mt-2 text-green-600">{formatPrice(stats.netIncome)}</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Bar Chart */}
        <div className="card-brutal p-6 bg-background">
          <h2 className="font-heading text-lg uppercase mb-4 border-b-2 border-foreground pb-2 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-success" /> Revenue Timeline
          </h2>
          {revenueByMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border-subtle))" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))", fontFamily: "monospace" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))", fontFamily: "monospace" }}
                  tickFormatter={(v) => `₱${v}`}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--background))",
                    border: "2px solid hsl(var(--foreground))",
                    boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
                    fontFamily: "monospace",
                    fontSize: "12px",
                    borderRadius: "0px"
                  }}
                  formatter={(v: number) => [formatPrice(v), "Revenue"]}
                />
                <Bar dataKey="revenue" fill="#3b82f6" stroke="#000" strokeWidth={2} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-16 italic">No monthly revenue logs.</p>
          )}
        </div>

        {/* Orders by status distribution */}
        <div className="card-brutal p-6 bg-background">
          <h2 className="font-heading text-lg uppercase mb-4 border-b-2 border-foreground pb-2 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" /> Fulfillment Split
          </h2>
          {ordersByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={ordersByStatus}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  stroke="#000"
                  strokeWidth={2}
                >
                  {ordersByStatus.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--background))",
                    border: "2px solid hsl(var(--foreground))",
                    boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
                    fontFamily: "monospace",
                    fontSize: "12px",
                    borderRadius: "0px"
                  }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: "10px", fontFamily: "monospace", textTransform: "uppercase" }}
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-16 italic">No order status records.</p>
          )}
        </div>
      </div>

      {/* Top Products Horizontal Chart */}
      <div className="card-brutal p-6 bg-background">
        <h2 className="font-heading text-lg uppercase mb-4 border-b-2 border-foreground pb-2">Sales volume by Product</h2>
        {topProducts.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border-subtle))" />
              <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))", fontFamily: "monospace" }} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))", fontFamily: "monospace" }}
                width={130}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--background))",
                  border: "2px solid hsl(var(--foreground))",
                  boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
                  fontFamily: "monospace",
                  fontSize: "12px",
                  borderRadius: "0px"
                }}
              />
              <Bar dataKey="sold" fill="#22c55e" stroke="#000" strokeWidth={2} radius={[0, 2, 2, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-muted-foreground text-sm text-center py-16 italic">No sales logs found.</p>
        )}
      </div>

      {/* Inventory & Sales Performance Ledger */}
      <div className="card-brutal overflow-hidden bg-background">
        <div className="p-6 border-b-2 border-foreground bg-muted/30">
          <h2 className="font-heading text-xl uppercase">Store Inventory & Performance</h2>
          <p className="text-xs text-muted-foreground">Product listings performance ledger showing sales and stock status.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-xs font-heading uppercase">
              <tr className="border-b border-foreground">
                <th className="p-4">Listed Product</th>
                <th className="p-4 text-right">Selling Price</th>
                <th className="p-4 text-right">Items Sold</th>
                <th className="p-4 text-right">Gross Revenue</th>
                <th className="p-4 text-right">Available Stock</th>
                <th className="p-4">Fulfillment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {productPerformance?.map((p) => (
                <tr key={p.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="p-4 font-heading text-xs uppercase">{p.name}</td>
                  <td className="p-4 text-right font-mono text-xs">{formatPrice(Number(p.price))}</td>
                  <td className="p-4 text-right font-mono text-xs">{p.sold}</td>
                  <td className="p-4 text-right font-heading text-xs text-success">{formatPrice(p.revenue)}</td>
                  <td className="p-4 text-right font-mono text-xs">
                    <span className={p.stock < 5 ? "text-destructive font-bold" : ""}>
                      {p.stock} units
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 text-[9px] uppercase font-heading ${
                      p.stock === 0 
                        ? "bg-destructive text-destructive-foreground"
                        : p.stock < 5
                          ? "bg-warning text-warning-foreground"
                          : "bg-success text-success-foreground"
                    }`}>
                      {p.stock === 0 ? "Out of Stock" : p.stock < 5 ? "Low Stock" : "In Stock"}
                    </span>
                  </td>
                </tr>
              ))}
              {(!productPerformance || productPerformance.length === 0) && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground italic">
                    No products listed.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VendorAnalytics;
