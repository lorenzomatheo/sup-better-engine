"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ChatWindow from "@/components/chat/ChatWindow";
import EmailModal from "@/components/chat/EmailModal";
import { useChat } from "@/hooks/useChat";

function ChatPage() {
  const searchParams = useSearchParams();
  const origem = searchParams.get("origem") || "desconhecido";

  const {
    messages,
    isLoading,
    showEmailModal,
    emailSubmitted,
    error,
    handleSend,
    handleEmailSubmit,
    dismissEmailModal,
  } = useChat(origem);

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: "var(--sb-canvas-chat)" }}
    >
      {/* Chat area — the chat IS the page, no header/sidebar */}
      <ChatWindow
        messages={messages}
        isLoading={isLoading}
        error={error}
        onSend={handleSend}
      />

      {/* Email modal */}
      <EmailModal
        isOpen={showEmailModal}
        onSubmit={handleEmailSubmit}
        onDismiss={dismissEmailModal}
      />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div
          className="flex items-center justify-center h-full"
          style={{ background: "var(--sb-canvas-chat)" }}
        >
          <p style={{ color: "hsl(var(--sb-muted))" }}>Carregando…</p>
        </div>
      }
    >
      <ChatPage />
    </Suspense>
  );
}
