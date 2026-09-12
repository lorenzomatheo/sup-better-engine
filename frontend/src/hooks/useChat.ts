"use client";

import { useCallback, useRef, useState } from "react";
import { sendMessage, submitEmail } from "@/lib/api-client";

export interface Message {
  id: string;
  role: "user" | "agent";
  content: string;
}

interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  showEmailModal: boolean;
  emailSubmitted: boolean;
  sessionId: string | null;
  turnCount: number;
  error: string | null;
  handleSend: (text: string) => Promise<void>;
  handleEmailSubmit: (email: string) => Promise<boolean>;
  dismissEmailModal: () => void;
}

export function useChat(origem: string): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const turnCountRef = useRef(0);

  const handleSend = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      setError(null);
      setIsLoading(true);

      // Add user message immediately
      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: text.trim(),
      };
      setMessages((prev) => [...prev, userMsg]);

      try {
        const res = await sendMessage(text.trim(), sessionIdRef.current, origem);

        // Store session ID for subsequent messages
        sessionIdRef.current = res.session_id;
        turnCountRef.current = res.turn_count;

        // Add agent response
        const agentMsg: Message = {
          id: crypto.randomUUID(),
          role: "agent",
          content: res.response,
        };
        setMessages((prev) => [...prev, agentMsg]);

        // Show email modal if backend signals it
        if (res.show_email_modal && !emailSubmitted) {
          setShowEmailModal(true);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erro de conexão";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, origem, emailSubmitted],
  );

  const handleEmailSubmit = useCallback(
    async (email: string): Promise<boolean> => {
      if (!sessionIdRef.current) return false;

      try {
        const res = await submitEmail(sessionIdRef.current, email);
        if (res.success) {
          setEmailSubmitted(true);
          setShowEmailModal(false);

          // Add confirmation message from agent
          const confirmMsg: Message = {
            id: crypto.randomUUID(),
            role: "agent",
            content:
              "Obrigado! Seu contato foi registrado. Nossa equipe comercial entrará em contato em breve.",
          };
          setMessages((prev) => [...prev, confirmMsg]);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    [],
  );

  const dismissEmailModal = useCallback(() => {
    setShowEmailModal(false);
  }, []);

  return {
    messages,
    isLoading,
    showEmailModal,
    emailSubmitted,
    sessionId: sessionIdRef.current,
    turnCount: turnCountRef.current,
    error,
    handleSend,
    handleEmailSubmit,
    dismissEmailModal,
  };
}
