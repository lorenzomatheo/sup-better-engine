"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function BackofficeLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const ok = await login(email, password);
    if (ok) {
      router.push("/backoffice/dashboard");
    } else {
      setError("Credenciais inválidas.");
    }
    setIsLoading(false);
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen px-4"
      style={{ background: "hsl(var(--sb-canvas-backoffice))" }}
    >
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1
            className="text-2xl font-bold"
            style={{ color: "hsl(var(--sb-fg-strong))" }}
          >
            Sup Better
          </h1>
          <p style={{ color: "hsl(var(--sb-muted))", fontSize: "14px" }}>
            Backoffice — Acesse sua conta
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 bg-white rounded-2xl p-6"
          style={{
            border: "1px solid hsl(var(--sb-border))",
            boxShadow: "0 1px 2px rgb(0 0 0 / 0.05)",
          }}
        >
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: "hsl(var(--sb-fg))" }}
            >
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="operador@supbetter.com"
              className="w-full bg-white text-neutral-900 placeholder:text-neutral-400"
              style={{
                height: "44px",
                borderRadius: "var(--sb-radius-xl)",
                border: "1px solid hsl(var(--sb-border))",
                padding: "0 12px",
                fontSize: "16px",
              }}
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: "hsl(var(--sb-fg))" }}
            >
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-white text-neutral-900 placeholder:text-neutral-400"
              style={{
                height: "44px",
                borderRadius: "var(--sb-radius-xl)",
                border: "1px solid hsl(var(--sb-border))",
                padding: "0 12px",
                fontSize: "16px",
              }}
            />
          </div>

          {error && (
            <p
              className="text-sm rounded-lg px-3 py-2"
              style={{
                color: "hsl(var(--sb-danger))",
                background: "hsl(var(--sb-danger) / 0.08)",
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-full text-sm font-medium text-white transition-colors disabled:opacity-50"
            style={{
              height: "44px",
              background: "hsl(var(--sb-primary))",
            }}
          >
            {isLoading ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <p className="text-center text-xs" style={{ color: "hsl(var(--sb-muted))" }}>
          Piloto: gestao@supbetter.com / pilot2026!
        </p>
      </div>
    </div>
  );
}
