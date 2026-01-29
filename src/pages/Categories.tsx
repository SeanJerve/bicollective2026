import { Link } from "react-router-dom";
import PageLayout from "@/components/layout/PageLayout";
import CategoryCard from "@/components/marketplace/CategoryCard";
import { categories } from "@/data/mockData";

const Categories = () => {
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
            <span>Categories</span>
          </nav>
          <h1 className="font-heading text-5xl md:text-6xl uppercase">Shop by Category</h1>
          <p className="text-muted-foreground mt-2">
            Browse our curated collections
          </p>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-12">
        <div className="section-container">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                name={category.name}
                slug={category.slug}
                productCount={category.productCount}
              />
            ))}
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Categories;
