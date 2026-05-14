import { Link } from "react-router-dom";
import {
  Users,
  Package,
  ShoppingCart,
  BadgeCheck,
  AlertTriangle,
  FileText,
  Scale,
  DollarSign,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const AdminDashboard = () => {
  const { data: stats } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      const [
        totalVendors,
        verifiedVendors,
        totalProducts,
        totalOrders,
        pendingReports,
        pendingApplications,
        deliveredOrders,
      ] = await Promise.all([
        supabase.from("brands").select("*", { count: "exact", head: true }),
        supabase
          .from("brands")
          .select("*", { count: "exact", head: true })
          .eq("status", "verified"),
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("*", { count: "exact", head: true }),
        supabase
          .from("reports")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("vendor_applications")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase.from("vendor_orders").select("subtotal, shipping_fee").eq("status", "delivered"),
      ]);

      const revenue = (deliveredOrders.data || []).reduce(
        (sum, o) => sum + Number(o.subtotal) + Number(o.shipping_fee || 0),
        0
      );

      return {
        totalVendors: totalVendors.count || 0,
        verifiedVendors: verifiedVendors.count || 0,
        totalProducts: totalProducts.count || 0,
        totalOrders: totalOrders.count || 0,
        pendingReports: pendingReports.count || 0,
        pendingApplications: pendingApplications.count || 0,
        revenue,
      };
    },
  });

  const { data: recentVendors } = useQuery({
    queryKey: ["admin-recent-vendors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
  });

  const s = stats || {
    totalVendors: 0,
    verifiedVendors: 0,
    totalProducts: 0,
    totalOrders: 0,
    pendingReports: 0,
    pendingApplications: 0,
    revenue: 0,
  };

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

  if (!stats) {
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
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Platform overview and management
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
        {[
          {
            icon: DollarSign,
            label: "Revenue",
            value: `₱${s.revenue.toLocaleString()}`,
            accent: "bg-success/20",
            iconClass: "text-success",
          },
          { icon: Users, label: "Total Vendors", value: s.totalVendors },
          {
            icon: BadgeCheck,
            label: "Verified",
            value: s.verifiedVendors,
            accent: "bg-success/20",
            iconClass: "text-success",
          },
          { icon: Package, label: "Products", value: s.totalProducts },
          { icon: ShoppingCart, label: "Total Orders", value: s.totalOrders },
          {
            icon: AlertTriangle,
            label: "Reports",
            value: s.pendingReports,
            highlight: s.pendingReports > 0,
          },
          {
            icon: FileText,
            label: "Applications",
            value: s.pendingApplications,
            highlight: s.pendingApplications > 0,
          },
        ].map((item) => (
          <div key={item.label} className="card-brutal p-4 md:p-6">
            <div className="flex items-center gap-3 md:gap-4">
              <div
                className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center flex-shrink-0 ${
                  item.highlight ? "bg-destructive/20" : item.accent || "bg-secondary"
                }`}
              >
                <item.icon
                  className={`w-5 h-5 md:w-6 md:h-6 ${
                    item.highlight ? "text-destructive" : item.iconClass || ""
                  }`}
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs md:text-sm text-muted-foreground">{item.label}</p>
                <p className="font-heading text-lg md:text-2xl">{item.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 md:mb-8">
        {[
          { label: "Applications", to: "/admin/applications", count: s.pendingApplications },
          { label: "Reports", to: "/admin/reports", count: s.pendingReports },
          { label: "Analytics", to: "/admin/analytics", count: null },
        ].map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="card-brutal p-4 text-center hover:bg-secondary transition-colors"
          >
            <span className="font-heading text-sm uppercase">{link.label}</span>
            {link.count !== null && link.count > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-destructive text-destructive-foreground">
                {link.count}
              </span>
            )}
          </Link>
        ))}
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
        {(recentVendors || []).length > 0 ? (
          <div className="divide-y divide-border-subtle">
            {(recentVendors || []).map((vendor: any) => (
              <div key={vendor.id} className="p-4 md:p-6 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 md:gap-4 min-w-0">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-muted flex items-center justify-center font-heading text-base md:text-lg flex-shrink-0">
                    {vendor.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-heading uppercase text-sm md:text-base truncate">
                      {vendor.name}
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      {new Date(vendor.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2 md:px-3 py-1 text-xs uppercase flex-shrink-0 ${getStatusColor(vendor.status)}`}
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
