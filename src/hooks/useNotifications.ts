import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface NotificationCounts {
  // Admin counts
  pendingApplications: number;
  pendingVerifications: number;
  pendingReports: number;
  pendingDisputes: number;
  // Vendor counts
  pendingOrders: number;
  newReviews: number;
  lowStockProducts: number;
  verificationResubmission: number;
  // Customer counts
  orderUpdates: number;
  needsResubmission: number;
  // Shared
  unreadMessages: number;
}

const EMPTY_COUNTS: NotificationCounts = {
  pendingApplications: 0,
  pendingVerifications: 0,
  pendingReports: 0,
  pendingDisputes: 0,
  pendingOrders: 0,
  newReviews: 0,
  lowStockProducts: 0,
  verificationResubmission: 0,
  orderUpdates: 0,
  needsResubmission: 0,
  unreadMessages: 0,
};

// Track dismissed notifications per session
const dismissedKeys = new Set<string>();

export const useNotifications = () => {
  const { user, isAdmin, isVendor } = useAuth();
  const [counts, setCounts] = useState<NotificationCounts>(EMPTY_COUNTS);
  const [loading, setLoading] = useState(false);

  const fetchCounts = useCallback(async () => {
    if (!user) {
      setCounts(EMPTY_COUNTS);
      return;
    }

    setLoading(true);

    try {
      const newCounts = { ...EMPTY_COUNTS };

      if (isAdmin) {
        const [apps, verifs, reports, disputes] = await Promise.all([
          supabase.from("vendor_applications").select("*", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("vendor_verifications").select("*", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("disputes").select("*", { count: "exact", head: true }).eq("status", "pending"),
        ]);
        newCounts.pendingApplications = apps.count || 0;
        newCounts.pendingVerifications = verifs.count || 0;
        newCounts.pendingReports = reports.count || 0;
        newCounts.pendingDisputes = disputes.count || 0;
      }

      if (isVendor && !isAdmin) {
        const { data: brand } = await supabase.from("brands").select("id").eq("owner_id", user.id).maybeSingle();
        if (brand) {
          const [orders, reviews, lowStock, verifs] = await Promise.all([
            supabase.from("vendor_orders").select("*", { count: "exact", head: true }).eq("brand_id", brand.id).in("status", ["payment_uploaded", "pending_payment"]),
            supabase.from("reviews").select("*", { count: "exact", head: true }).eq("brand_id", brand.id).eq("is_visible", true),
            supabase.from("products").select("*", { count: "exact", head: true }).eq("brand_id", brand.id).lt("stock_quantity", 5),
            supabase.from("vendor_verifications").select("status").eq("brand_id", brand.id).order("submitted_at", { ascending: false }).limit(1),
          ]);
          newCounts.pendingOrders = orders.count || 0;
          newCounts.newReviews = reviews.count || 0;
          newCounts.lowStockProducts = lowStock.count || 0;
          newCounts.verificationResubmission = (verifs.data && verifs.data[0]?.status === "needs_resubmission") ? 1 : 0;
        }
      }

      if (!isAdmin) {
        // Customer: count orders with recent status changes
        // We select vendor_orders directly and count unique order_ids
        // Let's use the working 'orders' with inner join pattern but fixed
        const { data: customerOrders } = await supabase
          .from("orders")
          .select("id, vendor_orders!inner(status)")
          .eq("customer_id", user.id)
          .in("vendor_orders.status", ["payment_uploaded", "paid", "confirmed", "handed_to_courier", "for_delivery", "shipped"]);

        // Deduplicate order IDs
        const uniqueOrderIds = new Set(customerOrders?.map(o => o.id) || []);
        newCounts.orderUpdates = uniqueOrderIds.size;

        // Check for vendor applications needing resubmission
        const { data: apps } = await supabase
          .from("vendor_applications")
          .select("status")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1);
        newCounts.needsResubmission = (apps && apps[0]?.status === "needs_resubmission") ? 1 : 0;
      }

      // Unread messages for all authenticated users
      const { count: unreadMessages } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .is("read_at", null);
      newCounts.unreadMessages = unreadMessages || 0;

      // Zero out dismissed counts
      Object.keys(newCounts).forEach((k) => {
        const key = k as keyof NotificationCounts;
        if (dismissedKeys.has(key)) {
          newCounts[key] = 0;
        }
      });

      setCounts(newCounts);
    } catch (error) {
      console.error("Error fetching notification counts:", error);
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin, isVendor]);

  // Debounced version for realtime events
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedFetchCounts = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchCounts();
    }, 2000);
  }, [fetchCounts]);

  useEffect(() => {
    fetchCounts();

    if (!user) return;

    const channels: ReturnType<typeof supabase.channel>[] = [];

    if (isAdmin) {
      const adminChannel = supabase
        .channel("admin-notifications")
        .on("postgres_changes", { event: "*", schema: "public", table: "vendor_applications" }, debouncedFetchCounts)
        .on("postgres_changes", { event: "*", schema: "public", table: "vendor_verifications" }, debouncedFetchCounts)
        .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, debouncedFetchCounts)
        .on("postgres_changes", { event: "*", schema: "public", table: "disputes" }, debouncedFetchCounts)
        .subscribe();
      channels.push(adminChannel);
    }

    if (isVendor && !isAdmin) {
      const vendorChannel = supabase
        .channel("vendor-notifications")
        .on("postgres_changes", { event: "*", schema: "public", table: "vendor_orders" }, debouncedFetchCounts)
        .on("postgres_changes", { event: "*", schema: "public", table: "reviews" }, debouncedFetchCounts)
        .on("postgres_changes", { event: "*", schema: "public", table: "products" }, debouncedFetchCounts)
        .subscribe();
      channels.push(vendorChannel);
    }

    if (!isAdmin) {
      const customerChannel = supabase
        .channel("customer-notifications")
        .on("postgres_changes", { event: "*", schema: "public", table: "vendor_orders" }, debouncedFetchCounts)
        .subscribe();
      channels.push(customerChannel);
    }

    // Listen to new messages for unread badge — all authenticated users
    const messagesChannel = supabase
      .channel("messages-notifications")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "messages",
      }, (payload: any) => {
        // Simple check if we are involved
        const isParticipant = 
          payload.new?.receiver_id === user.id || 
          payload.new?.sender_id === user.id || 
          payload.old?.receiver_id === user.id || 
          payload.old?.sender_id === user.id;
          
        if (isParticipant) {
          fetchCounts(); // Call directly for messages
        }
      })
      .subscribe();
    channels.push(messagesChannel);

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [user, isAdmin, isVendor, fetchCounts, debouncedFetchCounts]);

  const dismiss = (key: keyof NotificationCounts) => {
    dismissedKeys.add(key);
    setCounts((prev) => ({ ...prev, [key]: 0 }));
  };

  const totalAdmin = counts.pendingApplications + counts.pendingVerifications + counts.pendingReports + counts.pendingDisputes;
  const totalVendor = counts.pendingOrders + counts.lowStockProducts + counts.verificationResubmission;
  const totalCustomer = counts.orderUpdates + counts.needsResubmission;

  return { counts, loading, dismiss, totalAdmin, totalVendor, totalCustomer, refetch: fetchCounts };
};
