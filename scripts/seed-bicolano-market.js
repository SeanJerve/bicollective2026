import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// --- CONFIGURATION ---
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "http://127.0.0.1:54321";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY is missing from environment.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const MOCK_PASSWORD = "Bicolano2026!";
const MOCK_EMAIL_DOMAIN = "mock.test";

// --- DATA DEFINITION ---
const CATEGORIES = {
  "T-Shirts": "t-shirts",
  Shirts: "shirts",
  Pants: "pants",
  Hoodies: "hoodies",
  Jackets: "jackets",
  Accessories: "accessories",
};

const MOCK_VENDORS = [
  {
    name: "Gubat Collective",
    slug: "gubat-collective",
    email: `vendor.gubat@${MOCK_EMAIL_DOMAIN}`,
    fullName: "Mateo Gubatnon",
    location: "Gubat, Sorsogon",
    description:
      "Rugged and nature-inspired streetwear born from the coasts of Sorsogon. Celebrating the surf and soul of Bicol.",
    logo: "/mock/gubat_banner.png", // Using the banner as logo for now or could generate a specific one
    banner: "/mock/gubat_banner.png",
    products: [
      {
        name: "Sorsogon Swell Hoodie",
        price: 1850,
        category: "Hoodies",
        description: "Heavyweight fleece hoodie with hand-screened swell graphics.",
        image: "/mock/gubat_product.png",
      },
      {
        name: "Bulusan Lake Windbreaker",
        price: 2100,
        category: "Jackets",
        description: "Lightweight weather-resistant jacket perfect for coastal trips.",
        image: "/mock/bl_windbreaker.png",
      },
    ],
  },
  {
    name: "Soul of Bicol",
    slug: "soul-of-bicol",
    email: `vendor.soul@${MOCK_EMAIL_DOMAIN}`,
    fullName: "Ana Oragon",
    location: "Naga City, Camarines Sur",
    description:
      "Bold 'Oragon' pride reflected in premium graphic apparel. Naga's premier street lifestyle label.",
    logo: "/mock/soul_banner.png",
    banner: "/mock/soul_banner.png",
    products: [
      {
        name: "Oragon Pride Boxy Tee",
        price: 950,
        category: "T-Shirts",
        description: "Oversized fit with high-contrast neo-brutalist typography.",
        image: "/mock/soul_product.png",
        originalPrice: 1250,
      },
      {
        name: "Naga Nightlife Track Pants",
        price: 1600,
        category: "Pants",
        description: "Luxury streetwear track pants with discrete reflective detailing.",
        image: "/mock/naga_trackpants.png",
      },
      {
        name: "Oragon Essential Cap",
        price: 750,
        category: "Accessories",
        description: "Structured 5-panel hat with embroidered core logo.",
        image: "/mock/oragon_cap.png",
        originalPrice: 950,
      },
    ],
  },
  {
    name: "Magayon Studio",
    slug: "magayon-studio",
    email: `vendor.magayon@${MOCK_EMAIL_DOMAIN}`,
    fullName: "Elena Bicolano",
    location: "Legazpi City, Albay",
    description: "Elegant, minimalist basics inspired by the perfect symmetry of Mount Mayon.",
    logo: "/mock/magayon_banner.png",
    banner: "/mock/magayon_banner.png",
    products: [
      {
        name: "Mayon Minimalist Knit",
        price: 1450,
        category: "Shirts",
        description: "Soft, breathable knit shirt with clean lines.",
        image: "/mock/magayon_product.png",
      },
      {
        name: "Cagsawa Ruins Linen Button-down",
        price: 1800,
        category: "Shirts",
        description: "Crisp oversized linen shirt tailored for tropical layering.",
        image: "/mock/mayon_linen.png",
        originalPrice: 2200,
      },
    ],
  },
];

const MOCK_CUSTOMERS = [
  {
    email: `customer.juan@${MOCK_EMAIL_DOMAIN}`,
    name: "Juan Dela Cruz",
    avatar: "/mock/avatar_juan.png",
  },
  {
    email: `customer.maria@${MOCK_EMAIL_DOMAIN}`,
    name: "Maria Clara",
    avatar: "/mock/avatar_maria.png",
  },
];

const REVIEWS = [
  "Sobrang siram kan tela! Legit oragon design.",
  "Excellent quality. The print doesn't fade after washing. Fast shipping from Bicol!",
  "Ganda ng fit. Pang-porma talaga.",
  "Highly recommended! Support local Bicolano brands.",
  "The packaging was premium. Will definitely order again.",
];

const ORDER_STATUSES = ["pending_payment", "paid", "processing", "shipped", "delivered"];

// --- EXECUTION ---
async function seed() {
  console.log("🚀 Starting OFFLINE-READY Bicolano Collective Seeding...");

  // 1. Get Categories for lookup
  const { data: dbCategories } = await supabase.from("categories").select("id, name");
  const catMap = Object.fromEntries(dbCategories.map((c) => [c.name, c.id]));

  // 2. Create Customers
  console.log("👤 Creating mock customers...");
  const customerIds = [];
  for (const cust of MOCK_CUSTOMERS) {
    const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
      email: cust.email,
      password: MOCK_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: cust.name },
    });

    let userId = authUser?.user?.id;
    if (authErr && authErr.message === "User already registered") {
      const { data } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("email", cust.email)
        .single();
      userId = data?.user_id;
    }

    if (userId) {
      await supabase.from("profiles").update({ avatar_url: cust.avatar }).eq("user_id", userId);
      customerIds.push(userId);
    }
  }

  // 3. Create Vendors & Brands
  console.log("🏪 Creating mock vendors and brands...");
  const credentials = [];
  const seededProducts = [];

  for (const vendor of MOCK_VENDORS) {
    const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
      email: vendor.email,
      password: MOCK_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: vendor.fullName },
    });

    let userId = authUser?.user?.id;
    if (authErr && authErr.message === "User already registered") {
      const { data } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("email", vendor.email)
        .single();
      userId = data?.user_id;
    }

    if (!userId) continue;
    credentials.push({ brand: vendor.name, email: vendor.email, password: MOCK_PASSWORD });

    await supabase
      .from("user_roles")
      .upsert({ user_id: userId, role: "vendor" }, { onConflict: "user_id,role" });

    const { data: brand } = await supabase
      .from("brands")
      .upsert(
        {
          owner_id: userId,
          name: vendor.name,
          slug: vendor.slug,
          description: vendor.description,
          logo_url: vendor.logo,
          banner_url: vendor.banner,
          status: "verified",
          location: vendor.location,
        },
        { onConflict: "slug" }
      )
      .select("id")
      .single();

    if (brand) {
      for (const prod of vendor.products) {
        const { data: product, error: prodErr } = await supabase
          .from("products")
          .upsert(
            {
              brand_id: brand.id,
              category_id: catMap[prod.category],
              name: prod.name,
              slug: `${vendor.slug}-${prod.name.toLowerCase().replace(/ /g, "-")}`,
              description: prod.description,
              price: prod.price,
              original_price: prod.originalPrice || null,
              image_url: prod.image,
              in_stock: true,
              stock_quantity: 50,
              is_active: true,
            },
            { onConflict: "slug" }
          )
          .select("id, name, price")
          .single();

        if (prodErr) console.error("PROD ERR:", prod.name, prodErr);
        if (product) {
          seededProducts.push({ ...product, brand_id: brand.id });
          // Add random reviews
          const numReviews = 2;
          for (let i = 0; i < numReviews; i++) {
            await supabase.from("reviews").insert({
              user_id: customerIds[i % customerIds.length],
              product_id: product.id,
              brand_id: brand.id,
              rating: 5,
              comment: REVIEWS[i % REVIEWS.length],
            });
          }
        }
      }
    }
  }

  // 4. Create Mock Transaction History (Analytics)
  console.log("📈 Injecting mock transaction history (last 30 days)...");
  if (customerIds.length > 0 && seededProducts.length > 0) {
    for (let i = 0; i < 30; i++) {
      const randomCustomer = customerIds[Math.floor(Math.random() * customerIds.length)];
      const randomProduct = seededProducts[Math.floor(Math.random() * seededProducts.length)];

      // FOR ANALYTICS: These MUST be 'delivered' to show in revenue charts
      const status = "delivered";

      // Backdate orders
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));

      const { data: order } = await supabase
        .from("orders")
        .insert({
          customer_id: randomCustomer,
          total_amount: randomProduct.price,
          shipping_address: "Naga City, Camarines Sur",
          shipping_name: "Test Customer",
          shipping_phone: "09123456789",
          created_at: date.toISOString(),
        })
        .select("id")
        .single();

      if (order) {
        const { data: vendorOrder } = await supabase
          .from("vendor_orders")
          .insert({
            order_id: order.id,
            brand_id: randomProduct.brand_id,
            subtotal: randomProduct.price,
            status: status,
            created_at: date.toISOString(),
          })
          .select("id")
          .single();

        if (vendorOrder) {
          await supabase.from("order_items").insert({
            vendor_order_id: vendorOrder.id,
            product_id: randomProduct.id,
            product_name: randomProduct.name,
            product_price: randomProduct.price,
            quantity: 1,
          });
        }
      }
    }
  }

  console.log("\n✅ SEEDING COMPLETE!");
  console.log("\n--- MOCK VENDOR CREDENTIALS ---");
  credentials.forEach((cred) => {
    console.log(
      `Brand: ${cred.brand.padEnd(20)} | Email: ${cred.email.padEnd(30)} | Pass: ${cred.password}`
    );
  });
  console.log("\n-------------------------------\n");
}

seed().catch((err) => {
  console.error("💥 Critical seeding error:", err);
  process.exit(1);
});
