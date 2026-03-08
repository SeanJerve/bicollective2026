import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Loader2, Package, Search, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Pagination from "@/components/admin/Pagination";

const ITEMS_PER_PAGE = 20;

const AdminProducts = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("active");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [categories, setCategories] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [filter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter, categoryFilter]);

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("id, name").order("name");
    setCategories(data || []);
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("products")
        .select(`*, brand:brands(name, slug), category:categories(name)`)
        .order("created_at", { ascending: false });

      if (filter === "active") query = query.eq("is_active", true);
      else if (filter === "hidden") query = query.eq("is_active", false);
      else if (filter === "low_stock") query = query.lt("stock_quantity", 5);

      const { data, error } = await query;
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (productId: string, currentActive: boolean) => {
    try {
      const { error } = await supabase.from("products").update({ is_active: !currentActive }).eq("id", productId);
      if (error) throw error;
      setProducts((prev) => prev.map((p) => p.id === productId ? { ...p, is_active: !currentActive } : p));
      toast({ title: currentActive ? "Product hidden" : "Product activated" });
    } catch {
      toast({ title: "Error", description: "Failed to update product", variant: "destructive" });
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm("Permanently delete this product? This cannot be undone.")) return;
    try {
      const { error } = await supabase.from("products").delete().eq("id", productId);
      if (error) throw error;
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      toast({ title: "Product deleted permanently" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete", variant: "destructive" });
    }
  };

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount);

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.brand?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || p.category_id === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="font-heading text-2xl md:text-4xl uppercase">Products</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Manage all marketplace products ({filteredProducts.length} total)
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search products or brands..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-brutal w-full pl-10" />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="input-brutal w-full sm:w-auto">
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input-brutal w-full sm:w-auto">
          <option value="active">Active</option>
          <option value="hidden">Hidden</option>
          <option value="low_stock">Low Stock</option>
          <option value="all">All</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : paginatedProducts.length === 0 ? (
        <div className="card-brutal p-8 md:p-12 text-center">
          <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-heading text-xl uppercase mb-2">No Products</h3>
          <p className="text-muted-foreground text-sm">No products match your filters</p>
        </div>
      ) : (
        <>
          {/* Mobile */}
          <div className="md:hidden space-y-4">
            {paginatedProducts.map((product) => (
              <div key={product.id} className="card-brutal p-4">
                <div className="flex gap-4">
                  <div className="w-16 h-20 bg-muted flex-shrink-0 overflow-hidden">
                    {product.image_url && <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{product.name}</h3>
                    <p className="text-xs text-muted-foreground">{product.brand?.name}</p>
                    <p className="font-heading mt-1">{formatPrice(Number(product.price))}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-0.5 text-xs uppercase ${product.is_active ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}`}>
                        {product.is_active ? "Active" : "Hidden"}
                      </span>
                      {(product.stock_quantity ?? 0) < 5 && (
                        <span className="px-2 py-0.5 text-xs uppercase bg-destructive text-destructive-foreground">Low Stock ({product.stock_quantity})</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-border-subtle">
                  <button onClick={() => toggleActive(product.id, product.is_active)} className="p-2 hover:bg-secondary">
                    {product.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <Link to={`/products/${product.slug}`} className="p-2 hover:bg-secondary"><Eye className="w-4 h-4" /></Link>
                  <button onClick={() => deleteProduct(product.id)} className="p-2 hover:bg-destructive/20"><Trash2 className="w-4 h-4 text-destructive" /></button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop */}
          <div className="hidden md:block card-brutal overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary">
                  <tr>
                    <th className="text-left p-4 font-heading text-sm uppercase">Product</th>
                    <th className="text-left p-4 font-heading text-sm uppercase">Brand</th>
                    <th className="text-left p-4 font-heading text-sm uppercase">Category</th>
                    <th className="text-left p-4 font-heading text-sm uppercase">Price</th>
                    <th className="text-left p-4 font-heading text-sm uppercase">Stock</th>
                    <th className="text-left p-4 font-heading text-sm uppercase">Status</th>
                    <th className="text-right p-4 font-heading text-sm uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {paginatedProducts.map((product) => (
                    <tr key={product.id}>
                      <td className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-14 bg-muted flex-shrink-0 overflow-hidden">
                            {product.image_url && <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />}
                          </div>
                          <span className="font-medium">{product.name}</span>
                        </div>
                      </td>
                      <td className="p-4"><Link to={`/brands/${product.brand?.slug}`} className="text-muted-foreground hover:underline">{product.brand?.name}</Link></td>
                      <td className="p-4 text-muted-foreground">{product.category?.name || "-"}</td>
                      <td className="p-4">{formatPrice(Number(product.price))}</td>
                      <td className="p-4">
                        <span className={`font-heading ${(product.stock_quantity ?? 0) < 5 ? "text-destructive" : ""}`}>
                          {product.stock_quantity ?? 0}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-xs uppercase ${product.is_active ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}`}>
                          {product.is_active ? "Active" : "Hidden"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => toggleActive(product.id, product.is_active)} className="p-2 hover:bg-secondary" title={product.is_active ? "Hide" : "Show"}>
                            {product.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <Link to={`/products/${product.slug}`} className="p-2 hover:bg-secondary" title="View"><Eye className="w-4 h-4" /></Link>
                          <button onClick={() => deleteProduct(product.id)} className="p-2 hover:bg-destructive/20" title="Delete"><Trash2 className="w-4 h-4 text-destructive" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </>
      )}
    </div>
  );
};

export default AdminProducts;
