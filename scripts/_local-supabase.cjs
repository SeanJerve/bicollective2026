const { createClient } = require("@supabase/supabase-js");

/** Local dev scripts only — set SUPABASE_SERVICE_ROLE_KEY from `supabase status`. */
function getLocalSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL || "http://127.0.0.1:54321";
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseKey) {
    console.error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Run `supabase status` and export the service role key."
    );
    process.exit(1);
  }
  return createClient(supabaseUrl, supabaseKey);
}

module.exports = { getLocalSupabase };
