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
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);

  const fetchCounts = useCallback(async () => {
    if (!user) {
      setCounts(EMPTY_COUNTS);
      setRecentNotifications([]);
      return;
    }

    setLoading(true);

    try {
      const newCounts = { ...EMPTY_COUNTS };

      // 1. Fetch persistent notification history
      const { data: history } = await (supabase as any)
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      setRecentNotifications(history || []);

      // 2. Aggregate unread counts from history for badge numbers
      const unreadAlerts = history || [];
      
      // Reset counts to be alert-driven for the badge
      newCounts.newReviews = unreadAlerts.filter(n => !n.read_at && n.type === 'review').length;
      newCounts.pendingOrders = unreadAlerts.filter(n => !n.read_at && n.type === 'order' && n.link?.includes('/vendor')).length;
      newCounts.orderUpdates = unreadAlerts.filter(n => !n.read_at && n.type === 'order' && n.link?.includes('/account')).length;
      newCounts.pendingApplications = unreadAlerts.filter(n => !n.read_at && n.type === 'admin' && n.link?.includes('applications')).length;
      newCounts.pendingVerifications = unreadAlerts.filter(n => !n.read_at && n.type === 'admin' && n.link?.includes('verifications')).length;
      newCounts.pendingReports = unreadAlerts.filter(n => !n.read_at && n.type === 'admin' && n.link?.includes('reports')).length;
      newCounts.pendingDisputes = unreadAlerts.filter(n => !n.read_at && (n.type === 'admin' || n.type === 'dispute') && n.link?.includes('disputes')).length;
      newCounts.needsResubmission = unreadAlerts.filter(n => !n.read_at && n.type === 'status').length;
      newCounts.lowStockProducts = unreadAlerts.filter(n => !n.read_at && n.type === 'inventory').length;

      // 6. Messaging (Already head-count based, but we can unify if needed)
      const { count: unreadMessages } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .is("read_at", null);
      newCounts.unreadMessages = unreadMessages || 0;

      // Filter out dismissed session counts (if still needed, though database now handles persistence)
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

  // Debounced fetch
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedFetchCounts = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchCounts();
    }, 1500);
  }, [fetchCounts]);

  const markAsRead = async (notificationId: string) => {
    const { error } = await (supabase as any)
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId);
    if (!error) fetchCounts();
  };

  useEffect(() => {
    fetchCounts();

    if (!user) return;

    const channels: ReturnType<typeof supabase.channel>[] = [];

    // Notifications history channel
    const historyChannel = supabase
      .channel("history-notifications")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, debouncedFetchCounts)
      .subscribe();
    channels.push(historyChannel);

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

    if (isVendor) {
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
  const totalVendor = counts.pendingOrders + counts.lowStockProducts + counts.verificationResubmission + counts.newReviews;
  const totalCustomer = counts.orderUpdates + counts.needsResubmission;

  return { 
    counts, 
    loading, 
    dismiss, 
    totalAdmin, 
    totalVendor, 
    totalCustomer, 
    refetch: fetchCounts,
    recentNotifications,
    markAsRead
  };
};
