import { createClient } from "@supabase/supabase-js";

// --- CONFIGURATION ---
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "http://127.0.0.1:54321";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY is missing from environment.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const MOCK_EMAIL_DOMAIN = "mock.test";

async function wipe() {
  console.log("🧹 Starting Mock Data Cleanup...");

  // 1. Find all mock users
  const { data: users, error: userErr } = await supabase.auth.admin.listUsers();

  if (userErr) {
    console.error("Error listing users:", userErr.message);
    process.exit(1);
  }

  const mockUsers = users.users.filter((u) => u.email.endsWith(`@${MOCK_EMAIL_DOMAIN}`));

  if (mockUsers.length === 0) {
    console.log("✨ No mock users found. Database is clean!");
    return;
  }

  console.log(`🗑️ Deleting ${mockUsers.length} mock users and their associated brands/products...`);

  for (const user of mockUsers) {
    const { error: delErr } = await supabase.auth.admin.deleteUser(user.id);
    if (delErr) {
      console.error(`Error deleting user ${user.email}:`, delErr.message);
    } else {
      console.log(`✅ Deleted user: ${user.email}`);
    }
  }

  console.log("\n✨ CLEANUP COMPLETE! All mock data has been wiped.");
}

wipe().catch((err) => {
  console.error("💥 Critical cleanup error:", err);
  process.exit(1);
});
