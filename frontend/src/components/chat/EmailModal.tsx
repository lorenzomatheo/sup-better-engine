"use client";

import React, { FormEvent, useState } from "react";

/* -------------------------------------------------------------------
 * Disposable domain blocklist — DESIGN-SYSTEM.md §4.3
 * ------------------------------------------------------------------- */
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com", "guerrillamail.com", "tempmail.com", "throwaway.email",
  "yopmail.com", "sharklasers.com", "guerrillamailblock.com", "grr.la",
  "mailnesia.com", "maildrop.cc", "discard.email", "tmpmail.net",
  "tmpmail.org", "binkmail.com", "bobmail.info", "chammy.info",
  "devnullmail.com", "letthemeatspam.com", "moza.pl", "nearcrisis.com",
]);

function validateEmail(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return "Digite seu e-mail.";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) return "Formato de e-mail inválido.";
  const domain = trimmed.split("@")[1];
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return "E-mails temporários não são aceitos. Use um e-mail válido.";
  }
  return null;
}

/* -------------------------------------------------------------------
 * Mail icon — DESIGN-SYSTEM.md §4.3 (24px primary)
 * ------------------------------------------------------------------- */
function MailIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
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
      style={style}
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

/* -------------------------------------------------------------------
 * Check icon — DESIGN-SYSTEM.md §5.6 (consent card)
 * ------------------------------------------------------------------- */
function CheckIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
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
      style={style}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/* -------------------------------------------------------------------
 * EmailModal — DESIGN-SYSTEM.md §4.3
 * ------------------------------------------------------------------- */
interface EmailModalProps {
  isOpen: boolean;
  onSubmit: (email: string) => Promise<boolean>;
  onDismiss: () => void;
}

export default function EmailModal({
  isOpen,
  onSubmit,
  onDismiss,
}: EmailModalProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConsentCard, setShowConsentCard] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const validationError = validateEmail(email);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsSubmitting(true);

    const success = await onSubmit(email.trim().toLowerCase());
    if (success) {
      setShowConsentCard(true);
      setTimeout(() => setShowConsentCard(false), 5000);
    } else {
      setError("Erro ao registrar e-mail. Tente novamente.");
    }
    setIsSubmitting(false);
  };

  if (!isOpen && !showConsentCard) return null;

  // Consent card — DESIGN-SYSTEM.md §5.6
  if (showConsentCard && !isOpen) {
    return (
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
        <div
          className="rounded-2xl p-4 flex items-start gap-3"
          style={{
            border: "1px solid hsl(var(--sb-accent) / 0.3)",
            background: "hsl(var(--sb-accent) / 0.05)",
          }}
        >
          <CheckIcon
            className="h-5 w-5 flex-shrink-0 mt-0.5"
            style={{ color: "hsl(var(--sb-accent))" }}
          />
          <div>
            <p
              className="text-sm font-semibold"
              style={{ color: "hsl(var(--sb-fg-strong))" }}
            >
              E-mail registrado
            </p>
            <p className="text-xs mt-0.5" style={{ color: "hsl(220 10% 45%)" }}>
              A equipe comercial entrará em contato em breve.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgb(0 0 0 / 0.4)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6"
        style={{ boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
      >
        {/* Header — DESIGN-SYSTEM.md §4.3 */}
        <div className="space-y-3 mb-5">
          <MailIcon
            className="h-6 w-6"
            style={{ color: "hsl(var(--sb-primary))" }}
          />
          <h2
            className="text-lg font-semibold"
            style={{ color: "hsl(var(--sb-fg-strong))" }}
          >
            Para continuarmos…
          </h2>
          <p className="text-sm" style={{ color: "hsl(var(--sb-fg))" }}>
            Seu e-mail serve para o time comercial retornar sobre esta
            conversa.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              placeholder="seu@email.com"
              autoFocus
              disabled={isSubmitting}
              className="w-full bg-white text-neutral-900 placeholder:text-neutral-400 disabled:opacity-50"
              style={{
                height: "44px",
                borderRadius: "var(--sb-radius-xl)",
                border: "1px solid hsl(var(--sb-border))",
                padding: "0 16px",
                fontSize: "16px",
              }}
            />
            {error && (
              <p className="mt-1.5 text-red-500" style={{ fontSize: "12px" }}>
                {error}
              </p>
            )}
          </div>

          {/* Primary CTA — full-width — DESIGN-SYSTEM.md §4.3 */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full text-sm font-medium text-white transition-colors disabled:opacity-50"
            style={{
              height: "44px",
              background: "hsl(var(--sb-primary))",
            }}
          >
            {isSubmitting ? "Enviando…" : "Enviar e-mail"}
          </button>

          {/* Skip link — DESIGN-SYSTEM.md §4.3 */}
          <button
            type="button"
            onClick={() => {
              setEmail("");
              setError(null);
              onDismiss();
            }}
            disabled={isSubmitting}
            className="w-full text-center text-sm transition-colors disabled:opacity-50"
            style={{ color: "hsl(var(--sb-muted))" }}
          >
            Prefiro não informar
          </button>
        </form>

        {/* LGPD notice — DESIGN-SYSTEM.md §4.3 / §8 */}
        <p
          className="mt-4 leading-relaxed"
          style={{
            fontSize: "11px",
            color: "hsl(var(--sb-muted-foreground))",
          }}
        >
          Ao enviar, você concorda que seus dados serão usados apenas para este
          fim.
        </p>
      </div>
    </div>
  );
}
