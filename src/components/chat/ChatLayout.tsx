import { WifiOff, ServerCrash, Clock } from "lucide-react";
import ChatSidebar from "./ChatSidebar";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useChat } from "@/hooks/useChat";
import { SidebarProvider } from "@/components/ui/sidebar";

const ChatLayout = () => {
  const {
    conversations,
    activeConversation,
    activeId,
    status,
    isOffline,
    connectionReady,
    isLoadingHistory,
    rateLimitSecondsLeft,
    explanationLevel,
    setExplanationLevel,
    newConversation,
    sendMessage,
    selectConversation,
    deleteConversation,
    regenerateLastMessage,
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

  return (
    <SidebarProvider>
      <ChatSidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={selectConversation}
        onNew={newConversation}
        onDelete={deleteConversation}
        isLoadingHistory={isLoadingHistory}
        level={explanationLevel}
        onLevelChange={setExplanationLevel}
      />

      <main className="flex min-w-0 flex-1 flex-col h-screen overflow-hidden">
        {isOffline && (
          <div className="flex items-center justify-center gap-2 bg-destructive/10 px-4 py-2 text-xs font-medium text-destructive">
            <WifiOff className="h-3.5 w-3.5" />
            Sin conexión con el servidor — reconectando…
          </div>
        )}

        {rateLimitSecondsLeft > 0 && (
          <div className="flex items-center justify-center gap-2 bg-amber-500/10 px-4 py-2 text-xs font-medium text-amber-600 dark:text-amber-400">
            <Clock className="h-3.5 w-3.5" />
            Límite de mensajes alcanzado — podés enviar más en {rateLimitSecondsLeft}s
          </div>
        )}

        <ChatHeader conversation={activeConversation} />

        <ErrorBoundary>
          <MessageList
            messages={messages}
            isTyping={status === "loading"}
            onSuggestion={sendMessage}
            onRegenerate={status === "loading" || isOffline ? undefined : regenerateLastMessage}
          />
        </ErrorBoundary>

        <ChatInput
          onSend={sendMessage}
          disabled={status === "loading" || isOffline || isLoadingHistory || rateLimitSecondsLeft > 0}
          placeholder={
            rateLimitSecondsLeft > 0
              ? `Esperá ${rateLimitSecondsLeft}s para seguir enviando…`
              : isLoadingHistory
              ? "Cargando historial…"
              : undefined
          }
          level={explanationLevel}
          onLevelChange={setExplanationLevel}
        />
      </main>
    </SidebarProvider>
  );
};

export default ChatLayout;
