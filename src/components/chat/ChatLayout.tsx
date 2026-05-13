import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { WifiOff, ServerCrash } from "lucide-react";
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
    connectionReady,
    isLoadingHistory,
    sidebarOpen,
    setSidebarOpen,
    newConversation,
    sendMessage,
    selectConversation,
    deleteConversation,
  } = useChat();

  if (!connectionReady && isOffline) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background text-center px-6">
        <ServerCrash className="h-12 w-12 text-destructive/60" />
        <div>
          <p className="text-lg font-semibold text-foreground">Servicio no disponible</p>
          <p className="mt-1 text-sm text-muted-foreground">
            No se puede conectar con el servidor del chat.<br />Verificá tu conexión o intentá más tarde.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!connectionReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

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
