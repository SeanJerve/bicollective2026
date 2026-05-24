const { getLocalSupabase } = require('./_local-supabase.cjs');
const supabase = getLocalSupabase();

async function check() {
  const { data: promos, error } = await supabase.from('platform_promos').select(`
    *,
    discount:discounts(*)
  `);
  if (error) console.error(error);
  else console.log(JSON.stringify(promos, null, 2));
}
check();
