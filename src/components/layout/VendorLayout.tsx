import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingCart, Store, Star, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const VendorLayout = () => {
  const location = useLocation();
  const { signOut, user } = useAuth();

  const navItems = [
    { href: "/vendor", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/vendor/products", label: "Products", icon: Package },
    { href: "/vendor/orders", label: "Orders", icon: ShoppingCart },
    { href: "/vendor/store", label: "Store Settings", icon: Store },
    { href: "/vendor/reviews", label: "Reviews", icon: Star },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-foreground text-background border-r-2 border-foreground flex flex-col">
        <div className="p-6 border-b border-background/20">
          <Link to="/" className="font-heading text-xl tracking-tight">
            BICOLLECTIVE
          </Link>
          <p className="text-sm opacity-60 mt-1">Vendor Portal</p>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 font-heading text-sm uppercase tracking-wide transition-colors ${
                    isActive(item.href, item.exact)
                      ? "bg-background text-foreground"
                      : "hover:bg-background/10"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
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
      <main className="flex-1 bg-background overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default VendorLayout;
