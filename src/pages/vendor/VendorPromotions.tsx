import { useState } from "react";
import {
  Tag,
  Plus,
  Percent,
  DollarSign,
  Truck,
  Power,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  BarChart3,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import BrutalistConfirmModal from "@/components/ui/BrutalistConfirmModal";

interface VendorPromoForm {
  name: string;
  description: string;
  code: string;
  type: "percentage_discount" | "fixed_discount" | "free_shipping";
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  max_uses: number | null;
  max_uses_per_user: number;
  starts_at: string;
  ends_at: string;
}

const defaultForm: VendorPromoForm = {
  name: "",
  description: "",
  code: "",
  type: "percentage_discount",
  discount_value: 10,
  min_order_amount: 0,
  max_discount_amount: null,
  max_uses: null,
  max_uses_per_user: 1,
  starts_at: new Date().toISOString().slice(0, 16),
  ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
};

const VendorPromotions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<VendorPromoForm>(defaultForm);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [promoToDeleteId, setPromoToDeleteId] = useState<string | null>(null);

  const { data: brand } = useQuery({
    queryKey: ["vendor-brand", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("*")
        .eq("owner_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: promotions, isLoading } = useQuery({
    queryKey: ["vendor-promotions-new", brand?.id],
    queryFn: async () => {
      const { data, error } = await (supabase.from("vendor_vouchers") as any)
        .select(
          `
          *,
          discounts!inner(*)
        `
        )
        .eq("brand_id", brand!.id);

      if (error) throw error;

      // Flatten for UI and sort by discount creation date
      return (data || [])
        .map((v: any) => ({
          ...v.discounts,
          id: v.discounts.id,
          vendor_voucher_id: v.id,
          brand_id: v.brand_id,
          code: v.code,
        }))
        .sort(
          (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    },
    enabled: !!brand,
  });

  const { data: products } = useQuery({
    queryKey: ["vendor-products-list", brand?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name")
        .eq("brand_id", brand!.id)
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
    enabled: !!brand,
  });

  const saveMutation = useMutation({
    mutationFn: async (formData: VendorPromoForm) => {
      const discountPayload = {
        name: formData.name,
        description: formData.description || null,
        discount_type:
          formData.type === "percentage_discount"
            ? "percentage"
            : formData.type === "fixed_discount"
              ? "fixed"
              : "free_shipping",
        discount_value: formData.discount_value,
        min_order_amount: formData.min_order_amount,
        max_discount_amount: formData.max_discount_amount,
        max_uses: formData.max_uses,
        max_uses_per_user: formData.max_uses_per_user,
        starts_at: new Date(formData.starts_at).toISOString(),
        ends_at: new Date(formData.ends_at).toISOString(),
        is_active: true,
      };

      if (editId) {
        // Update supertype
        await supabase.from("discounts").update(discountPayload).eq("id", editId);
        // Note: we don't update the code in vendor_vouchers here unless we want to allow code changes
        await supabase
          .from("vendor_vouchers")
          .update({ code: formData.code.toUpperCase() })
          .eq("discount_id", editId);
      } else {
        // Step 1: Create the discount supertype
        const { data: discount, error: dError } = await supabase
          .from("discounts")
          .insert(discountPayload)
          .select()
          .single();

        if (dError) throw dError;

        // Step 2: Link it to the vendor brand and add the code
        const { error: vError } = await supabase.from("vendor_vouchers").insert({
          discount_id: discount.id,
          brand_id: brand!.id,
          code: formData.code.toUpperCase() || null,
        });

        if (vError) throw vError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-promotions-new", brand?.id] });
      toast({ title: editId ? "Promotion updated" : "Promotion created" });
      setShowForm(false);
      setEditId(null);
      setForm(defaultForm);
    },
    onError: (err: any) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("discounts").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["vendor-promotions-new", brand?.id] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("discounts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-promotions-new"] });
      toast({ title: "Promotion deleted" });
    },
  });

  const handleEdit = (promo: any) => {
    setForm({
      name: promo.name,
      description: promo.description || "",
      code: promo.code || "",
      type:
        promo.discount_type === "percentage"
          ? "percentage_discount"
          : promo.discount_type === "fixed"
            ? "fixed_discount"
            : "free_shipping",
      discount_value: Number(promo.discount_value),
      min_order_amount: Number(promo.min_order_amount || 0),
      max_discount_amount: promo.max_discount_amount ? Number(promo.max_discount_amount) : null,
      max_uses: promo.max_uses,
      max_uses_per_user: promo.max_uses_per_user || 1,
      starts_at: new Date(promo.starts_at).toISOString().slice(0, 16),
      ends_at: new Date(promo.ends_at).toISOString().slice(0, 16),
    });
    setEditId(promo.id);
    setShowForm(true);
  };

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "percentage":
        return "% OFF";
      case "fixed":
        return "₱ OFF";
      case "free_shipping":
        return "FREE SHIP";
      // Handle legacy types if any
      case "percentage_discount":
        return "% OFF";
      case "fixed_discount":
        return "₱ OFF";
      default:
        return type;
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl md:text-4xl uppercase">My Promotions</h1>
          <p className="text-muted-foreground text-sm">
            Create promo codes and discounts for your products
          </p>
        </div>
        {!showForm && promotions && promotions.length > 0 && (
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditId(null);
              setForm(defaultForm);
            }}
            className="btn-brutal"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Promo
          </button>
        )}
      </div>

      {showForm && (
        <div className="card-brutal p-6 mb-8">
          <h2 className="font-heading text-xl uppercase mb-4">
            {editId ? "Edit Promotion" : "Create Promotion"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-heading text-xs uppercase tracking-wide mb-1 block">
                Name
              </label>
              <input
                className="input-brutal"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Weekend Flash Sale"
              />
            </div>
            <div>
              <label className="font-heading text-xs uppercase tracking-wide mb-1 block">
                Promo Code
              </label>
              <input
                className="input-brutal font-mono"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="FLASH20"
              />
            </div>
            <div>
              <label className="font-heading text-xs uppercase tracking-wide mb-1 block">
                Type
              </label>
              <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
                <SelectTrigger className="input-brutal">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage_discount">Percentage Discount</SelectItem>
                  <SelectItem value="fixed_discount">Fixed Peso Discount</SelectItem>
                  <SelectItem value="free_shipping">Free Shipping</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="font-heading text-xs uppercase tracking-wide mb-1 block">
                {form.type === "percentage_discount" ? "Discount %" : "Discount (₱)"}
              </label>
              <input
                type="number"
                className="input-brutal"
                value={form.discount_value}
                onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="font-heading text-xs uppercase tracking-wide mb-1 block">
                Min Order (₱)
              </label>
              <input
                type="number"
                className="input-brutal"
                value={form.min_order_amount}
                onChange={(e) => setForm({ ...form, min_order_amount: Number(e.target.value) })}
              />
            </div>
            {form.type === "percentage_discount" && (
              <div>
                <label className="font-heading text-xs uppercase tracking-wide mb-1 block">
                  Max Discount Cap (₱)
                </label>
                <input
                  type="number"
                  className="input-brutal"
                  value={form.max_discount_amount || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      max_discount_amount: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  placeholder="No cap"
                />
              </div>
            )}
            <div>
              <label className="font-heading text-xs uppercase tracking-wide mb-1 block">
                Usage Limit
              </label>
              <input
                type="number"
                className="input-brutal"
                value={form.max_uses || ""}
                onChange={(e) =>
                  setForm({ ...form, max_uses: e.target.value ? Number(e.target.value) : null })
                }
                placeholder="Unlimited"
              />
            </div>
            <div>
              <label className="font-heading text-xs uppercase tracking-wide mb-1 block">
                Per-User Limit
              </label>
              <input
                type="number"
                className="input-brutal"
                value={form.max_uses_per_user}
                onChange={(e) => setForm({ ...form, max_uses_per_user: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="font-heading text-xs uppercase tracking-wide mb-1 block">
                Starts At
              </label>
              <input
                type="datetime-local"
                className="input-brutal"
                value={form.starts_at}
                onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
              />
            </div>
            <div>
              <label className="font-heading text-xs uppercase tracking-wide mb-1 block">
                Ends At
              </label>
              <input
                type="datetime-local"
                className="input-brutal"
                value={form.ends_at}
                onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="font-heading text-xs uppercase tracking-wide mb-1 block">
                Description
              </label>
              <textarea
                className="input-brutal min-h-[60px]"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => saveMutation.mutate(form)}
              disabled={saveMutation.isPending || !form.name}
              className="btn-brutal"
            >
              {saveMutation.isPending ? "Saving..." : editId ? "Update" : "Create"}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setEditId(null);
              }}
              className="btn-brutal-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 skeleton-brutal" />
          ))}
        </div>
      ) : promotions && promotions.length > 0 ? (
        <div className="space-y-3">
          {promotions.map((promo) => {
            const isActive =
              promo.is_active &&
              new Date(promo.starts_at) <= new Date() &&
              new Date(promo.ends_at) > new Date();
            const isExpired = new Date(promo.ends_at) <= new Date();
            const expanded = expandedId === promo.id;

            return (
              <div key={promo.id} className={`card-brutal ${isExpired ? "opacity-50" : ""}`}>
                <div
                  className="p-4 flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedId(expanded ? null : promo.id)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 flex items-center justify-center ${isActive ? "bg-success/20" : "bg-muted"}`}
                    >
                      {promo.discount_type === "percentage" ? (
                        <Percent className="w-4 h-4" />
                      ) : promo.discount_type === "free_shipping" ? (
                        <Truck className="w-4 h-4" />
                      ) : (
                        <DollarSign className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-heading uppercase">{promo.name}</span>
                        <span
                          className={`px-2 py-0.5 text-xs uppercase ${isActive ? "bg-success text-success-foreground" : isExpired ? "bg-muted text-muted-foreground" : "bg-secondary"}`}
                        >
                          {isActive ? "Active" : isExpired ? "Expired" : "Inactive"}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {getTypeLabel(promo.discount_type)}:{" "}
                        {promo.discount_type === "percentage"
                          ? `${promo.discount_value}%`
                          : formatPrice(Number(promo.discount_value))}{" "}
                        · {promo.current_uses || 0} uses
                      </span>
                    </div>
                  </div>
                  {expanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
                {expanded && (
                  <div className="px-4 pb-4 border-t border-border-subtle pt-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
                      <div>
                        <span className="text-xs text-muted-foreground block">Code</span>
                        <code className="font-mono">{promo.code || "—"}</code>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Schedule</span>
                        {format(new Date(promo.starts_at), "MMM d")} -{" "}
                        {format(new Date(promo.ends_at), "MMM d")}
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Usage</span>
                        {promo.current_uses || 0} / {promo.max_uses || "∞"}
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Min Order</span>
                        {formatPrice(Number(promo.min_order_amount || 0))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(promo)}
                        className="btn-brutal-secondary text-xs px-3 py-1"
                      >
                        <Edit2 className="w-3 h-3 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() =>
                          toggleActive.mutate({ id: promo.id, is_active: !promo.is_active })
                        }
                        className="btn-brutal-secondary text-xs px-3 py-1"
                      >
                        <Power className="w-3 h-3 mr-1" />
                        {promo.is_active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => setPromoToDeleteId(promo.id)}
                        className="btn-brutal-secondary text-xs px-3 py-1 text-destructive"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card-brutal p-12 text-center">
          <Tag className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="font-heading text-xl uppercase mb-2">No Promotions Yet</h2>
          <p className="text-muted-foreground mb-4">
            Create promo codes and discounts for your products
          </p>
          <button onClick={() => setShowForm(true)} className="btn-brutal">
            <Plus className="w-4 h-4 mr-2" />
            Create Promotion
          </button>
        </div>
      )}

      <BrutalistConfirmModal
        isOpen={promoToDeleteId !== null}
        title="Delete Promotion?"
        message="Are you sure you want to delete this promotion?"
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={() => {
          if (promoToDeleteId) {
            deleteMutation.mutate(promoToDeleteId);
            setPromoToDeleteId(null);
          }
        }}
        onCancel={() => setPromoToDeleteId(null)}
      />
    </div>
  );
};

export default VendorPromotions;
