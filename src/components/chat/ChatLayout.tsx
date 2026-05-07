import { useIsMobile } from "@/hooks/use-mobile";
import ChatSidebar from "./ChatSidebar";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import ErrorBanner from "./ErrorBanner";
import { useChat } from "@/hooks/useChat";

const ChatLayout = () => {
  const isMobile = useIsMobile();
  const {
    conversations,
    activeConversation,
    activeId,
    status,
    sidebarOpen,
    setSidebarOpen,
    newConversation,
    sendMessage,
    selectConversation,
    deleteConversation,
    clearError,
  } = useChat();

  const messages = activeConversation?.messages ?? [];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <ChatSidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={selectConversation}
        onNew={newConversation}
        onDelete={deleteConversation}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isMobile={isMobile}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <ChatHeader
          conversation={activeConversation}
          onToggleSidebar={() => setSidebarOpen(true)}
          isMobile={isMobile}
        />

        {status === "error" && <ErrorBanner onRetry={clearError} />}

        <MessageList
          messages={messages}
          isTyping={status === "loading"}
          onSuggestion={sendMessage}
        />

        <ChatInput onSend={sendMessage} disabled={status === "loading" || status === "error"} />
      </div>
    </div>
  );
};

export default ChatLayout;
