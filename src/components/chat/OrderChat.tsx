import { useState, useEffect, useRef } from "react";
import { Send, MessageSquare, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface OrderChatProps {
  vendorOrderId: string;
  otherUserId: string;
  otherUserName?: string;
}

const OrderChat = ({ vendorOrderId, otherUserId, otherUserName }: OrderChatProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !user) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("vendor_order_id", vendorOrderId)
        .order("created_at", { ascending: true });

      if (!error) setMessages(data || []);
      setLoading(false);

      // Mark unread as read
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("vendor_order_id", vendorOrderId)
        .eq("receiver_id", user.id)
        .is("read_at", null);
      setUnreadCount(0);
    };

    fetchMessages();

    // Subscribe to realtime
    const channel = supabase
      .channel(`chat-${vendorOrderId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `vendor_order_id=eq.${vendorOrderId}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new]);
        if (payload.new.receiver_id === user.id) {
          supabase
            .from("messages")
            .update({ read_at: new Date().toISOString() })
            .eq("id", payload.new.id);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isOpen, user, vendorOrderId]);

  // Count unread when closed
  useEffect(() => {
    if (isOpen || !user) return;
    const fetchUnread = async () => {
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("vendor_order_id", vendorOrderId)
        .eq("receiver_id", user.id)
        .is("read_at", null);
      setUnreadCount(count || 0);
    };
    fetchUnread();
  }, [isOpen, user, vendorOrderId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;
    setSending(true);
    try {
      await supabase.from("messages").insert({
        sender_id: user.id,
        receiver_id: otherUserId,
        vendor_order_id: vendorOrderId,
        content: newMessage.trim(),
        is_system_message: false,
      });
      setNewMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn-brutal-secondary flex items-center gap-2 text-sm relative"
      >
        <MessageSquare className="w-4 h-4" />
        Chat
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 w-80 md:w-96 bg-background border-2 border-foreground shadow-brutal z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-border-subtle">
            <span className="font-heading text-sm uppercase">
              Chat with {otherUserName || "User"}
            </span>
            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-secondary">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="h-64 overflow-y-auto p-3 space-y-2">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center mt-8">
                No messages yet. Start the conversation!
              </p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] px-3 py-2 text-xs ${
                      msg.is_system_message
                        ? "bg-muted text-muted-foreground italic w-full text-center"
                        : msg.sender_id === user?.id
                        ? "bg-foreground text-background"
                        : "bg-secondary"
                    }`}
                  >
                    <p>{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${msg.sender_id === user?.id ? "text-background/60" : "text-muted-foreground"}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={scrollRef} />
          </div>

          {/* Input */}
          <div className="p-2 border-t border-border-subtle flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Type a message..."
              className="input-brutal flex-1 text-xs py-2"
            />
            <button
              onClick={sendMessage}
              disabled={sending || !newMessage.trim()}
              className="btn-brutal p-2"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderChat;
