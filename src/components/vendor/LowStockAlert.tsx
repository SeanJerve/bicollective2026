import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface LowStockProduct {
  id: string;
  name: string;
  slug: string;
  stock_quantity: number;
}

const LowStockAlert = ({ brandId }: { brandId: string }) => {
  const [products, setProducts] = useState<LowStockProduct[]>([]);

  useEffect(() => {
    if (!brandId) return;
    supabase
      .from("products")
      .select("id, name, slug, stock_quantity")
      .eq("brand_id", brandId)
      .eq("is_active", true)
      .lt("stock_quantity", 5)
      .order("stock_quantity", { ascending: true })
      .limit(5)
      .then(({ data }) => setProducts(data || []));
  }, [brandId]);

  if (products.length === 0) return null;

  return (
    <div className="card-brutal border-destructive/50 mb-6 md:mb-8">
      <div className="p-4 md:p-6 bg-destructive/10 flex items-center gap-3 border-b-2 border-foreground">
        <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
        <h2 className="font-heading text-base md:text-lg uppercase">Low Stock Alert</h2>
      </div>
      <div className="divide-y divide-border-subtle">
        {products.map((p) => (
          <div key={p.id} className="p-4 md:px-6 flex items-center justify-between">
            <span className="text-sm truncate flex-1">{p.name}</span>
            <div className="flex items-center gap-3 flex-shrink-0 ml-3">
              <span className="font-heading text-destructive">{p.stock_quantity} left</span>
              <Link to="/vendor/products" className="text-xs underline text-muted-foreground hover:text-foreground">Edit</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LowStockAlert;
