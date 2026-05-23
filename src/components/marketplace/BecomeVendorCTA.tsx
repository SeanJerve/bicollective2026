import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import footerBanner from "@/assets/footer-banner.png";

const BecomeVendorCTA = () => {
  const { isVendor, isAdmin } = useAuth();

  if (isVendor || isAdmin) return null;

  return (
    <section
      className="relative py-20 md:py-32 border-t-2 border-foreground overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: `url(${footerBanner})` }}
    >
      {/* Subtle cream/white gradient overlay to fade the background image and emphasize text */}
      <div className="absolute inset-0 bg-background/70 md:bg-background/50" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/60" />

      <div className="relative section-container text-center px-4">
        <h2 className="font-heading text-3xl md:text-6xl uppercase mb-4 md:mb-6">
          Own a Local Brand?
        </h2>
        <p className="text-base md:text-lg text-foreground max-w-xl mx-auto mb-6 md:mb-8 font-medium">
          Join Bicollective and reach thousands of customers. Get your own storefront with zero
          setup fees.
        </p>
        <Link to="/vendor/register" className="btn-brutal inline-flex items-center gap-2">
          Become a Vendor
          <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
        </Link>
      </div>
    </section>
  );
};

export default BecomeVendorCTA;
