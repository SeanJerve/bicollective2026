import { Link } from "react-router-dom";

interface CategoryCardProps {
  name: string;
  slug: string;
  image?: string;
  productCount?: number;
}

const CategoryCard = ({ name, slug, image, productCount }: CategoryCardProps) => {
  return (
    <Link to={`/categories/${slug}`} className="block group">
      <article className="card-brutal overflow-hidden">
        {/* Image */}
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          {image ? (
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
              <span className="font-heading text-4xl uppercase opacity-20">{name.charAt(0)}</span>
            </div>
          )}

          {/* Overlay */}
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors" />
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-heading text-xl uppercase tracking-tight">{name}</h3>
          {productCount !== undefined && (
            <p className="text-sm text-muted-foreground mt-1">
              {productCount} {productCount === 1 ? "product" : "products"}
            </p>
          )}
        </div>
      </article>
    </Link>
  );
};

export default CategoryCard;
