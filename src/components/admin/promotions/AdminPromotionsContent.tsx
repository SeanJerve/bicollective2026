import { useState } from "react";
import {
  Tag,
  Plus,
  Calendar,
  Percent,
  DollarSign,
  Truck,
  BarChart3,
  Trash2,
  Power,
  Edit2,
  ChevronDown,
  ChevronUp,
  Target,
  Eye,
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
import { BICOL_PROVINCES } from "@/components/checkout/ShippingCalculator";

interface PromoForm {
  name: string;
  description: string;
  code: string;
  type: "percentage_discount" | "fixed_discount" | "free_shipping";
  scope: "platform" | "seller" | "location" | "product";
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  max_uses: number | null;
  max_uses_per_user: number;
  starts_at: string;
  ends_at: string;
  is_stackable: boolean;
  deployment_target: string;
  target_locations: string[];
}

const defaultForm: PromoForm = {
  name: "",
  description: "",
  code: "",
  type: "percentage_discount",
  scope: "platform",
  discount_value: 10,
  min_order_amount: 0,
  max_discount_amount: null,
  max_uses: null,
  max_uses_per_user: 1,
  starts_at: new Date().toISOString().slice(0, 16),
  ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  is_stackable: true,
  deployment_target: "manual_code",
  target_locations: [],
};

const AdminPromotions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<PromoForm>(defaultForm);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: promotions, isLoading } = useQuery({
    queryKey: ["admin-promotions"],
    queryFn: async () => {
      const { data, error } = await (
        supabase.from("platform_promos").select(`
          *,
          discounts:discounts(*)
        `) as any
      ).order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((p: any) => ({
        ...p.discounts,
        code: p.code,
        promo_id: p.id,
        deployment_target: p.deployment_target,
        target_locations: p.target_locations,
        created_by: p.created_by,
      }));
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (formData: PromoForm) => {
      const discountPayload = {
        name: formData.name,
        description: formData.description || null,
        discount_type: formData.type.replace("_discount", ""),
        discount_value: formData.discount_value,
        min_order_amount: formData.min_order_amount,
        max_discount_amount: formData.max_discount_amount,
        max_uses: formData.max_uses,
        max_uses_per_user: formData.max_uses_per_user,
        starts_at: new Date(formData.starts_at).toISOString(),
        ends_at: new Date(formData.ends_at).toISOString(),
        is_stackable: formData.is_stackable,
        is_active: true,
      };

      if (editId) {
        // Find the platform_promo to get the discount_id
        const { data: existing } = await supabase
          .from("platform_promos")
          .select("discount_id")
          .eq("id", editId)
          .single();

        if (existing) {
          await supabase.from("discounts").update(discountPayload).eq("id", existing.discount_id);
          await supabase
            .from("platform_promos")
            .update({
              code: formData.code.toUpperCase(),
              deployment_target: formData.deployment_target,
              target_locations:
                formData.target_locations.length > 0 ? formData.target_locations : null,
            })
            .eq("id", editId);
        }
      } else {
        // Step 1: Create the discount supertype
        const { data: discount, error: dError } = await (supabase
          .from("discounts")
          .insert(discountPayload)
          .select()
          .single() as any);

        if (dError) throw dError;

        // Step 2: Create the platform promo subtype
        const { error: pError } = await supabase.from("platform_promos").insert({
          discount_id: discount.id,
          code: formData.code.toUpperCase() || null,
          deployment_target: formData.deployment_target,
          target_locations: formData.target_locations.length > 0 ? formData.target_locations : null,
          created_by: user!.id,
        });

        if (pError) throw pError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promotions"] });
      toast({ title: editId ? "Promotion updated" : "Promotion created" });
      setShowForm(false);
      setEditId(null);
      setForm(defaultForm);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      // id here is the platform_promo id, we need the discount_id
      const { data } = await supabase
        .from("platform_promos")
        .select("discount_id")
        .eq("id", id)
        .single();

      if (data) {
        const { error } = await supabase
          .from("discounts")
          .update({ is_active })
          .eq("id", data.discount_id);
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-promotions"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await supabase
        .from("platform_promos")
        .select("discount_id")
        .eq("id", id)
        .single();

      if (data) {
        // Deleting platform_promo first (subtype)
        await supabase.from("platform_promos").delete().eq("id", id);
        // Then deleting discount (supertype)
        const { error } = await supabase.from("discounts").delete().eq("id", data.discount_id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promotions"] });
      toast({ title: "Promotion deleted" });
    },
  });

  const handleEdit = (promo: any) => {
    setForm({
      name: promo.name,
      description: promo.description || "",
      code: promo.code || "",
      type: promo.type,
      scope: promo.scope,
      discount_value: Number(promo.discount_value),
      min_order_amount: Number(promo.min_order_amount || 0),
      max_discount_amount: promo.max_discount_amount ? Number(promo.max_discount_amount) : null,
      max_uses: promo.max_uses,
      max_uses_per_user: promo.max_uses_per_user || 1,
      starts_at: new Date(promo.starts_at).toISOString().slice(0, 16),
      ends_at: new Date(promo.ends_at).toISOString().slice(0, 16),
      is_stackable: promo.is_stackable ?? true,
      deployment_target: promo.deployment_target || "manual_code",
      target_locations: promo.target_locations || [],
    });
    setEditId(promo.id);
    setShowForm(true);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "percentage_discount":
        return <Percent className="w-4 h-4" />;
      case "fixed_discount":
        return <DollarSign className="w-4 h-4" />;
      case "free_shipping":
        return <Truck className="w-4 h-4" />;
      default:
        return <Tag className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "percentage_discount":
        return "% OFF";
      case "fixed_discount":
        return "₱ OFF";
      case "free_shipping":
        return "FREE SHIP";
      default:
        return type;
    }
  };

  const getDeploymentLabel = (target: string) => {
    switch (target) {
      case "sale_banner":
        return "Sale Banner";
      case "lucky_popup":
        return "Lucky Popup";
      case "manual_code":
        return "Promo Code";
      case "auto_apply":
        return "Auto Apply";
      default:
        return target;
    }
  };

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl md:text-4xl uppercase">Platform Promotions</h1>
          <p className="text-muted-foreground text-sm">
            Manage sitewide campaigns, discounts, and location-based offers
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditId(null);
            setForm(defaultForm);
          }}
          className="btn-brutal"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Campaign
        </button>
      </div>

      {/* Campaign Form */}
      {showForm && (
        <div className="card-brutal p-6 mb-8">
          <h2 className="font-heading text-xl uppercase mb-4">
            {editId ? "Edit Campaign" : "Create Campaign"}
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
                placeholder="Summer Sale 2026"
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
                placeholder="SUMMER2026"
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
                Scope
              </label>
              <Select value={form.scope} onValueChange={(v: any) => setForm({ ...form, scope: v })}>
                <SelectTrigger className="input-brutal">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="platform">Sitewide</SelectItem>
                  <SelectItem value="location">Location-Based</SelectItem>
                  <SelectItem value="product">Product-Specific</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="font-heading text-xs uppercase tracking-wide mb-1 block">
                {form.type === "percentage_discount" ? "Discount %" : "Discount Amount (₱)"}
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
                Total Usage Limit
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
            <div>
              <label className="font-heading text-xs uppercase tracking-wide mb-1 block">
                Deployment Target
              </label>
              <Select
                value={form.deployment_target}
                onValueChange={(v) => setForm({ ...form, deployment_target: v })}
              >
                <SelectTrigger className="input-brutal">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual_code">Promo Code (manual entry)</SelectItem>
                  <SelectItem value="sale_banner">Sale Banner Countdown</SelectItem>
                  <SelectItem value="lucky_popup">Lucky Popup Reward Pool</SelectItem>
                  <SelectItem value="auto_apply">Auto-Apply at Checkout</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="stackable"
                checked={form.is_stackable}
                onChange={(e) => setForm({ ...form, is_stackable: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="stackable" className="text-sm">
                Stackable with vouchers
              </label>
            </div>
            {form.scope === "location" && (
              <div className="md:col-span-2">
                <label className="font-heading text-xs uppercase tracking-wide mb-1 block">
                  Target Locations
                </label>
                <div className="flex flex-wrap gap-2">
                  {BICOL_PROVINCES.map((prov) => (
                    <button
                      key={prov}
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          target_locations: form.target_locations.includes(prov)
                            ? form.target_locations.filter((l) => l !== prov)
                            : [...form.target_locations, prov],
                        })
                      }
                      className={`px-3 py-1 text-xs border-2 border-foreground ${form.target_locations.includes(prov) ? "bg-foreground text-background" : "bg-background"}`}
                    >
                      {prov}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="md:col-span-2">
              <label className="font-heading text-xs uppercase tracking-wide mb-1 block">
                Description
              </label>
              <textarea
                className="input-brutal min-h-[60px]"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Campaign description..."
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => saveMutation.mutate(form)}
              disabled={saveMutation.isPending || !form.name}
              className="btn-brutal"
            >
              {saveMutation.isPending
                ? "Saving..."
                : editId
                  ? "Update Campaign"
                  : "Create Campaign"}
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

      {/* Promotions List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 skeleton-brutal" />
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
                      {getTypeIcon(promo.type)}
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
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          {getTypeLabel(promo.type)}:{" "}
                          {promo.type === "percentage_discount"
                            ? `${promo.discount_value}%`
                            : formatPrice(Number(promo.discount_value))}
                        </span>
                        <span>·</span>
                        <span>{promo.code || "No code"}</span>
                        <span>·</span>
                        <span>{getDeploymentLabel(promo.deployment_target || "manual_code")}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {promo.current_uses || 0} uses
                    </span>
                    {expanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>

                {expanded && (
                  <div className="px-4 pb-4 border-t border-border-subtle pt-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
                      <div>
                        <span className="text-xs text-muted-foreground block">Schedule</span>
                        <span>
                          {format(new Date(promo.starts_at), "MMM d")} -{" "}
                          {format(new Date(promo.ends_at), "MMM d, yyyy")}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Usage</span>
                        <span>
                          {promo.current_uses || 0} / {promo.max_uses || "∞"}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Scope</span>
                        <span className="capitalize">{promo.scope}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Stackable</span>
                        <span>{promo.is_stackable ? "Yes" : "Exclusive"}</span>
                      </div>
                    </div>
                    {promo.target_locations && promo.target_locations.length > 0 && (
                      <div className="mb-4">
                        <span className="text-xs text-muted-foreground">Locations: </span>
                        <span className="text-sm">{promo.target_locations.join(", ")}</span>
                      </div>
                    )}
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
                        onClick={() => {
                          if (confirm("Delete this promotion?")) deleteMutation.mutate(promo.id);
                        }}
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
          <h2 className="font-heading text-xl uppercase mb-2">No Campaigns Yet</h2>
          <p className="text-muted-foreground mb-4">Create your first sitewide promotion</p>
          <button onClick={() => setShowForm(true)} className="btn-brutal">
            <Plus className="w-4 h-4 mr-2" />
            Create Campaign
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminPromotions;
