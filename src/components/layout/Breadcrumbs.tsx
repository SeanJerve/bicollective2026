import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

const Breadcrumbs = () => {
  const location = useLocation();

  const pathnames = location.pathname.split("/").filter((x) => x);

  const getLabel = (path: string) => {
    // Map path segments to readable labels
    const labels: Record<string, string> = {
      admin: "Admin",
      vendor: "Vendor",
      products: "Products",
      orders: "Orders",
      messages: "Messages",
      promotions: "Promotions",
      store: "Store Settings",
      reviews: "Reviews",
      analytics: "Analytics",
      finances: "Finances",
      marketing: "Marketing",
      premium: "Premium Plan",
      reports: "Reports",
      applications: "Applications",
      verifications: "Verifications",
      vendors: "Vendors",
      vouchers: "Vouchers",
      "lucky-promo": "Lucky Promo",
      disputes: "Disputes",
    };

    return labels[path] || path.charAt(0).toUpperCase() + path.slice(1);
  };

  if (location.pathname === "/") return null;

  return (
    <nav className="flex items-center gap-2 text-xs font-heading uppercase mb-6 overflow-x-auto whitespace-nowrap pb-2 md:pb-0">
      <Link
        to="/"
        className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
      >
        <Home className="w-3 h-3" />
        Home
      </Link>

      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`;
        const isLast = index === pathnames.length - 1;

        return (
          <div key={name} className="flex items-center gap-2">
            <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
            {isLast ? (
              <span className="text-foreground font-bold">{getLabel(name)}</span>
            ) : (
              <Link
                to={routeTo}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {getLabel(name)}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
