import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  ShoppingCart,
  Star,
  Shield,
  FileText,
  AlertTriangle,
  Scale,
  Package,
  MessageSquare,
} from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/contexts/AuthContext";

const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    counts,
    dismiss,
    totalAdmin,
    totalVendor,
    totalCustomer,
    recentNotifications,
    markAsRead,
  } = useNotifications();
  const { user, isAdmin, isVendor } = useAuth();
  const ref = useRef<HTMLDivElement>(null);

  const total =
    (isAdmin ? totalAdmin : isVendor ? totalVendor + totalCustomer : totalCustomer) +
    counts.unreadMessages;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const adminItems = [
    {
      label: "Pending Applications",
      count: counts.pendingApplications,
      key: "pendingApplications",
      icon: FileText,
      href: "/admin/applications",
    },
    {
      label: "Pending Verifications",
      count: counts.pendingVerifications,
      key: "pendingVerifications",
      icon: Shield,
      href: "/admin/verifications",
    },
    {
      label: "Pending Reports",
      count: counts.pendingReports,
      key: "pendingReports",
      icon: AlertTriangle,
      href: "/admin/reports",
    },
  ];

  const vendorItems = [
    {
      label: "New Orders to Process",
      count: counts.pendingOrders,
      key: "pendingOrders",
      icon: ShoppingCart,
      href: "/vendor/orders",
    },
    {
      label: "New Review Alerts",
      count: counts.newReviews,
      key: "newReviews",
      icon: Star,
      href: "/vendor/reviews",
    },
    {
      label: "Low Stock Products",
      count: counts.lowStockProducts,
      key: "lowStockProducts",
      icon: Package,
      href: "/vendor/products",
    },
    {
      label: "Verification Resubmission",
      count: counts.verificationResubmission,
      key: "verificationResubmission",
      icon: Shield,
      href: "/vendor/verification",
    },
  ];

  const customerItems = [
    {
      label: "Active Orders",
      count: counts.orderUpdates,
      key: "orderUpdates",
      icon: ShoppingCart,
      href: "/account/orders",
    },
    {
      label: "Application Resubmission",
      count: counts.needsResubmission,
      key: "needsResubmission",
      icon: FileText,
      href: "/vendor/register",
    },
  ];

  const sharedItems = [
    {
      label: "Unread Messages",
      count: counts.unreadMessages,
      key: "unreadMessages",
      icon: MessageSquare,
      href: "/account/messages",
    },
  ];

  const items = [
    ...(isAdmin ? adminItems : []),
    ...(isVendor && !isAdmin ? vendorItems : []),
    ...(!isAdmin ? customerItems : []),
    ...sharedItems,
  ];

  const actionItems = items.filter((i) => i.count > 0);

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
        <div className="absolute right-0 top-full mt-2 w-80 bg-background border-2 border-foreground shadow-brutal z-50 overflow-hidden">
          <div className="p-3 border-b-2 border-foreground flex items-center justify-between">
            <h3 className="font-heading text-sm uppercase">Quick Alerts</h3>
            <Link
              to="/account/notifications"
              onClick={() => setIsOpen(false)}
              className="text-[10px] font-heading uppercase underline hover:text-primary transition-colors"
            >
              All History
            </Link>
          </div>

          <div className="max-h-96 overflow-y-auto overflow-x-hidden">
            {/* Actionable items (Order updates, messages, etc) */}
            {actionItems.length > 0 && (
              <div className="py-1 border-b border-border-subtle bg-secondary/10">
                {actionItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => {
                      setIsOpen(false);
                      dismiss(item.key as keyof typeof counts);
                    }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-secondary transition-colors border-b border-border-subtle last:border-0"
                  >
                    <div className="w-8 h-8 bg-destructive text-destructive-foreground flex items-center justify-center flex-shrink-0 border border-foreground shadow-brutal-xs">
                      <item.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold tracking-tight">{item.label}</p>
                    </div>
                    <span className="min-w-[20px] h-[20px] bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1 rounded-full border border-foreground">
                      {item.count}
                    </span>
                  </Link>
                ))}
              </div>
            )}

            {/* Persistent History items */}
            {recentNotifications.length > 0 ? (
              <div className="py-1">
                <div className="px-4 py-2 bg-secondary/30">
                  <p className="text-[10px] font-heading uppercase text-muted-foreground">
                    Recent Activity
                  </p>
                </div>
                {recentNotifications.map((notif) => (
                  <Link
                    key={notif.id}
                    to={notif.link || "/account/notifications"}
                    onClick={() => {
                      setIsOpen(false);
                      if (!notif.read_at) markAsRead(notif.id);
                    }}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-secondary transition-colors border-b border-border-subtle last:border-0 ${!notif.read_at ? "bg-primary/5" : "opacity-60"}`}
                  >
                    <div
                      className={`w-8 h-8 flex items-center justify-center flex-shrink-0 border border-foreground shadow-brutal-xs ${!notif.read_at ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                    >
                      {notif.type === "order" ? (
                        <ShoppingCart className="w-4 h-4" />
                      ) : notif.type === "review" ? (
                        <Star className="w-4 h-4" />
                      ) : notif.type === "message" ? (
                        <MessageSquare className="w-4 h-4" />
                      ) : (
                        <Bell className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p
                          className="text-xs uppercase leading-none truncate font-medium"
                        >
                          {notif.title}
                        </p>
                        {!notif.read_at && (
                          <span className="w-1.5 h-1.5 bg-destructive rounded-full" />
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        {notif.message}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              actionItems.length === 0 && (
                <div className="p-8 text-center bg-background">
                  <Bell className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-30" />
                  <p className="text-sm text-muted-foreground font-heading uppercase">
                    All caught up!
                  </p>
                </div>
              )
            )}
          </div>

          <div className="grid grid-cols-2 border-t-2 border-foreground">
            <Link
              to="/account/notifications"
              onClick={() => setIsOpen(false)}
              className="p-3 text-center text-xs font-heading uppercase hover:bg-secondary transition-colors border-r-2 border-foreground"
            >
              Full History
            </Link>
            <button
              onClick={() => setIsOpen(false)}
              className="p-3 text-center text-xs font-heading uppercase hover:bg-secondary transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
