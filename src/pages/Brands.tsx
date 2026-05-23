import { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import BrandCard from "@/components/marketplace/BrandCard";
import BrandCardSkeleton from "@/components/marketplace/BrandCardSkeleton";
import BecomeVendorCTA from "@/components/marketplace/BecomeVendorCTA";
import { useBrands } from "@/hooks/useProducts";
import usePageSEO from "@/hooks/usePageSEO";

const BICOL_LOCATIONS = [
  "All Locations",
  "Legazpi City",
  "Naga City",
  "Tabaco City",
  "Ligao City",
  "Iriga City",
  "Sorsogon City",
  "Masbate City",
  "Daet",
  "Virac",
  "Albay",
  "Camarines Sur",
  "Camarines Norte",
  "Sorsogon",
  "Masbate",
  "Catanduanes",
];

const Brands = () => {
  const { data: brands, isLoading } = useBrands();
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  usePageSEO({
    title: "Brands",
    description:
      "Discover verified local Bicolano clothing brands. Explore trusted fashion partners from the Bicol region.",
  });

  const filteredBrands = (brands || []).filter((b) => {
    if (!selectedLocation) return true;
    return b.location?.toLowerCase().includes(selectedLocation.toLowerCase());
  });

  const verifiedBrands = filteredBrands.filter((b) => b.isVerified);
  const allBrands = filteredBrands;

  return (
    <PageLayout>
      {/* Header */}
      <section className="py-8 md:py-12 border-b-2 border-foreground">
        <div className="section-container">
          <nav className="text-xs md:text-sm mb-3 md:mb-4">
            <Link to="/" className="text-muted-foreground hover:text-foreground">
              Home
            </Link>
            <span className="mx-2 text-muted-foreground">/</span>
            <span>Brands</span>
          </nav>
          <h1 className="font-heading text-4xl md:text-6xl uppercase">Local Brands</h1>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">
            {allBrands.length} Bicolano fashion brands
            {selectedLocation && ` in ${selectedLocation}`}
          </p>
        </div>
      </section>

      {/* Location Filter */}
      <section className="py-4 border-b border-border-subtle bg-secondary/50">
        <div className="section-container">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            {BICOL_LOCATIONS.map((loc) => (
              <button
                key={loc}
                onClick={() => setSelectedLocation(loc === "All Locations" ? null : loc)}
                className={`px-3 py-1.5 text-xs md:text-sm uppercase whitespace-nowrap border-2 transition-colors ${
                  (loc === "All Locations" && !selectedLocation) || selectedLocation === loc
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background text-foreground border-foreground hover:bg-secondary"
                }`}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Verified Brands */}
      {!isLoading && verifiedBrands.length > 0 && (
        <section className="py-8 md:py-12 bg-secondary border-b-2 border-foreground">
          <div className="section-container">
            <div className="mb-6 md:mb-8">
              <span className="inline-block badge-verified mb-2 md:mb-3">Verified</span>
              <h2 className="font-heading text-2xl md:text-3xl uppercase">Trusted Brands</h2>
              <p className="text-muted-foreground mt-2 text-sm md:text-base">
                These brands have been verified by Bicollective
              </p>
            </div>
            <div className="brand-grid">
              {verifiedBrands.map((brand) => (
                <BrandCard key={brand.id} {...brand} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Brands */}
      <section className="py-8 md:py-12">
        <div className="section-container">
          <h2 className="font-heading text-2xl md:text-3xl uppercase mb-6 md:mb-8">All Brands</h2>
          <div className="brand-grid">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => <BrandCardSkeleton key={i} />)
            ) : allBrands.length > 0 ? (
              allBrands.map((brand) => <BrandCard key={brand.id} {...brand} />)
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">No brands available yet.</p>
              </div>
            )}
          </div>
        </div>
      </section>
      {/* Become Vendor CTA */}
      <BecomeVendorCTA />
    </PageLayout>
  );
};

export default Brands;
