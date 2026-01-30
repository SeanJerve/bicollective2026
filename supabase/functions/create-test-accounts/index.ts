import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const testAccounts = [
      {
        email: "admin@bicollective.test",
        password: "admin123",
        fullName: "Admin User",
        roles: ["admin", "customer"],
      },
      {
        email: "customer@bicollective.test", 
        password: "customer123",
        fullName: "Test Customer",
        roles: ["customer"],
      },
    ];

    const results = [];

    for (const account of testAccounts) {
      // Check if user exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === account.email);

      if (existingUser) {
        results.push({ email: account.email, status: "exists" });
        continue;
      }

      // Create user
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
        user_metadata: { full_name: account.fullName },
      });

      if (userError) {
        results.push({ email: account.email, status: "error", error: userError.message });
        continue;
      }

      // Add additional roles if needed
      for (const role of account.roles) {
        if (role !== "customer") {
          await supabaseAdmin.from("user_roles").insert({
            user_id: userData.user.id,
            role: role,
          });
        }
      }

      results.push({ email: account.email, status: "created" });
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
