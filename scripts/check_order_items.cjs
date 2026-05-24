const { getLocalSupabase } = require('./_local-supabase.cjs');
const supabase = getLocalSupabase();

async function check() {
  const { data: orderItems, error } = await supabase.from('order_items').select('*');
  if (error) console.error(error);
  else console.log(JSON.stringify(orderItems.slice(-10), null, 2));
}
check();
