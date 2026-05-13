import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { WifiOff } from "lucide-react";
import ChatSidebar from "./ChatSidebar";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import { useChat } from "@/hooks/useChat";

const ChatLayout = () => {
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const {
    conversations,
    activeConversation,
    activeId,
    status,
    isOffline,
    isLoadingHistory,
    sidebarOpen,
    setSidebarOpen,
    newConversation,
    sendMessage,
    selectConversation,
    deleteConversation,
  } = useChat();

  const messages = activeConversation?.messages ?? [];

  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen(true);
    } else {
      setSidebarCollapsed((v) => !v);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <ChatSidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={selectConversation}
        onNew={newConversation}
        onDelete={deleteConversation}
        isLoadingHistory={isLoadingHistory}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isMobile={isMobile}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {isOffline && (
          <div className="flex items-center justify-center gap-2 bg-destructive/10 px-4 py-2 text-xs font-medium text-destructive">
            <WifiOff className="h-3.5 w-3.5" />
            Sin conexión con el servidor — reconectando…
          </div>
        )}

        <ChatHeader
          conversation={activeConversation}
          onToggleSidebar={toggleSidebar}
          isMobile={isMobile}
        />

        <MessageList
          messages={messages}
          isTyping={status === "loading"}
          onSuggestion={sendMessage}
        />

        <ChatInput onSend={sendMessage} disabled={status === "loading" || isOffline} />
      </div>
    </div>
  );
};

export default ChatLayout;
