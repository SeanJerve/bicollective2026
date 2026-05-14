import { useState, useEffect, useRef, useCallback } from "react";
import { X, Send, MessageSquare, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

interface ProductContext {
  id: string;
  name: string;
  image: string;
  price: number;
  slug: string;
}

interface DirectMessageDialogProps {
  open: boolean;
  onClose: () => void;
  brandOwnerId: string;
  brandName: string;
  product?: ProductContext;
}

interface DirectMsg {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  product_id: string | null;
  product_name: string | null;
  product_image: string | null;
}

const formatPrice = (amount: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount);

const DirectMessageDialog = ({ open, onClose, brandOwnerId, brandName, product }: DirectMessageDialogProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<DirectMsg[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data } = await supabase
      .from("direct_messages")
      .select("id, sender_id, content, created_at, product_id, product_name, product_image")
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${brandOwnerId}),and(sender_id.eq.${brandOwnerId},receiver_id.eq.${user.id})`)
      .order("created_at", { ascending: true });

    setMessages(data || []);
    setLoading(false);

    // Mark received messages as read
    await supabase
      .from("direct_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("receiver_id", user.id)
      .eq("sender_id", brandOwnerId)
      .is("read_at", null);
  }, [user, brandOwnerId]);

  useEffect(() => {
    if (open && user) {
      fetchMessages();

      const channel = supabase
        .channel(`dm-${user.id}-${brandOwnerId}`)
        .on("postgres_changes", {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
        }, (payload) => {
          const msg = payload.new as any;
          if (
            (msg.sender_id === user.id && msg.receiver_id === brandOwnerId) ||
            (msg.sender_id === brandOwnerId && msg.receiver_id === user.id)
          ) {
            setMessages((prev) => [...prev, msg]);
          }
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [open, user, brandOwnerId, fetchMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!newMsg.trim() || !user || sending) return;
    setSending(true);

    // Include product context on the first message of this conversation
    const hasProductContext = messages.some((m) => m.product_id === product?.id);
    const isFirstMsg = messages.length === 0;

    const { error } = await supabase.from("direct_messages").insert({
      sender_id: user.id,
      receiver_id: brandOwnerId,
      content: newMsg.trim(),
      product_id: (isFirstMsg || !hasProductContext) && product ? product.id : null,
      product_name: (isFirstMsg || !hasProductContext) && product ? product.name : null,
      product_image: (isFirstMsg || !hasProductContext) && product ? product.image : null,
    });

    if (!error) {
      setNewMsg("");
    }
    setSending(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-foreground/50" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full sm:w-[420px] max-h-[80vh] sm:max-h-[600px] bg-background border-2 border-foreground shadow-brutal flex flex-col animate-slide-in-right sm:animate-none">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b-2 border-foreground bg-secondary/30">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            <h3 className="font-heading text-sm uppercase tracking-wide">{brandName}</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-secondary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Context Banner */}
        {product && (
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border-subtle bg-secondary/20">
            <img
              src={product.image}
              alt={product.name}
              className="w-10 h-10 object-cover border border-border-subtle flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-heading uppercase truncate leading-tight">{product.name}</p>
              <p className="text-xs text-muted-foreground">{formatPrice(product.price)}</p>
            </div>
          </div>
        )}

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[250px]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center">
              <MessageSquare className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm font-heading uppercase">Start a conversation</p>
              <p className="text-xs mt-1">Ask {brandName} about {product ? `"${product.name}"` : "their products"}</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender_id === user?.id;
              return (
                <div key={msg.id}>
                  {/* Product context card on first mention */}
                  {msg.product_name && msg.product_image && (
                    <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-1`}>
                      <div className="flex items-center gap-2 px-2.5 py-1.5 bg-accent/30 border border-border-subtle max-w-[80%]">
                        <img
                          src={msg.product_image}
                          alt={msg.product_name}
                          className="w-8 h-8 object-cover border border-border-subtle flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-[10px] text-muted-foreground uppercase">Re: Product Inquiry</p>
                          <p className="text-xs font-medium truncate">{msg.product_name}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] px-3 py-2 text-sm border-2 ${
                        isMine
                          ? "bg-foreground text-background border-foreground"
                          : "bg-secondary border-foreground"
                      }`}
                    >
                      <p className="break-words">{msg.content}</p>
                      <p className={`text-[10px] mt-1 ${isMine ? "text-background/60" : "text-muted-foreground"}`}>
                        {format(new Date(msg.created_at), "h:mm a")}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input */}
        <div className="border-t-2 border-foreground p-3">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              placeholder={`Message ${brandName}...`}
              className="flex-1 input-brutal text-sm py-2 px-3"
              autoFocus
            />
            <button
              type="submit"
              disabled={!newMsg.trim() || sending}
              className="p-2.5 bg-foreground text-background border-2 border-foreground hover:bg-foreground/90 transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DirectMessageDialog;
