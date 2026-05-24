import { Link } from "react-router-dom";
import {
  Users,
  Package,
  ShoppingCart,
  BadgeCheck,
  AlertTriangle,
  FileText,
  DollarSign,
  ShieldCheck,
  ArrowRight,
  ClipboardList,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { calcCommissionAtCurrentRate } from "@/lib/platformFees";
import { useQuery } from "@tanstack/react-query";

const AdminDashboard = () => {
  // Query all active queues and pending statistics
  const { data: stats } = useQuery({
    queryKey: ["admin-dashboard-action-stats"],
    queryFn: async () => {
      const [
        pendingReports,
        pendingApplications,
        pendingVerifications,
        pendingTransactions,
        pendingBoosts,
      ] = await Promise.all([
        supabase
          .from("reports")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("vendor_applications")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("vendor_verifications")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("platform_transactions")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("ad_boosts")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending"),
      ]);

      return {
        pendingReports: pendingReports.count || 0,
        pendingApplications: pendingApplications.count || 0,
        pendingVerifications: pendingVerifications.count || 0,
        pendingFinances: (pendingTransactions.count || 0) + (pendingBoosts.count || 0),
      };
    },
  });

  // Query details for active queue feeds
  const { data: siteFinance } = useQuery({
    queryKey: ["admin-dashboard-site-finance"],
    queryFn: async () => {
      const { data: orders, error } = await supabase
        .from("vendor_orders")
        .select("subtotal, brand:brands(commission_rate)")
        .eq("status", "delivered");
      if (error) throw error;

      let totalIncome = 0;
      let siteProfit = 0;
      orders?.forEach((order) => {
        const subtotal = Number(order.subtotal);
        totalIncome += subtotal;
        siteProfit += calcCommissionAtCurrentRate(
          subtotal,
          (order.brand as { commission_rate?: number | null } | null)?.commission_rate
        );
      });
      return { totalIncome, siteProfit };
    },
  });

  const { data: queueDetails } = useQuery({
    queryKey: ["admin-dashboard-queues"],
    queryFn: async () => {
      const [applications, verifications, reports] = await Promise.all([
        supabase
          .from("vendor_applications")
          .select("id, brand_name, contact_email, created_at")
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(4),
        supabase
          .from("vendor_verifications")
          .select("id, submitted_at, brand:brands(name)")
          .eq("status", "pending")
          .order("submitted_at", { ascending: false })
          .limit(4),
        supabase
          .from("reports")
          .select("id, reason, created_at, review:reviews(comment)")
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(4),
      ]);

      return {
        applications: applications.data || [],
        verifications: verifications.data || [],
        reports: reports.data || [],
      };
    },
  });

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount);

  const s = stats || {
    pendingReports: 0,
    pendingApplications: 0,
    pendingVerifications: 0,
    pendingFinances: 0,
  };

  const q = queueDetails || {
    applications: [],
    verifications: [],
    reports: [],
  };

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div>
        <h1 className="font-heading text-2xl md:text-4xl uppercase">Operations Command Center</h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Real-time oversight, approvals flow, and disputes queue
        </p>
      </div>

      {/* Site revenue */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card-brutal p-5 bg-background">
          <p className="text-[10px] uppercase font-heading text-muted-foreground flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5" /> Total Income Generated
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Delivered vendor sales (no shipping)</p>
          <p className="font-heading text-2xl font-bold mt-2">
            {formatPrice(siteFinance?.totalIncome ?? 0)}
          </p>
        </div>
        <div className="card-brutal p-5 bg-background border-green-600/30">
          <p className="text-[10px] uppercase font-heading text-muted-foreground flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-green-600" /> Site Profit
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Commission at current rates (10% / 5% premium)</p>
          <p className="font-heading text-2xl font-bold mt-2 text-green-600">
            {formatPrice(siteFinance?.siteProfit ?? 0)}
          </p>
        </div>
      </div>

      {/* Action Badges Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Pending Applications",
            value: s.pendingApplications,
            to: "/admin/applications",
            highlight: s.pendingApplications > 0,
            color: "text-amber-600 bg-amber-50 border-amber-300"
          },
          {
            label: "Verification Requests",
            value: s.pendingVerifications,
            to: "/admin/verifications",
            highlight: s.pendingVerifications > 0,
            color: "text-blue-600 bg-blue-50 border-blue-300"
          },
          {
            label: "Disputes & Reports",
            value: s.pendingReports,
            to: "/admin/reports",
            highlight: s.pendingReports > 0,
            color: "text-destructive bg-destructive/10 border-destructive/30"
          },
          {
            label: "Finance Approvals",
            value: s.pendingFinances,
            to: "/admin/finances",
            highlight: s.pendingFinances > 0,
            color: "text-green-600 bg-green-50 border-green-300"
          }
        ].map((item) => (
          <Link
            key={item.label}
            to={item.to}
            className={`card-brutal p-5 flex flex-col justify-between hover:bg-secondary/40 transition-colors shadow-brutal-sm hover:-translate-y-0.5 active:translate-y-0 bg-background ${
              item.highlight ? item.color : "border-foreground/10"
            }`}
          >
            <span className="text-xs uppercase font-heading text-muted-foreground">{item.label}</span>
            <div className="flex items-baseline justify-between mt-3">
              <span className="font-heading text-3xl font-bold">{item.value}</span>
              <ArrowRight className="w-4 h-4 opacity-50" />
            </div>
          </Link>
        ))}
      </div>

      {/* Main Queues Feed Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Verification requests queue */}
        <div className="card-brutal flex flex-col">
          <div className="p-5 border-b-2 border-foreground flex items-center justify-between bg-muted/20">
            <h2 className="font-heading text-lg uppercase flex items-center gap-2">
              <BadgeCheck className="w-5 h-5 text-blue-500" /> Verifications Queue
            </h2>
            <Link to="/admin/verifications" className="text-xs font-heading uppercase text-muted-foreground hover:text-foreground">
              Manage All
            </Link>
          </div>
          <div className="flex-1 divide-y divide-border-subtle">
            {q.verifications.length > 0 ? (
              q.verifications.map((v: any) => (
                <div key={v.id} className="p-4 flex items-center justify-between hover:bg-secondary/20 transition-colors">
                  <div>
                    <p className="font-heading text-sm uppercase leading-tight">{v.brand?.name || "Unknown Brand"}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                      Requested: {new Date(v.submitted_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Link to="/admin/verifications" className="btn-brutal px-3 py-1.5 text-xs shadow-none">
                    Review File
                  </Link>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground italic text-sm">
                No verifications requests pending.
              </div>
            )}
          </div>
        </div>

        {/* Vendor applications queue */}
        <div className="card-brutal flex flex-col">
          <div className="p-5 border-b-2 border-foreground flex items-center justify-between bg-muted/20">
            <h2 className="font-heading text-lg uppercase flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-500" /> Pending Registrations
            </h2>
            <Link to="/admin/applications" className="text-xs font-heading uppercase text-muted-foreground hover:text-foreground">
              Manage All
            </Link>
          </div>
          <div className="flex-1 divide-y divide-border-subtle">
            {q.applications.length > 0 ? (
              q.applications.map((app: any) => (
                <div key={app.id} className="p-4 flex items-center justify-between hover:bg-secondary/20 transition-colors">
                  <div>
                    <p className="font-heading text-sm uppercase leading-tight">{app.brand_name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                      Contact: {app.contact_email}
                    </p>
                  </div>
                  <Link to="/admin/applications" className="btn-brutal px-3 py-1.5 text-xs shadow-none">
                    Verify Registration
                  </Link>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground italic text-sm">
                No vendor applications pending.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Flagged Review Disputes Feed */}
      <div className="card-brutal">
        <div className="p-5 border-b-2 border-foreground flex items-center justify-between bg-muted/20">
          <h2 className="font-heading text-lg uppercase flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" /> Flagged Content & Disputes Feed
          </h2>
          <Link to="/admin/reports" className="text-xs font-heading uppercase text-muted-foreground hover:text-foreground">
            View All Reports
          </Link>
        </div>
        <div className="divide-y divide-border-subtle">
          {q.reports.length > 0 ? (
            q.reports.map((report: any) => (
              <div key={report.id} className="p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-heading uppercase text-destructive bg-destructive/10 px-2 py-0.5 border border-destructive/20">
                      Flagged Review
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {new Date(report.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">Reason: "{report.reason}"</p>
                  {report.review && (
                    <p className="text-xs text-muted-foreground italic">
                      Review Comment: "{report.review.comment || "(No text)"}"
                    </p>
                  )}
                </div>
                <Link to="/admin/reports" className="btn-brutal px-4 py-2 text-xs shadow-none self-start sm:self-center">
                  Moderate Dispute
                </Link>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground italic text-sm">
              All clear! No pending flagged reports.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
