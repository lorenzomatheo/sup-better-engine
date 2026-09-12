"use client";

import {
  FormEvent,
  KeyboardEvent,
  useRef,
  useEffect,
  useState,
  useCallback,
} from "react";
import type { Message } from "@/hooks/useChat";

/* -------------------------------------------------------------------
 * Quick reply labels & payloads — DESIGN-SYSTEM.md §5.4 / §8
 * ------------------------------------------------------------------- */
const QUICK_REPLIES = [
  { label: "Quero saber mais", payload: "Gostaria de saber mais sobre os serviços" },
  { label: "Tenho uma dúvida", payload: "Tenho uma dúvida para a equipe" },
  { label: "Falar com atendente", payload: "Gostaria de falar com um atendente" },
];

/* -------------------------------------------------------------------
 * Typewriter placeholder — DESIGN-SYSTEM.md §7
 * ------------------------------------------------------------------- */
const TYPEWRITER_TEXT =
  "Ex.: quero saber mais, tenho uma dúvida, falar com atendente…";
const TYPEWRITER_MS = 38; // per character
const TYPEWRITER_PAUSE = 2500; // loop restart delay

function useTypewriter() {
  const [display, setDisplay] = useState("");
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (prefersReduced) {
      setDisplay(TYPEWRITER_TEXT);
      return;
    }

    let idx = 0;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      idx++;
      setDisplay(TYPEWRITER_TEXT.slice(0, idx));
      if (idx < TYPEWRITER_TEXT.length) {
        timer = setTimeout(tick, TYPEWRITER_MS);
      } else {
        timer = setTimeout(() => {
          idx = 0;
          setDisplay("");
          timer = setTimeout(tick, TYPEWRITER_MS);
        }, TYPEWRITER_PAUSE);
      }
    };

    timer = setTimeout(tick, TYPEWRITER_MS);
    return () => clearTimeout(timer);
  }, [prefersReduced]);

  return display;
}

/* -------------------------------------------------------------------
 * Voice input — DESIGN-SYSTEM.md §7
 * ------------------------------------------------------------------- */
function useSpeechRecognition(onResult: (text: string) => void) {
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<ReturnType<
    typeof createRecognition
  > | null>(null);

  function createRecognition() {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) return null;
    const r = new SR();
    r.lang = "pt-BR";
    r.interimResults = false;
    r.continuous = false;
    r.maxAlternatives = 1;
    return r;
  }

  const start = useCallback(() => {
    const r = createRecognition();
    if (!r) {
      alert("Seu navegador não suporta reconhecimento de voz. Use Chrome ou Edge.");
      return;
    }
    recognitionRef.current = r;
    setIsRecording(true);

    r.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      onResult(transcript);
      setIsRecording(false);
    };
    r.onerror = () => {
      setIsRecording(false);
    };
    r.onend = () => {
      setIsRecording(false);
    };
    r.start();
  }, [onResult]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  }, []);

  return { isRecording, start, stop };
}

/* -------------------------------------------------------------------
 * Icons (Lucide-equivalent outline, stroke 1.5–2) — DESIGN-SYSTEM.md §2
 * ------------------------------------------------------------------- */
function SendIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

/* -------------------------------------------------------------------
 * ChatWindow Component
 * ------------------------------------------------------------------- */
interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  onSend: (text: string) => void;
}

export default function ChatWindow({
  messages,
  isLoading,
  error,
  onSend,
}: ChatWindowProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const placeholder = useTypewriter();

  // Voice input
  const handleVoiceResult = useCallback(
    (text: string) => {
      setInput((prev) => (prev ? prev + " " + text : text));
    },
    [],
  );
  const { isRecording, start: startVoice, stop: stopVoice } =
    useSpeechRecognition(handleVoiceResult);

  // Auto-scroll — DESIGN-SYSTEM.md §7
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const isEmpty = messages.length === 0;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleQuickReply = (payload: string) => {
    if (isLoading) return;
    onSend(payload);
  };

  return (
    <div className="flex flex-col h-full w-full max-w-3xl mx-auto">
      {/* ============================================================
       * Empty state — DESIGN-SYSTEM.md §4.1
       * ============================================================ */}
      {isEmpty && (
        <div className="flex flex-col items-center justify-center flex-1 px-4 py-20">
          <h1
            className="text-[28px] md:text-[36px] font-semibold tracking-tight text-center"
            style={{ color: "hsl(var(--sb-fg-strong))" }}
          >
            Como podemos{" "}
            <em style={{ color: "hsl(var(--sb-primary))" }}>
              ajudar você hoje?
            </em>
          </h1>

          {/* Quick reply chips — desktop outline, mobile full-width rows */}
          <div className="flex flex-wrap justify-center gap-2 mt-8 md:gap-3">
            {QUICK_REPLIES.map((qr) => (
              <button
                key={qr.label}
                onClick={() => handleQuickReply(qr.payload)}
                className="hidden md:inline-flex items-center h-11 px-5 rounded-full border text-sm font-medium transition-colors"
                style={{
                  borderColor: "hsl(var(--sb-primary) / 0.3)",
                  color: "hsl(var(--sb-primary))",
                }}
              >
                {qr.label}
              </button>
            ))}
            {/* Mobile: full-width rows */}
            <div className="flex flex-col gap-1 w-full md:hidden mt-4">
              {QUICK_REPLIES.map((qr) => (
                <button
                  key={qr.label}
                  onClick={() => handleQuickReply(qr.payload)}
                  className="flex items-center gap-3 h-11 px-4 rounded-xl text-left text-sm transition-colors"
                  style={{ color: "hsl(var(--sb-muted))" }}
                >
                  {qr.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
       * Message list — DESIGN-SYSTEM.md §4.2 / §5.3
       * ============================================================ */}
      {!isEmpty && (
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`w-fit max-w-[min(100%,36rem)] rounded-2xl px-4 py-2.5 text-sm break-words ${
                  msg.role === "user"
                    ? "ml-auto text-white"
                    : "mr-auto text-neutral-900"
                }`}
                style={{
                  background:
                    msg.role === "user"
                      ? "hsl(var(--sb-bubble-user))"
                      : "hsl(var(--sb-bubble-assistant))",
                  overflowWrap: "anywhere",
                  whiteSpace: "pre-wrap",
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* Loading — DESIGN-SYSTEM.md §5.3: "Pensando…" text, no dots */}
          {isLoading && (
            <div className="flex justify-start">
              <div
                className="mr-auto rounded-2xl px-4 py-2.5 text-sm italic"
                style={{
                  background: "hsl(var(--sb-bubble-assistant))",
                  color: "hsl(var(--sb-muted))",
                }}
              >
                Pensando…
              </div>
            </div>
          )}

          {error && (
            <div
              className="text-center text-sm rounded-lg px-3 py-2"
              style={{
                color: "hsl(var(--sb-danger))",
                background: "hsl(var(--sb-danger) / 0.08)",
              }}
            >
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      )}

      {/* ============================================================
       * Composer — DESIGN-SYSTEM.md §5.1 (desktop) / §5.2 (mobile)
       * ============================================================ */}
      <div
        className="shrink-0"
        style={{
          paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
        }}
      >
        {/* Desktop composer — card wrapper */}
        <div className="hidden md:block px-4 pb-4">
          <div
            className="overflow-hidden"
            style={{
              borderRadius: "var(--sb-radius-composer)",
              border: "1px solid var(--sb-border-desktop)",
              background: "hsl(var(--sb-card))",
              boxShadow: "0 1px 2px rgb(0 0 0 / 0.05)",
            }}
          >
            {/* Input row */}
            <form
              onSubmit={handleSubmit}
              className="flex items-end gap-2 px-4 py-3"
              style={{
                borderTop: "1px solid hsl(var(--sb-bubble-assistant))",
                background: "hsl(0 0% 98% / 0.8)",
              }}
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isEmpty ? placeholder : "Digite sua mensagem…"}
                rows={1}
                disabled={isLoading}
                className="flex-1 resize-none bg-white px-4 py-3 text-base text-neutral-900 placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-0"
                style={{
                  minHeight: "44px",
                  borderRadius: "var(--sb-radius-2xl)",
                  border: "1px solid hsl(var(--sb-border))",
                  fontSize: "16px",
                }}
              />
              {/* Mic button — always visible on desktop */}
              <button
                type="button"
                onClick={isRecording ? stopVoice : startVoice}
                disabled={isLoading}
                aria-label={isRecording ? "Parar gravação" : "Iniciar gravação de voz"}
                className="flex-shrink-0 flex items-center justify-center rounded-full transition-colors disabled:opacity-40"
                style={{
                  width: "44px",
                  height: "44px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  background: isRecording
                    ? "hsl(var(--sb-danger) / 0.1)"
                    : "hsl(var(--sb-card))",
                  color: isRecording
                    ? "hsl(var(--sb-danger))"
                    : "hsl(var(--sb-muted))",
                }}
              >
                <MicIcon
                  className={`h-4 w-4 ${isRecording ? "animate-pulse" : ""}`}
                />
              </button>
              {/* Send button */}
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="flex-shrink-0 flex items-center justify-center gap-2 rounded-full px-6 text-sm font-medium text-white shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  height: "44px",
                  minWidth: "120px",
                  background:
                    input.trim() && !isLoading
                      ? "hsl(var(--sb-primary))"
                      : "hsl(var(--sb-primary) / 0.4)",
                }}
              >
                Enviar
                <SendIcon className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Mobile composer — sticky pill + FAB — DESIGN-SYSTEM.md §5.2 */}
        <div
          className="md:hidden px-3 pt-2"
          style={{
            borderTop: "1px solid hsl(var(--sb-border) / 0.4)",
            background: "hsl(var(--sb-canvas-mobile) / 0.95)",
            backdropFilter: "blur(8px)",
            paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
          }}
        >
          <div className="max-w-lg mx-auto flex items-end gap-2">
            {/* Pill input */}
            <div
              className="flex-1 flex items-center gap-2 px-3 py-2"
              style={{
                minHeight: "48px",
                borderRadius: "var(--sb-radius-pill)",
                border: "1px solid hsl(var(--sb-border) / 0.6)",
                background: "hsl(var(--sb-muted) / 0.15)",
              }}
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isEmpty ? placeholder : "Perguntar ao atendente"}
                rows={1}
                disabled={isLoading}
                className="flex-1 bg-transparent resize-none text-base placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-0"
                style={{
                  minHeight: "40px",
                  maxHeight: "112px",
                  fontSize: "16px",
                }}
              />
              {/* Mic in pill — only when input is empty */}
              {!input.trim() && (
                <button
                  type="button"
                  onClick={isRecording ? stopVoice : startVoice}
                  disabled={isLoading}
                  aria-label={isRecording ? "Parar gravação" : "Iniciar gravação de voz"}
                  className="flex-shrink-0 flex items-center justify-center"
                  style={{ width: "40px", height: "40px" }}
                >
                  <MicIcon
                    className={`h-5 w-5 ${isRecording ? "animate-pulse" : ""}`}
                  />
                </button>
              )}
            </div>
            {/* FAB 48×48 */}
            <button
              type="button"
              onClick={() => {
                if (input.trim() && !isLoading) {
                  handleSubmit({ preventDefault: () => {} } as FormEvent);
                } else if (!input.trim() && !isLoading) {
                  isRecording ? stopVoice() : startVoice();
                }
              }}
              disabled={isLoading}
              aria-label={
                input.trim()
                  ? "Enviar mensagem"
                  : isRecording
                    ? "Parar gravação"
                    : "Iniciar gravação de voz"
              }
              className="flex-shrink-0 flex items-center justify-center rounded-full text-white transition-colors disabled:opacity-40"
              style={{
                width: "48px",
                height: "48px",
                background: "hsl(var(--sb-primary))",
                boxShadow: "0 1px 2px rgb(0 0 0 / 0.05)",
              }}
            >
              {input.trim() ? (
                <SendIcon className="h-5 w-5" />
              ) : (
                <MicIcon
                  className={`h-5 w-5 ${isRecording ? "animate-pulse" : ""}`}
                />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
