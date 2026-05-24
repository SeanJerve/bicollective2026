const { getLocalSupabase } = require('./_local-supabase.cjs');
const supabase = getLocalSupabase();

async function check() {
  console.log('--- get_lucky_promo_public_info ---');
  const { data, error } = await supabase.rpc('get_lucky_promo_public_info');
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));

  console.log('\n--- lucky_promo_settings ---');
  const { data: raw, error: rawErr } = await supabase.from('lucky_promo_settings').select('*');
  if (rawErr) console.error(rawErr);
  else console.log(JSON.stringify(raw, null, 2));
}
check();
