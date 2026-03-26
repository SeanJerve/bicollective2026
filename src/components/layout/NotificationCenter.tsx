import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bell, ShoppingCart, Star, Shield, FileText, AlertTriangle, Scale, Package, MessageSquare } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/contexts/AuthContext";

const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { counts, dismiss, totalAdmin, totalVendor, totalCustomer } = useNotifications();
  const { isAdmin, isVendor } = useAuth();
  const ref = useRef<HTMLDivElement>(null);

  const total = (isAdmin ? totalAdmin : isVendor ? totalVendor + totalCustomer : totalCustomer) + counts.unreadMessages;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const adminItems = [
    { label: "Pending Applications", count: counts.pendingApplications, key: "pendingApplications", icon: FileText, href: "/admin/applications" },
    { label: "Pending Verifications", count: counts.pendingVerifications, key: "pendingVerifications", icon: Shield, href: "/admin/verifications" },
    { label: "Pending Reports", count: counts.pendingReports, key: "pendingReports", icon: AlertTriangle, href: "/admin/reports" },
    { label: "Pending Disputes", count: counts.pendingDisputes, key: "pendingDisputes", icon: Scale, href: "/admin/disputes" },
  ];

  const vendorItems = [
    { label: "Orders Needing Action", count: counts.pendingOrders, key: "pendingOrders", icon: ShoppingCart, href: "/vendor/orders" },
    { label: "New Reviews", count: counts.newReviews, key: "newReviews", icon: Star, href: "/vendor/reviews" },
    { label: "Low Stock Products", count: counts.lowStockProducts, key: "lowStockProducts", icon: Package, href: "/vendor/products" },
    { label: "Verification Resubmission", count: counts.verificationResubmission, key: "verificationResubmission", icon: Shield, href: "/vendor/verification" },
  ];

  const customerItems = [
    { label: "Active Orders", count: counts.orderUpdates, key: "orderUpdates", icon: ShoppingCart, href: "/account/orders" },
    { label: "Application Resubmission", count: counts.needsResubmission, key: "needsResubmission", icon: FileText, href: "/vendor/register" },
  ];

  const sharedItems = [
    { label: "Unread Messages", count: counts.unreadMessages, key: "unreadMessages", icon: MessageSquare, href: (isVendor && !isAdmin) ? "/vendor/messages" : "/account/messages" }
  ];

  const items = [
    ...(isAdmin ? adminItems : []),
    ...(isVendor && !isAdmin ? vendorItems : []),
    ...(!isAdmin ? customerItems : []),
    ...sharedItems,
  ];

  const activeItems = items.filter((i) => i.count > 0);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-secondary transition-colors border-2 border-transparent hover:border-foreground relative"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {total > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1 rounded-full">
            {total > 99 ? "99+" : total}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-background border-2 border-foreground shadow-brutal z-50">
          <div className="p-3 border-b border-border-subtle">
            <h3 className="font-heading text-sm uppercase">Notifications</h3>
          </div>

          {activeItems.length > 0 ? (
            <div className="py-1 max-h-80 overflow-y-auto">
              {activeItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => {
                    setIsOpen(false);
                    dismiss(item.key as keyof typeof counts);
                  }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-secondary transition-colors"
                >
                  <div className="w-8 h-8 bg-destructive/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-4 h-4 text-destructive" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.label}</p>
                  </div>
                  <span className="min-w-[22px] h-[22px] bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center px-1 rounded-full">
                    {item.count}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center">
              <Bell className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">All caught up!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
