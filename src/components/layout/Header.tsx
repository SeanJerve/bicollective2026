import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShoppingBag, Menu, X, User, LogOut, LayoutDashboard, Shield, Search, Heart, Ticket, AlertTriangle, UserCog } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import SearchAutocomplete from "./SearchAutocomplete";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, isVendor, isAdmin } = useAuth();
  const { itemCount } = useCart();

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
    navigate("/");
  };

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

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="p-2 hover:bg-secondary transition-colors border-2 border-transparent hover:border-foreground"
                aria-label="Account"
              >
                <User className="w-5 h-5" />
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
                        <Link
                          to="/account/orders"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-secondary"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          My Orders
                        </Link>
                        <Link
                          to="/account/wishlist"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-secondary"
                        >
                          <Heart className="w-4 h-4" />
                          Wishlist
                        </Link>
                        <Link
                          to="/account/vouchers"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-secondary"
                        >
                          <Ticket className="w-4 h-4" />
                          My Vouchers
                        </Link>
                        <Link
                          to="/account/profile"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-secondary"
                        >
                          <UserCog className="w-4 h-4" />
                          Profile Settings
                        </Link>
                        {isVendor && !isAdmin && (
                          <Link
                            to="/vendor"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-secondary"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            Vendor Dashboard
                          </Link>
                        )}
                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-secondary"
                          >
                            <Shield className="w-4 h-4" />
                            Admin Panel
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
            <Link to="/cart" className="p-2 relative" aria-label="Cart">
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-foreground text-background text-[10px] font-bold flex items-center justify-center">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2"
              aria-label="Menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
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
                <Link
                  to="/account/orders"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 font-heading text-xl uppercase tracking-wide py-2"
                >
                  <ShoppingBag className="w-5 h-5" />
                  My Orders
                </Link>
                {isVendor && !isAdmin && (
                  <Link
                    to="/vendor"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 font-heading text-xl uppercase tracking-wide py-2"
                  >
                    <LayoutDashboard className="w-5 h-5" />
                    Vendor Dashboard
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
          className="fixed inset-0 z-40"
          onClick={() => setIsUserMenuOpen(false)}
        />
      )}
    </header>
  );
};

export default Header;
