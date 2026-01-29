import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, ShoppingBag, Menu, X, User } from "lucide-react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();

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
            <Link
              to="/account"
              className="p-2 hover:bg-secondary transition-colors border-2 border-transparent hover:border-foreground"
              aria-label="Account"
            >
              <User className="w-5 h-5" />
            </Link>
            <Link
              to="/cart"
              className="p-2 hover:bg-secondary transition-colors border-2 border-transparent hover:border-foreground relative"
              aria-label="Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-foreground text-background text-xs font-bold flex items-center justify-center">
                0
              </span>
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
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-foreground text-background text-[10px] font-bold flex items-center justify-center">
                0
              </span>
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
            <div className="relative">
              <input
                type="text"
                placeholder="Search products, brands..."
                className="input-brutal w-full pr-12"
                autoFocus
              />
              <button className="absolute right-0 top-0 h-full px-4 bg-foreground text-background border-2 border-foreground">
                <Search className="w-5 h-5" />
              </button>
            </div>
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
            <Link
              to="/account"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-3 font-heading text-xl uppercase tracking-wide py-2"
            >
              <User className="w-5 h-5" />
              Account
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
