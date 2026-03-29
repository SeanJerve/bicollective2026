import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Globe } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { isVendor } = useAuth();

  const footerLinks = {
    marketplace: [
      { href: "/products", label: "All Products" },
      { href: "/brands", label: "All Brands" },
      { href: "/categories", label: "Categories" },
    ],
    forVendors: isVendor
      ? [
        { href: "/vendor", label: "Vendor Dashboard" },
        { href: "/vendor/guidelines", label: "Seller Guidelines" },
      ]
      : [
        { href: "/vendor/register", label: "Become a Vendor" },
        { href: "/login", label: "Sign In as Vendor" },
        { href: "/vendor/guidelines", label: "Seller Guidelines" },
      ],
    support: [
      { href: "/help", label: "Help Center" },
      { href: "/contact", label: "Contact Us" },
      { href: "/faq", label: "FAQ" },
    ],
    legal: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
      { href: "/returns", label: "Return Policy" },
    ],
  };

  return (
    <footer className="bg-foreground text-background border-t-2 border-foreground">
      <div className="section-container py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="inline-block">
              <span className="font-heading text-2xl font-bold tracking-tight">
                BICOLLECTIVE
              </span>
            </Link>
            <p className="mt-4 text-sm opacity-80 leading-relaxed">
              Shared digital infrastructure for local Bicolano clothing brands.
            </p>
          </div>

          {/* Marketplace */}
          <div>
            <h4 className="font-heading text-sm uppercase tracking-wide mb-4">
              Marketplace
            </h4>
            <ul className="space-y-2">
              {footerLinks.marketplace.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm opacity-80 hover:opacity-100 transition-opacity"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Vendors */}
          <div>
            <h4 className="font-heading text-sm uppercase tracking-wide mb-4">
              For Vendors
            </h4>
            <ul className="space-y-2">
              {footerLinks.forVendors.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm opacity-80 hover:opacity-100 transition-opacity"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-heading text-sm uppercase tracking-wide mb-4">
              Support
            </h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm opacity-80 hover:opacity-100 transition-opacity"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-heading text-sm uppercase tracking-wide mb-4">
              Legal
            </h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm opacity-80 hover:opacity-100 transition-opacity"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-background/20 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <p className="text-sm opacity-60">
              © {currentYear} Bicollective. All rights reserved.
            </p>
            <div className="h-1 w-1 bg-background/20 rounded-full hidden md:block" />
            <div className="flex items-center gap-2 px-3 py-1.5 border border-background/20 rounded-none bg-background/5 text-sm">
              <Globe className="w-3.5 h-3.5" />
              <select
                className="bg-transparent border-none focus:ring-0 cursor-default font-heading uppercase text-xs"
                disabled
              >
                <option value="en">English</option>
              </select>
            </div>
          </div>
          <p className="text-sm opacity-60">
            Supporting local Bicolano fashion 🇵🇭
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
