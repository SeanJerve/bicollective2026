import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, Package, ShoppingCart, BadgeCheck, TrendingUp, AlertTriangle, FileText, Scale, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  totalVendors: number;
  verifiedVendors: number;
  totalProducts: number;
  totalOrders: number;
  pendingReports: number;
  pendingApplications: number;
  pendingDisputes: number;
  revenue: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalVendors: 0,
    verifiedVendors: 0,
    totalProducts: 0,
    totalOrders: 0,
    pendingReports: 0,
    pendingApplications: 0,
    pendingDisputes: 0,
    revenue: 0,
  });
  const [recentVendors, setRecentVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get vendors count
        const { count: totalVendors } = await supabase
          .from("brands")
          .select("*", { count: "exact", head: true });

        const { count: verifiedVendors } = await supabase
          .from("brands")
          .select("*", { count: "exact", head: true })
          .eq("status", "verified");

        // Get products count
        const { count: totalProducts } = await supabase
          .from("products")
          .select("*", { count: "exact", head: true });

        // Get orders count
        const { count: totalOrders } = await supabase
          .from("orders")
          .select("*", { count: "exact", head: true });

        // Get pending reports
        const { count: pendingReports } = await supabase
          .from("reports")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending");

        // Get pending applications
        const { count: pendingApplications } = await supabase
          .from("vendor_applications")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending");

        // Get pending disputes
        const { count: pendingDisputes } = await supabase
          .from("disputes")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending");

        // Get revenue from delivered orders
        const { data: deliveredOrders } = await supabase
          .from("vendor_orders")
          .select("subtotal, shipping_fee")
          .eq("status", "delivered");

        const revenue = (deliveredOrders || []).reduce(
          (sum, o) => sum + Number(o.subtotal) + Number(o.shipping_fee || 0),
          0
        );

        // Get recent vendors
        const { data: vendors } = await supabase
          .from("brands")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5);

        setStats({
          totalVendors: totalVendors || 0,
          verifiedVendors: verifiedVendors || 0,
          totalProducts: totalProducts || 0,
          totalOrders: totalOrders || 0,
          pendingReports: pendingReports || 0,
          pendingApplications: pendingApplications || 0,
          pendingDisputes: pendingDisputes || 0,
          revenue,
        });

        setRecentVendors(vendors || []);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "bg-success text-success-foreground";
      case "approved":
        return "bg-primary text-primary-foreground";
      case "pending":
        return "bg-muted text-muted-foreground";
      case "suspended":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="animate-pulse space-y-6 md:space-y-8">
          <div className="h-8 w-48 skeleton-brutal" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 md:h-32 skeleton-brutal" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="font-heading text-2xl md:text-4xl uppercase">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">Platform overview and management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
        <div className="card-brutal p-4 md:p-6">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-success/20 flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-xs md:text-sm text-muted-foreground">Revenue</p>
              <p className="font-heading text-lg md:text-2xl">₱{stats.revenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="card-brutal p-4 md:p-6">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-secondary flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs md:text-sm text-muted-foreground">Total Vendors</p>
              <p className="font-heading text-xl md:text-2xl">{stats.totalVendors}</p>
            </div>
          </div>
        </div>

        <div className="card-brutal p-4 md:p-6">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-success/20 flex items-center justify-center flex-shrink-0">
              <BadgeCheck className="w-5 h-5 md:w-6 md:h-6 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-xs md:text-sm text-muted-foreground">Verified</p>
              <p className="font-heading text-xl md:text-2xl">{stats.verifiedVendors}</p>
            </div>
          </div>
        </div>

        <div className="card-brutal p-4 md:p-6">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-secondary flex items-center justify-center flex-shrink-0">
              <Package className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs md:text-sm text-muted-foreground">Products</p>
              <p className="font-heading text-xl md:text-2xl">{stats.totalProducts}</p>
            </div>
          </div>
        </div>

        <div className="card-brutal p-4 md:p-6">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-secondary flex items-center justify-center flex-shrink-0">
              <ShoppingCart className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs md:text-sm text-muted-foreground">Total Orders</p>
              <p className="font-heading text-xl md:text-2xl">{stats.totalOrders}</p>
            </div>
          </div>
        </div>

        <div className="card-brutal p-4 md:p-6">
          <div className="flex items-center gap-3 md:gap-4">
            <div className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center flex-shrink-0 ${
              stats.pendingReports > 0 ? "bg-destructive/20" : "bg-secondary"
            }`}>
              <AlertTriangle className={`w-5 h-5 md:w-6 md:h-6 ${
                stats.pendingReports > 0 ? "text-destructive" : ""
              }`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs md:text-sm text-muted-foreground">Reports</p>
              <p className="font-heading text-xl md:text-2xl">{stats.pendingReports}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Vendors */}
      <div className="card-brutal">
        <div className="p-4 md:p-6 border-b-2 border-foreground">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg md:text-xl uppercase">Recent Vendors</h2>
            <Link
              to="/admin/vendors"
              className="text-xs md:text-sm text-muted-foreground hover:text-foreground"
            >
              View All
            </Link>
          </div>
        </div>

        {recentVendors.length > 0 ? (
          <div className="divide-y divide-border-subtle">
            {recentVendors.map((vendor) => (
              <div key={vendor.id} className="p-4 md:p-6 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 md:gap-4 min-w-0">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-muted flex items-center justify-center font-heading text-base md:text-lg flex-shrink-0">
                    {vendor.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-heading uppercase text-sm md:text-base truncate">{vendor.name}</p>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      {new Date(vendor.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2 md:px-3 py-1 text-xs uppercase flex-shrink-0 ${getStatusColor(
                    vendor.status
                  )}`}
                >
                  {vendor.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 md:p-8 text-center text-muted-foreground text-sm md:text-base">
            No vendors yet
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
