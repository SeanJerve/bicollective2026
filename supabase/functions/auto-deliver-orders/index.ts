import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find orders that are in "for_delivery" status and have been there for 7+ days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get orders eligible for auto-delivery
    const { data: eligibleOrders, error: fetchError } = await supabase
      .from("vendor_orders")
      .select("id, for_delivery_at, status")
      .eq("status", "for_delivery")
      .eq("auto_delivery_eligible", true)
      .lte("for_delivery_at", sevenDaysAgo.toISOString());

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${eligibleOrders?.length || 0} orders eligible for auto-delivery`);

    // Update each eligible order to delivered
    const updates = [];
    for (const order of eligibleOrders || []) {
      const { error: updateError } = await supabase
        .from("vendor_orders")
        .update({
          status: "delivered",
          delivered_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      if (updateError) {
        console.error(`Failed to update order ${order.id}:`, updateError);
      } else {
        updates.push(order.id);
        console.log(`Auto-delivered order ${order.id}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Auto-delivered ${updates.length} orders`,
        orders: updates,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const err = error as Error;
    console.error("Auto-delivery error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
