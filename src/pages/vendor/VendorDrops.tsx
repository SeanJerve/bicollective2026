import { useState } from "react";
import { Plus, Trash2, Calendar, Power } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import DocumentUpload from "@/components/vendor/DocumentUpload";
import BrutalistConfirmModal from "@/components/ui/BrutalistConfirmModal";

const VendorDrops = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingDropId, setEditingDropId] = useState<string | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [dropToDeleteId, setDropToDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    image_url: "",
    launch_date: "",
    is_active: true,
  });

  const [showQuickProduct, setShowQuickProduct] = useState(false);
  const [quickProduct, setQuickProduct] = useState({
    name: "",
    price: 0,
    description: "",
    image_url: "",
  });
  const [addingQuickProduct, setAddingQuickProduct] = useState(false);

  const handleAddQuickProduct = async () => {
    if (!quickProduct.name) {
      toast({ title: "Please enter product name", variant: "destructive" });
      return;
    }
    if (!brand?.id) {
      toast({ title: "Brand not found", variant: "destructive" });
      return;
    }

    setAddingQuickProduct(true);
    try {
      const slug = quickProduct.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const { data, error } = await supabase
        .from("products")
        .insert({
          brand_id: brand.id,
          name: quickProduct.name,
          slug,
          price: quickProduct.price || 0,
          description: quickProduct.description || null,
          image_url: quickProduct.image_url || null,
          listing_type: "teaser",
          in_stock: true,
          is_active: true,
        })
        .select("id")
        .single();

      if (error) throw error;

      await supabase.from("product_variants").insert({
        product_id: data.id,
        size: "M",
        stock_quantity: 10,
      });

      setSelectedProductIds((prev) => [...prev, data.id]);
      queryClient.invalidateQueries({ queryKey: ["vendor-products-for-drops"] });

      toast({ title: "Teaser product created & assigned" });
      setShowQuickProduct(false);
      setQuickProduct({ name: "", price: 0, description: "", image_url: "" });
    } catch (err: any) {
      toast({ title: "Error creating product", description: err.message, variant: "destructive" });
    } finally {
      setAddingQuickProduct(false);
    }
  };

  // Get brand id for current vendor
  const { data: brand } = useQuery({
    queryKey: ["vendor-brand", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("id")
        .eq("owner_id", user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Get active products for current brand
  const { data: vendorProducts } = useQuery({
    queryKey: ["vendor-products-for-drops", brand?.id],
    queryFn: async () => {
      if (!brand?.id) return [];
      const { data, error } = await supabase
        .from("products")
        .select("id, name, image_url, drop_id")
        .eq("brand_id", brand.id)
        .eq("is_active", true);
      if (error) throw error;
      return data || [];
    },
    enabled: !!brand?.id,
  });

  const { data: drops, isLoading } = useQuery({
    queryKey: ["vendor-drops", brand?.id],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("product_drops" as any)
        .select(
          `
          *,
          notifications:product_drop_notifications(count)
        `
        )
        .eq("brand_id", brand?.id)
        .order("launch_date", { ascending: true }) as any);
      if (error) throw error;
      return data;
    },
    enabled: !!brand?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async (formData: typeof form) => {
      let dropId = editingDropId;

      if (editingDropId) {
        // Update existing drop
        const { error } = await (supabase
          .from("product_drops" as any)
          .update({
            title: formData.title,
            description: formData.description || null,
            image_url: formData.image_url,
            launch_date: new Date(formData.launch_date).toISOString(),
            is_active: formData.is_active,
          })
          .eq("id", editingDropId) as any);
        if (error) throw error;
      } else {
        // Insert new drop
        const { data, error } = await (supabase
          .from("product_drops" as any)
          .insert({
            brand_id: brand?.id,
            title: formData.title,
            description: formData.description || null,
            image_url: formData.image_url,
            launch_date: new Date(formData.launch_date).toISOString(),
            is_active: formData.is_active,
          })
          .select("id")
          .single() as any);
        if (error) throw error;
        dropId = data.id;
      }

      if (dropId) {
        // Sync products drop_id associations
        // 1. Clear drop_id for products previously linked to this drop
        await supabase
          .from("products")
          .update({ drop_id: null })
          .eq("drop_id", dropId);

        // 2. Set drop_id for currently selected products
        if (selectedProductIds.length > 0) {
          const { error: updateError } = await supabase
            .from("products")
            .update({ drop_id: dropId })
            .in("id", selectedProductIds);
          if (updateError) throw updateError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-drops"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-products-for-drops"] });
      toast({ title: editingDropId ? "Drop updated successfully" : "Trailer created successfully" });
      setShowForm(false);
      setEditingDropId(null);
      setSelectedProductIds([]);
      setForm({ title: "", description: "", image_url: "", launch_date: "", is_active: true });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await (supabase
        .from("product_drops" as any)
        .update({ is_active })
        .eq("id", id) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-drops"] });
      toast({ title: "Status updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase
        .from("product_drops" as any)
        .delete()
        .eq("id", id) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-drops"] });
      toast({ title: "Trailer deleted" });
    },
  });

  return (
    <div className="p-4 md:p-8 w-full">
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl uppercase">Upcoming Drops</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Create trailers and announcements for future product launches.
          </p>
        </div>
        {!showForm && drops && drops.length > 0 && (
          <button onClick={() => setShowForm(true)} className="btn-brutal text-sm md:text-base">
            <Plus className="w-4 h-4 mr-2" />
            New Trailer
          </button>
        )}
      </div>

      {showForm && (
        <div className="card-brutal p-6 mb-8 bg-secondary/10 border-2 border-foreground">
          <h2 className="font-heading text-xl uppercase mb-4">
            {editingDropId ? "Edit Drop Trailer" : "Create New Drop Trailer"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="font-heading text-sm uppercase tracking-wide mb-1.5 block">
                  Release Title *
                </label>
                <input
                  type="text"
                  required
                  className="input-brutal w-full"
                  placeholder="e.g. Summer Collection '26"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div>
                <label className="font-heading text-sm uppercase tracking-wide mb-1.5 block">
                  Launch Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  className="input-brutal w-full"
                  value={form.launch_date}
                  onChange={(e) => setForm({ ...form, launch_date: e.target.value })}
                />
              </div>

              <div>
                <label className="font-heading text-sm uppercase tracking-wide mb-1.5 block">
                  Description
                </label>
                <textarea
                  className="input-brutal w-full min-h-[80px]"
                  placeholder="Briefly describe what customers can expect..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              {/* Product Selection Checklist */}
              <div>
                <label className="font-heading text-sm uppercase tracking-wide mb-1.5 block">
                  Assign Products to Drop Trailer
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto border-2 border-foreground p-3 bg-background">
                  {vendorProducts && vendorProducts.length > 0 ? (
                    vendorProducts.map((p) => {
                      const isChecked = selectedProductIds.includes(p.id);
                      return (
                        <label key={p.id} className="flex items-center gap-2 text-xs md:text-sm cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setSelectedProductIds((prev) =>
                                isChecked ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                              );
                            }}
                            className="w-4 h-4 border-2 border-foreground accent-foreground rounded-none cursor-pointer"
                          />
                          <img
                            src={p.image_url || "/placeholder.svg"}
                            className="w-6 h-6 object-cover border border-foreground flex-shrink-0"
                            alt=""
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.svg";
                            }}
                          />
                          <span className="truncate flex-1 text-foreground">{p.name}</span>
                          {p.drop_id && p.drop_id !== editingDropId && (
                            <span className="text-[9px] bg-amber-100 text-amber-800 px-1 border border-amber-200">
                              Linked to another drop
                            </span>
                          )}
                        </label>
                      );
                    })
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      No products found. Create some products first!
                    </p>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Selected products will be displayed in the teaser drop modal and marked as teasers.
                </p>

                <div className="mt-3">
                  {!showQuickProduct ? (
                    <button
                      type="button"
                      onClick={() => setShowQuickProduct(true)}
                      className="text-xs uppercase font-heading underline hover:text-accent flex items-center gap-1"
                    >
                      + Create New Teaser Product
                    </button>
                  ) : (
                    <div className="p-4 border-2 border-foreground bg-secondary/5 space-y-3 mt-2 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <h4 className="font-heading text-xs uppercase">New Teaser Product Details</h4>
                        <button
                          type="button"
                          onClick={() => setShowQuickProduct(false)}
                          className="text-[10px] font-heading uppercase underline hover:text-destructive"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">
                            Product Name *
                          </label>
                          <input
                            type="text"
                            className="input-brutal w-full text-xs p-2"
                            placeholder="e.g. Summer Hat"
                            value={quickProduct.name}
                            onChange={(e) => setQuickProduct({ ...quickProduct, name: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">
                            Preview Price (Optional, 0 for TBA)
                          </label>
                          <input
                            type="number"
                            className="input-brutal w-full text-xs p-2"
                            placeholder="0.00"
                            value={quickProduct.price || ""}
                            onChange={(e) => setQuickProduct({ ...quickProduct, price: Number(e.target.value) })}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">
                          Description (Optional)
                        </label>
                        <textarea
                          className="input-brutal w-full text-xs p-2 min-h-[50px]"
                          placeholder="Brief teaser description..."
                          value={quickProduct.description}
                          onChange={(e) => setQuickProduct({ ...quickProduct, description: e.target.value })}
                        />
                      </div>

                      <DocumentUpload
                        label="Product Image (Optional)"
                        description="JPG or PNG."
                        bucket="product-images"
                        folder={brand?.id || "unknown"}
                        value={quickProduct.image_url || undefined}
                        onChange={(url) => setQuickProduct({ ...quickProduct, image_url: url || "" })}
                      />

                      <button
                        type="button"
                        disabled={addingQuickProduct || !quickProduct.name}
                        onClick={handleAddQuickProduct}
                        className="btn-brutal text-xs py-1.5 px-3 uppercase font-heading bg-foreground text-background w-full flex items-center justify-center gap-1.5"
                      >
                        {addingQuickProduct ? "Creating..." : "Create & Add Product"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="active"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="w-5 h-5 accent-foreground"
                />
                <label htmlFor="active" className="font-heading text-sm uppercase">
                  Make Visible Immediately
                </label>
              </div>
            </div>

            <div>
              <DocumentUpload
                label="Trailer Image / Banner *"
                description="Use an engaging image (1200x600px recommended). JPG or PNG."
                bucket="brand-assets"
                folder={user?.id || "unknown"}
                accept="image/*"
                value={form.image_url || undefined}
                onChange={(url) => setForm({ ...form, image_url: url || "" })}
              />
              {form.image_url && (
                <div className="mt-4 border-2 border-foreground overflow-hidden bg-muted aspect-video">
                  <img
                    src={form.image_url}
                    alt="Trailer Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg";
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4 mt-8 pt-4 border-t border-border-subtle">
            <button
              onClick={() => saveMutation.mutate(form)}
              disabled={
                saveMutation.isPending || !form.title || !form.launch_date || !form.image_url
              }
              className="btn-brutal"
            >
              {saveMutation.isPending
                ? "Saving..."
                : editingDropId
                  ? "Save Changes"
                  : "Publish Trailer"}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingDropId(null);
                setSelectedProductIds([]);
                setForm({ title: "", description: "", image_url: "", launch_date: "", is_active: true });
              }}
              className="btn-brutal-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 skeleton-brutal" />
          <div className="h-64 skeleton-brutal" />
        </div>
      ) : drops && drops.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {drops.map((drop: any) => {
            const isLaunched = new Date(drop.launch_date) <= new Date();
            const notifCount = drop.notifications?.[0]?.count || 0;

            return (
              <div
                key={drop.id}
                className={`card-brutal flex flex-col overflow-hidden ${!drop.is_active ? "opacity-60" : ""}`}
              >
                <div className="relative aspect-video bg-muted border-b-2 border-foreground">
                  <img
                    src={drop.image_url}
                    alt={drop.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg";
                    }}
                  />
                  <div className="absolute top-2 right-2 flex flex-col gap-2">
                    <span
                      className={`px-2 py-1 text-xs font-bold uppercase ${drop.is_active ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}`}
                    >
                      {drop.is_active ? "Visible" : "Hidden"}
                    </span>
                    {isLaunched && (
                      <span className="px-2 py-1 text-xs font-bold uppercase bg-foreground text-background">
                        Launched
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col bg-background">
                  <h3
                    className="font-heading text-lg uppercase mb-1 line-clamp-1"
                    title={drop.title}
                  >
                    {drop.title}
                  </h3>
                  <div className="flex items-center text-xs text-muted-foreground mb-3 bg-secondary/50 p-2 border border-border-subtle">
                    <Calendar className="w-4 h-4 mr-2 text-foreground" />
                    <span className="font-medium text-foreground">
                      {new Date(drop.launch_date).toLocaleString()}
                    </span>
                  </div>

                  {drop.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {drop.description}
                    </p>
                  )}

                  <div className="mt-auto">
                    {(() => {
                      const linkedProductsCount = vendorProducts?.filter((p) => p.drop_id === drop.id).length || 0;
                      return (
                        <div className="flex flex-wrap gap-2 items-center justify-between mb-4">
                          <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            {notifCount} User{notifCount !== 1 ? "s" : ""} Notified
                          </span>
                          <span className="text-xs font-medium bg-secondary text-foreground px-2 py-1 flex items-center gap-1 border border-border-subtle">
                            {linkedProductsCount} Product{linkedProductsCount !== 1 ? "s" : ""} Linked
                          </span>
                        </div>
                      );
                    })()}

                    <div className="flex items-center gap-2 border-t border-border-subtle pt-4">
                      <button
                        onClick={() => {
                          setEditingDropId(drop.id);
                          setForm({
                            title: drop.title,
                            description: drop.description || "",
                            image_url: drop.image_url || "",
                            launch_date: drop.launch_date ? drop.launch_date.slice(0, 16) : "",
                            is_active: drop.is_active,
                          });
                          const linkedIds = vendorProducts?.filter((p) => p.drop_id === drop.id).map((p) => p.id) || [];
                          setSelectedProductIds(linkedIds);
                          setShowForm(true);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="flex-1 text-xs px-3 py-2 flex items-center justify-center font-bold uppercase transition-colors border-2 border-foreground bg-secondary hover:bg-foreground hover:text-background"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() =>
                          toggleActive.mutate({ id: drop.id, is_active: !drop.is_active })
                        }
                        className={`px-3 py-2 flex items-center justify-center font-bold uppercase transition-colors border-2 border-foreground ${drop.is_active ? "bg-secondary hover:bg-foreground hover:text-background" : "bg-success hover:bg-success/90 text-success-foreground"}`}
                        title={drop.is_active ? "Hide Trailer" : "Show Trailer"}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDropToDeleteId(drop.id)}
                        className="btn-brutal-secondary text-destructive px-3 py-2"
                        title="Delete Trailer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card-brutal p-12 text-center bg-secondary/5 border-dashed">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="font-heading text-xl uppercase mb-2">No Upcoming Drops</h2>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            Build hype by scheduling trailers for your future collections and products.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="btn-brutal px-8 shadow-[4px_4px_0_0_#000]"
          >
            <Plus className="w-4 h-4 mr-2" /> Create First Trailer
          </button>
        </div>
      )}

      <BrutalistConfirmModal
        isOpen={dropToDeleteId !== null}
        title="Delete Trailer?"
        message="Are you sure you want to delete this trailer?"
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={() => {
          if (dropToDeleteId) {
            deleteMutation.mutate(dropToDeleteId);
            setDropToDeleteId(null);
          }
        }}
        onCancel={() => setDropToDeleteId(null)}
      />
    </div>
  );
};

export default VendorDrops;
