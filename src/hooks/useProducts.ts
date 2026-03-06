import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  brandId: string;
  brandName: string;
  brandSlug: string;
  brandLocation?: string;
  isVerifiedBrand: boolean;
  category: string;
  categorySlug: string;
  description?: string;
  inStock: boolean;
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
  productCount?: number;
  location?: string;
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
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          brand:brands!inner(id, name, slug, status, location),
          category:categories(id, name, slug)
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: Number(p.price),
        originalPrice: p.original_price ? Number(p.original_price) : undefined,
        image: p.image_url || "/placeholder.svg",
        images: p.images || [],
        brandId: p.brand?.id || "",
        brandName: p.brand?.name || "",
        brandSlug: p.brand?.slug || "",
        brandLocation: p.brand?.location || undefined,
        isVerifiedBrand: p.brand?.status === "verified",
        category: p.category?.name || "",
        categorySlug: p.category?.slug || "",
        description: p.description || "",
        inStock: p.in_stock ?? true,
      }));
    },
  });
};

// Fetch single product by slug
export const useProduct = (slug: string) => {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: async (): Promise<Product | null> => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          brand:brands!inner(id, name, slug, status, location),
          category:categories(id, name, slug)
        `)
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        name: data.name,
        slug: data.slug,
        price: Number(data.price),
        originalPrice: data.original_price ? Number(data.original_price) : undefined,
        image: data.image_url || "/placeholder.svg",
        images: data.images || [],
        brandId: data.brand?.id || "",
        brandName: data.brand?.name || "",
        brandSlug: data.brand?.slug || "",
        isVerifiedBrand: data.brand?.status === "verified",
        category: data.category?.name || "",
        categorySlug: data.category?.slug || "",
        description: data.description || "",
        inStock: data.in_stock ?? true,
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
      const { data, error } = await supabase
        .from("brands")
        .select("*, location")
        .in("status", ["approved", "verified"])
        .order("name");

      if (error) throw error;

      // Get product counts for each brand
      const brandIds = (data || []).map((b) => b.id);
      const { data: productCounts } = await supabase
        .from("products")
        .select("brand_id")
        .eq("is_active", true)
        .in("brand_id", brandIds);

      const countMap: Record<string, number> = {};
      (productCounts || []).forEach((p) => {
        countMap[p.brand_id] = (countMap[p.brand_id] || 0) + 1;
      });

      return (data || []).map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        logo: b.logo_url || "/placeholder.svg",
        banner: b.banner_url || undefined,
        description: b.description || "",
        isVerified: b.status === "verified",
        rating: b.rating ? Number(b.rating) : undefined,
        productCount: countMap[b.id] || 0,
        location: b.location || undefined,
      }));
    },
  });
};

// Fetch single brand by slug
export const useBrand = (slug: string) => {
  return useQuery({
    queryKey: ["brand", slug],
    queryFn: async (): Promise<Brand | null> => {
      const { data, error } = await supabase
        .from("brands")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      // Get product count
      const { count } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("brand_id", data.id)
        .eq("is_active", true);

      return {
        id: data.id,
        name: data.name,
        slug: data.slug,
        logo: data.logo_url || "/placeholder.svg",
        banner: data.banner_url || undefined,
        description: data.description || "",
        isVerified: data.status === "verified",
        rating: data.rating ? Number(data.rating) : undefined,
        productCount: count || 0,
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
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          brand:brands!inner(id, name, slug, status),
          category:categories(id, name, slug)
        `)
        .eq("brand.slug", brandSlug)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: Number(p.price),
        originalPrice: p.original_price ? Number(p.original_price) : undefined,
        image: p.image_url || "/placeholder.svg",
        images: p.images || [],
        brandId: p.brand?.id || "",
        brandName: p.brand?.name || "",
        brandSlug: p.brand?.slug || "",
        isVerifiedBrand: p.brand?.status === "verified",
        category: p.category?.name || "",
        categorySlug: p.category?.slug || "",
        description: p.description || "",
        inStock: p.in_stock ?? true,
      }));
    },
    enabled: !!brandSlug,
  });
};

// Fetch all categories
export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (error) throw error;

      return (data || []).map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        image: c.image_url || undefined,
        productCount: c.product_count || 0,
      }));
    },
  });
};

// Fetch products by category
export const useProductsByCategory = (categorySlug: string) => {
  return useQuery({
    queryKey: ["products", "category", categorySlug],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          brand:brands!inner(id, name, slug, status),
          category:categories!inner(id, name, slug)
        `)
        .eq("category.slug", categorySlug)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: Number(p.price),
        originalPrice: p.original_price ? Number(p.original_price) : undefined,
        image: p.image_url || "/placeholder.svg",
        images: p.images || [],
        brandId: p.brand?.id || "",
        brandName: p.brand?.name || "",
        brandSlug: p.brand?.slug || "",
        isVerifiedBrand: p.brand?.status === "verified",
        category: p.category?.name || "",
        categorySlug: p.category?.slug || "",
        description: p.description || "",
        inStock: p.in_stock ?? true,
      }));
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

      // Get actual product count
      const { count } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("category_id", data.id)
        .eq("is_active", true);

      return {
        id: data.id,
        name: data.name,
        slug: data.slug,
        image: data.image_url || undefined,
        productCount: count || 0,
      };
    },
    enabled: !!slug,
  });
};
