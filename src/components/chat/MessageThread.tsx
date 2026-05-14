import { useState, useEffect, useRef } from "react";
import { Send, Loader2, ArrowLeft, Package, Paperclip, X, Image, FileText, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, isToday, isYesterday } from "date-fns";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface MessageThreadProps {
  vendorOrderId: string;
  otherUserId: string;
  otherUserName: string;
  orderId?: string;
  onBack?: () => void;
  role: "customer" | "vendor";
}

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,image/gif,application/pdf";
const MAX_FILE_MB = 5;

const AttachmentPreview = ({ url, type, name }: { url: string; type: string; name?: string }) => {
  const isImage = type === "image";
  if (isImage) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block mt-1">
        <img
          src={url}
          alt={name || "attachment"}
          className="max-w-[200px] max-h-[200px] object-cover border border-border-subtle rounded-sm"
        />
      </a>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 mt-1 px-2 py-1.5 bg-background/20 border border-border-subtle text-xs hover:opacity-80 transition-opacity"
    >
      <FileText className="w-4 h-4 shrink-0" />
      <span className="truncate max-w-[150px]">{name || "Attachment"}</span>
      <Download className="w-3 h-3 shrink-0 ml-auto" />
    </a>
  );
};

const MessageThread = ({ vendorOrderId, otherUserId, otherUserName, orderId, onBack, role }: MessageThreadProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // DM mode: vendorOrderId starts with "dm-"
  const isDM = vendorOrderId.startsWith("dm-");

  useEffect(() => {
    if (!user) return;

    const fetchMessages = async () => {
      setLoading(true);

      if (isDM) {
        // Direct messages mode
        const { data, error } = await supabase
          .from("direct_messages")
          .select("id, sender_id, receiver_id, content, created_at, read_at, product_id, product_name, product_image")
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
          .order("created_at", { ascending: true });

        if (!error) setMessages(data || []);
        setLoading(false);

        // Mark as read
        await supabase
          .from("direct_messages")
          .update({ read_at: new Date().toISOString() })
          .eq("receiver_id", user.id)
          .eq("sender_id", otherUserId)
          .is("read_at", null);
      } else {
        // Order-based messages mode
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("vendor_order_id", vendorOrderId)
          .order("created_at", { ascending: true });

        if (!error) setMessages(data || []);
        setLoading(false);

        await supabase
          .from("messages")
          .update({ read_at: new Date().toISOString() })
          .eq("vendor_order_id", vendorOrderId)
          .eq("receiver_id", user.id)
          .is("read_at", null);
      }
    };

    fetchMessages();

    const tableName = isDM ? "direct_messages" : "messages";
    const channel = supabase
      .channel(`thread-${vendorOrderId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: tableName,
        ...(isDM ? {} : { filter: `vendor_order_id=eq.${vendorOrderId}` }),
      }, (payload) => {
        const msg = payload.new as any;
        if (isDM) {
          // Only add if it's part of this conversation
          if (
            (msg.sender_id === user.id && msg.receiver_id === otherUserId) ||
            (msg.sender_id === otherUserId && msg.receiver_id === user.id)
          ) {
            setMessages((prev) => [...prev, msg]);
            if (msg.receiver_id === user.id) {
              supabase
                .from("direct_messages")
                .update({ read_at: new Date().toISOString() })
                .eq("id", msg.id);
            }
          }
        } else {
          setMessages((prev) => [...prev, msg]);
          if (msg.receiver_id === user.id) {
            supabase
              .from("messages")
              .update({ read_at: new Date().toISOString() })
              .eq("id", msg.id);
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, vendorOrderId, otherUserId, isDM]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast({ title: "File too large", description: `Max file size is ${MAX_FILE_MB}MB`, variant: "destructive" });
      return;
    }

    setPendingFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setPendingPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPendingPreview(null);
    }
    // reset input so same file can be re-selected
    e.target.value = "";
  };

  const clearPendingFile = () => {
    setPendingFile(null);
    setPendingPreview(null);
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && !pendingFile) || !user) return;
    setSending(true);
    try {
      let attachmentUrl: string | null = null;
      let attachmentType: string | null = null;
      let attachmentName: string | null = null;

      if (pendingFile) {
        const ext = pendingFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("chat-attachments")
          .upload(path, pendingFile, { upsert: false });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("chat-attachments").getPublicUrl(path);
        attachmentUrl = urlData.publicUrl;
        attachmentType = pendingFile.type.startsWith("image/") ? "image" : "file";
        attachmentName = pendingFile.name;
      }

      let insertError;
      if (isDM) {
        const { error } = await supabase.from("direct_messages").insert({
          sender_id: user.id,
          receiver_id: otherUserId,
          content: newMessage.trim() || "",
        });
        insertError = error;
      } else {
        const { error } = await supabase.from("messages").insert({
          sender_id: user.id,
          receiver_id: otherUserId,
          vendor_order_id: vendorOrderId,
          content: newMessage.trim() || (pendingFile ? "" : ""),
          is_system_message: false,
          attachment_url: attachmentUrl,
          attachment_type: attachmentType,
          attachment_name: attachmentName,
        });
        insertError = error;
      }

      if (insertError) throw insertError;

      setNewMessage("");
      clearPendingFile();
    } catch (err) {
      console.error("Error sending message:", err);
      toast({ title: "Failed to send", description: "Please try again.", variant: "destructive" });
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
          {isDM ? (
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Direct Message</p>
          ) : orderId ? (
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Order #{orderId.slice(0, 8)}
              {orderLink && (
                <Link to={orderLink} className="ml-2 underline hover:text-foreground inline-flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  View
                </Link>
              )}
            </p>
          ) : null}
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
                <div key={msg.id}>
                  {/* Product context card for DMs */}
                  {msg.product_name && msg.product_image && (
                    <div className={`flex mb-1 ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
                      <div className="flex items-center gap-2 px-2.5 py-1.5 bg-accent/30 border border-border-subtle max-w-[80%]">
                        <img src={msg.product_image} alt={msg.product_name} className="w-8 h-8 object-cover border border-border-subtle flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-muted-foreground uppercase">Re: Product Inquiry</p>
                          <p className="text-xs font-medium truncate">{msg.product_name}</p>
                        </div>
                      </div>
                    </div>
                  )}
                <div
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
                        ? "bg-muted text-muted-foreground italic text-center text-xs px-6 max-w-full w-full"
                        : msg.sender_id === user?.id
                        ? "bg-foreground text-background"
                        : "bg-secondary border border-border-subtle"
                    }`}
                  >
                    {msg.content && (
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    )}
                    {msg.attachment_url && (
                      <AttachmentPreview
                        url={msg.attachment_url}
                        type={msg.attachment_type || "file"}
                        name={msg.attachment_name}
                      />
                    )}
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
                </div>
              ))}
            </div>
          ))
        )}
        <div ref={scrollRef} />
      </div>

      {/* Pending File Preview */}
      {pendingFile && (
        <div className="px-3 pt-2 border-t border-border-subtle bg-secondary/20">
          <div className="flex items-center gap-2 p-2 bg-background border border-border-subtle">
            {pendingPreview ? (
              <img src={pendingPreview} alt="preview" className="w-12 h-12 object-cover border border-border-subtle" />
            ) : (
              <div className="w-12 h-12 flex items-center justify-center bg-secondary">
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{pendingFile.name}</p>
              <p className="text-[10px] text-muted-foreground">
                {(pendingFile.size / 1024).toFixed(0)} KB
              </p>
            </div>
            <button onClick={clearPendingFile} className="p-1 hover:bg-secondary rounded">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t-2 border-foreground bg-background flex gap-2 items-end">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 border-2 border-foreground hover:bg-secondary transition-colors shrink-0"
          title="Attach image or file"
        >
          <Paperclip className="w-4 h-4" />
        </button>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder={pendingFile ? "Add a caption..." : "Type a message..."}
          className="input-brutal flex-1 text-sm py-2"
        />
        <button
          onClick={sendMessage}
          disabled={sending || (!newMessage.trim() && !pendingFile)}
          className="btn-brutal px-4 shrink-0"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

export default MessageThread;
