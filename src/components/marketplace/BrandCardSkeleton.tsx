const BrandCardSkeleton = () => {
  return (
    <div className="border-2 border-border-subtle">
      {/* Banner Skeleton */}
      <div className="relative h-32 skeleton-brutal">
        {/* Logo Skeleton */}
        <div className="absolute -bottom-8 left-4 w-16 h-16 bg-background border-2 border-border-subtle skeleton-brutal" />
      </div>

      {/* Content Skeleton */}
      <div className="pt-10 p-4 space-y-3">
        {/* Name */}
        <div className="h-6 w-2/3 skeleton-brutal" />

        {/* Description */}
        <div className="space-y-2">
          <div className="h-4 w-full skeleton-brutal" />
          <div className="h-4 w-3/4 skeleton-brutal" />
        </div>

        {/* Stats */}
        <div className="flex gap-4">
          <div className="h-4 w-12 skeleton-brutal" />
          <div className="h-4 w-20 skeleton-brutal" />
        </div>
      </div>
    </div>
  );
};

export default BrandCardSkeleton;
