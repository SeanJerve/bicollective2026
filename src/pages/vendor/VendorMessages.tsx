import { useState } from "react";
import { MessageSquare } from "lucide-react";
import ConversationList from "@/components/chat/ConversationList";
import MessageThread from "@/components/chat/MessageThread";

const VendorMessages = () => {
  const [selected, setSelected] = useState<{
    vendorOrderId: string;
    otherUserId: string;
    otherUserName: string;
    orderId: string;
  } | null>(null);

  return (
    <div className="p-4 md:p-8 h-full">
      <h1 className="font-heading text-2xl md:text-4xl uppercase mb-6 flex items-center gap-3">
        <MessageSquare className="w-6 h-6 md:w-8 md:h-8" />
        Messages
      </h1>

      <div
        className="border-2 border-foreground shadow-brutal flex flex-col md:flex-row"
        style={{ height: "calc(100vh - 200px)", minHeight: "500px" }}
      >
        {/* Conversation List */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r-0 md:border-r-2 border-foreground flex-shrink-0 ${selected ? "hidden md:flex md:flex-col" : "flex flex-col"}`}
        >
          <div className="p-3 border-b-2 border-foreground bg-secondary/30">
            <h2 className="font-heading text-sm uppercase">Conversations</h2>
          </div>
          <div className="flex-1 overflow-hidden">
            <ConversationList
              selectedConversation={selected?.vendorOrderId || null}
              onSelect={(conv) =>
                setSelected({
                  vendorOrderId: conv.vendorOrderId,
                  otherUserId: conv.otherUserId,
                  otherUserName: conv.otherUserName,
                  orderId: conv.orderId,
                })
              }
              role="vendor"
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
              role="vendor"
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
    </div>
  );
};

export default VendorMessages;
