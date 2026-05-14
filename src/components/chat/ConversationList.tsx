import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MessageSquare, Loader2, Search, Paperclip, Trash2, X } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";

interface Conversation {
  vendorOrderId: string;
  otherUserId: string;
  otherUserName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  orderId: string;
  brandName: string;
  hasAttachment: boolean;
}

interface ConversationListProps {
  selectedConversation: string | null;
  onSelect: (conv: Conversation) => void;
  role: "customer" | "vendor";
}

const STORAGE_KEY = "bicollective_deleted_convs";

const getDeletedConvs = (): Set<string> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
};

const saveDeletedConv = (key: string) => {
  try {
    const existing = getDeletedConvs();
    existing.add(key);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing]));
  } catch {
    // ignore
  }
};

const ConversationList = ({ selectedConversation, onSelect, role }: ConversationListProps) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const deleted = getDeletedConvs();

    // Get all messages where user is sender or receiver
    const { data: messages, error } = await supabase
      .from("messages")
      .select(
        "vendor_order_id, sender_id, receiver_id, content, created_at, read_at, attachment_type"
      )
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (error || !messages) {
      setLoading(false);
      return;
    }

    // Group by otherUserId (consolidate conversations)
    const grouped = new Map<string, typeof messages>();
    for (const msg of messages) {
      const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      const existing = grouped.get(otherId) || [];
      existing.push(msg);
      grouped.set(otherId, existing);
    }

    // Get all vendor order IDs from all messages to fetch their brands
    const allVoIds = new Set<string>();
    for (const msgs of grouped.values()) {
      msgs.forEach((m) => {
        if (m.vendor_order_id) allVoIds.add(m.vendor_order_id);
      });
    }

    const { data: vendorOrders } = await supabase
      .from("vendor_orders")
      .select("id, order_id, brand:brands(id, name, owner_id)")
      .in("id", Array.from(allVoIds));

    // Get other user profiles
    const otherUserIds = Array.from(grouped.keys());
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", otherUserIds);

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p.full_name || "User"]) || []);

    // Build conversation list
    const convs: Conversation[] = [];
    for (const [otherId, msgs] of grouped.entries()) {
      const lastMsg = msgs[0]; // already sorted desc

      // Find brand name and order ID from messages in this conversation
      let brandName = "Unknown Store";
      let orderId = "";

      for (const msg of msgs) {
        const vo = vendorOrders?.find((v) => v.id === msg.vendor_order_id);
        if (vo) {
          orderId = vo.order_id;
          const brandData = vo.brand as any;
          if (brandData?.name) {
            brandName = brandData.name;
            break;
          }
        }
      }

      // Build a stable key to check against localStorage deletions
      const convKey = `${user.id}:${otherId}`;
      if (deleted.has(convKey)) continue;

      const unreadCount = msgs.filter((m) => m.receiver_id === user.id && !m.read_at).length;
      const otherUserName = role === "customer" ? brandName : profileMap.get(otherId) || "Customer";

      convs.push({
        vendorOrderId: lastMsg.vendor_order_id,
        otherUserId: otherId,
        otherUserName,
        lastMessage: lastMsg.content,
        lastMessageAt: lastMsg.created_at,
        unreadCount,
        orderId,
        brandName,
        hasAttachment: !!lastMsg.attachment_type,
      });
    }

    // Sort by latest message
    convs.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

    // Also fetch direct messages
    const { data: dms } = await supabase
      .from("direct_messages")
      .select(
        "id, sender_id, receiver_id, content, created_at, read_at, product_name, product_image"
      )
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (dms && dms.length > 0) {
      // Group DMs by other user
      const dmGrouped = new Map<string, typeof dms>();
      for (const dm of dms) {
        const otherId = dm.sender_id === user.id ? dm.receiver_id : dm.sender_id;
        const existing = dmGrouped.get(otherId) || [];
        existing.push(dm);
        dmGrouped.set(otherId, existing);
      }

      // Get profiles for DM users
      const dmOtherIds = Array.from(dmGrouped.keys());
      const { data: dmProfiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", dmOtherIds);
      const dmProfileMap = new Map(
        dmProfiles?.map((p) => [p.user_id, p.full_name || "User"]) || []
      );

      // Get brand names for vendor users (for customer view)
      const { data: dmBrands } = await supabase
        .from("brands")
        .select("owner_id, name")
        .in("owner_id", dmOtherIds);
      const dmBrandMap = new Map(dmBrands?.map((b) => [b.owner_id, b.name]) || []);

      for (const [otherId, msgs] of dmGrouped.entries()) {
        const convKey = `${user.id}:${otherId}`;
        if (deleted.has(convKey)) continue;

        // Skip if this user already has an order-based conversation
        const existingConv = convs.find((c) => c.otherUserId === otherId);
        if (existingConv) continue;

        const lastMsg = msgs[0];
        const unreadCount = msgs.filter((m) => m.receiver_id === user.id && !m.read_at).length;
        const otherUserName =
          role === "customer"
            ? dmBrandMap.get(otherId) || dmProfileMap.get(otherId) || "Seller"
            : dmProfileMap.get(otherId) || "Customer";

        // Find product context from messages
        const productMsg = msgs.find((m) => m.product_name);
        const productLabel = productMsg?.product_name ? ` · ${productMsg.product_name}` : "";

        convs.push({
          vendorOrderId: `dm-${otherId}`,
          otherUserId: otherId,
          otherUserName,
          lastMessage: lastMsg.content,
          lastMessageAt: lastMsg.created_at,
          unreadCount,
          orderId: "",
          brandName: dmBrandMap.get(otherId) || otherUserName,
          hasAttachment: false,
        });
      }

      // Re-sort after merging
      convs.sort(
        (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      );
    }

    setConversations(convs);
    setLoading(false);
  }, [user, role]);

  useEffect(() => {
    if (!user) return;
    fetchConversations();

    // Subscribe to new messages for live updates
    const channel = supabase
      .channel("conversations-list")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        () => {
          fetchConversations();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, role, fetchConversations]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, "h:mm a");
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMM d");
  };

  const handleDeleteConversation = (conv: Conversation) => {
    const convKey = `${user!.id}:${conv.otherUserId}`;
    saveDeletedConv(convKey);
    setConversations((prev) => prev.filter((c) => c.otherUserId !== conv.otherUserId));
    setConfirmDeleteId(null);
  };

  const filtered = conversations.filter(
    (c) =>
      c.otherUserName.toLowerCase().includes(search.toLowerCase()) ||
      (c.lastMessage || "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b border-border-subtle">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-brutal w-full text-sm pl-9 py-2"
          />
        </div>
      </div>

      {/* Confirm Delete Overlay */}
      {confirmDeleteId &&
        (() => {
          const conv = conversations.find((c) => c.otherUserId === confirmDeleteId);
          if (!conv) return null;
          return (
            <div className="mx-3 mt-2 mb-1 p-3 border-2 border-destructive bg-destructive/10 animate-fade-in">
              <p className="text-xs font-heading uppercase text-destructive mb-2">
                Remove conversation with {conv.otherUserName}?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 border-2 border-foreground text-xs font-heading uppercase hover:bg-secondary transition-colors"
                >
                  <X className="w-3 h-3" /> Keep
                </button>
                <button
                  onClick={() => handleDeleteConversation(conv)}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 border-2 border-destructive bg-destructive text-destructive-foreground text-xs font-heading uppercase hover:bg-destructive/90 transition-colors"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>
          );
        })()}

      {/* Conversation Items */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <MessageSquare className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">No conversations yet</p>
          </div>
        ) : (
          filtered.map((conv) => (
            <div
              key={conv.otherUserId}
              className={`group relative border-b border-border-subtle transition-colors ${
                selectedConversation === conv.vendorOrderId ||
                selectedConversation === conv.otherUserId
                  ? "bg-secondary border-l-4 border-l-foreground"
                  : "hover:bg-secondary/50"
              }`}
            >
              <button onClick={() => onSelect(conv)} className="w-full text-left px-4 py-3 pr-10">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm truncate ${conv.unreadCount > 0 ? "font-bold" : "font-medium"}`}
                      >
                        {conv.otherUserName}
                      </span>
                      {conv.unreadCount > 0 && (
                        <span className="shrink-0 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center rounded-full">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">
                      {conv.vendorOrderId.startsWith("dm-")
                        ? "Direct Message"
                        : `Order #${conv.orderId.slice(0, 8)}`}
                    </p>
                    <p
                      className={`text-xs mt-1 truncate flex items-center gap-1 ${conv.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}
                    >
                      {conv.hasAttachment && <Paperclip className="w-3 h-3 shrink-0" />}
                      {conv.lastMessage || (conv.hasAttachment ? "Attachment" : "")}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                    {formatTime(conv.lastMessageAt)}
                  </span>
                </div>
              </button>

              {/* Delete button — appears on hover */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDeleteId(conv.otherUserId);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                title="Delete conversation"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ConversationList;
