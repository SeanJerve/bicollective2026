import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MessageSquare, Loader2, Search, Paperclip } from "lucide-react";
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
}

interface ConversationListProps {
  selectedConversation: string | null;
  onSelect: (conv: Conversation) => void;
  role: "customer" | "vendor";
}

const ConversationList = ({ selectedConversation, onSelect, role }: ConversationListProps) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      setLoading(true);

      // Get all messages where user is sender or receiver
      const { data: messages, error } = await supabase
        .from("messages")
        .select("vendor_order_id, sender_id, receiver_id, content, created_at, read_at, attachment_type")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error || !messages) {
        setLoading(false);
        return;
      }

      // Group by vendor_order_id
      const grouped = new Map<string, typeof messages>();
      for (const msg of messages) {
        const existing = grouped.get(msg.vendor_order_id) || [];
        existing.push(msg);
        grouped.set(msg.vendor_order_id, existing);
      }

      // Get vendor order details
      const voIds = Array.from(grouped.keys());
      if (voIds.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const { data: vendorOrders } = await supabase
        .from("vendor_orders")
        .select("id, order_id, brand:brands(id, name, owner_id)")
        .in("id", voIds);

      // Get other user profiles
      const otherUserIds = new Set<string>();
      for (const msgs of grouped.values()) {
        for (const msg of msgs) {
          if (msg.sender_id !== user.id) otherUserIds.add(msg.sender_id);
          if (msg.receiver_id !== user.id) otherUserIds.add(msg.receiver_id);
        }
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", Array.from(otherUserIds));

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p.full_name || "User"]) || []);

      // Build conversation list
      const convs: Conversation[] = [];
      for (const [voId, msgs] of grouped.entries()) {
        const vo = vendorOrders?.find((v) => v.id === voId);
        const lastMsg = msgs[0]; // already sorted desc
        const otherUserId = lastMsg.sender_id === user.id ? lastMsg.receiver_id : lastMsg.sender_id;
        const unreadCount = msgs.filter((m) => m.receiver_id === user.id && !m.read_at).length;

        const brandData = vo?.brand as any;
        const brandName = brandData?.name || "Unknown Store";
        const otherUserName = role === "customer"
          ? brandName
          : profileMap.get(otherUserId) || "Customer";

        convs.push({
          vendorOrderId: voId,
          otherUserId,
          otherUserName,
          lastMessage: lastMsg.content,
          lastMessageAt: lastMsg.created_at,
          unreadCount,
          orderId: vo?.order_id || "",
          brandName,
        });
      }

      // Sort by latest message
      convs.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
      setConversations(convs);
      setLoading(false);
    };

    fetchConversations();

    // Subscribe to new messages for live updates
    const channel = supabase
      .channel("conversations-list")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
      }, () => {
        fetchConversations();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, role]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, "h:mm a");
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMM d");
  };

  const filtered = conversations.filter((c) =>
    c.otherUserName.toLowerCase().includes(search.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(search.toLowerCase())
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

      {/* Conversation Items */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <MessageSquare className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">No conversations yet</p>
          </div>
        ) : (
          filtered.map((conv) => (
            <button
              key={conv.vendorOrderId}
              onClick={() => onSelect(conv)}
              className={`w-full text-left px-4 py-3 border-b border-border-subtle transition-colors hover:bg-secondary/50 ${
                selectedConversation === conv.vendorOrderId
                  ? "bg-secondary border-l-4 border-l-foreground"
                  : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm truncate ${conv.unreadCount > 0 ? "font-bold" : "font-medium"}`}>
                      {conv.otherUserName}
                    </span>
                    {conv.unreadCount > 0 && (
                      <span className="shrink-0 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center rounded-full">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">
                    Order #{conv.orderId.slice(0, 8)}
                  </p>
                  <p className={`text-xs mt-1 truncate ${conv.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {conv.lastMessage}
                  </p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                  {formatTime(conv.lastMessageAt)}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default ConversationList;
