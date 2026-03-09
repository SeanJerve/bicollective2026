import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShoppingBag, Menu, X, User, LogOut, LayoutDashboard, Shield, Search, Heart, Ticket, UserCog, Star, Store, MessageSquare } from "lucide-react";
import NotificationCenter from "./NotificationCenter";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationBadge from "@/components/ui/notification-badge";
import SearchAutocomplete from "./SearchAutocomplete";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, isVendor, isAdmin } = useAuth();
  const { itemCount } = useCart();
  const { totalAdmin, totalVendor, totalCustomer, counts } = useNotifications();

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Shop" },
    { href: "/brands", label: "Brands" },
    { href: "/categories", label: "Categories" },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const handleSignOut = async () => {
    await signOut();
    setIsUserMenuOpen(false);
    navigate("/login");
  };

  // For admin users, gray out customer features and redirect to 404
  const adminDisabledLinks = isAdmin
    ? ["/account/orders", "/account/wishlist", "/account/vouchers", "/account/profile"]
    : [];

  const isDisabledForAdmin = (href: string) => adminDisabledLinks.includes(href);

  const handleNavClick = (href: string, closeMenu: () => void) => {
    closeMenu();
    if (isDisabledForAdmin(href)) {
      navigate("/coming-soon");
      return;
    }
    navigate(href);
  };

  const userMenuItems = [
    { href: "/account/orders", label: "My Orders", icon: ShoppingBag, badge: totalCustomer },
    { href: "/account/messages", label: "Messages", icon: MessageSquare, badge: counts.unreadMessages },
    { href: "/account/to-review", label: "To Review", icon: Star },
    { href: "/account/wishlist", label: "Wishlist", icon: Heart },
    { href: "/account/vouchers", label: "My Vouchers", icon: Ticket },
    { href: "/account/profile", label: "Profile Settings", icon: UserCog },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background border-b-2 border-foreground">
      <div className="section-container">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="font-heading text-2xl md:text-3xl font-bold tracking-tight">
              BICOLLECTIVE
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`font-heading text-sm uppercase tracking-wide transition-opacity hover:opacity-60 ${
                  isActive(link.href) ? "border-b-2 border-foreground pb-1" : ""
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 hover:bg-secondary transition-colors border-2 border-transparent hover:border-foreground"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Notification Center */}
            {user && <NotificationCenter />}

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="p-2 hover:bg-secondary transition-colors border-2 border-transparent hover:border-foreground relative"
                aria-label="Account"
              >
                <User className="w-5 h-5" />
                {user && (
                  <NotificationBadge
                    count={isAdmin ? totalAdmin : isVendor ? totalVendor + totalCustomer : totalCustomer}
                  />
                )}
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-background border-2 border-foreground shadow-brutal z-50">
                  {user ? (
                    <>
                      <div className="p-4 border-b border-border-subtle">
                        <p className="text-sm text-muted-foreground">Signed in as</p>
                        <p className="text-sm font-medium truncate">{user.email}</p>
                      </div>
                      <div className="py-2">
                        {!isAdmin && userMenuItems.map((item) => (
                          <button
                            key={item.href}
                            onClick={() => handleNavClick(item.href, () => setIsUserMenuOpen(false))}
                            className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-secondary w-full text-left"
                          >
                            <item.icon className="w-4 h-4" />
                            {item.label}
                            {(item.badge ?? 0) > 0 && (
                              <span className="ml-auto min-w-[18px] h-[18px] bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1 rounded-full">
                                {item.badge}
                              </span>
                            )}
                          </button>
                        ))}
                        {isVendor && !isAdmin && (
                          <Link
                            to="/vendor"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-secondary relative"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            Vendor Dashboard
                            {totalVendor > 0 && (
                              <span className="ml-auto min-w-[18px] h-[18px] bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1 rounded-full">
                                {totalVendor}
                              </span>
                            )}
                          </Link>
                        )}
                        {!isVendor && !isAdmin && (
                          <Link
                            to="/vendor/register"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-secondary"
                          >
                            <Store className="w-4 h-4" />
                            Become a Vendor
                          </Link>
                        )}
                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-secondary relative"
                          >
                            <Shield className="w-4 h-4" />
                            Admin Panel
                            {totalAdmin > 0 && (
                              <span className="ml-auto min-w-[18px] h-[18px] bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1 rounded-full">
                                {totalAdmin}
                              </span>
                            )}
                          </Link>
                        )}
                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-secondary w-full text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="py-2">
                      <Link
                        to="/login"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm hover:bg-secondary"
                      >
                        Sign In
                      </Link>
                      <Link
                        to="/register"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm hover:bg-secondary"
                      >
                        Create Account
                      </Link>
                      <hr className="my-2 border-border-subtle" />
                      <Link
                        to="/vendor/register"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm hover:bg-secondary"
                      >
                        Become a Vendor
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {!isAdmin && (
              <Link
                to="/cart"
                className="p-2 hover:bg-secondary transition-colors border-2 border-transparent hover:border-foreground relative"
                aria-label="Cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-foreground text-background text-xs font-bold flex items-center justify-center">
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </Link>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
            {!isAdmin && (
              <Link to="/cart" className="p-2 relative" aria-label="Cart">
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-foreground text-background text-[10px] font-bold flex items-center justify-center">
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </Link>
            )}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 relative"
              aria-label="Menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              {user && (
                <NotificationBadge
                  count={isAdmin ? totalAdmin : isVendor ? totalVendor + totalCustomer : totalCustomer}
                />
              )}
            </button>
          </div>
        </div>

      {/* Search Bar */}
        {isSearchOpen && (
          <div className="py-4 border-t-2 border-foreground animate-fade-in">
            <SearchAutocomplete
              autoFocus
              onClose={() => setIsSearchOpen(false)}
            />
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t-2 border-foreground bg-background animate-fade-in">
          <nav className="section-container py-6 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setIsMenuOpen(false)}
                className={`block font-heading text-xl uppercase tracking-wide py-2 ${
                  isActive(link.href) ? "border-l-4 border-foreground pl-4" : ""
                }`}
              >
                {link.label}
              </Link>
            ))}
            <hr className="border-border-subtle" />
            {user ? (
              <>
                {!isAdmin && (
                  <button
                    onClick={() => handleNavClick("/account/orders", () => setIsMenuOpen(false))}
                    className="flex items-center gap-3 font-heading text-xl uppercase tracking-wide py-2 w-full text-left"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    My Orders
                    {totalCustomer > 0 && (
                      <span className="ml-2 min-w-[20px] h-[20px] bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center px-1 rounded-full">
                        {totalCustomer}
                      </span>
                    )}
                  </button>
                )}
                {isVendor && !isAdmin && (
                  <Link
                    to="/vendor"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 font-heading text-xl uppercase tracking-wide py-2"
                  >
                    <LayoutDashboard className="w-5 h-5" />
                    Vendor Dashboard
                    {totalVendor > 0 && (
                      <span className="ml-2 min-w-[20px] h-[20px] bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center px-1 rounded-full">
                        {totalVendor}
                      </span>
                    )}
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 font-heading text-xl uppercase tracking-wide py-2"
                  >
                    <Shield className="w-5 h-5" />
                    Admin Panel
                    {totalAdmin > 0 && (
                      <span className="ml-2 min-w-[20px] h-[20px] bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center px-1 rounded-full">
                        {totalAdmin}
                      </span>
                    )}
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleSignOut();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-3 font-heading text-xl uppercase tracking-wide py-2"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 font-heading text-xl uppercase tracking-wide py-2"
                >
                  <User className="w-5 h-5" />
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMenuOpen(false)}
                  className="block font-heading text-xl uppercase tracking-wide py-2"
                >
                  Create Account
                </Link>
              </>
            )}
          </nav>
        </div>
      )}

      {/* Overlay for user menu */}
      {isUserMenuOpen && (
        <div
          className="fixed inset-0 z-[45]"
          onClick={() => setIsUserMenuOpen(false)}
        />
      )}
    </header>
  );
};

export default Header;
