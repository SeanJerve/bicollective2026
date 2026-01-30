import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, ShoppingCart, DollarSign, Star, TrendingUp, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  pendingOrders: number;
  totalRevenue: number;
  averageRating: number;
}

const VendorDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    activeProducts: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    averageRating: 0,
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

        const totalRevenue = ordersData?.reduce(
          (sum, o) => sum + (o.status === "delivered" ? Number(o.subtotal) : 0),
          0
        ) || 0;

        setStats({
          totalProducts: totalProducts || 0,
          activeProducts: activeProducts || 0,
          pendingOrders,
          totalRevenue,
          averageRating: brandData.rating || 0,
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
