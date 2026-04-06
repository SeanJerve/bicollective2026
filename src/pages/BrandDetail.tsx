import { useParams, Link } from "react-router-dom";
import { BadgeCheck, Star, Shield } from "lucide-react";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import PageLayout from "@/components/layout/PageLayout";
import ProductCard from "@/components/marketplace/ProductCard";
import ProductCardSkeleton from "@/components/marketplace/ProductCardSkeleton";
import { useBrand, useProductsByBrand } from "@/hooks/useProducts";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Calendar, Bell, BellRing } from "lucide-react";

const BrandDetail = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: brand, isLoading: brandLoading } = useBrand(slug || "");
  const { data: brandProducts, isLoading: productsLoading } = useProductsByBrand(slug || "");

  const { data: drops } = useQuery({
    queryKey: ["brand-drops", brand?.id, user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("product_drops" as any)
        .select(`
          *,
          notifications:product_drop_notifications(id, user_id)
        `)
        .eq("brand_id", brand?.id)
        .eq("is_active", true)
        .gte("launch_date", new Date().toISOString())
        .order("launch_date", { ascending: true }) as any);
      
      if (error) throw error;

      // Transform to check if current user is notified
      return (data || []).map((drop: any) => ({
        ...drop,
        isNotified: user ? drop.notifications.some((n: any) => n.user_id === user.id) : false,
      }));
    },
    enabled: !!brand?.id,
  });

  const toggleNotifyMutation = useMutation({
    mutationFn: async ({ dropId, isNotified }: { dropId: string, isNotified: boolean }) => {
      if (!user) throw new Error("Must be logged in to enable notifications");

      if (isNotified) {
        const { error } = await (supabase
          .from("product_drop_notifications" as any)
          .delete()
          .eq("drop_id", dropId)
          .eq("user_id", user.id) as any);
        if (error) throw error;
      } else {
        const { error } = await (supabase
          .from("product_drop_notifications" as any)
          .insert({ drop_id: dropId, user_id: user.id }) as any);
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["brand-drops", brand?.id] });
      toast({
        title: variables.isNotified ? "Notifications off" : "Notifications on",
        description: variables.isNotified ? "You will not be notified of this drop." : "We'll let you know when this drops!",
      });
    },
    onError: (err: any) => {
      if (err.message === "Must be logged in to enable notifications") {
        toast({ title: "Login required", description: "Please sign in to get notified.", variant: "destructive" });
      } else {
        toast({ title: "Error", description: "Could not update notification settings.", variant: "destructive" });
      }
    }
  });

  if (brandLoading) {
    return (
      <PageLayout>
        <div className="section-container py-20">
          <div className="animate-pulse space-y-6">
            <div className="h-48 md:h-64 skeleton-brutal" />
            <div className="h-8 w-48 skeleton-brutal" />
            <div className="h-4 w-96 skeleton-brutal" />
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!brand) {
    return (
      <PageLayout>
        <div className="section-container py-16 md:py-20 text-center">
          <h1 className="font-heading text-3xl md:text-4xl uppercase mb-4">Brand Not Found</h1>
          <p className="text-muted-foreground mb-6 md:mb-8 text-sm md:text-base">
            The brand you're looking for doesn't exist.
          </p>
          <Link to="/brands" className="btn-brutal">
            Browse Brands
          </Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {/* Brand Header */}
      <section className="border-b-2 border-foreground">
        {/* Banner */}
        <div className="aspect-[4/1] md:aspect-[5/1] bg-gradient-to-br from-muted to-accent overflow-hidden">
          {brand.banner && (
            <img
              src={brand.banner}
              alt={`${brand.name} banner`}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Brand Info */}
        <div className="section-container pb-6 md:pb-8">
          <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6 relative z-10">
            {/* Logo */}
            <div className="-mt-12 md:-mt-16 w-24 h-24 md:w-32 md:h-32 aspect-square bg-background border-2 border-foreground shadow-brutal overflow-hidden flex-shrink-0 relative">
              <img
                src={brand.logo}
                alt={brand.name}
                className="w-full h-full object-cover"
              />
              {brand.isVerified && (
                <VerifiedBadge 
                  size="lg" 
                  className="absolute -top-2 -right-2 z-10 border-2" 
                />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 pt-2 md:pt-3">
              <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                <h1 className="font-heading text-3xl md:text-5xl uppercase">
                  {brand.name}
                </h1>
                {brand.subscriptionTier === "premium" && (
                  <span className="badge-premium px-2 py-0.5 text-[10px] md:text-xs flex items-center gap-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-crown"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>
                    PREMIUM VENDOR
                  </span>
                )}
              </div>

              {brand.description && (
                <p className="text-muted-foreground max-w-2xl mb-3 md:mb-4 text-sm md:text-base">
                  {brand.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm md:text-base">
                {brand.rating && (
                  <div className="flex items-center gap-1 md:gap-2">
                    <Star className="w-4 h-4 md:w-5 md:h-5 fill-foreground" />
                    <span className="font-heading">{brand.rating.toFixed(1)}</span>
                  </div>
                )}
                <span className="text-muted-foreground">
                  {brandProducts?.length || 0} products
                </span>
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          {brand.isVerified && (
            <div className="mt-6 md:mt-8 flex flex-wrap gap-3 md:gap-4">
              <div className="inline-flex items-center gap-2 px-3 md:px-4 py-2 bg-secondary border border-border-subtle text-xs md:text-sm">
                <BadgeCheck className="w-4 h-4 md:w-5 md:h-5 text-success" />
                <span>Verified Local Brand</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 md:px-4 py-2 bg-secondary border border-border-subtle text-xs md:text-sm">
                <Shield className="w-4 h-4 md:w-5 md:h-5" />
                <span>Buyer Protection Active</span>
              </div>
              {brand.subscriptionTier === "premium" && (
                <div className="inline-flex items-center gap-2 px-3 md:px-4 py-2 bg-foreground text-background font-heading text-[10px] md:text-xs uppercase tracking-widest">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-crown"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>
                  Premium Member
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Upcoming Drops / Trailers */}
      {drops && drops.length > 0 && (
        <section className="bg-foreground text-background py-12 md:py-16">
          <div className="section-container">
            <div className="flex items-center gap-3 mb-8 md:mb-10">
              <Calendar className="w-6 h-6 md:w-8 md:h-8" />
              <h2 className="font-heading text-2xl md:text-3xl uppercase tracking-widest text-[#FF0000]">Upcoming Drops</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {drops.map((drop: any) => (
                <div key={drop.id} className="border-2 border-background bg-secondary text-foreground group overflow-hidden">
                  <div className="aspect-video relative overflow-hidden bg-muted">
                    <img 
                      src={drop.image_url} 
                      alt={drop.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    />
                    <div className="absolute top-4 left-4 bg-background text-foreground font-heading text-sm px-3 py-1 uppercase tracking-widest shadow-brutal">
                      {format(new Date(drop.launch_date), "MMM d, yyyy")}
                    </div>
                  </div>
                  
                  <div className="p-5 md:p-6 flex flex-col items-start">
                    <h3 className="font-heading text-xl md:text-2xl uppercase mb-2 line-clamp-1">{drop.title}</h3>
                    
                    {drop.description && (
                      <p className="text-muted-foreground text-sm line-clamp-2 mb-6">
                        {drop.description}
                      </p>
                    )}

                    <div className="mt-auto w-full flex items-center justify-between pt-4 border-t border-border-subtle">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Drops In</span>
                        <span className="font-mono font-medium">
                          {format(new Date(drop.launch_date), "h:mm a")} 
                        </span>
                      </div>
                      
                      <button 
                        onClick={() => toggleNotifyMutation.mutate({ dropId: drop.id, isNotified: drop.isNotified })}
                        disabled={toggleNotifyMutation.isPending}
                        className={`btn-brutal flex items-center gap-2 text-xs md:text-sm shadow-none ${drop.isNotified ? 'bg-success text-success-foreground' : ''}`}
                      >
                        {drop.isNotified ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                        {drop.isNotified ? "Notified" : "Notify Me"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Products */}
      <section className="py-8 md:py-12">
        <div className="section-container">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h2 className="font-heading text-2xl md:text-3xl uppercase">Products</h2>
          </div>

          {productsLoading ? (
            <div className="product-grid">
              {Array.from({ length: 4 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : brandProducts && brandProducts.length > 0 ? (
            <div className="product-grid">
              {brandProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 md:py-16 border-2 border-border-subtle">
              <h3 className="font-heading text-xl md:text-2xl uppercase mb-2">No Products Yet</h3>
              <p className="text-muted-foreground text-sm md:text-base">
                This brand hasn't listed any products.
              </p>
            </div>
          )}
        </div>
      </section>
    </PageLayout>
  );
};

export default BrandDetail;
