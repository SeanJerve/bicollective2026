import { useState, useEffect, useRef } from "react";
import { Send, Loader2, ArrowLeft, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, isToday, isYesterday } from "date-fns";
import { Link } from "react-router-dom";

interface MessageThreadProps {
  vendorOrderId: string;
  otherUserId: string;
  otherUserName: string;
  orderId?: string;
  onBack?: () => void;
  role: "customer" | "vendor";
}

const MessageThread = ({ vendorOrderId, otherUserId, otherUserName, orderId, onBack, role }: MessageThreadProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const fetchMessages = async () => {
      setLoading(true);
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
    };

    fetchMessages();

    const channel = supabase
      .channel(`thread-${vendorOrderId}`)
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
  }, [user, vendorOrderId]);

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

  // Group messages by date
  const groupedMessages: { date: string; messages: any[] }[] = [];
  let currentDate = "";
  for (const msg of messages) {
    const msgDate = format(new Date(msg.created_at), "yyyy-MM-dd");
    if (msgDate !== currentDate) {
      currentDate = msgDate;
      groupedMessages.push({ date: msgDate, messages: [msg] });
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(msg);
    }
  }

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMMM d, yyyy");
  };

  const orderLink = role === "customer" ? `/account/orders/${orderId}` : undefined;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b-2 border-foreground bg-secondary/30">
        {onBack && (
          <button onClick={onBack} className="p-1 hover:bg-secondary rounded md:hidden">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-heading text-sm uppercase truncate">{otherUserName}</h3>
          {orderId && (
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Order #{orderId.slice(0, 8)}
              {orderLink && (
                <Link to={orderLink} className="ml-2 underline hover:text-foreground inline-flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  View
                </Link>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : groupedMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p className="text-sm">No messages yet.</p>
            <p className="text-xs mt-1">Start the conversation!</p>
          </div>
        ) : (
          groupedMessages.map((group) => (
            <div key={group.date}>
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-border-subtle" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {formatDateHeader(group.date)}
                </span>
                <div className="flex-1 h-px bg-border-subtle" />
              </div>
              {group.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex mb-2 ${
                    msg.is_system_message
                      ? "justify-center"
                      : msg.sender_id === user?.id
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] px-3 py-2 ${
                      msg.is_system_message
                        ? "bg-muted text-muted-foreground italic text-center text-xs px-6"
                        : msg.sender_id === user?.id
                        ? "bg-foreground text-background"
                        : "bg-secondary border border-border-subtle"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    <p
                      className={`text-[10px] mt-1 ${
                        msg.is_system_message
                          ? "text-muted-foreground"
                          : msg.sender_id === user?.id
                          ? "text-background/60"
                          : "text-muted-foreground"
                      }`}
                    >
                      {format(new Date(msg.created_at), "h:mm a")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t-2 border-foreground bg-background flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Type a message..."
          className="input-brutal flex-1 text-sm py-2"
        />
        <button
          onClick={sendMessage}
          disabled={sending || !newMessage.trim()}
          className="btn-brutal px-4"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default MessageThread;
