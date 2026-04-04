import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import DocumentUpload from "@/components/vendor/DocumentUpload";

const VendorStore = () => {
  const { user, refreshRoles } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [brand, setBrand] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    logo_url: "",
    banner_url: "",
    location: "",
    store_sale_percent: 0,
    store_sale_ends_at: "",
  });

  const BICOL_LOCATIONS = [
    "Legazpi City",
    "Naga City",
    "Tabaco City",
    "Ligao City",
    "Iriga City",
    "Sorsogon City",
    "Masbate City",
    "Daet",
    "Virac",
    "Albay",
    "Camarines Sur",
    "Camarines Norte",
    "Sorsogon",
    "Masbate",
    "Catanduanes",
  ];

  useEffect(() => {
    const fetchBrand = async () => {
      if (!user) return;

      try {
        const { data } = await supabase
          .from("brands")
          .select("*")
          .eq("owner_id", user.id)
          .single();

        if (data) {
          setBrand(data);
          setFormData({
            name: data.name || "",
            slug: data.slug || "",
            description: data.description || "",
            logo_url: data.logo_url || "",
            banner_url: data.banner_url || "",
            location: data.location || "",
            store_sale_percent: data.store_sale_percent || 0,
            store_sale_ends_at: data.store_sale_ends_at ? data.store_sale_ends_at.split("T")[0] : "",
          });
        }
      } catch (error) {
        // No brand yet
      } finally {
        setLoading(false);
      }
    };

    fetchBrand();
  }, [user]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);

    try {
      const slug = formData.slug || generateSlug(formData.name);

      if (brand) {
        // Update existing brand
        const { error } = await supabase
          .from("brands")
          .update({
            name: formData.name,
            slug,
            description: formData.description,
            logo_url: formData.logo_url || null,
            banner_url: formData.banner_url || null,
            location: formData.location || null,
            store_sale_percent: formData.store_sale_percent || 0,
            store_sale_ends_at: formData.store_sale_ends_at || null,
          })
          .eq("id", brand.id);

        if (error) throw error;

        toast({
          title: "Store updated",
          description: "Your store settings have been saved",
        });
      } else {
        // Create new brand
        const { error } = await supabase.from("brands").insert({
          owner_id: user.id,
          name: formData.name,
          slug,
          description: formData.description,
          logo_url: formData.logo_url || null,
          banner_url: formData.banner_url || null,
          location: formData.location || null,
          status: "approved",
        });

        if (error) throw error;

        // Add vendor role
        const { error: roleError } = await supabase.from("user_roles").insert({
          user_id: user.id,
          role: "vendor",
        });

        if (roleError && !roleError.message.includes("duplicate")) {
          throw roleError;
        }

        await refreshRoles();

        toast({
          title: "Store created!",
          description: "Your vendor store is now live",
        });

        navigate("/vendor");
      }
    } catch (error: any) {
      console.error("Error saving store:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save store",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
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

  return (
    <div className="p-4 md:p-8 w-full">
      <div className="mb-6 md:mb-8">
        <h1 className="font-heading text-2xl md:text-4xl uppercase">
          {brand ? "Store Settings" : "Set Up Your Store"}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          {brand
            ? "Manage your brand profile and storefront"
            : "Create your vendor profile to start selling"}
        </p>
      </div>

      <div className="w-full">
        <form onSubmit={handleSubmit} className="card-brutal p-4 md:p-8 space-y-5 md:space-y-6">
          <div>
            <label className="font-heading text-xs md:text-sm uppercase tracking-wide mb-2 block">
              Brand Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  name: e.target.value,
                  slug: generateSlug(e.target.value),
                });
              }}
              className="input-brutal text-sm md:text-base"
              placeholder="Your Brand Name"
              required
            />
          </div>

          <div>
            <label className="font-heading text-xs md:text-sm uppercase tracking-wide mb-2 block">
              Store URL
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center">
              <span className="bg-secondary px-3 md:px-4 py-2 md:py-3 border-2 sm:border-r-0 border-foreground text-xs md:text-sm text-muted-foreground">
                bicollective.com/brands/
              </span>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: generateSlug(e.target.value) })
                }
                className="input-brutal flex-1 text-sm md:text-base"
                placeholder="your-brand"
              />
            </div>
          </div>

          <div>
            <label className="font-heading text-xs md:text-sm uppercase tracking-wide mb-2 block">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="input-brutal min-h-[100px] md:min-h-[120px] text-sm md:text-base"
              placeholder="Tell customers about your brand..."
            />
          </div>

          <div>
            <label className="font-heading text-xs md:text-sm uppercase tracking-wide mb-2 block">
              Location *
            </label>
            <select
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              className="input-brutal text-sm md:text-base"
              required
            >
              <option value="">Select your location</option>
              {BICOL_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              This helps customers filter products by location
            </p>
          </div>

          {/* Logo Upload */}
          <div>
            <DocumentUpload
              label="Brand Logo"
              description="Square image recommended (500×500px). JPG or PNG."
              bucket="brand-assets"
              folder={user?.id || "unknown"}
              accept="image/*"
              value={formData.logo_url || undefined}
              onChange={(url) => setFormData({ ...formData, logo_url: url || "" })}
            />
            {formData.logo_url && (
              <div className="mt-2 w-16 h-16 border border-border-subtle overflow-hidden bg-muted">
                <img src={formData.logo_url} alt="Logo preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Banner Upload */}
          <div>
            <DocumentUpload
              label="Store Banner"
              description="IMPORTANT: Please use a 3:1 ratio (e.g. 1200×400px) so the image displays perfectly on your store page without cropping. JPG or PNG."
              bucket="brand-assets"
              folder={user?.id || "unknown"}
              accept="image/*"
              value={formData.banner_url || undefined}
              onChange={(url) => setFormData({ ...formData, banner_url: url || "" })}
            />
            {formData.banner_url && (
              <div className="mt-2 w-full h-24 border border-border-subtle overflow-hidden bg-muted">
                <img src={formData.banner_url} alt="Banner preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Store-wide Sale */}
          <div className="border-t-2 border-foreground pt-5 md:pt-6">
            <h2 className="font-heading text-sm md:text-base uppercase tracking-wide mb-4">Store-wide Sale</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-heading text-xs md:text-sm uppercase tracking-wide mb-2 block">
                  Discount %
                </label>
                <input
                  type="number"
                  value={formData.store_sale_percent}
                  onChange={(e) =>
                    setFormData({ ...formData, store_sale_percent: Number(e.target.value) })
                  }
                  className="input-brutal text-sm md:text-base"
                  min="0"
                  max="100"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="font-heading text-xs md:text-sm uppercase tracking-wide mb-2 block">
                  Sale Ends
                </label>
                <input
                  type="date"
                  value={formData.store_sale_ends_at}
                  onChange={(e) =>
                    setFormData({ ...formData, store_sale_ends_at: e.target.value })
                  }
                  className="input-brutal text-sm md:text-base"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Set to 0% or leave end date empty to disable the sale
            </p>
          </div>

          <button type="submit" disabled={saving} className="btn-brutal w-full text-sm md:text-base">
            {saving ? "Saving..." : brand ? "Save Changes" : "Create Store"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VendorStore;
