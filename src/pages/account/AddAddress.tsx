import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BICOL_PROVINCES } from "@/data/bicolGeo";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AddAddress = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    label: "Home",
    full_name: "",
    phone: "",
    street: "",
    barangay: "",
    province: "",
    city: "",
    zip_code: "",
    is_default: true,
  });

  const selectedProvince = useMemo(
    () => BICOL_PROVINCES.find((p) => p.name === formData.province),
    [formData.province]
  );

  const selectedCity = useMemo(
    () => selectedProvince?.cities.find((c) => c.name === formData.city),
    [selectedProvince, formData.city]
  );

  // Auto-fill zip code when city changes
  const handleCityChange = (cityName: string) => {
    const city = selectedProvince?.cities.find((c) => c.name === cityName);
    setFormData({
      ...formData,
      city: cityName,
      zip_code: city?.zipCode || "",
    });
  };

  const handleProvinceChange = (province: string) => {
    setFormData({
      ...formData,
      province,
      city: "",
      zip_code: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.full_name || !formData.phone || !formData.street || !formData.barangay || !formData.province || !formData.city || !formData.zip_code) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("addresses").insert({
        user_id: user.id,
        label: formData.label,
        full_name: formData.full_name,
        phone: formData.phone,
        street: formData.street,
        barangay: formData.barangay,
        city: formData.city,
        province: formData.province,
        zip_code: formData.zip_code,
        is_default: formData.is_default,
      });

      if (error) throw error;

      toast({ title: "Address saved" });
      navigate(returnTo || "/account/profile");
    } catch (error: any) {
      toast({ title: "Failed to save address", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageLayout>
      <section className="py-12">
        <div className="section-container max-w-xl">
          <button
            onClick={() => navigate(returnTo || "/account/profile")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <h1 className="font-heading text-3xl md:text-4xl uppercase mb-6">
            Add Address
          </h1>

          <div className="card-brutal p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Label */}
              <div>
                <label className="font-heading text-sm uppercase tracking-wide mb-2 block">
                  Address Label
                </label>
                <Select
                  value={formData.label}
                  onValueChange={(v) => setFormData({ ...formData, label: v })}
                >
                  <SelectTrigger className="input-brutal">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Home">Home</SelectItem>
                    <SelectItem value="Work">Work</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Full Name */}
              <div>
                <label className="font-heading text-sm uppercase tracking-wide mb-2 block">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="input-brutal"
                  placeholder="Juan Dela Cruz"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="font-heading text-sm uppercase tracking-wide mb-2 block">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input-brutal"
                  placeholder="+63 9XX XXX XXXX"
                  required
                />
              </div>

              {/* Street */}
              <div>
                <label className="font-heading text-sm uppercase tracking-wide mb-2 block">
                  Street Address
                </label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  className="input-brutal"
                  placeholder="House/Unit No., Street Name"
                  required
                />
              </div>

              {/* Barangay */}
              <div>
                <label className="font-heading text-sm uppercase tracking-wide mb-2 block">
                  Barangay
                </label>
                <input
                  type="text"
                  value={formData.barangay}
                  onChange={(e) => setFormData({ ...formData, barangay: e.target.value })}
                  className="input-brutal"
                  placeholder="Barangay name"
                  required
                />
              </div>

              {/* Province (dropdown) */}
              <div>
                <label className="font-heading text-sm uppercase tracking-wide mb-2 block">
                  Province
                </label>
                <Select
                  value={formData.province}
                  onValueChange={handleProvinceChange}
                >
                  <SelectTrigger className="input-brutal">
                    <SelectValue placeholder="Select province" />
                  </SelectTrigger>
                  <SelectContent>
                    {BICOL_PROVINCES.map((p) => (
                      <SelectItem key={p.name} value={p.name}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* City (dropdown, filtered by province) */}
              <div>
                <label className="font-heading text-sm uppercase tracking-wide mb-2 block">
                  City / Municipality
                </label>
                <Select
                  value={formData.city}
                  onValueChange={handleCityChange}
                  disabled={!formData.province}
                >
                  <SelectTrigger className="input-brutal">
                    <SelectValue placeholder={formData.province ? "Select city" : "Select province first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedProvince?.cities.map((c) => (
                      <SelectItem key={c.name} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Zip Code (dropdown, auto-filled) */}
              <div>
                <label className="font-heading text-sm uppercase tracking-wide mb-2 block">
                  Zip Code
                </label>
                <input
                  type="text"
                  value={formData.zip_code}
                  className="input-brutal bg-muted"
                  readOnly
                  placeholder="Auto-filled from city"
                />
              </div>

              {/* Default toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="w-5 h-5"
                />
                <span className="text-sm">Set as default address</span>
              </label>

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
                {saving ? "Saving..." : "Save Address"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default AddAddress;
