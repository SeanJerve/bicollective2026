import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface NotificationCounts {
  // Admin counts
  pendingApplications: number;
  pendingVerifications: number;
  pendingReports: number;
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
  pendingOrders: 0,
  newReviews: 0,
  lowStockProducts: 0,
  verificationResubmission: 0,
  orderUpdates: 0,
  needsResubmission: 0,
  unreadMessages: 0,
};

// Session persistence key
const DISMISSED_STORAGE_KEY = "bicollective_dismissed_notifications";

export const useNotifications = () => {
  const { user, isAdmin, isVendor } = useAuth();
  const [counts, setCounts] = useState<NotificationCounts>(EMPTY_COUNTS);
  const [loading, setLoading] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);
  const [dismissedKeys, setDismissedKeys] = useState<Set<string>>(new Set());

  // Re-hydrate dismissed keys from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(DISMISSED_STORAGE_KEY);
    if (saved) {
      try {
        setDismissedKeys(new Set(JSON.parse(saved)));
      } catch (e) {
        console.error("Failed to load dismissed notifications", e);
      }
    }
  }, []);

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

      // 2. Fetch ALL unread notifications for accurate badge counting
      const { data: unreadAlerts } = await (supabase as any)
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .is("read_at", null);

      const allUnreads = unreadAlerts || [];

      // Reset counts based on all unread alerts
      newCounts.newReviews = allUnreads.filter((n) => n.type === "review").length;
      newCounts.pendingOrders = allUnreads.filter(
        (n) => n.type === "order" && (n.link?.includes("/vendor") || n.link?.includes("/orders"))
      ).length;
      newCounts.orderUpdates = allUnreads.filter(
        (n) => n.type === "order" && n.link?.includes("/account")
      ).length;
      newCounts.pendingApplications = allUnreads.filter(
        (n) => n.type === "admin" && n.link?.includes("applications")
      ).length;
      newCounts.pendingVerifications = allUnreads.filter(
        (n) => n.type === "admin" && n.link?.includes("verifications")
      ).length;
      newCounts.pendingReports = allUnreads.filter(
        (n) => n.type === "admin" && n.link?.includes("reports")
      ).length;
      newCounts.needsResubmission = allUnreads.filter((n) => n.type === "status").length;
      newCounts.lowStockProducts = allUnreads.filter((n) => n.type === "inventory").length;

      // 6. Messaging (Already head-count based, but we can unify if needed)
      const { count: unreadMessages } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .is("read_at", null);

      const { count: unreadDirectMessages } = await supabase
        .from("direct_messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .is("read_at", null);

      newCounts.unreadMessages = (unreadMessages || 0) + (unreadDirectMessages || 0);

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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        debouncedFetchCounts
      )
      .subscribe();
    channels.push(historyChannel);

    if (isAdmin) {
      const adminChannel = supabase
        .channel("admin-notifications")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "vendor_applications" },
          debouncedFetchCounts
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "vendor_verifications" },
          debouncedFetchCounts
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "reports" },
          debouncedFetchCounts
        )
        .subscribe();
      channels.push(adminChannel);
    }

    if (isVendor) {
      const vendorChannel = supabase
        .channel("vendor-notifications")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "vendor_orders" },
          debouncedFetchCounts
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "reviews" },
          debouncedFetchCounts
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "products" },
          debouncedFetchCounts
        )
        .subscribe();
      channels.push(vendorChannel);
    }

    if (!isAdmin) {
      const customerChannel = supabase
        .channel("customer-notifications")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "vendor_orders" },
          debouncedFetchCounts
        )
        .subscribe();
      channels.push(customerChannel);
    }

    // Listen to new messages for unread badge — all authenticated users
    const handleMessageChange = (payload: any) => {
      // Simple check if we are involved
      const isParticipant =
        payload.new?.receiver_id === user.id ||
        payload.new?.sender_id === user.id ||
        payload.old?.receiver_id === user.id ||
        payload.old?.sender_id === user.id;

      if (isParticipant) {
        fetchCounts(); // Call directly for messages
      }
    };

    const messagesChannel = supabase
      .channel("messages-notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        handleMessageChange
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "direct_messages",
        },
        handleMessageChange
      )
      .subscribe();
    channels.push(messagesChannel);

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [user, isAdmin, isVendor, fetchCounts, debouncedFetchCounts]);

  const dismiss = useCallback(async (key: keyof NotificationCounts) => {
    // Immediate UI feedback
    setCounts((prev) => ({ ...prev, [key]: 0 }));

    // Persist session-level dismissal to avoid flicker on re-fetches
    setDismissedKeys((prevKeys) => {
      const newDismissed = new Set(prevKeys);
      newDismissed.add(key);
      localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(Array.from(newDismissed)));
      return newDismissed;
    });

    if (!user) return;

    try {
      // Specialized dismissal logic for each key
      if (key === "unreadMessages") {
        await supabase
          .from("messages")
          .update({ read_at: new Date().toISOString() })
          .eq("receiver_id", user.id)
          .is("read_at", null);
        await supabase
          .from("direct_messages")
          .update({ read_at: new Date().toISOString() })
          .eq("receiver_id", user.id)
          .is("read_at", null);
        await (supabase as any)
          .from("notifications")
          .update({ read_at: new Date().toISOString() })
          .eq("user_id", user.id)
          .eq("type", "message")
          .is("read_at", null);
      } else {
        // Map keys to notification types/links for database-level "read" status
        let query: any = (supabase as any)
          .from("notifications")
          .update({ read_at: new Date().toISOString() })
          .eq("user_id", user.id)
          .is("read_at", null);

        if (key === "pendingApplications")
          query = query.eq("type", "admin").ilike("link", "%applications%");
        if (key === "pendingVerifications")
          query = query.eq("type", "admin").ilike("link", "%verifications%");
        if (key === "pendingReports") query = query.eq("type", "admin").ilike("link", "%reports%");
        if (key === "newReviews") query = query.eq("type", "review");
        if (key === "pendingOrders")
          query = query.filter("type", "eq", "order").or("link.ilike.%vendor%,link.ilike.%orders%");
        if (key === "orderUpdates") query = query.eq("type", "order").ilike("link", "%account%");
        if (key === "needsResubmission") query = query.eq("type", "status");
        if (key === "lowStockProducts") query = query.eq("type", "inventory");

        await query;
      }

      // Refresh to ensure database state and local count match
      fetchCounts();
    } catch (e) {
      console.error("Failed to persist notification dismissal", e);
    }
  }, [user, fetchCounts]);

  const totalAdmin =
    counts.pendingApplications + counts.pendingVerifications + counts.pendingReports;
  const totalVendor =
    counts.pendingOrders +
    counts.lowStockProducts +
    counts.verificationResubmission +
    counts.newReviews;
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
    markAsRead,
  };
};
