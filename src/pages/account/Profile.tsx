import { useState, useEffect, useRef } from "react";
import { User, Phone, MapPin, Save, Loader2, Plus, Trash2, Star, Lock, Eye, EyeOff, Camera, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageLayout from "@/components/layout/PageLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Password change state
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

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
          setAvatarUrl(data.avatar_url || null);
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 5MB", variant: "destructive" });
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-pictures")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("profile-pictures")
        .getPublicUrl(filePath);

      const newUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: newUrl, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      setAvatarUrl(newUrl);
      toast({ title: "Profile picture updated" });
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;
    setUploadingAvatar(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: null, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);

      if (error) throw error;
      setAvatarUrl(null);
      toast({ title: "Profile picture removed" });
    } catch (error: any) {
      toast({ title: "Failed to remove", description: error.message, variant: "destructive" });
    } finally {
      setUploadingAvatar(false);
    }
  };

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

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast({ title: "Password too short", description: "Must be at least 6 characters", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }

    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: "Password updated", description: "Your password has been changed successfully" });
      setNewPassword("");
      setConfirmPassword("");
      setPasswordOpen(false);
    } catch (error: any) {
      toast({ title: "Failed to update password", description: error.message, variant: "destructive" });
    } finally {
      setSavingPassword(false);
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

          {/* Avatar Section */}
          <div className="card-brutal p-6 md:p-8 mb-8">
            <div className="flex items-center gap-5">
              <div className="relative group">
                <div className="w-20 h-20 md:w-24 md:h-24 border-2 border-foreground bg-muted overflow-hidden flex items-center justify-center flex-shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground" />
                  )}
                </div>
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="btn-brutal-secondary flex items-center gap-2 text-xs px-3 py-2"
                >
                  <Camera className="w-3.5 h-3.5" />
                  {avatarUrl ? "Change Photo" : "Upload Photo"}
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={uploadingAvatar}
                    className="text-xs text-destructive hover:underline flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Remove
                  </button>
                )}
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
          </div>

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

          {/* Password Change */}
          <div className="card-brutal mb-8">
            <Collapsible open={passwordOpen} onOpenChange={setPasswordOpen}>
              <CollapsibleTrigger className="w-full p-6 flex items-center justify-between text-left">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5" />
                  <span className="font-heading text-lg uppercase">Change Password</span>
                </div>
                <span className="text-xs text-muted-foreground">{passwordOpen ? "Close" : "Expand"}</span>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <form onSubmit={handlePasswordChange} className="p-6 pt-0 space-y-4">
                  <div>
                    <label className="font-heading text-sm uppercase tracking-wide mb-2 block">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="input-brutal pl-12 pr-12"
                        placeholder="Min 6 characters"
                        minLength={6}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="font-heading text-sm uppercase tracking-wide mb-2 block">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="input-brutal pl-12"
                        placeholder="Re-enter password"
                        minLength={6}
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="btn-brutal w-full flex items-center justify-center gap-2"
                  >
                    {savingPassword ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                    {savingPassword ? "Updating..." : "Update Password"}
                  </button>
                </form>
              </CollapsibleContent>
            </Collapsible>
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
