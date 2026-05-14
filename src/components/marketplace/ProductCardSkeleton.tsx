const ProductCardSkeleton = () => {
  return (
    <div className="border-2 border-border-subtle">
      {/* Image Skeleton */}
      <div className="aspect-[3/4] skeleton-brutal" />

      {/* Content Skeleton */}
      <div className="p-4 space-y-3">
        {/* Brand */}
        <div className="h-3 w-20 skeleton-brutal" />

        {/* Title */}
        <div className="space-y-2">
          <div className="h-5 w-full skeleton-brutal" />
          <div className="h-5 w-2/3 skeleton-brutal" />
        </div>

        {/* Price */}
        <div className="h-5 w-24 skeleton-brutal" />
      </div>
    </div>
  );
};

export default ProductCardSkeleton;
