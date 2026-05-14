import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user with anon key client
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Use service role for deletion operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check for active orders (non-terminal statuses)
    const { data: activeOrders } = await supabaseAdmin
      .from("orders")
      .select("id, vendor_orders(id, status)")
      .eq("customer_id", userId);

    const hasActiveOrders = activeOrders?.some((order: any) =>
      order.vendor_orders?.some((vo: any) => !["delivered", "cancelled"].includes(vo.status))
    );

    if (hasActiveOrders) {
      return new Response(
        JSON.stringify({
          error:
            "You have active orders. Please wait for all orders to be delivered or cancelled before deleting your account.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if user is a vendor with a brand
    const { data: brand } = await supabaseAdmin
      .from("brands")
      .select("id")
      .eq("owner_id", userId)
      .maybeSingle();

    if (brand) {
      // Check for active vendor orders
      const { data: activeVendorOrders } = await supabaseAdmin
        .from("vendor_orders")
        .select("id, status")
        .eq("brand_id", brand.id)
        .not("status", "in", '("delivered","cancelled")');

      if (activeVendorOrders && activeVendorOrders.length > 0) {
        return new Response(
          JSON.stringify({
            error:
              "You have active vendor orders. Please fulfill or cancel all orders before deleting your account.",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Soft-delete brand and products
      const now = new Date().toISOString();
      await supabaseAdmin
        .from("products")
        .update({ deleted_at: now, is_active: false })
        .eq("brand_id", brand.id);

      await supabaseAdmin
        .from("brands")
        .update({ deleted_at: now, status: "suspended" })
        .eq("id", brand.id);
    }

    // Anonymize profile data
    await supabaseAdmin
      .from("profiles")
      .update({
        full_name: "Deleted User",
        phone: null,
        address: null,
        avatar_url: null,
        email: `deleted_${userId.slice(0, 8)}@removed.local`,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    // Delete addresses
    await supabaseAdmin.from("addresses").delete().eq("user_id", userId);

    // Delete wishlist
    await supabaseAdmin.from("wishlists").delete().eq("user_id", userId);

    // Delete cart items
    await supabaseAdmin.from("cart_items").delete().eq("user_id", userId);

    // Anonymize reviews (keep for product integrity but remove user association)
    await supabaseAdmin
      .from("reviews")
      .update({ comment: "[Review from deleted user]" })
      .eq("user_id", userId);

    // Delete the auth user (cascades user_roles via FK)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteError) {
      throw deleteError;
    }

    return new Response(
      JSON.stringify({ success: true, message: "Account deleted successfully" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Account deletion error:", error);
    return new Response(JSON.stringify({ error: error.message || "Failed to delete account" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
