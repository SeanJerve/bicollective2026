const PageLoadingFallback = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
        <span className="font-heading text-sm uppercase tracking-widest text-muted-foreground">
          Loading
        </span>
      </div>
    </div>
  );
};

export default PageLoadingFallback;
