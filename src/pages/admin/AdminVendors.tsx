import { useEffect, useState } from "react";
import { BadgeCheck, Ban, Eye, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AdminVendors = () => {
  const { toast } = useToast();
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const { data } = await supabase
          .from("brands")
          .select("*")
          .order("created_at", { ascending: false });

        setVendors(data || []);
      } catch (error) {
        console.error("Error fetching vendors:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVendors();
  }, []);

  const updateVendorStatus = async (vendorId: string, status: "approved" | "verified" | "suspended") => {
    try {
      const { error } = await supabase
        .from("brands")
        .update({ status })
        .eq("id", vendorId);

      if (error) throw error;

      setVendors((prev) =>
        prev.map((v) => (v.id === vendorId ? { ...v, status } : v))
      );

      toast({
        title: "Vendor updated",
        description: `Vendor status changed to ${status}`,
      });
    } catch (error) {
      console.error("Error updating vendor:", error);
      toast({
        title: "Error",
        description: "Failed to update vendor",
        variant: "destructive",
      });
    }
  };

  const deleteVendor = async (vendorId: string) => {
    if (!confirm("Permanently delete this vendor and all their data? This cannot be undone.")) return;
    try {
      const { error } = await supabase.from("brands").delete().eq("id", vendorId);
      if (error) throw error;
      setVendors(prev => prev.filter(v => v.id !== vendorId));
      toast({ title: "Vendor deleted permanently" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete vendor", variant: "destructive" });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "bg-success text-success-foreground";
      case "approved":
        return "bg-primary text-primary-foreground";
      case "pending":
        return "bg-muted text-muted-foreground";
      case "suspended":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const filteredVendors = vendors.filter((v) => {
    if (filter === "all") return true;
    return v.status === filter;
  });

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
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="font-heading text-2xl md:text-4xl uppercase">Vendors</h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Manage vendor accounts and verification
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { value: "all", label: "All" },
          { value: "pending", label: "Pending" },
          { value: "approved", label: "Approved" },
          { value: "verified", label: "Verified" },
          { value: "suspended", label: "Suspended" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 font-heading text-sm uppercase ${
              filter === f.value
                ? "bg-foreground text-background"
                : "bg-secondary hover:bg-accent"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filteredVendors.length > 0 ? (
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredVendors.map((vendor) => (
              <div key={vendor.id} className="card-brutal p-4">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 bg-muted flex items-center justify-center font-heading flex-shrink-0 overflow-hidden">
                    {vendor.logo_url ? (
                      <img
                        src={vendor.logo_url}
                        alt={vendor.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      vendor.name.charAt(0)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{vendor.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{vendor.slug}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`px-2 py-0.5 text-xs uppercase ${getStatusColor(
                          vendor.status
                        )}`}
                      >
                        {vendor.status}
                      </span>
                      {vendor.rating && (
                        <span className="text-xs text-muted-foreground">
                          ★ {vendor.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
                  <span className="text-xs text-muted-foreground">
                    Joined {new Date(vendor.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-1">
                    <a
                      href={`/brands/${vendor.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-secondary"
                      title="View Store"
                    >
                      <Eye className="w-4 h-4" />
                    </a>
                    {vendor.status !== "verified" && (
                      <button
                        onClick={() => updateVendorStatus(vendor.id, "verified")}
                        className="p-2 hover:bg-success/20"
                        title="Verify"
                      >
                        <BadgeCheck className="w-4 h-4 text-success" />
                      </button>
                    )}
                    {vendor.status !== "suspended" && (
                      <button
                        onClick={() => updateVendorStatus(vendor.id, "suspended")}
                        className="p-2 hover:bg-destructive/20"
                        title="Suspend"
                      >
                        <Ban className="w-4 h-4 text-destructive" />
                      </button>
                    )}
                    {vendor.status === "suspended" && (
                      <button
                        onClick={() => updateVendorStatus(vendor.id, "approved")}
                        className="p-2 hover:bg-secondary"
                        title="Reactivate"
                      >
                        <BadgeCheck className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteVendor(vendor.id)}
                      className="p-2 hover:bg-destructive/20"
                      title="Delete permanently"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block card-brutal overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary">
                  <tr>
                    <th className="text-left p-4 font-heading text-sm uppercase">Brand</th>
                    <th className="text-left p-4 font-heading text-sm uppercase">Slug</th>
                    <th className="text-left p-4 font-heading text-sm uppercase">Rating</th>
                    <th className="text-left p-4 font-heading text-sm uppercase">Status</th>
                    <th className="text-left p-4 font-heading text-sm uppercase">Joined</th>
                    <th className="text-right p-4 font-heading text-sm uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {filteredVendors.map((vendor) => (
                    <tr key={vendor.id}>
                      <td className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-muted flex items-center justify-center font-heading overflow-hidden">
                            {vendor.logo_url ? (
                              <img
                                src={vendor.logo_url}
                                alt={vendor.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              vendor.name.charAt(0)
                            )}
                          </div>
                          <span className="font-medium">{vendor.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">{vendor.slug}</td>
                      <td className="p-4">{vendor.rating?.toFixed(1) || "-"}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 text-xs uppercase ${getStatusColor(
                            vendor.status
                          )}`}
                        >
                          {vendor.status}
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {new Date(vendor.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={`/brands/${vendor.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-secondary"
                            title="View Store"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                          {vendor.status !== "verified" && (
                            <button
                              onClick={() => updateVendorStatus(vendor.id, "verified")}
                              className="p-2 hover:bg-success/20"
                              title="Verify"
                            >
                              <BadgeCheck className="w-4 h-4 text-success" />
                            </button>
                          )}
                          {vendor.status !== "suspended" && (
                            <button
                              onClick={() => updateVendorStatus(vendor.id, "suspended")}
                              className="p-2 hover:bg-destructive/20"
                              title="Suspend"
                            >
                              <Ban className="w-4 h-4 text-destructive" />
                            </button>
                          )}
                          {vendor.status === "suspended" && (
                            <button
                              onClick={() => updateVendorStatus(vendor.id, "approved")}
                              className="p-2 hover:bg-secondary"
                              title="Reactivate"
                            >
                              <BadgeCheck className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteVendor(vendor.id)}
                            className="p-2 hover:bg-destructive/20"
                            title="Delete permanently"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="card-brutal p-8 md:p-12 text-center">
          <h3 className="font-heading text-xl md:text-2xl uppercase mb-4">No Vendors</h3>
          <p className="text-muted-foreground text-sm md:text-base">
            No vendors match the current filter.
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminVendors;
