import { useState } from "react";
import { Plus, Power, Trash2, Globe } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import DocumentUpload from "@/components/vendor/DocumentUpload";

const AdminSitePopups = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    image_url: "",
    redirect_url: "",
    is_active: false,
  });

  const { data: popups, isLoading } = useQuery({
    queryKey: ["admin-site-popups"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("site_popups" as any)
        .select("*")
        .order("created_at", { ascending: false }) as any);
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (formData: typeof form) => {
      // First, if this is active, maybe we deactivate others? Or allow multiple, up to the UI.
      const { error } = await (supabase.from("site_popups" as any).insert({
        image_url: formData.image_url,
        redirect_url: formData.redirect_url || null,
        is_active: formData.is_active,
      }) as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-site-popups"] });
      toast({ title: "Popup created successfully" });
      setShowForm(false);
      setForm({ image_url: "", redirect_url: "", is_active: false });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await (supabase
        .from("site_popups" as any)
        .update({ is_active })
        .eq("id", id) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-site-popups"] });
      toast({ title: "Status updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase
        .from("site_popups" as any)
        .delete()
        .eq("id", id) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-site-popups"] });
      toast({ title: "Popup deleted" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl uppercase">Global Promotions Popups</h2>
          <p className="text-muted-foreground text-sm">
            Manage the ad banner that flashes to users when they visit the site.
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-brutal">
          <Plus className="w-4 h-4 mr-2" />
          New Popup
        </button>
      </div>

      {showForm && (
        <div className="card-brutal p-6 border-2 border-foreground bg-secondary/10">
          <h3 className="font-heading text-lg uppercase mb-4">Create New Popup</h3>
          <div className="space-y-4 max-w-xl">
            <div>
              <DocumentUpload
                label="Popup Image"
                description="Use an engaging, vertically-oriented or square banner. JPG/PNG."
                bucket="platform-assets"
                folder="popups"
                accept="image/*"
                value={form.image_url || undefined}
                onChange={(url) => setForm({ ...form, image_url: url || "" })}
              />
              {form.image_url && (
                <div className="mt-2 h-40 border-2 border-foreground bg-muted flex items-center justify-center overflow-hidden">
                  <img src={form.image_url} alt="Popup Preview" className="h-full object-cover" />
                </div>
              )}
            </div>

            <div>
              <label className="font-heading text-xs uppercase tracking-wide mb-1 block">
                Redirect URL (Optional)
              </label>
              <input
                type="text"
                className="input-brutal w-full"
                placeholder="/brands/my-brand or /search?q=sale"
                value={form.redirect_url}
                onChange={(e) => setForm({ ...form, redirect_url: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-3 py-2">
              <input
                type="checkbox"
                id="is_active"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="is_active" className="text-sm font-medium">
                Set as Active immediately
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => saveMutation.mutate(form)}
                disabled={saveMutation.isPending || !form.image_url}
                className="btn-brutal"
              >
                {saveMutation.isPending ? "Saving..." : "Save Popup"}
              </button>
              <button onClick={() => setShowForm(false)} className="btn-brutal-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex gap-4">
          <div className="h-48 w-64 skeleton-brutal" />
        </div>
      ) : popups && popups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {popups.map((popup) => (
            <div
              key={popup.id}
              className={`card-brutal flex flex-col ${!popup.is_active ? "opacity-70" : "ring-2 ring-foreground"} overflow-hidden`}
            >
              <div className="h-48 bg-muted relative">
                <img src={popup.image_url} alt="Popup" className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 flex gap-1">
                  <span
                    className={`px-2 py-1 text-[10px] uppercase font-bold ${popup.is_active ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}`}
                  >
                    {popup.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col bg-background">
                {popup.redirect_url ? (
                  <p className="text-xs text-muted-foreground mb-4 truncate flex items-center gap-1">
                    <Globe className="w-3 h-3" /> {popup.redirect_url}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mb-4 italic">
                    No redirect configured
                  </p>
                )}

                <div className="mt-auto flex items-center justify-between gap-2 border-t border-border-subtle pt-4">
                  <button
                    onClick={() =>
                      toggleActive.mutate({ id: popup.id, is_active: !popup.is_active })
                    }
                    className={`text-xs px-3 py-1.5 flex items-center font-bold uppercase transition-colors ${popup.is_active ? "text-destructive hover:bg-destructive/10" : "text-success hover:bg-success/10"}`}
                  >
                    <Power className="w-3 h-3 mr-1.5" />
                    {popup.is_active ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Delete this popup forever?")) deleteMutation.mutate(popup.id);
                    }}
                    className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border-2 border-dashed border-border-subtle p-12 flex flex-col items-center justify-center text-center">
          <Globe className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
          <h3 className="font-heading text-xl uppercase mb-2">No Popups</h3>
          <p className="text-muted-foreground text-sm max-w-md">
            Create your first global site popup ad to display to visiting users.
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminSitePopups;
