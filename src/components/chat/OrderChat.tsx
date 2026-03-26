import { useState, useEffect, useRef } from "react";
import { Send, MessageSquare, X, Loader2, Paperclip, Image as ImageIcon } from "lucide-react";
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
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const sendMessage = async (attachmentUrl?: string, attachmentName?: string, attachmentType?: string) => {
    if ((!newMessage.trim() && !attachmentUrl) || !user) return;
    setSending(true);
    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        receiver_id: otherUserId,
        vendor_order_id: vendorOrderId,
        content: newMessage.trim() || (attachmentUrl ? "Sent an attachment" : ""),
        is_system_message: false,
        attachment_url: attachmentUrl || null,
        attachment_name: attachmentName || null,
        attachment_type: attachmentType || null,
      });
      if (error) throw error;
      setNewMessage("");
    } catch (err: any) {
      console.error("Error sending message:", err);
      // We could add a toast here but for now just log
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("message-attachments")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("message-attachments")
        .getPublicUrl(filePath);

      await sendMessage(publicUrl, file.name, file.type);
    } catch (err: any) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
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
                    className={`max-w-[75%] px-3 py-2 text-xs border border-foreground shadow-brutal-xs ${
                      msg.is_system_message
                        ? "bg-muted text-muted-foreground italic w-full text-center"
                        : msg.sender_id === user?.id
                        ? "bg-foreground text-background"
                        : "bg-background"
                    }`}
                  >
                    {msg.attachment_url && (
                      <div className="mb-2 border border-foreground/20 overflow-hidden bg-muted/20">
                        {msg.attachment_type?.startsWith("image/") ? (
                          <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer">
                            <img src={msg.attachment_url} alt={msg.attachment_name || "Attachment"} className="w-full max-h-48 object-cover" />
                          </a>
                        ) : (
                          <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 hover:underline">
                            <Paperclip className="w-3 h-3" />
                            <span className="truncate max-w-[150px]">{msg.attachment_name || "File"}</span>
                          </a>
                        )}
                      </div>
                    )}
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
          <div className="p-2 border-t border-border-subtle flex gap-2 items-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,application/pdf"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || sending}
              className="p-2 hover:bg-secondary transition-colors"
              title="Attach a file"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Paperclip className="w-4 h-4" />
              )}
            </button>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Type a message..."
              className="input-brutal flex-1 text-xs py-2"
            />
            <button
              onClick={() => sendMessage()}
              disabled={sending || (!newMessage.trim() && !uploading)}
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
