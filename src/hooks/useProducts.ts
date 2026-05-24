import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { resolveCommissionRate } from "@/lib/platformFees";
import { compareBoostedProducts, hasActiveAdBoost } from "@/lib/adBoosts";

export interface ProductVariant {
  id: string;
  size: string;
  stock_quantity: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  image: string;
  galleryImages?: string[]; // from product_images table
  variants?: ProductVariant[]; // from product_variants table
  brandId: string;
  brandName: string;
  brandSlug: string;
  brandLocation?: string;
  isVerifiedBrand: boolean;
  category: string;
  categorySlug: string;
  description?: string;
  inStock: boolean;
  listingType: string;
  releaseDate?: string;
  preorderDiscountPercent?: number;
  storeSalePercent?: number;
  storeSaleEndsAt?: string;
  brandCommissionRate?: number;
  isBoosted?: boolean;
  dropId?: string | null;
  dropLaunchDate?: string | null;
  isTeaser?: boolean;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string;
  banner?: string;
  description?: string;
  isVerified: boolean;
  rating?: number;
  reviewCount?: number;
  productCount?: number;
  location?: string;
  subscriptionTier?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  productCount?: number;
}

// Fetch all products
export const useProducts = () => {
  return useQuery({
    queryKey: ["products"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await (
        supabase.from("products").select(`
          *,
          brand:brands!inner(id, name, slug, status, location, store_sale_percent, store_sale_ends_at, commission_rate, subscription_tier),
          category:categories(id, name, slug),
          ad_boosts(id, status, starts_at, ends_at),
          product_variants(id, size, stock_quantity),
          product_images(image_url, sort_order),
          product_drops(id, title, launch_date)
        `) as any
      )
        .eq("is_active", true)
        .eq("brand.is_hidden", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      const products = (data as any[]) || [];

      return products
        .map((p) => {
          const variants = p.product_variants || [];
          const hasStock = variants.some((v: any) => v.stock_quantity > 0);

          return {
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: Number(p.price),
            originalPrice: p.original_price ? Number(p.original_price) : undefined,
            image: p.image_url || "/placeholder.svg",
            galleryImages: (p.product_images || [])
              .sort((a: any, b: any) => a.sort_order - b.sort_order)
              .map((img: any) => img.image_url),
            variants: variants,
            brandId: p.brand?.id || "",
            brandName: p.brand?.name || "",
            brandSlug: p.brand?.slug || "",
            brandLocation: p.brand?.location || undefined,
            isVerifiedBrand: p.brand?.status === "verified",
            category: p.category?.name || "",
            categorySlug: p.category?.slug || "",
            description: p.description || "",
            inStock: hasStock, // Calculated from variants
            listingType: p.listing_type || "regular",
            releaseDate: p.release_date || undefined,
            preorderDiscountPercent: p.preorder_discount_percent || undefined,
            storeSalePercent: p.brand?.store_sale_percent || undefined,
            storeSaleEndsAt: p.brand?.store_sale_ends_at || undefined,
            brandCommissionRate: resolveCommissionRate(p.brand?.commission_rate),
            isBoosted: hasActiveAdBoost(p.ad_boosts),
            dropId: p.drop_id || null,
            dropLaunchDate: p.product_drops?.launch_date || null,
            isTeaser: p.product_drops?.launch_date ? new Date(p.product_drops.launch_date) > new Date() : (p.listing_type === "teaser"),
          };
        })
        .sort(compareBoostedProducts);
    },
  });
};

// Fetch single product by slug
export const useProduct = (slug: string) => {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: async (): Promise<Product | null> => {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
      
      let query = supabase.from("products").select(`
        *,
        brand:brands!inner(id, name, slug, status, location, store_sale_percent, store_sale_ends_at, commission_rate, subscription_tier),
        category:categories(id, name, slug),
        ad_boosts(id, status, starts_at, ends_at),
        product_variants(id, size, stock_quantity),
        product_images(image_url, sort_order),
        product_drops(id, title, launch_date)
      `) as any;

      if (isUuid) {
        query = query.eq("id", slug);
      } else {
        query = query.eq("slug", slug);
      }

      const { data, error } = await query
        .eq("brand.is_hidden", false)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      const product = data as any;

      const variants = product.product_variants || [];
      const hasStock = variants.some((v: any) => v.stock_quantity > 0);

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: Number(product.price),
        originalPrice: product.original_price ? Number(product.original_price) : undefined,
        image: product.image_url || "/placeholder.svg",
        galleryImages: (product.product_images || [])
          .sort((a: any, b: any) => a.sort_order - b.sort_order)
          .map((img: any) => img.image_url),
        variants: variants,
        brandId: product.brand?.id || "",
        brandName: product.brand?.name || "",
        brandSlug: product.brand?.slug || "",
        brandLocation: product.brand?.location || undefined,
        isVerifiedBrand: product.brand?.status === "verified",
        category: product.category?.name || "",
        categorySlug: product.category?.slug || "",
        description: product.description || "",
        inStock: hasStock, // Calculated from variants
        listingType: product.listing_type || "regular",
        releaseDate: product.release_date || undefined,
        preorderDiscountPercent: product.preorder_discount_percent || undefined,
        storeSalePercent: product.brand?.store_sale_percent || undefined,
        storeSaleEndsAt: product.brand?.store_sale_ends_at || undefined,
        brandCommissionRate: resolveCommissionRate(product.brand?.commission_rate),
        isBoosted: hasActiveAdBoost(product.ad_boosts),
        dropId: product.drop_id || null,
        dropLaunchDate: product.product_drops?.launch_date || null,
        isTeaser: product.product_drops?.launch_date ? new Date(product.product_drops.launch_date) > new Date() : (product.listing_type === "teaser"),
      };
    },
    enabled: !!slug,
  });
};

// Fetch all brands
export const useBrands = () => {
  return useQuery({
    queryKey: ["brands"],
    queryFn: async (): Promise<Brand[]> => {
      const { data, error } = await (
        supabase.from("brands").select("*, location, subscription_tier") as any
      )
        .in("status", ["approved", "verified"])
        .eq("is_hidden", false)
        .order("name");

      if (error) throw error;

      // Get product counts for each brand
      const brandIds = (data || []).map((b: any) => b.id);
      const { data: productCounts } = await supabase
        .from("products")
        .select("brand_id")
        .eq("is_active", true)
        .in("brand_id", brandIds);

      const countMap: Record<string, number> = {};
      (productCounts || []).forEach((p: any) => {
        countMap[p.brand_id] = (countMap[p.brand_id] || 0) + 1;
      });

      // Fetch live ratings from brand_aggregates view
      const { data: aggregates } = await (supabase.from("brand_aggregates") as any)
        .select("brand_id, average_rating, review_count")
        .in("brand_id", brandIds);

      const aggMap: Record<string, any> = {};
      (aggregates || []).forEach((a: any) => {
        aggMap[a.brand_id] = a;
      });

      return (data || []).map((b: any) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        logo: b.logo_url || "/placeholder.svg",
        banner: b.banner_url || undefined,
        description: b.description || "",
        isVerified: b.status === "verified",
        rating: aggMap[b.id]?.average_rating ? Number(aggMap[b.id].average_rating) : undefined,
        reviewCount: aggMap[b.id]?.review_count ? Number(aggMap[b.id].review_count) : 0,
        productCount: countMap[b.id] || 0,
        location: b.location || undefined,
        subscriptionTier: b.subscription_tier,
      }));
    },
  });
};

// Fetch single brand by slug
export const useBrand = (slug: string) => {
  return useQuery({
    queryKey: ["brand", slug],
    queryFn: async (): Promise<Brand | null> => {
      const { data, error } = await (supabase.from("brands").select("*, subscription_tier") as any)
        .eq("slug", slug)
        .eq("is_hidden", false)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      const brand = data as any;

      // Get product count
      const { count } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("brand_id", brand.id)
        .eq("is_active", true);

      // Get live rating from brand_aggregates view
      const { data: agg } = await (supabase.from("brand_aggregates") as any)
        .select("average_rating, review_count")
        .eq("brand_id", brand.id)
        .maybeSingle();

      return {
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        logo: brand.logo_url || "/placeholder.svg",
        banner: brand.banner_url || undefined,
        description: brand.description || "",
        isVerified: brand.status === "verified",
        rating: agg?.average_rating ? Number(agg.average_rating) : undefined,
        reviewCount: agg?.review_count ? Number(agg.review_count) : 0,
        productCount: count || 0,
        subscriptionTier: brand.subscription_tier,
      };
    },
    enabled: !!slug,
  });
};

// Fetch products by brand
export const useProductsByBrand = (brandSlug: string) => {
  return useQuery({
    queryKey: ["products", "brand", brandSlug],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await (
        supabase.from("products").select(`
          *,
          brand:brands!inner(id, name, slug, status, commission_rate, subscription_tier),
          category:categories(id, name, slug),
          ad_boosts(id, status, starts_at, ends_at),
          product_variants(id, size, stock_quantity),
          product_images(image_url, sort_order),
          product_drops(id, title, launch_date)
        `) as any
      )
        .eq("brand.slug", brandSlug)
        .eq("is_active", true)
        .eq("brand.is_hidden", false)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || [])
        .map((p: any) => {
          const variants = p.product_variants || [];
          const hasStock = variants.some((v: any) => v.stock_quantity > 0);

          return {
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: Number(p.price),
            originalPrice: p.original_price ? Number(p.original_price) : undefined,
            image: p.image_url || "/placeholder.svg",
            galleryImages: (p.product_images || [])
              .sort((a: any, b: any) => a.sort_order - b.sort_order)
              .map((img: any) => img.image_url),
            variants: variants,
            brandId: p.brand?.id || "",
            brandName: p.brand?.name || "",
            brandSlug: p.brand?.slug || "",
            isVerifiedBrand: p.brand?.status === "verified",
            category: p.category?.name || "",
            categorySlug: p.category?.slug || "",
            description: p.description || "",
            inStock: hasStock, // Calculated from variants
            listingType: p.listing_type || "regular",
            releaseDate: p.release_date || undefined,
            preorderDiscountPercent: p.preorder_discount_percent || undefined,
            brandCommissionRate: resolveCommissionRate(p.brand?.commission_rate),
            isBoosted: hasActiveAdBoost(p.ad_boosts),
            dropId: p.drop_id || null,
            dropLaunchDate: p.product_drops?.launch_date || null,
            isTeaser: p.product_drops?.launch_date ? new Date(p.product_drops.launch_date) > new Date() : (p.listing_type === "teaser"),
          };
        })
        .sort(compareBoostedProducts);
    },
    enabled: !!brandSlug,
  });
};

// Fetch all categories
export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase.from("categories").select("*").order("name");

      if (error) throw error;

      // Get product counts per category
      const categoryIds = (data || []).map((c: any) => c.id);
      const { data: productCounts } = await supabase
        .from("products")
        .select("category_id")
        .eq("is_active", true)
        .in("category_id", categoryIds);

      const countMap: Record<string, number> = {};
      (productCounts || []).forEach((p: any) => {
        if (p.category_id) countMap[p.category_id] = (countMap[p.category_id] || 0) + 1;
      });

      return (data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        image: c.image_url || undefined,
        productCount: countMap[c.id] || 0,
      }));
    },
  });
};

// Fetch products by category
export const useProductsByCategory = (categorySlug: string) => {
  return useQuery({
    queryKey: ["products", "category", categorySlug],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await (
        supabase.from("products").select(`
          *,
          brand:brands!inner(id, name, slug, status, commission_rate, subscription_tier),
          category:categories!inner(id, name, slug),
          ad_boosts(id, status, starts_at, ends_at),
          product_variants(id, size, stock_quantity),
          product_images(image_url, sort_order),
          product_drops(id, title, launch_date)
        `) as any
      )
        .eq("category.slug", categorySlug)
        .eq("is_active", true)
        .eq("brand.is_hidden", false)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || [])
        .map((p: any) => {
          const variants = p.product_variants || [];
          const hasStock = variants.some((v: any) => v.stock_quantity > 0);

          return {
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: Number(p.price),
            originalPrice: p.original_price ? Number(p.original_price) : undefined,
            image: p.image_url || "/placeholder.svg",
            galleryImages: (p.product_images || [])
              .sort((a: any, b: any) => a.sort_order - b.sort_order)
              .map((img: any) => img.image_url),
            variants: variants,
            brandId: p.brand?.id || "",
            brandName: p.brand?.name || "",
            brandSlug: p.brand?.slug || "",
            isVerifiedBrand: p.brand?.status === "verified",
            category: p.category?.name || "",
            categorySlug: p.category?.slug || "",
            description: p.description || "",
            inStock: hasStock, // Calculated from variants
            listingType: p.listing_type || "regular",
            releaseDate: p.release_date || undefined,
            preorderDiscountPercent: p.preorder_discount_percent || undefined,
            brandCommissionRate: resolveCommissionRate(p.brand?.commission_rate),
            isBoosted: hasActiveAdBoost(p.ad_boosts),
            dropId: p.drop_id || null,
            dropLaunchDate: p.product_drops?.launch_date || null,
            isTeaser: p.product_drops?.launch_date ? new Date(p.product_drops.launch_date) > new Date() : (p.listing_type === "teaser"),
          };
        })
        .sort(compareBoostedProducts);
    },
    enabled: !!categorySlug,
  });
};

// Fetch category by slug
export const useCategory = (slug: string) => {
  return useQuery({
    queryKey: ["category", slug],
    queryFn: async (): Promise<Category | null> => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      const category = data as any;

      // Get actual product count
      const { count } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("category_id", category.id)
        .eq("is_active", true);

      return {
        id: category.id,
        name: category.name,
        slug: category.slug,
        image: category.image_url || undefined,
        productCount: count || 0,
      };
    },
    enabled: !!slug,
  });
};
