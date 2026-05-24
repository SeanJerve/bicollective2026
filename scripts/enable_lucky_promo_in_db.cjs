const { getLocalSupabase } = require('./_local-supabase.cjs');
const supabase = getLocalSupabase();

async function enable() {
  console.log('Enabling Lucky Promo in database settings...');
  const { error } = await supabase
    .from('lucky_promo_settings')
    .update({
      is_active: true,
      active_hours_start: null,
      active_hours_end: null
    })
    .neq('id', '00000000-0000-0000-0000-000000000000'); // matches all

  if (error) {
    console.error('Error enabling Lucky Promo:', error);
  } else {
    console.log('Successfully enabled Lucky Promo! settings is_active=true, hours=24/7.');
  }
}
enable();
