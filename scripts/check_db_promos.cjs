const { getLocalSupabase } = require('./_local-supabase.cjs');
const supabase = getLocalSupabase();

async function check() {
  console.log('--- Platform Promos (Raw) ---');
  const { data: promos, error: err1 } = await supabase.from('platform_promos').select('*');
  console.log(JSON.stringify(promos, null, 2));

  console.log('--- Discounts (Raw) ---');
  const { data: discounts, error: err2 } = await supabase.from('discounts').select('*');
  console.log(JSON.stringify(discounts, null, 2));
}
check();
