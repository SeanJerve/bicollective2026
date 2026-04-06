import { Link } from "react-router-dom";
import { Package, ShoppingCart, DollarSign, Star, TrendingUp, AlertCircle, Ticket, BarChart3, ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import LowStockAlert from "@/components/vendor/LowStockAlert";

const VendorDashboard = () => {
  const { user } = useAuth();

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
    queryKey: ["vendor-dashboard-stats", brand?.id],
    queryFn: async () => {
      const brandId = brand!.id;

      const [totalProducts, activeProducts, ordersData, promoStats, totalReviews, lowStockData] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }).eq("brand_id", brandId),
        supabase.from("products").select("*", { count: "exact", head: true }).eq("brand_id", brandId).eq("is_active", true),
        supabase.from("vendor_orders").select("status, subtotal, shipping_fee").eq("brand_id", brandId),
        supabase.from("vendor_vouchers").select("discount_id, discounts:discounts(is_active)").eq("brand_id", brandId) as any,
        supabase.from("reviews").select("rating").eq("brand_id", brandId),
        supabase.from("product_variants").select("stock_quantity, product:products!inner(brand_id)").eq("product.brand_id", brandId).lt("stock_quantity", 5) as any,
      ]);

      const orders = ordersData.data || [];
      const pendingOrders = orders.filter((o) => o.status === "pending_payment" || o.status === "payment_uploaded").length;
      let totalRevenue = 0;
      let deliveredOrders = 0;
      orders.forEach((o) => {
        if (o.status === "delivered") {
          totalRevenue += Number(o.subtotal) + Number(o.shipping_fee || 0);
          deliveredOrders++;
        }
      });

      const reviews = totalReviews.data || [];
      const averageRating = reviews.length > 0
        ? reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length
        : 0;

      const promos = promoStats.data || [];
      const totalPromos = promos.length;
      const activePromos = promos.filter((p: any) => p.discounts?.is_active).length;

      return {
        totalProducts: totalProducts.count || 0,
        activeProducts: activeProducts.count || 0,
        pendingOrders,
        totalRevenue,
        averageRating,
        deliveredOrders,
        totalPromos,
        activePromos,
        totalReviews: reviews.length,
        lowStockProducts: lowStockData.data?.length || 0,
      };
    },
    enabled: !!brand,
  });

  const { data: recentOrders } = useQuery({
    queryKey: ["vendor-recent-orders", brand?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_orders")
        .select("*, order:orders(address:addresses(*), created_at)")
        .eq("brand_id", brand!.id)
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
      case "pending_payment": return "bg-muted text-muted-foreground";
      case "payment_uploaded": return "bg-secondary text-secondary-foreground";
      case "paid": case "delivered": return "bg-success text-success-foreground";
      case "shipped": return "bg-primary text-primary-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (brandLoading) {
    return (
      <div className="p-4 md:p-8">
        <div className="animate-pulse space-y-6 md:space-y-8">
          <div className="h-8 w-48 skeleton-brutal" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 md:h-32 skeleton-brutal" />)}
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
          <p className="text-muted-foreground mb-6 text-sm md:text-base">You haven't set up your vendor store yet.</p>
          <Link to="/vendor/store" className="btn-brutal">Set Up Store</Link>
        </div>
      </div>
    );
  }

  const s = stats || { totalProducts: 0, activeProducts: 0, pendingOrders: 0, totalRevenue: 0, averageRating: 0, deliveredOrders: 0, totalPromos: 0, activePromos: 0, totalReviews: 0, lowStockProducts: 0 };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl md:text-4xl uppercase">Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">Welcome back, {brand.name}</p>
      </div>

      <LowStockAlert brandId={brand.id} />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
        {[
          { icon: Package, label: "Total Products", value: s.totalProducts },
          { icon: ShoppingCart, label: "Pending Orders", value: s.pendingOrders },
          { icon: DollarSign, label: "Total Revenue", value: formatPrice(s.totalRevenue) },
          { icon: Star, label: "Average Rating", value: s.averageRating.toFixed(1) },
        ].map((item) => (
          <div key={item.label} className="card-brutal p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-secondary flex items-center justify-center">
                <item.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="font-heading text-2xl">{item.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
        <div className="card-brutal p-4 md:p-6">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-success/20 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-xs md:text-sm text-muted-foreground">Delivered</p>
              <p className="font-heading text-xl md:text-2xl">{s.deliveredOrders}</p>
            </div>
          </div>
        </div>
        <div className="card-brutal p-4 md:p-6">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-secondary flex items-center justify-center flex-shrink-0">
              <Ticket className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs md:text-sm text-muted-foreground">Active Promos</p>
              <p className="font-heading text-xl md:text-2xl">{s.activePromos}/{s.totalPromos}</p>
            </div>
          </div>
        </div>
        <div className="card-brutal p-4 md:p-6">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-secondary flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs md:text-sm text-muted-foreground">Reviews</p>
              <p className="font-heading text-xl md:text-2xl">{s.totalReviews}</p>
            </div>
          </div>
        </div>
        <div className="card-brutal p-4 md:p-6">
          <div className="flex items-center gap-3 md:gap-4">
            <div className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center flex-shrink-0 ${s.lowStockProducts > 0 ? "bg-destructive/20" : "bg-secondary"}`}>
              <Package className={`w-5 h-5 md:w-6 md:h-6 ${s.lowStockProducts > 0 ? "text-destructive" : ""}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs md:text-sm text-muted-foreground">Low Stock</p>
              <p className="font-heading text-xl md:text-2xl">{s.lowStockProducts}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card-brutal">
        <div className="p-6 border-b-2 border-foreground">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl uppercase">Recent Orders</h2>
            <Link to="/vendor/orders" className="text-sm text-muted-foreground hover:text-foreground">View All</Link>
          </div>
        </div>
        {(recentOrders || []).length > 0 ? (
          <div className="divide-y divide-border-subtle">
            {(recentOrders || []).map((order: any) => (
              <div key={order.id} className="p-6 flex items-center justify-between">
                <div>
                  <p className="font-heading uppercase">{order.order?.address?.full_name || "Customer"}</p>
                  <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-heading">{formatPrice(Number(order.subtotal))}</p>
                  <span className={`inline-block px-2 py-1 text-xs uppercase ${getStatusColor(order.status)}`}>
                    {order.status.replace("_", " ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">No orders yet</div>
        )}
      </div>
    </div>
  );
};

export default VendorDashboard;
