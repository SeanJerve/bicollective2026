import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "http://127.0.0.1:54321";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function check() {
  const { data: brand } = await supabase
    .from("brands")
    .select("*")
    .eq("slug", "gubat-collective")
    .single();
  console.log("Brand:", brand.name, "Logo:", brand.logo_url, "Banner:", brand.banner_url);

  const { data: products } = await supabase.from("products").select("*").eq("brand_id", brand.id);
  products.forEach((p) => {
    console.log("Product:", p.name, "Image:", p.image_url);
  });

  const { data: custProfiles } = await supabase.from("profiles").select("full_name, avatar_url");
  custProfiles
    ?.filter((p) => p.avatar_url)
    .forEach((p) => {
      console.log("Cust Profile:", p.full_name, "Avatar:", p.avatar_url);
    });
}

check();
