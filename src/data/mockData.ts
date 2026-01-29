import product1 from "@/assets/products/product-1.jpg";
import product2 from "@/assets/products/product-2.jpg";
import product3 from "@/assets/products/product-3.jpg";
import product4 from "@/assets/products/product-4.jpg";
import brandLogo1 from "@/assets/brands/brand-logo-1.jpg";
import brandLogo2 from "@/assets/brands/brand-logo-2.jpg";
import brandLogo3 from "@/assets/brands/brand-logo-3.jpg";

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
  isVerifiedBrand?: boolean;
  category: string;
  categorySlug: string;
  description?: string;
  inStock?: boolean;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string;
  banner?: string;
  description?: string;
  isVerified?: boolean;
  rating?: number;
  productCount?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  productCount?: number;
}

// Sample Products
export const products: Product[] = [
  {
    id: "1",
    name: "Essential Cotton Tee",
    slug: "essential-cotton-tee",
    price: 899,
    originalPrice: 1299,
    image: product1,
    brandId: "1",
    brandName: "Bulak Clothing",
    brandSlug: "bulak-clothing",
    isVerifiedBrand: true,
    category: "T-Shirts",
    categorySlug: "t-shirts",
    description: "Premium quality cotton t-shirt made from locally sourced materials. Comfortable everyday wear with a minimalist design.",
    inStock: true,
  },
  {
    id: "2",
    name: "Oversized Linen Button-Up",
    slug: "oversized-linen-button-up",
    price: 1899,
    image: product2,
    brandId: "2",
    brandName: "Naga Studios",
    brandSlug: "naga-studios",
    isVerifiedBrand: true,
    category: "Shirts",
    categorySlug: "shirts",
    description: "Relaxed fit linen shirt perfect for the tropical climate. Features natural breathability and timeless styling.",
    inStock: true,
  },
  {
    id: "3",
    name: "Tactical Cargo Pants",
    slug: "tactical-cargo-pants",
    price: 2499,
    originalPrice: 2999,
    image: product3,
    brandId: "3",
    brandName: "Mayon Apparel",
    brandSlug: "mayon-apparel",
    isVerifiedBrand: false,
    category: "Pants",
    categorySlug: "pants",
    description: "Durable cargo pants with multiple pockets. Built for utility and street style.",
    inStock: true,
  },
  {
    id: "4",
    name: "Classic Pullover Hoodie",
    slug: "classic-pullover-hoodie",
    price: 1799,
    image: product4,
    brandId: "1",
    brandName: "Bulak Clothing",
    brandSlug: "bulak-clothing",
    isVerifiedBrand: true,
    category: "Hoodies",
    categorySlug: "hoodies",
    description: "Soft fleece hoodie with kangaroo pocket. Perfect for cooler evenings.",
    inStock: true,
  },
  {
    id: "5",
    name: "Minimal Logo Tee",
    slug: "minimal-logo-tee",
    price: 799,
    image: product1,
    brandId: "2",
    brandName: "Naga Studios",
    brandSlug: "naga-studios",
    isVerifiedBrand: true,
    category: "T-Shirts",
    categorySlug: "t-shirts",
    inStock: true,
  },
  {
    id: "6",
    name: "Wide Leg Trousers",
    slug: "wide-leg-trousers",
    price: 2199,
    image: product3,
    brandId: "2",
    brandName: "Naga Studios",
    brandSlug: "naga-studios",
    isVerifiedBrand: true,
    category: "Pants",
    categorySlug: "pants",
    inStock: false,
  },
  {
    id: "7",
    name: "Cropped Zip Hoodie",
    slug: "cropped-zip-hoodie",
    price: 1999,
    image: product4,
    brandId: "3",
    brandName: "Mayon Apparel",
    brandSlug: "mayon-apparel",
    isVerifiedBrand: false,
    category: "Hoodies",
    categorySlug: "hoodies",
    inStock: true,
  },
  {
    id: "8",
    name: "Relaxed Oxford Shirt",
    slug: "relaxed-oxford-shirt",
    price: 1699,
    image: product2,
    brandId: "1",
    brandName: "Bulak Clothing",
    brandSlug: "bulak-clothing",
    isVerifiedBrand: true,
    category: "Shirts",
    categorySlug: "shirts",
    inStock: true,
  },
];

// Sample Brands
export const brands: Brand[] = [
  {
    id: "1",
    name: "Bulak Clothing",
    slug: "bulak-clothing",
    logo: brandLogo1,
    description: "Contemporary streetwear rooted in Bicolano heritage. Quality basics for the modern Filipino.",
    isVerified: true,
    rating: 4.8,
    productCount: 24,
  },
  {
    id: "2",
    name: "Naga Studios",
    slug: "naga-studios",
    logo: brandLogo2,
    description: "Minimalist essentials designed in Naga City. Clean lines, premium fabrics, timeless style.",
    isVerified: true,
    rating: 4.9,
    productCount: 18,
  },
  {
    id: "3",
    name: "Mayon Apparel",
    slug: "mayon-apparel",
    logo: brandLogo3,
    description: "Streetwear inspired by the iconic Mayon Volcano. Bold designs for the adventurous spirit.",
    isVerified: false,
    rating: 4.5,
    productCount: 12,
  },
];

// Sample Categories
export const categories: Category[] = [
  {
    id: "1",
    name: "T-Shirts",
    slug: "t-shirts",
    productCount: 45,
  },
  {
    id: "2",
    name: "Shirts",
    slug: "shirts",
    productCount: 28,
  },
  {
    id: "3",
    name: "Pants",
    slug: "pants",
    productCount: 32,
  },
  {
    id: "4",
    name: "Hoodies",
    slug: "hoodies",
    productCount: 19,
  },
  {
    id: "5",
    name: "Jackets",
    slug: "jackets",
    productCount: 15,
  },
  {
    id: "6",
    name: "Accessories",
    slug: "accessories",
    productCount: 23,
  },
];

// Helper functions
export const getProductBySlug = (slug: string): Product | undefined => {
  return products.find((p) => p.slug === slug);
};

export const getBrandBySlug = (slug: string): Brand | undefined => {
  return brands.find((b) => b.slug === slug);
};

export const getCategoryBySlug = (slug: string): Category | undefined => {
  return categories.find((c) => c.slug === slug);
};

export const getProductsByBrand = (brandSlug: string): Product[] => {
  return products.filter((p) => p.brandSlug === brandSlug);
};

export const getProductsByCategory = (categorySlug: string): Product[] => {
  return products.filter((p) => p.categorySlug === categorySlug);
};
