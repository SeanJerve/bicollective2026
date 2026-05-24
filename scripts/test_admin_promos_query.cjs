const { getLocalSupabase } = require('./_local-supabase.cjs');
const supabase = getLocalSupabase();

async function check() {
  const { data, error } = await supabase.from("platform_promos").select(`
    *,
    discounts:discounts(*),
    promotion_targets(*)
  `);
  if (error) {
    console.error('QUERY ERROR:', error);
  } else {
    console.log('QUERY SUCCESS:');
    console.log(JSON.stringify(data, null, 2));
  }
}
check();
