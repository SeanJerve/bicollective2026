import { Link } from "react-router-dom";
import PageLayout from "@/components/layout/PageLayout";
import BrandCard from "@/components/marketplace/BrandCard";
import { brands } from "@/data/mockData";

const Brands = () => {
  const verifiedBrands = brands.filter((b) => b.isVerified);
  const allBrands = brands;

  return (
    <PageLayout>
      {/* Header */}
      <section className="py-12 border-b-2 border-foreground">
        <div className="section-container">
          <nav className="text-sm mb-4">
            <Link to="/" className="text-muted-foreground hover:text-foreground">
              Home
            </Link>
            <span className="mx-2 text-muted-foreground">/</span>
            <span>Brands</span>
          </nav>
          <h1 className="font-heading text-5xl md:text-6xl uppercase">Local Brands</h1>
          <p className="text-muted-foreground mt-2">
            {brands.length} Bicolano fashion brands
          </p>
        </div>
      </section>

      {/* Verified Brands */}
      {verifiedBrands.length > 0 && (
        <section className="py-12 bg-secondary border-b-2 border-foreground">
          <div className="section-container">
            <div className="mb-8">
              <span className="inline-block badge-verified mb-3">Verified</span>
              <h2 className="font-heading text-3xl uppercase">Trusted Brands</h2>
              <p className="text-muted-foreground mt-2">
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
      <section className="py-12">
        <div className="section-container">
          <h2 className="font-heading text-3xl uppercase mb-8">All Brands</h2>
          <div className="brand-grid">
            {allBrands.map((brand) => (
              <BrandCard key={brand.id} {...brand} />
            ))}
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Brands;
