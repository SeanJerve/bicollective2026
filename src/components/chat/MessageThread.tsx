import { useState, useEffect, useRef } from "react";
import {
  Send,
  Loader2,
  ArrowLeft,
  Package,
  Paperclip,
  X,
  Image,
  FileText,
  Download,
  Truck,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, isToday, isYesterday } from "date-fns";
import { Link, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface MessageThreadProps {
  vendorOrderId: string;
  otherUserId: string;
  otherUserName: string;
  orderId?: string;
  onBack?: () => void;
  role: "customer" | "vendor";
  productId?: string;
  productName?: string;
  productImage?: string;
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
          onError={(e) => {
            e.currentTarget.src = "/placeholder.svg";
          }}
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

const stripEmojis = (text: string) => {
  if (!text) return "";
  return text.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|\p{Emoji_Presentation}|\p{Emoji}\uFE0F/gu, "");
};

const MOCK_COURIERS = [
  "Ninja Vanishing Service",
  "LBC Express but Slow",
  "FedUp Delivery",
  "DHL-y No Delivery",
  "Bicol Express (actually 2 weeks)",
];

const getMockCourier = (orderId: string) => {
  if (!orderId) return MOCK_COURIERS[0];
  let sum = 0;
  for (let i = 0; i < orderId.length; i++) {
    sum += orderId.charCodeAt(i);
  }
  return MOCK_COURIERS[sum % MOCK_COURIERS.length];
};

const SystemOrderCard = ({ msg, vendorOrder }: { msg: any; vendorOrder: any }) => {
  if (!vendorOrder) {
    return (
      <div className="card-brutal p-4 bg-secondary/50 text-center max-w-md mx-auto my-2 border-2 border-foreground shadow-brutal-sm">
        <p className="text-[10px] font-heading uppercase text-muted-foreground mb-1">System Update</p>
        <p className="text-xs font-semibold leading-relaxed">{stripEmojis(msg.content)}</p>
      </div>
    );
  }

  const cleanContent = stripEmojis(msg.content);
  const slicedId = vendorOrder.id.slice(0, 8).toUpperCase();
  const brandName = vendorOrder.brand?.name || "Vendor Store";
  const items = vendorOrder.order_items || [];
  const trackingNumber = vendorOrder.tracking_number;
  const courier = getMockCourier(vendorOrder.id);

  // Status-based color themes for the card header
  let statusHeaderBg = "bg-primary text-primary-foreground";
  let StatusIcon = Package;
  
  if (vendorOrder.status === "delivered") {
    statusHeaderBg = "bg-success text-success-foreground";
    StatusIcon = CheckCircle;
  } else if (vendorOrder.status === "cancelled") {
    statusHeaderBg = "bg-destructive text-destructive-foreground";
    StatusIcon = X;
  } else if (vendorOrder.status?.includes("payment")) {
    statusHeaderBg = "bg-warning text-warning-foreground";
    StatusIcon = AlertTriangle;
  } else if (["shipped", "handed_to_courier", "for_delivery"].includes(vendorOrder.status)) {
    StatusIcon = Truck;
  }

  return (
    <div className="card-brutal max-w-sm mx-auto bg-background p-0 overflow-hidden text-left my-3 border-2 border-foreground shadow-brutal-sm">
      {/* Header Banner */}
      <div className={`p-2 font-heading text-[10px] uppercase tracking-wider flex items-center justify-between border-b-2 border-foreground ${statusHeaderBg}`}>
        <span className="flex items-center gap-1.5">
          <StatusIcon className="w-3.5 h-3.5" />
          Order Status Update
        </span>
        <span className="font-mono font-bold">#{slicedId}</span>
      </div>

      <div className="p-3 space-y-2 text-xs">
        {/* Update Message */}
        <div className="border-b border-dashed border-border-subtle pb-2">
          <p className="font-semibold leading-tight">{cleanContent}</p>
        </div>

        {/* Brand & Status Details */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground uppercase font-heading text-[9px]">Store</span>
            <span className="font-bold">{brandName}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground uppercase font-heading text-[9px]">Status</span>
            <span className="font-bold uppercase tracking-wider text-primary">{vendorOrder.status?.replace(/_/g, " ")}</span>
          </div>

          {trackingNumber && (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground uppercase font-heading text-[9px]">Courier</span>
                <span className="font-bold">{courier}</span>
              </div>
              <div className="flex justify-between items-center bg-secondary/50 p-1.5 border border-dashed border-foreground/10 font-mono mt-1">
                <span className="text-muted-foreground uppercase font-heading text-[8px]">Tracking #</span>
                <span className="font-bold select-all">{trackingNumber}</span>
              </div>
            </>
          )}
        </div>

        {/* Items list */}
        {items.length > 0 && (
          <div className="pt-2 border-t border-dashed border-border-subtle">
            <p className="text-[9px] text-muted-foreground uppercase font-heading mb-1">Items Summary</p>
            <div className="space-y-0.5 max-h-20 overflow-y-auto pr-1">
              {items.map((item: any) => (
                <div key={item.id} className="flex justify-between text-[11px] font-mono">
                  <span className="truncate max-w-[180px]">{item.product_name}</span>
                  <span className="text-muted-foreground">x{item.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const MessageThread = ({
  vendorOrderId,
  otherUserId,
  otherUserName,
  orderId,
  onBack,
  role,
  productId,
  productName,
  productImage,
}: MessageThreadProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [vendorOrdersMap, setVendorOrdersMap] = useState<Record<string, any>>({});
  const isInteractingRef = useRef(false);

  const markAsRead = async () => {
    if (!user || !otherUserId) return;
    try {
      await Promise.all([
        supabase
          .from("direct_messages")
          .update({ read_at: new Date().toISOString() })
          .eq("receiver_id", user.id)
          .eq("sender_id", otherUserId)
          .is("read_at", null),
        supabase
          .from("messages")
          .update({ read_at: new Date().toISOString() })
          .eq("receiver_id", user.id)
          .eq("sender_id", otherUserId)
          .is("read_at", null)
      ]);
    } catch (err) {
      console.error("Error marking messages as read:", err);
    }
  };

  // DM mode: vendorOrderId is empty or starts with "dm-"
  const isDM = !vendorOrderId || vendorOrderId.startsWith("dm-");

  const fetchMessages = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Query order messages
      const { data: dbMessages, error: msgsError } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
        );

      if (msgsError) console.error("Error fetching order messages:", msgsError);

      // Query direct messages
      const { data: dbDms, error: dmsError } = await supabase
        .from("direct_messages")
        .select(
          "id, sender_id, receiver_id, content, created_at, read_at, product_id, product_name, product_image"
        )
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
        );

      if (dmsError) console.error("Error fetching direct messages:", dmsError);

      const merged: any[] = [];
      if (dbMessages) {
        dbMessages.forEach((m) => merged.push({ ...m, source: "message" }));
      }
      if (dbDms) {
        dbDms.forEach((d) => merged.push({ ...d, source: "direct_message" }));
      }

      // Sort ascending chronologically
      merged.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      setMessages(merged);
      setLoading(false);

      // Fetch vendor order details for all referenced orders in this thread
      const referencedVoIds = Array.from(
        new Set(merged.map((m) => m.vendor_order_id).filter(Boolean))
      ) as string[];

      if (referencedVoIds.length > 0) {
        const { data: voData, error: voError } = await supabase
          .from("vendor_orders")
          .select(`
            id,
            status,
            tracking_number,
            brand:brands(name),
            order_items(id, product_name, quantity, size)
          `)
          .in("id", referencedVoIds);

        if (!voError && voData) {
          const map: Record<string, any> = {};
          voData.forEach((vo) => {
            map[vo.id] = vo;
          });
          setVendorOrdersMap(map);
        }
      }

    } catch (err) {
      console.error("Error in fetchMessages:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    fetchMessages();
    markAsRead();

    // Subscription to messages insertions
    const channel = supabase
      .channel(`thread-unified-${otherUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const msg = payload.new as any;
          if (
            (msg.sender_id === user.id && msg.receiver_id === otherUserId) ||
            (msg.sender_id === otherUserId && msg.receiver_id === user.id)
          ) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === msg.id)) return prev;
              const newMsgs = [...prev, { ...msg, source: "message" }];
              return newMsgs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            });

            // Fetch order details for the new message if needed
            if (msg.vendor_order_id) {
              supabase
                .from("vendor_orders")
                .select(`
                  id,
                  status,
                  tracking_number,
                  brand:brands(name),
                  order_items(id, product_name, quantity, size)
                `)
                .eq("id", msg.vendor_order_id)
                .maybeSingle()
                .then(({ data }) => {
                  if (data) {
                    setVendorOrdersMap((prev) => ({ ...prev, [data.id]: data }));
                  }
                });
            }

            if (msg.receiver_id === user.id) {
              if (document.hasFocus() && isInteractingRef.current) {
                supabase
                  .from("messages")
                  .update({ read_at: new Date().toISOString() })
                  .eq("id", msg.id)
                  .then();
              }
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
        },
        (payload) => {
          const msg = payload.new as any;
          if (
            (msg.sender_id === user.id && msg.receiver_id === otherUserId) ||
            (msg.sender_id === otherUserId && msg.receiver_id === user.id)
          ) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === msg.id)) return prev;
              const newMsgs = [...prev, { ...msg, source: "direct_message" }];
              return newMsgs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            });

            if (msg.receiver_id === user.id) {
              if (document.hasFocus() && isInteractingRef.current) {
                supabase
                  .from("direct_messages")
                  .update({ read_at: new Date().toISOString() })
                  .eq("id", msg.id)
                  .then();
              }
            }
          }
        }
      )
      .subscribe();

    // Subscription to vendor_orders updates to keep statuses synced in real-time
    const voChannel = supabase
      .channel(`vendor-orders-thread-${otherUserId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "vendor_orders",
        },
        () => {
          // Re-query order statuses when they change in the database
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(voChannel);
    };
  }, [user, otherUserId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `Max file size is ${MAX_FILE_MB}MB`,
        variant: "destructive",
      });
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
    e.target.value = "";
  };

  const clearPendingFile = () => {
    setPendingFile(null);
    setPendingPreview(null);
  };

  const handleSendProductLink = async () => {
    if (!user || !productId) return;
    setSending(true);
    try {
      const { error } = await supabase.from("direct_messages").insert({
        sender_id: user.id,
        receiver_id: otherUserId,
        content: `Hi, I'm inquiring about this product: ${productName}`,
        product_id: productId,
        product_name: productName,
        product_image: productImage || null,
      });
      if (error) throw error;

      handleDismissProductContext();
    } catch (err) {
      console.error("Error sending product link:", err);
      toast({
        title: "Failed to send link",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleDismissProductContext = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("productId");
    newParams.delete("productName");
    newParams.delete("productImage");
    setSearchParams(newParams);
  };

  useEffect(() => {
    if (user && productId && !sending) {
      handleSendProductLink();
    }
  }, [user, productId]);

  const sendMessage = async () => {
    if ((!newMessage.trim() && !pendingFile) || !user) return;
    setSending(true);
    markAsRead();
    try {
      // Determine if there is a valid order context in this unified thread
      let activeVoId = vendorOrderId && !vendorOrderId.startsWith("dm-") ? vendorOrderId : null;
      if (!activeVoId) {
        const orderMsg = [...messages].reverse().find((m) => m.vendor_order_id);
        if (orderMsg) {
          activeVoId = orderMsg.vendor_order_id;
        }
      }

      if (pendingFile && !activeVoId) {
        toast({
          title: "Cannot send attachment",
          description: "Attachments can only be sent for conversations with active orders.",
          variant: "destructive",
        });
        setSending(false);
        return;
      }

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
      if (activeVoId) {
        const { error } = await supabase.from("messages").insert({
          sender_id: user.id,
          receiver_id: otherUserId,
          vendor_order_id: activeVoId,
          content: newMessage.trim() || "",
          is_system_message: false,
          attachment_url: attachmentUrl,
          attachment_type: attachmentType,
          attachment_name: attachmentName,
        });
        insertError = error;
      } else {
        const payload: any = {
          sender_id: user.id,
          receiver_id: otherUserId,
          content: newMessage.trim() || "",
        };
        // Attach product context to the DM if there's an inquiry
        if (productId) {
          payload.product_id = productId;
          payload.product_name = productName;
          payload.product_image = productImage;
        }
        const { error } = await supabase.from("direct_messages").insert(payload);
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
    <div
      className="flex flex-col h-full"
      onClickCapture={markAsRead}
      onMouseEnter={() => {
        isInteractingRef.current = true;
        markAsRead();
      }}
      onMouseLeave={() => {
        isInteractingRef.current = false;
      }}
      onFocusCapture={() => {
        isInteractingRef.current = true;
        markAsRead();
      }}
      onBlurCapture={() => {
        isInteractingRef.current = false;
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b-2 border-foreground bg-secondary/30">
        {onBack && (
          <button onClick={onBack} className="p-1 hover:bg-secondary rounded md:hidden">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-heading font-bold text-sm uppercase truncate">{otherUserName}</h3>
          {isDM ? (
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Direct Message
            </p>
          ) : orderId ? (
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Order #{orderId.slice(0, 8)}
              {orderLink && (
                <Link
                  to={orderLink}
                  className="ml-2 underline hover:text-foreground inline-flex items-center gap-1"
                >
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
                  {msg.product_name && (
                    <div
                      className={`flex mb-1 ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}
                    >
                      <div className="flex items-center gap-3 p-2 bg-secondary border-2 border-foreground shadow-brutal-xs max-w-[80%]">
                        {msg.product_image && (
                          <img
                            src={msg.product_image}
                            alt={msg.product_name}
                            className="w-10 h-10 object-cover border border-foreground flex-shrink-0"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.svg";
                            }}
                          />
                        )}
                        <div className="min-w-0">
                          <p className="text-[9px] font-heading uppercase text-muted-foreground tracking-wide font-bold">
                            Product Inquiry
                          </p>
                          <p className="text-xs font-bold truncate">{msg.product_name}</p>
                          {msg.product_id && (
                            <Link
                              to={`/products/${msg.product_id}`}
                              className="text-[9px] font-heading uppercase underline hover:text-primary mt-0.5 block font-bold"
                            >
                              View Product →
                            </Link>
                          )}
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
                    {msg.is_system_message ? (
                      <div className="w-full">
                        <SystemOrderCard msg={msg} vendorOrder={vendorOrdersMap[msg.vendor_order_id]} />
                      </div>
                    ) : (
                      <div
                        className={`max-w-[80%] px-3 py-2 ${
                          msg.sender_id === user?.id
                            ? "bg-foreground text-background"
                            : "bg-secondary border border-border-subtle"
                        }`}
                      >
                        {msg.content && (
                          <p className="text-sm whitespace-pre-wrap break-words">{stripEmojis(msg.content)}</p>
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
                            msg.sender_id === user?.id
                              ? "text-background/60"
                              : "text-muted-foreground"
                          }`}
                        >
                          {format(new Date(msg.created_at), "h:mm a")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
        <div ref={scrollRef} />
      </div>

      {/* Product Inquiry Banner */}
      {productId && productName && (
        <div className="mx-3 my-2 p-3 bg-secondary border-2 border-foreground shadow-brutal-xs flex items-center gap-3 animate-fade-in">
          {productImage && (
            <img
              src={productImage}
              alt={productName}
              className="w-12 h-12 object-cover border-2 border-foreground shadow-brutal-xs shrink-0"
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg";
              }}
            />
          )}
          <div className="min-w-0 flex-1">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground block font-heading font-bold">
              Product Inquiry
            </span>
            <span className="text-xs font-bold truncate block">{productName}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSendProductLink}
              disabled={sending}
              className="btn-brutal text-[10px] py-1 px-3 uppercase font-heading bg-primary text-primary-foreground flex items-center gap-1"
            >
              Send Link
            </button>
            <button
              onClick={handleDismissProductContext}
              className="p-1 border-2 border-foreground hover:bg-secondary transition-colors"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Pending File Preview */}
      {pendingFile && (
        <div className="px-3 pt-2 border-t border-border-subtle bg-secondary/20">
          <div className="flex items-center gap-2 p-2 bg-background border border-border-subtle">
            {pendingPreview ? (
              <img
                src={pendingPreview}
                alt="preview"
                className="w-12 h-12 object-cover border border-border-subtle"
              />
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

      {/* Suggestion Chips */}
      {(() => {
        const suggestions = isDM
          ? role === "customer"
            ? [
                "Hi! Is this item currently in stock?",
                "Hello! Can I request a custom size or color?",
                "Hi, how long does shipping usually take?",
                "Hello, do you offer bulk order discounts?",
              ]
            : [
                "Hello! Yes, this item is in stock and ready to ship.",
                "Hi! We can customize the size and color for you.",
                "Hello! Shipping typically takes 3-5 business days.",
                "Hi! We'd be happy to discuss a discount for bulk orders.",
              ]
          : role === "customer"
            ? [
                "Hello! How is my order going?",
                "When will this order be shipped?",
                "Could I request a tracking update?",
                "Thank you for the quick shipping!",
              ]
            : [
                "Hello! We have received your order and are preparing it.",
                "Your order has been handed over to the courier service.",
                "Thanks for shopping with us! Let us know if you need anything else.",
                "We are currently checking the stock for your items.",
              ];

        return (
          <div className="flex gap-2 overflow-x-auto pb-2 pt-1.5 px-3 border-t border-border-subtle bg-background/50 scrollbar-hide max-w-full">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setNewMessage(suggestion);
                }}
                className="bg-secondary hover:bg-foreground hover:text-background text-foreground border-2 border-foreground px-3 py-1 text-[10px] font-heading uppercase whitespace-nowrap transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        );
      })()}

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
