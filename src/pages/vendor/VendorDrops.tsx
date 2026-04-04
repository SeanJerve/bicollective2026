import { useState } from "react";
import { Plus, Trash2, Calendar, Power } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import DocumentUpload from "@/components/vendor/DocumentUpload";

const VendorDrops = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    image_url: "",
    launch_date: "",
    is_active: true,
  });

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

  const { data: drops, isLoading } = useQuery({
    queryKey: ["vendor-drops", brand?.id],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("product_drops" as any)
        .select(`
          *,
          notifications:product_drop_notifications(count)
        `)
        .eq("brand_id", brand?.id)
        .order("launch_date", { ascending: true }) as any);
      if (error) throw error;
      return data;
    },
    enabled: !!brand?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async (formData: typeof form) => {
      const { error } = await (supabase.from("product_drops" as any).insert({
        brand_id: brand?.id,
        title: formData.title,
        description: formData.description || null,
        image_url: formData.image_url,
        launch_date: new Date(formData.launch_date).toISOString(),
        is_active: formData.is_active,
      }) as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-drops"] });
      toast({ title: "Trailer created successfully" });
      setShowForm(false);
      setForm({ title: "", description: "", image_url: "", launch_date: "", is_active: true });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await (supabase.from("product_drops" as any).update({ is_active }).eq("id", id) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-drops"] });
      toast({ title: "Status updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("product_drops" as any).delete().eq("id", id) as any);
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
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-brutal text-sm md:text-base">
            <Plus className="w-4 h-4 mr-2" />
            New Trailer
          </button>
        )}
      </div>

      {showForm && (
        <div className="card-brutal p-6 mb-8 bg-secondary/10 border-2 border-foreground">
          <h2 className="font-heading text-xl uppercase mb-4">Create New Drop Trailer</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="font-heading text-sm uppercase tracking-wide mb-1.5 block">Release Title *</label>
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
                <label className="font-heading text-sm uppercase tracking-wide mb-1.5 block">Launch Date & Time *</label>
                <input 
                  type="datetime-local" 
                  required 
                  className="input-brutal w-full"
                  value={form.launch_date}
                  onChange={(e) => setForm({ ...form, launch_date: e.target.value })}
                />
              </div>

              <div>
                <label className="font-heading text-sm uppercase tracking-wide mb-1.5 block">Description</label>
                <textarea 
                  className="input-brutal w-full min-h-[100px]"
                  placeholder="Briefly describe what customers can expect..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="active" 
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="w-5 h-5 accent-foreground"
                />
                <label htmlFor="active" className="font-heading text-sm uppercase">Make Visible Immediately</label>
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
                  <img src={form.image_url} alt="Trailer Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4 mt-8 pt-4 border-t border-border-subtle">
            <button 
              onClick={() => saveMutation.mutate(form)} 
              disabled={saveMutation.isPending || !form.title || !form.launch_date || !form.image_url} 
              className="btn-brutal"
            >
              {saveMutation.isPending ? "Publishing..." : "Publish Trailer"}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-brutal-secondary">
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
              <div key={drop.id} className={`card-brutal flex flex-col overflow-hidden ${!drop.is_active ? 'opacity-60' : ''}`}>
                <div className="relative aspect-video bg-muted border-b-2 border-foreground">
                  <img src={drop.image_url} alt={drop.title} className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 flex flex-col gap-2">
                    <span className={`px-2 py-1 text-xs font-bold uppercase ${drop.is_active ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'}`}>
                      {drop.is_active ? 'Visible' : 'Hidden'}
                    </span>
                    {isLaunched && (
                      <span className="px-2 py-1 text-xs font-bold uppercase bg-foreground text-background">
                        Launched
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="p-4 flex-1 flex flex-col bg-background">
                  <h3 className="font-heading text-lg uppercase mb-1 line-clamp-1" title={drop.title}>{drop.title}</h3>
                  <div className="flex items-center text-xs text-muted-foreground mb-3 bg-secondary/50 p-2 border border-border-subtle">
                    <Calendar className="w-4 h-4 mr-2 text-foreground" />
                    <span className="font-medium text-foreground">{new Date(drop.launch_date).toLocaleString()}</span>
                  </div>
                  
                  {drop.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{drop.description}</p>
                  )}

                  <div className="mt-auto">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        {notifCount} User{notifCount !== 1 ? 's' : ''} Notified
                      </span>
                    </div>

                    <div className="flex items-center gap-2 border-t border-border-subtle pt-4">
                      <button 
                        onClick={() => toggleActive.mutate({ id: drop.id, is_active: !drop.is_active })}
                        className={`flex-1 text-xs px-3 py-2 flex items-center justify-center font-bold uppercase transition-colors border-2 border-transparent ${drop.is_active ? 'bg-secondary hover:border-foreground/20' : 'bg-success hover:bg-success/90 text-success-foreground'}`}
                      >
                        <Power className="w-3 h-3 mr-2" />
                        {drop.is_active ? 'Hide' : 'Show'}
                      </button>
                      <button 
                        onClick={() => { if(confirm("Are you sure you want to delete this trailer?")) deleteMutation.mutate(drop.id); }}
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
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">Build hype by scheduling trailers for your future collections and products.</p>
          <button onClick={() => setShowForm(true)} className="btn-brutal px-8 shadow-[4px_4px_0_0_#000]">
            <Plus className="w-4 h-4 mr-2" /> Create First Trailer
          </button>
        </div>
      )}
    </div>
  );
};

export default VendorDrops;
