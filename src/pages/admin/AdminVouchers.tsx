import { useState } from "react";
import { Ticket, Plus, Trash2, Power, Users, Clock, Search } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BulkVoucherForm {
  name: string;
  description: string;
  type: "percentage_discount" | "fixed_discount" | "free_shipping";
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  expires_in: string; // "1h", "1d", "1w", "1m"
  target_audience: string;
  count: number;
}

const defaultBulkForm: BulkVoucherForm = {
  name: "Platform Reward", description: "",
  type: "fixed_discount", discount_value: 50,
  min_order_amount: 0, max_discount_amount: null,
  expires_in: "1w", target_audience: "all", count: 10,
};

const AdminVouchers = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [bulkForm, setBulkForm] = useState<BulkVoucherForm>(defaultBulkForm);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: vouchers, isLoading } = useQuery({
    queryKey: ["admin-vouchers"],
    queryFn: async () => {
      const { data, error } = await ((supabase
        .from("user_discount_claims") as any)
        .select(`
          *,
          discounts:discounts(*),
          platform_promo:platform_promos(*)
        `)
        .order("created_at", { ascending: false })
        .limit(200));
      if (error) throw error;
      return (data || []).map((v: any) => ({
        id: v.id,
        discount_id: v.discount_id,
        user_id: v.user_id,
        status: v.status,
        created_at: v.created_at,
        name: v.discounts?.name,
        description: v.discounts?.description,
        type: v.discounts?.discount_type === "percentage" ? "percentage_discount" : (v.discounts?.discount_type === "fixed" ? "fixed_discount" : "free_shipping"),
        discount_value: v.discounts?.discount_value,
        expires_at: v.discounts?.ends_at,
        code: v.platform_promo?.code || "CLAIMED",
        source: "admin_grant"
      }));
    },
  });

  const getExpiryDate = (expiresIn: string): string => {
    const ms: Record<string, number> = {
      "1h": 60 * 60 * 1000,
      "1d": 24 * 60 * 60 * 1000,
      "1w": 7 * 24 * 60 * 60 * 1000,
      "1m": 30 * 24 * 60 * 60 * 1000,
    };
    return new Date(Date.now() + (ms[expiresIn] || ms["1w"])).toISOString();
  };

  const bulkCreateMutation = useMutation({
    mutationFn: async (form: BulkVoucherForm) => {
      // Get target users
      let userIds: string[] = [];
      const { data: profiles } = await supabase.from("profiles").select("user_id");
      if (!profiles) throw new Error("No users found");

      if (form.target_audience === "all") {
        userIds = profiles.map((p) => p.user_id);
      } else {
        userIds = profiles.map((p) => p.user_id);
      }

      // Limit to count
      userIds = userIds.slice(0, form.count);

      const expiresAt = getExpiryDate(form.expires_in);
      
      // Step 1: Create the Discount Template
      const { data: discount, error: dError } = await (supabase
        .from("discounts")
        .insert({
          name: form.name,
          description: form.description || null,
          discount_type: form.type.replace("_discount", ""),
          discount_value: form.discount_value,
          min_order_amount: form.min_order_amount,
          max_discount_amount: form.max_discount_amount,
          starts_at: new Date().toISOString(),
          ends_at: expiresAt,
          is_active: true,
        })
        .select()
        .single() as any);

      if (dError) throw dError;

      // Step 2: Create Claims for each user
      const claims = userIds.map((userId) => ({
        user_id: userId,
        discount_id: discount.id,
        status: "active",
      }));

      const { error: cError } = await (supabase.from("user_discount_claims") as any).insert(claims);
      if (cError) throw cError;

      // Optional: If we want them to have unique codes, we'd need platform_promos too.
      // For now, let's just create one platform_promo so they can see "CLAIMED" or a generic code.
      await (supabase.from("platform_promos") as any).insert({
        discount_id: discount.id,
        code: `REWARD-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        deployment_target: "manual_code",
        created_by: user!.id,
      });

      return userIds.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["admin-vouchers"] });
      toast({ title: `${count} vouchers granted!` });
      setShowBulkForm(false);
      setBulkForm(defaultBulkForm);
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("user_discount_claims") as any).update({ status: "expired" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-vouchers"] });
      toast({ title: "Voucher revoked" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_discount_claims").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-vouchers"] });
      toast({ title: "Voucher deleted" });
    },
  });

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount);

  const filteredVouchers = vouchers?.filter((v) => {
    const matchesSearch = !searchTerm || v.code.toLowerCase().includes(searchTerm.toLowerCase()) || v.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const stats = {
    total: vouchers?.length || 0,
    active: vouchers?.filter((v) => v.status === "active").length || 0,
    used: vouchers?.filter((v) => v.status === "used").length || 0,
    expired: vouchers?.filter((v) => v.status === "expired" || v.status === "cancelled").length || 0,
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl md:text-4xl uppercase">Voucher Governance</h1>
          <p className="text-muted-foreground text-sm">Create, grant, and manage platform vouchers</p>
        </div>
        <button onClick={() => setShowBulkForm(!showBulkForm)} className="btn-brutal">
          <Plus className="w-4 h-4 mr-2" />Bulk Create
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total", value: stats.total, color: "bg-secondary" },
          { label: "Active", value: stats.active, color: "bg-success/20" },
          { label: "Used", value: stats.used, color: "bg-muted" },
          { label: "Expired", value: stats.expired, color: "bg-destructive/20" },
        ].map((s) => (
          <div key={s.label} className="card-brutal p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="font-heading text-2xl">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Bulk Create Form */}
      {showBulkForm && (
        <div className="card-brutal p-6 mb-8">
          <h2 className="font-heading text-xl uppercase mb-4">Bulk Create Vouchers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-heading text-xs uppercase tracking-wide mb-1 block">Voucher Name</label>
              <input className="input-brutal" value={bulkForm.name} onChange={(e) => setBulkForm({ ...bulkForm, name: e.target.value })} />
            </div>
            <div>
              <label className="font-heading text-xs uppercase tracking-wide mb-1 block">Type</label>
              <Select value={bulkForm.type} onValueChange={(v: any) => setBulkForm({ ...bulkForm, type: v })}>
                <SelectTrigger className="input-brutal"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed_discount">Fixed Discount (₱)</SelectItem>
                  <SelectItem value="percentage_discount">Percentage (%)</SelectItem>
                  <SelectItem value="free_shipping">Free Shipping</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="font-heading text-xs uppercase tracking-wide mb-1 block">Discount Value</label>
              <input type="number" className="input-brutal" value={bulkForm.discount_value} onChange={(e) => setBulkForm({ ...bulkForm, discount_value: Number(e.target.value) })} />
            </div>
            <div>
              <label className="font-heading text-xs uppercase tracking-wide mb-1 block">Min Order (₱)</label>
              <input type="number" className="input-brutal" value={bulkForm.min_order_amount} onChange={(e) => setBulkForm({ ...bulkForm, min_order_amount: Number(e.target.value) })} />
            </div>
            <div>
              <label className="font-heading text-xs uppercase tracking-wide mb-1 block">Expires In</label>
              <Select value={bulkForm.expires_in} onValueChange={(v) => setBulkForm({ ...bulkForm, expires_in: v })}>
                <SelectTrigger className="input-brutal"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">1 Hour</SelectItem>
                  <SelectItem value="1d">1 Day</SelectItem>
                  <SelectItem value="1w">1 Week</SelectItem>
                  <SelectItem value="1m">1 Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="font-heading text-xs uppercase tracking-wide mb-1 block">Target Audience</label>
              <Select value={bulkForm.target_audience} onValueChange={(v) => setBulkForm({ ...bulkForm, target_audience: v })}>
                <SelectTrigger className="input-brutal"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="new">New Users</SelectItem>
                  <SelectItem value="loyal">Loyal Users</SelectItem>
                  <SelectItem value="inactive">Inactive Users</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="font-heading text-xs uppercase tracking-wide mb-1 block">Max Recipients</label>
              <input type="number" className="input-brutal" value={bulkForm.count} onChange={(e) => setBulkForm({ ...bulkForm, count: Number(e.target.value) })} />
            </div>
            <div>
              <label className="font-heading text-xs uppercase tracking-wide mb-1 block">Description</label>
              <input className="input-brutal" value={bulkForm.description} onChange={(e) => setBulkForm({ ...bulkForm, description: e.target.value })} placeholder="Special gift from admin" />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => bulkCreateMutation.mutate(bulkForm)} disabled={bulkCreateMutation.isPending} className="btn-brutal">
              {bulkCreateMutation.isPending ? "Creating..." : `Create ${bulkForm.count} Vouchers`}
            </button>
            <button onClick={() => setShowBulkForm(false)} className="btn-brutal-secondary">Cancel</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input className="input-brutal pl-10 text-sm" placeholder="Search code or name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="input-brutal w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="used">Used</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Voucher List */}
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 skeleton-brutal" />)}</div>
      ) : filteredVouchers.length > 0 ? (
        <div className="card-brutal divide-y divide-border-subtle">
          {filteredVouchers.slice(0, 50).map((v) => (
            <div key={v.id} className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 flex items-center justify-center text-xs flex-shrink-0 ${v.status === "active" ? "bg-success/20" : v.status === "used" ? "bg-muted" : "bg-destructive/20"}`}>
                  <Ticket className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-xs truncate">{v.code}</code>
                    <span className={`px-1.5 py-0.5 text-[10px] uppercase ${v.status === "active" ? "bg-success text-success-foreground" : v.status === "used" ? "bg-muted text-muted-foreground" : "bg-destructive/20 text-destructive"}`}>
                      {v.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {v.name} · {v.type === "percentage_discount" ? `${v.discount_value}%` : v.type === "free_shipping" ? "Free Ship" : formatPrice(Number(v.discount_value))}
                    {v.source && ` · ${v.source}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[10px] text-muted-foreground hidden md:block">
                  {format(new Date(v.expires_at), "MMM d")}
                </span>
                {v.status === "active" && (
                  <button onClick={() => revokeMutation.mutate(v.id)} className="p-1 text-muted-foreground hover:text-destructive" title="Revoke">
                    <Power className="w-3.5 h-3.5" />
                  </button>
                )}
                <button onClick={() => { if (confirm("Delete?")) deleteMutation.mutate(v.id); }} className="p-1 text-muted-foreground hover:text-destructive" title="Delete">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          {filteredVouchers.length > 50 && (
            <p className="p-3 text-xs text-muted-foreground text-center">Showing 50 of {filteredVouchers.length}</p>
          )}
        </div>
      ) : (
        <div className="card-brutal p-12 text-center">
          <Ticket className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No vouchers found</p>
        </div>
      )}
    </div>
  );
};

export default AdminVouchers;
