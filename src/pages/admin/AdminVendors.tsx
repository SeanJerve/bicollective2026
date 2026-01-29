import { useEffect, useState } from "react";
import { BadgeCheck, Ban, Eye } from "lucide-react";
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
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 skeleton-brutal" />
          <div className="h-64 skeleton-brutal" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-heading text-4xl uppercase">Vendors</h1>
        <p className="text-muted-foreground mt-1">
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
        <div className="card-brutal overflow-hidden">
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
                      <div className="w-10 h-10 bg-muted flex items-center justify-center font-heading">
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card-brutal p-12 text-center">
          <h3 className="font-heading text-2xl uppercase mb-4">No Vendors</h3>
          <p className="text-muted-foreground">
            No vendors match the current filter.
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminVendors;
