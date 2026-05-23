import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import ProductForm from "@/components/vendor/ProductForm";
import BrutalistConfirmModal from "@/components/ui/BrutalistConfirmModal";

const VendorProducts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [brand, setBrand] = useState<any>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productToDeleteId, setProductToDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch brand
        const { data: brandData } = await supabase
          .from("brands")
          .select("*")
          .eq("owner_id", user.id)
          .maybeSingle();

        if (!brandData) {
          setLoading(false);
          return;
        }

        setBrand(brandData);

        // Fetch products and categories in parallel
        const [productsRes, categoriesRes] = await Promise.all([
          supabase
            .from("products")
            .select(
              `*, category:categories (name), product_variants(id, size, stock_quantity), product_images(image_url, sort_order)`
            )
            .eq("brand_id", brandData.id)
            .is("deleted_at", null)
            .order("created_at", { ascending: false }),
          supabase.from("categories").select("id, name").order("name"),
        ]);

        // Calculate total stock for each product
        const productsWithStock = (productsRes.data || []).map((p: any) => {
          const totalStock =
            p.product_variants?.reduce((sum: number, v: any) => sum + (v.stock_quantity || 0), 0) ||
            0;
          return { ...p, totalStock };
        });

        setProducts(productsWithStock);
        setCategories(categoriesRes.data || []);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const refreshProducts = async () => {
    if (!brand) return;

    const { data } = await supabase
      .from("products")
      .select(
        `*, category:categories (name), product_variants(id, size, stock_quantity), product_images(image_url, sort_order)`
      )
      .eq("brand_id", brand.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    const productsWithStock = (data || []).map((p: any) => {
      const totalStock =
        p.product_variants?.reduce((sum: number, v: any) => sum + (v.stock_quantity || 0), 0) || 0;
      return { ...p, totalStock };
    });

    setProducts(productsWithStock);
  };

  const toggleActive = async (productId: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ is_active: !currentActive })
        .eq("id", productId);

      if (error) throw error;

      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, is_active: !currentActive } : p))
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
    try {
      // Soft delete - set deleted_at timestamp instead of hard delete
      const { error } = await supabase
        .from("products")
        .update({ deleted_at: new Date().toISOString(), is_active: false })
        .eq("id", productId);

      if (error) throw error;

      setProducts((prev) => prev.filter((p) => p.id !== productId));

      toast({
        title: "Product deleted",
        description: "Product has been archived and removed from the marketplace",
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

  const handleEditProduct = (product: any) => {
    setEditingProduct({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: Number(product.price),
      originalPrice: product.original_price ? Number(product.original_price) : undefined,
      description: product.description,
      categoryId: product.category_id,
      imageUrl: product.image_url,
      images: (product.product_images || [])
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
        .map((img: any) => img.image_url),
      inStock: product.in_stock,
      variants: product.product_variants || [],
      dropId: product.drop_id,
    });
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 skeleton-brutal" />
          <div className="h-64 skeleton-brutal" />
        </div>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="p-4 md:p-8">
        <div className="card-brutal p-6 md:p-8 text-center">
          <h2 className="font-heading text-xl md:text-2xl uppercase mb-4">
            Set Up Your Store First
          </h2>
          <p className="text-muted-foreground mb-6 text-sm md:text-base">
            You need to set up your store before adding products.
          </p>
          <Link to="/vendor/store" className="btn-brutal">
            Set Up Store
          </Link>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="p-4 md:p-8">
        <h1 className="font-heading text-2xl md:text-4xl uppercase mb-6 md:mb-8">
          {editingProduct ? "Edit Product" : "Add Product"}
        </h1>
        <div className="card-brutal p-4 md:p-6">
          <ProductForm
            brandId={brand.id}
            categories={categories}
            initialData={editingProduct}
            onSuccess={() => {
              setShowForm(false);
              setEditingProduct(null);
              refreshProducts();
            }}
            onCancel={() => {
              setShowForm(false);
              setEditingProduct(null);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="font-heading text-2xl md:text-4xl uppercase">Products</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            {products.length} {products.length === 1 ? "product" : "products"}
          </p>
        </div>
        {!showForm && products.length > 0 && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-brutal flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5" />
            Add Product
          </button>
        )}
      </div>

      {products.length > 0 ? (
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {products.map((product) => (
              <div key={product.id} className="card-brutal p-4">
                <div className="flex gap-4">
                  <div className="w-20 h-24 bg-muted flex-shrink-0 overflow-hidden">
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg";
                        }}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{product.name}</h3>
                    <p className="text-xs text-muted-foreground">{product.category?.name || "-"}</p>
                    <p className="font-heading mt-1">{formatPrice(Number(product.price))}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs font-heading">{product.totalStock} in stock</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`px-2 py-0.5 text-xs uppercase ${
                          product.is_active
                            ? "bg-success text-success-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {product.is_active ? "Active" : "Hidden"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-border-subtle">
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
                  <button
                    onClick={() => handleEditProduct(product)}
                    className="p-2 hover:bg-secondary"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setProductToDeleteId(product.id)}
                    className="p-2 hover:bg-destructive hover:text-destructive-foreground"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block card-brutal overflow-hidden">
            <div className="overflow-x-auto">
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
                          <div className="w-12 h-16 bg-muted flex-shrink-0 overflow-hidden">
                            {product.image_url && (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = "/placeholder.svg";
                                }}
                              />
                            )}
                          </div>
                          <span className="font-medium">{product.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">{product.category?.name || "-"}</td>
                      <td className="p-4">{formatPrice(Number(product.price))}</td>
                      <td className="p-4">
                        {product.totalStock > 0 ? (
                          <span className="text-success font-heading">
                            {product.totalStock} in stock
                          </span>
                        ) : (
                          <span className="text-destructive font-heading">Out of Stock</span>
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
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="p-2 hover:bg-secondary"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setProductToDeleteId(product.id)}
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
          </div>
        </>
      ) : (
        <div className="card-brutal p-8 md:p-12 text-center">
          <h3 className="font-heading text-xl md:text-2xl uppercase mb-4">No Products Yet</h3>
          <p className="text-muted-foreground mb-6 text-sm md:text-base">
            Start by adding your first product.
          </p>
          <button onClick={() => setShowForm(true)} className="btn-brutal">
            Add Product
          </button>
        </div>
      )}

      <BrutalistConfirmModal
        isOpen={productToDeleteId !== null}
        title="Delete Product?"
        message="Are you sure you want to delete this product? It will be hidden from the marketplace."
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={() => {
          if (productToDeleteId) {
            deleteProduct(productToDeleteId);
            setProductToDeleteId(null);
          }
        }}
        onCancel={() => setProductToDeleteId(null)}
      />
    </div>
  );
};

export default VendorProducts;
