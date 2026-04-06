import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function check() {
  const { data: brand } = await supabase.from('brands').select('id, name').eq('slug', 'gubat-collective').single();
  
  const { data: orders, error } = await supabase
    .from("vendor_orders")
    .select("*, order:orders(created_at)")
    .eq("brand_id", brand.id);
    
  if (orders?.length > 0) {
    console.log("Order 0 Status:", orders[0].status);
    console.log("Order 0 Subtotal:", orders[0].subtotal);
    console.log("Order 0 Date:", orders[0].order?.created_at || orders[0].created_at);
    
    // Revenue by month logic
    const monthlyRevenue = {};
    let totalRevenue = 0;
    
    orders.forEach((o) => {
      if (o.status === "delivered") {
        const date = new Date(o.order?.created_at || o.created_at);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        monthlyRevenue[key] = (monthlyRevenue[key] || 0) + Number(o.subtotal);
        totalRevenue += Number(o.subtotal);
      }
    });
    
    console.log("Calculated Total Revenue:", totalRevenue);
    console.log("Calculated Monthly Revenue:", monthlyRevenue);
  }
}

check();
