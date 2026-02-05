import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, ShoppingCart, DollarSign, Star, TrendingUp, AlertCircle, Ticket, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  pendingOrders: number;
  totalRevenue: number;
  averageRating: number;
  deliveredOrders: number;
  totalPromos: number;
  activePromos: number;
  totalReviews: number;
  lowStockProducts: number;
}

const VendorDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    activeProducts: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    averageRating: 0,
    deliveredOrders: 0,
    totalPromos: 0,
    activePromos: 0,
    totalReviews: 0,
    lowStockProducts: 0,
  });
  const [brand, setBrand] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        // Get brand
        const { data: brandData } = await supabase
          .from("brands")
          .select("*")
          .eq("owner_id", user.id)
          .single();

        if (!brandData) {
          setLoading(false);
          return;
        }

        setBrand(brandData);

        // Get products count
        const { count: totalProducts } = await supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("brand_id", brandData.id);

        const { count: activeProducts } = await supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("brand_id", brandData.id)
          .eq("is_active", true);

        // Get vendor orders
        const { data: ordersData } = await supabase
          .from("vendor_orders")
          .select(`
            *,
            order:orders (
              shipping_name,
              created_at
            )
          `)
          .eq("brand_id", brandData.id)
          .order("created_at", { ascending: false })
          .limit(5);

        const pendingOrders = ordersData?.filter(
          (o) => o.status === "pending_payment" || o.status === "payment_uploaded"
        ).length || 0;

        let totalRevenue = 0;
        let deliveredOrders = 0;
        ordersData?.forEach((o) => {
          if (o.status === "delivered") {
            totalRevenue += Number(o.subtotal) + Number(o.shipping_fee || 0);
            deliveredOrders++;
          }
        });

        // Get promotions count
        const { count: totalPromos } = await supabase
          .from("promotions")
          .select("*", { count: "exact", head: true })
          .eq("brand_id", brandData.id);

        const { count: activePromos } = await supabase
          .from("promotions")
          .select("*", { count: "exact", head: true })
          .eq("brand_id", brandData.id)
          .eq("is_active", true);

        // Get reviews count
        const { count: totalReviews } = await supabase
          .from("reviews")
          .select("*", { count: "exact", head: true })
          .eq("brand_id", brandData.id);

        // Get low stock products
        const { count: lowStockProducts } = await supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("brand_id", brandData.id)
          .lt("stock_quantity", 5);

        setStats({
          totalProducts: totalProducts || 0,
          activeProducts: activeProducts || 0,
          pendingOrders,
          totalRevenue,
          averageRating: brandData.rating || 0,
          deliveredOrders,
          totalPromos: totalPromos || 0,
          activePromos: activePromos || 0,
          totalReviews: totalReviews || 0,
          lowStockProducts: lowStockProducts || 0,
        });

        setRecentOrders(ordersData || []);
      } catch (error) {
        console.error("Error fetching dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending_payment":
        return "bg-muted text-muted-foreground";
      case "payment_uploaded":
        return "bg-secondary text-secondary-foreground";
      case "paid":
        return "bg-success text-success-foreground";
      case "shipped":
        return "bg-primary text-primary-foreground";
      case "delivered":
        return "bg-success text-success-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
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

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="font-heading text-2xl md:text-4xl uppercase">Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">Welcome back, {brand.name}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
        <div className="card-brutal p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-secondary flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Products</p>
              <p className="font-heading text-2xl">{stats.totalProducts}</p>
            </div>
          </div>
        </div>

        <div className="card-brutal p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-secondary flex items-center justify-center">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Orders</p>
              <p className="font-heading text-2xl">{stats.pendingOrders}</p>
            </div>
          </div>
        </div>

        <div className="card-brutal p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-secondary flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="font-heading text-2xl">{formatPrice(stats.totalRevenue)}</p>
            </div>
          </div>
        </div>

        <div className="card-brutal p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-secondary flex items-center justify-center">
              <Star className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Average Rating</p>
              <p className="font-heading text-2xl">{stats.averageRating.toFixed(1)}</p>
            </div>
          </div>
        </div>
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
              <p className="font-heading text-xl md:text-2xl">{stats.deliveredOrders}</p>
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
              <p className="font-heading text-xl md:text-2xl">{stats.activePromos}/{stats.totalPromos}</p>
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
              <p className="font-heading text-xl md:text-2xl">{stats.totalReviews}</p>
            </div>
          </div>
        </div>

        <div className="card-brutal p-4 md:p-6">
          <div className="flex items-center gap-3 md:gap-4">
            <div className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center flex-shrink-0 ${stats.lowStockProducts > 0 ? "bg-destructive/20" : "bg-secondary"}`}>
              <Package className={`w-5 h-5 md:w-6 md:h-6 ${stats.lowStockProducts > 0 ? "text-destructive" : ""}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs md:text-sm text-muted-foreground">Low Stock</p>
              <p className="font-heading text-xl md:text-2xl">{stats.lowStockProducts}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card-brutal">
        <div className="p-6 border-b-2 border-foreground">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl uppercase">Recent Orders</h2>
            <Link
              to="/vendor/orders"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              View All
            </Link>
          </div>
        </div>

        {recentOrders.length > 0 ? (
          <div className="divide-y divide-border-subtle">
            {recentOrders.map((order) => (
              <div key={order.id} className="p-6 flex items-center justify-between">
                <div>
                  <p className="font-heading uppercase">
                    {order.order?.shipping_name || "Customer"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-heading">{formatPrice(Number(order.subtotal))}</p>
                  <span
                    className={`inline-block px-2 py-1 text-xs uppercase ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {order.status.replace("_", " ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            No orders yet
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorDashboard;
