import { useState, useEffect } from "react";
import { User, Phone, MapPin, Save, Loader2, Plus, Trash2, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageLayout from "@/components/layout/PageLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
  });

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error) throw error;
        if (data) {
          setFormData({
            full_name: data.full_name || "",
            phone: data.phone || "",
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  // Fetch addresses
  const { data: addresses, isLoading: addressesLoading } = useQuery({
    queryKey: ["user-addresses", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user!.id)
        .order("is_default", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully",
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      const { error } = await supabase
        .from("addresses")
        .update({ is_default: true })
        .eq("id", addressId);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["user-addresses"] });
      toast({ title: "Default address updated" });
    } catch (error: any) {
      toast({ title: "Failed to update", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    try {
      const { error } = await supabase
        .from("addresses")
        .delete()
        .eq("id", addressId);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["user-addresses"] });
      toast({ title: "Address deleted" });
    } catch (error: any) {
      toast({ title: "Failed to delete", description: error.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="section-container py-12">
          <div className="max-w-xl mx-auto">
            <div className="skeleton-brutal h-8 w-48 mb-8" />
            <div className="card-brutal p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton-brutal h-16" />
              ))}
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <section className="py-12">
        <div className="section-container max-w-xl">
          <h1 className="font-heading text-3xl md:text-4xl uppercase mb-6">
            Profile Settings
          </h1>

          {/* Basic Info */}
          <div className="card-brutal p-6 md:p-8 mb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="font-heading text-sm uppercase tracking-wide mb-2 block">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="input-brutal pl-12"
                    placeholder="Juan Dela Cruz"
                  />
                </div>
              </div>

              <div>
                <label className="font-heading text-sm uppercase tracking-wide mb-2 block">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input-brutal pl-12"
                    placeholder="+63 9XX XXX XXXX"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border-subtle">
                <p className="text-sm text-muted-foreground mb-4">
                  Email: <strong>{user?.email}</strong>
                </p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="btn-brutal w-full flex items-center justify-center gap-2"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>

          {/* Addresses Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-2xl uppercase">My Addresses</h2>
              <button
                onClick={() => navigate("/account/add-address")}
                className="btn-brutal-secondary flex items-center gap-2 text-sm px-4 py-2"
              >
                <Plus className="w-4 h-4" />
                Add Address
              </button>
            </div>

            {addressesLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="skeleton-brutal h-24" />
                ))}
              </div>
            ) : addresses && addresses.length > 0 ? (
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <div key={addr.id} className="card-brutal p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-heading text-sm">{addr.full_name}</span>
                          <span className="text-xs text-muted-foreground">({addr.label})</span>
                          {addr.is_default && (
                            <span className="text-xs bg-foreground text-background px-2 py-0.5">DEFAULT</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{addr.phone}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {addr.street}, {addr.barangay}, {addr.city}, {addr.province} {addr.zip_code}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!addr.is_default && (
                          <button
                            onClick={() => handleSetDefault(addr.id)}
                            className="text-xs text-muted-foreground hover:text-foreground underline"
                            title="Set as default"
                          >
                            <Star className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="text-xs text-destructive hover:text-destructive/80"
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
              <div className="card-brutal p-8 text-center">
                <MapPin className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-4">No addresses saved yet</p>
                <button
                  onClick={() => navigate("/account/add-address")}
                  className="btn-brutal text-sm"
                >
                  Add Your First Address
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Profile;
