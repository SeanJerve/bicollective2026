import { useEffect, useState } from "react";
import { Loader2, Search, Users, Shield, Store, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import Pagination from "@/components/admin/Pagination";

interface UserRecord {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  roles: string[];
  full_name: string | null;
  avatar_url: string | null;
}

const ITEMS_PER_PAGE = 20;

const roleIcons: Record<string, typeof Shield> = {
  admin: Shield,
  vendor: Store,
  customer: User,
};

const roleColors: Record<string, string> = {
  admin: "bg-destructive text-destructive-foreground",
  vendor: "bg-primary text-primary-foreground",
  customer: "bg-secondary text-secondary-foreground",
};

const AdminUsers = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-list-users");
      if (error) throw error;
      setUsers(data.users || []);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast({ title: "Error loading users", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.roles.includes(roleFilter);
    return matchesSearch && matchesRole;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="font-heading text-2xl md:text-4xl uppercase">Users</h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Manage platform users ({filtered.length} total)
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-brutal w-full pl-10"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="input-brutal w-full sm:w-auto"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admins</option>
          <option value="vendor">Vendors</option>
          <option value="customer">Customers</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : paginated.length === 0 ? (
        <div className="card-brutal p-8 md:p-12 text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-heading text-xl uppercase mb-2">No Users</h3>
          <p className="text-muted-foreground text-sm">No users match your search</p>
        </div>
      ) : (
        <>
          {/* Mobile */}
          <div className="md:hidden space-y-4">
            {paginated.map((user) => (
              <div key={user.id} className="card-brutal p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-secondary flex items-center justify-center flex-shrink-0 uppercase font-heading text-sm">
                    {user.full_name?.[0] || user.email[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{user.full_name || "—"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Joined {format(new Date(user.created_at), "PP")}
                    </p>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {user.roles.map((role) => (
                        <span key={role} className={`px-2 py-0.5 text-xs uppercase ${roleColors[role] || "bg-muted"}`}>
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop */}
          <div className="hidden md:block card-brutal overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary">
                  <tr>
                    <th className="text-left p-4 font-heading text-sm uppercase">User</th>
                    <th className="text-left p-4 font-heading text-sm uppercase">Email</th>
                    <th className="text-left p-4 font-heading text-sm uppercase">Roles</th>
                    <th className="text-left p-4 font-heading text-sm uppercase">Joined</th>
                    <th className="text-left p-4 font-heading text-sm uppercase">Last Login</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {paginated.map((user) => (
                    <tr key={user.id}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-secondary flex items-center justify-center flex-shrink-0 uppercase font-heading text-xs">
                            {user.full_name?.[0] || user.email[0]}
                          </div>
                          <span className="font-medium">{user.full_name || "—"}</span>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground text-sm">{user.email}</td>
                      <td className="p-4">
                        <div className="flex gap-1 flex-wrap">
                          {user.roles.map((role) => (
                            <span key={role} className={`px-2 py-0.5 text-xs uppercase ${roleColors[role] || "bg-muted"}`}>
                              {role}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground text-sm">
                        {format(new Date(user.created_at), "PP")}
                      </td>
                      <td className="p-4 text-muted-foreground text-sm">
                        {user.last_sign_in_at
                          ? format(new Date(user.last_sign_in_at), "PP")
                          : "Never"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </>
      )}
    </div>
  );
};

export default AdminUsers;
