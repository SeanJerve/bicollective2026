import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const VendorProducts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [brand, setBrand] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!user) return;

      try {
        const { data: brandData } = await supabase
          .from("brands")
          .select("*")
          .eq("owner_id", user.id)
          .single();

        if (!brandData) {
          setLoading(false);
          return;
        }

        setBrand(brandData);

        const { data: productsData } = await supabase
          .from("products")
          .select(`
            *,
            category:categories (name)
          `)
          .eq("brand_id", brandData.id)
          .order("created_at", { ascending: false });

        setProducts(productsData || []);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [user]);

  const toggleActive = async (productId: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ is_active: !currentActive })
        .eq("id", productId);

      if (error) throw error;

      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, is_active: !currentActive } : p
        )
      );

      toast({
        title: currentActive ? "Product hidden" : "Product visible",
        description: currentActive
          ? "Product is now hidden from the marketplace"
          : "Product is now visible on the marketplace",
      });
    } catch (error) {
      console.error("Error toggling product:", error);
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      });
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

      if (error) throw error;

      setProducts((prev) => prev.filter((p) => p.id !== productId));

      toast({
        title: "Product deleted",
        description: "Product has been removed",
      });
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 skeleton-brutal" />
          <div className="h-64 skeleton-brutal" />
        </div>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="p-8">
        <div className="card-brutal p-8 text-center">
          <h2 className="font-heading text-2xl uppercase mb-4">Set Up Your Store First</h2>
          <p className="text-muted-foreground mb-6">
            You need to set up your store before adding products.
          </p>
          <Link to="/vendor/store" className="btn-brutal">
            Set Up Store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-4xl uppercase">Products</h1>
          <p className="text-muted-foreground mt-1">
            {products.length} {products.length === 1 ? "product" : "products"}
          </p>
        </div>
        <Link to="/vendor/products/new" className="btn-brutal flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Product
        </Link>
      </div>

      {products.length > 0 ? (
        <div className="card-brutal overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary">
              <tr>
                <th className="text-left p-4 font-heading text-sm uppercase">Product</th>
                <th className="text-left p-4 font-heading text-sm uppercase">Category</th>
                <th className="text-left p-4 font-heading text-sm uppercase">Price</th>
                <th className="text-left p-4 font-heading text-sm uppercase">Stock</th>
                <th className="text-left p-4 font-heading text-sm uppercase">Status</th>
                <th className="text-right p-4 font-heading text-sm uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-16 bg-muted flex-shrink-0">
                        {product.image_url && (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <span className="font-medium">{product.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {product.category?.name || "-"}
                  </td>
                  <td className="p-4">{formatPrice(Number(product.price))}</td>
                  <td className="p-4">
                    {product.in_stock ? (
                      <span className="text-success">In Stock</span>
                    ) : (
                      <span className="text-destructive">Out of Stock</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 text-xs uppercase ${
                        product.is_active
                          ? "bg-success text-success-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {product.is_active ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => toggleActive(product.id, product.is_active)}
                        className="p-2 hover:bg-secondary"
                        title={product.is_active ? "Hide" : "Show"}
                      >
                        {product.is_active ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                      <Link
                        to={`/vendor/products/${product.id}/edit`}
                        className="p-2 hover:bg-secondary"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => deleteProduct(product.id)}
                        className="p-2 hover:bg-destructive hover:text-destructive-foreground"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card-brutal p-12 text-center">
          <h3 className="font-heading text-2xl uppercase mb-4">No Products Yet</h3>
          <p className="text-muted-foreground mb-6">
            Start by adding your first product.
          </p>
          <Link to="/vendor/products/new" className="btn-brutal">
            Add Product
          </Link>
        </div>
      )}
    </div>
  );
};

export default VendorProducts;
