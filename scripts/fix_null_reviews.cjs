const { getLocalSupabase } = require('./_local-supabase.cjs');
const supabase = getLocalSupabase();

async function fix() {
  console.log('Fetching reviews with null product_id...');
  const { data: reviews, error: fetchError } = await supabase
    .from('reviews')
    .select('id, vendor_order_id')
    .is('product_id', null);

  if (fetchError) {
    console.error('Error fetching reviews:', fetchError);
    return;
  }

  console.log(`Found ${reviews.length} reviews with null product_id.`);

  for (const review of reviews) {
    if (!review.vendor_order_id) {
      console.log(`Review ${review.id} has no vendor_order_id, skipping.`);
      continue;
    }

    // Find the product_id from order_items
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('product_id, variant_id')
      .eq('vendor_order_id', review.vendor_order_id)
      .limit(1);

    if (itemsError || !orderItems || orderItems.length === 0) {
      console.log(`Could not find order item for vendor_order_id ${review.vendor_order_id}`);
      continue;
    }

    let productId = orderItems[0].product_id;

    // If product_id is null in order_items, resolve it from product_variants
    if (!productId && orderItems[0].variant_id) {
      const { data: variant, error: varError } = await supabase
        .from('product_variants')
        .select('product_id')
        .eq('id', orderItems[0].variant_id)
        .maybeSingle();

      if (!varError && variant) {
        productId = variant.product_id;
      }
    }

    if (productId) {
      console.log(`Updating review ${review.id} with product_id ${productId}`);
      const { error: updateError } = await supabase
        .from('reviews')
        .update({ product_id: productId })
        .eq('id', review.id);

      if (updateError) {
        console.error(`Error updating review ${review.id}:`, updateError);
      } else {
        console.log(`Successfully updated review ${review.id}`);
      }
    } else {
      console.log(`Could not resolve product_id for review ${review.id}`);
    }
  }
  console.log('Done fixing null reviews!');
}

fix();
