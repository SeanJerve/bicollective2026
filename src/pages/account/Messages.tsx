import { useState } from "react";
import { MessageSquare } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import ConversationList from "@/components/chat/ConversationList";
import MessageThread from "@/components/chat/MessageThread";
import { Link } from "react-router-dom";
import { usePageSEO } from "@/hooks/usePageSEO";

const Messages = () => {
  usePageSEO({ title: "Messages | BICOLLECTIVE", description: "Your conversations with vendors." });
  
  const [selected, setSelected] = useState<{
    vendorOrderId: string;
    otherUserId: string;
    otherUserName: string;
    orderId: string;
  } | null>(null);

  return (
    <PageLayout>
      <section className="py-6 md:py-8 border-b-2 border-foreground">
        <div className="section-container">
          <nav className="text-xs md:text-sm mb-2">
            <Link to="/" className="text-muted-foreground hover:text-foreground">Home</Link>
            <span className="mx-2 text-muted-foreground">/</span>
            <span>Messages</span>
          </nav>
          <h1 className="font-heading text-2xl md:text-4xl uppercase flex items-center gap-3">
            <MessageSquare className="w-6 h-6 md:w-8 md:h-8" />
            Messages
          </h1>
        </div>
      </section>

      <section className="section-container py-6 md:py-8">
        <div className="border-2 border-foreground shadow-brutal flex flex-col md:flex-row" style={{ height: "calc(100vh - 260px)", minHeight: "500px" }}>
          {/* Conversation List - hide on mobile when thread is open */}
          <div className={`w-full md:w-80 lg:w-96 border-r-0 md:border-r-2 border-foreground flex-shrink-0 ${selected ? "hidden md:flex md:flex-col" : "flex flex-col"}`}>
            <div className="p-3 border-b-2 border-foreground bg-secondary/30">
              <h2 className="font-heading text-sm uppercase">Conversations</h2>
            </div>
            <div className="flex-1 overflow-hidden">
              <ConversationList
                selectedConversation={selected?.vendorOrderId || null}
                onSelect={(conv) => setSelected({
                  vendorOrderId: conv.vendorOrderId,
                  otherUserId: conv.otherUserId,
                  otherUserName: conv.otherUserName,
                  orderId: conv.orderId,
                })}
                role="customer"
              />
            </div>
          </div>

          {/* Message Thread */}
          <div className={`flex-1 ${!selected ? "hidden md:flex" : "flex"} flex-col`}>
            {selected ? (
              <MessageThread
                vendorOrderId={selected.vendorOrderId}
                otherUserId={selected.otherUserId}
                otherUserName={selected.otherUserName}
                orderId={selected.orderId}
                onBack={() => setSelected(null)}
                role="customer"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
                <p className="font-heading text-sm uppercase">Select a conversation</p>
                <p className="text-xs mt-1">Choose a conversation from the list to start chatting</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Messages;
