import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface LowStockVariant {
  id: string;
  size: string;
  stock_quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

const LowStockAlert = ({ brandId }: { brandId: string }) => {
  const [variants, setVariants] = useState<LowStockVariant[]>([]);

  useEffect(() => {
    if (!brandId) return;
    // Query product_variants (replaces products.stock_quantity which was dropped)
    (supabase as any)
      .from("product_variants")
      .select("id, size, stock_quantity, product:products!inner(id, name, slug, brand_id)")
      .eq("product.brand_id", brandId)
      .lt("stock_quantity", 5)
      .gt("stock_quantity", 0)
      .order("stock_quantity", { ascending: true })
      .limit(8)
      .then(({ data }: any) => setVariants(data || []));
  }, [brandId]);

  if (variants.length === 0) return null;

  return (
    <div className="card-brutal border-destructive/50 mb-6 md:mb-8">
      <div className="p-4 md:p-6 bg-destructive/10 flex items-center gap-3 border-b-2 border-foreground">
        <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
        <h2 className="font-heading text-base md:text-lg uppercase">Low Stock Alert</h2>
      </div>
      <div className="divide-y divide-border-subtle">
        {variants.map((v) => (
          <div key={v.id} className="p-4 md:px-6 flex items-center justify-between">
            <span className="text-sm truncate flex-1">
              {v.product?.name} — <span className="text-muted-foreground">Size {v.size}</span>
            </span>
            <div className="flex items-center gap-3 flex-shrink-0 ml-3">
              <span className="font-heading text-destructive">{v.stock_quantity} left</span>
              <Link to="/vendor/products" className="text-xs underline text-muted-foreground hover:text-foreground">Edit</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LowStockAlert;
