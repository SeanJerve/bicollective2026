import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingCart, Store, Star, LogOut, Tag, Menu, X, BarChart3, MessageSquare, ChevronLeft, DollarSign, Zap, Award } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";

const VendorLayout = () => {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { counts, dismiss } = useNotifications();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { href: "/vendor", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/vendor/products", label: "Products", icon: Package, badge: counts.lowStockProducts },
    { href: "/vendor/orders", label: "Orders", icon: ShoppingCart, badge: counts.pendingOrders },
    { href: "/vendor/messages", label: "Messages", icon: MessageSquare, badge: counts.unreadMessages },
    { href: "/vendor/promotions", label: "Promotions", icon: Tag },
    { href: "/vendor/store", label: "Store Settings", icon: Store },
    { href: "/vendor/reviews", label: "Reviews", icon: Star, badge: counts.newReviews },
    { href: "/vendor/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/vendor/finances", label: "Finances", icon: DollarSign },
    { href: "/vendor/marketing", label: "Marketing", icon: Zap },
    { href: "/vendor/premium", label: "Premium Plan", icon: Award },

  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const currentPage = navItems.find((item) =>
    item.exact ? location.pathname === item.href : location.pathname.startsWith(item.href) && item.href !== "/vendor"
  ) || navItems[0];

  return (
    <div className="min-h-screen flex">
      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-foreground text-background flex items-center justify-between px-4 py-3 md:hidden">
        <div className="min-w-0">
          <Link to="/" className="font-heading text-lg tracking-tight">
            BICOLLECTIVE
          </Link>
          <p className="text-xs opacity-60 truncate">{currentPage.label}</p>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1">
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — slides in from the RIGHT on mobile */}
      <aside
        className={`fixed md:sticky top-0 right-0 md:left-0 z-50 md:z-auto h-screen w-64 bg-foreground text-background border-l-2 md:border-l-0 md:border-r-2 border-foreground flex flex-col transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-6 border-b border-background/20">
          <Link to="/" className="font-heading text-xl tracking-tight">
            BICOLLECTIVE
          </Link>
          <p className="text-sm opacity-60 mt-1">Vendor Portal</p>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="mb-4 px-4">
            <Link to="/" className="text-[10px] font-heading uppercase flex items-center gap-1.5 text-background/60 hover:text-background transition-colors">
              <ChevronLeft className="w-3 h-3" />
              Back to Marketplace
            </Link>
          </div>
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  to={item.href}
                  onClick={() => {
                    setSidebarOpen(false);
                    if (item.label === "Products") dismiss("lowStockProducts");
                    if (item.label === "Orders") dismiss("pendingOrders");
                    if (item.label === "Messages") dismiss("unreadMessages");
                    if (item.label === "Reviews") dismiss("newReviews");

                  }}
                  className={`flex items-center gap-3 px-4 py-3 font-heading text-sm uppercase tracking-wide transition-colors ${
                    isActive(item.href, item.exact)
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
            <p className="text-sm opacity-60">Signed in as</p>
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
      <main className="flex-1 bg-background overflow-auto pt-14 md:pt-0">
        <Outlet />
      </main>
    </div>
  );
};

export default VendorLayout;
