import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, Package, ShoppingCart, Flag, BadgeCheck, LogOut, Tag, Ticket, Gift, BarChart3, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationBadge from "@/components/ui/notification-badge";

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { counts } = useNotifications();

  // Items that are "coming soon" for admin
  const comingSoonItems = ["/admin/analytics"];

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/admin/applications", label: "Applications", icon: Users, badge: counts.pendingApplications },
    { href: "/admin/verifications", label: "Verifications", icon: BadgeCheck, badge: counts.pendingVerifications },
    { href: "/admin/vendors", label: "Vendors", icon: Users },
    { href: "/admin/products", label: "Products", icon: Package },
    { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
    { href: "/admin/promotions", label: "Promotions", icon: Tag },
    { href: "/admin/vouchers", label: "Vouchers", icon: Ticket },
    { href: "/admin/lucky-promo", label: "Lucky Promo", icon: Gift },
    { href: "/admin/reports", label: "Reports", icon: Flag, badge: counts.pendingReports },
    { href: "/admin/disputes", label: "Disputes", icon: AlertTriangle, badge: counts.pendingDisputes },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3, comingSoon: true },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const handleNavClick = (e: React.MouseEvent, item: typeof navItems[0]) => {
    if (item.comingSoon) {
      e.preventDefault();
      navigate("/coming-soon");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-foreground text-background border-r-2 border-foreground flex flex-col">
        <div className="p-6 border-b border-background/20">
          <Link to="/" className="font-heading text-xl tracking-tight">
            BICOLLECTIVE
          </Link>
          <p className="text-sm opacity-60 mt-1">Admin Panel</p>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  to={item.comingSoon ? "#" : item.href}
                  onClick={(e) => handleNavClick(e, item)}
                  className={`flex items-center gap-3 px-4 py-3 font-heading text-sm uppercase tracking-wide transition-colors relative ${
                    item.comingSoon
                      ? "opacity-40 cursor-not-allowed"
                      : isActive(item.href, item.exact)
                      ? "bg-background text-foreground"
                      : "hover:bg-background/10"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                  {(item.badge ?? 0) > 0 && (
                    <span className="ml-auto min-w-[20px] h-[20px] bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-background/20">
          <div className="px-4 py-2 mb-4">
            <p className="text-sm opacity-60">Admin</p>
            <p className="text-sm truncate">{user?.email}</p>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-4 py-3 w-full font-heading text-sm uppercase tracking-wide hover:bg-background/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-background overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
