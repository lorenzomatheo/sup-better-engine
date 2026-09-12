"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import {
  useAuth,
  authFetch,
  getNavItemsForRole,
  type UserRole,
} from "@/lib/auth-context";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/* -------------------------------------------------------------------
 * Data types
 * ------------------------------------------------------------------- */
interface DailyCounters {
  date: string;
  sessions_today: number;
  edge_blocks_today: number;
  intent_distribution: Record<string, number>;
  email_distribution: Record<string, number>;
}

interface SessionItem {
  session_id: string;
  status: string;
  intent: string | null;
  turn_count: number;
  origem: string;
  email_state: string;
  flagged: boolean;
  last_message_at: string | null;
}

/* -------------------------------------------------------------------
 * Nav icons (Lucide-equivalent outline, 20px) — DESIGN-SYSTEM.md §2
 * ------------------------------------------------------------------- */
function NavIcon({ name, className }: { name: string; className?: string }) {
  const icons: Record<string, ReactNode> = {
    MessageSquare: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    Users: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    BarChart3: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M3 3v18h18" />
        <path d="M7 16h8" />
        <path d="M7 11h12" />
        <path d="M7 6h3" />
      </svg>
    ),
    Link: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
    Settings: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    Shield: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      </svg>
    ),
    Clock: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    LogOut: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" x2="9" y1="12" y2="12" />
      </svg>
    ),
  };
  return icons[name] || null;
}

/* -------------------------------------------------------------------
 * Status badge — DESIGN-SYSTEM.md §6.2
 * ------------------------------------------------------------------- */
const STATUS_BADGES: Record<string, { label: string; bg: string; text: string }> = {
  active:  { label: "Ativa",      bg: "bg-green-100",    text: "text-green-800" },
  valida:  { label: "Ativa",      bg: "bg-green-100",    text: "text-green-800" },
  idle:    { label: "Idle",       bg: "bg-yellow-100",   text: "text-yellow-800" },
  expirada_ttl: { label: "Expirada", bg: "bg-neutral-100", text: "text-neutral-600" },
  rate_limited: { label: "Limitada", bg: "bg-red-100",    text: "text-red-800" },
};

function StatusBadge({ status }: { status: string }) {
  const badge = STATUS_BADGES[status] || { label: status, bg: "bg-neutral-100", text: "text-neutral-600" };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {badge.label}
    </span>
  );
}

/* -------------------------------------------------------------------
 * KPI Card — DESIGN-SYSTEM.md §6.4.1
 * ------------------------------------------------------------------- */
function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="bg-white"
      style={{
        borderRadius: "var(--sb-radius-2xl)",
        border: "1px solid hsl(var(--sb-border))",
        padding: "16px",
        minWidth: "9.5rem",
        boxShadow: "0 1px 2px rgb(0 0 0 / 0.05)",
      }}
    >
      <p
        className="uppercase tracking-wide mb-1"
        style={{
          fontSize: "11px",
          fontWeight: 500,
          color: "hsl(var(--sb-muted))",
        }}
      >
        {label}
      </p>
      <p
        className="font-semibold"
        style={{
          fontSize: "18px",
          color: "hsl(var(--sb-fg-strong))",
        }}
      >
        {value.toLocaleString("pt-BR")}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------
 * Dashboard Page
 * ------------------------------------------------------------------- */
export default function DashboardPage() {
  const { user, accessToken, isLoading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [counters, setCounters] = useState<DailyCounters | null>(null);
  const [sessions, setSessions] = useState<SessionItem[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/backoffice");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!accessToken) return;
    authFetch(`${API_BASE}/api/counters/daily`, accessToken)
      .then((r) => r.json())
      .then(setCounters)
      .catch(() => {});
    authFetch(`${API_BASE}/api/sessions?page_size=10`, accessToken)
      .then((r) => r.json())
      .then((data) => setSessions(data.items || []))
      .catch(() => {});
  }, [accessToken]);

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p style={{ color: "hsl(var(--sb-muted))" }}>Carregando…</p>
      </div>
    );
  }

  const navItems = getNavItemsForRole(user.role);

  return (
    <div className="flex h-full" style={{ background: "hsl(var(--sb-canvas-backoffice))" }}>
      {/* ============================================================
       * Sidebar — DESIGN-SYSTEM.md §6.1
       * w-[260px] fixa, bg-white border-r
       * ============================================================ */}
      <aside
        className="hidden md:flex flex-col flex-shrink-0 bg-white"
        style={{
          width: "260px",
          borderRight: "1px solid hsl(var(--sb-border))",
        }}
      >
        {/* Logo — §6.1: tile 40×40 rounded-xl bg-primary/10 + "Sup Better" 16px semibold */}
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid hsl(var(--sb-border))" }}>
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "var(--sb-radius-xl)",
              background: "hsl(var(--sb-primary) / 0.1)",
            }}
          >
            <NavIcon name="MessageSquare" className="h-5 w-5" />
          </div>
          <div>
            <p className="text-base font-semibold" style={{ color: "hsl(var(--sb-fg-strong))" }}>
              Sup Better
            </p>
            <p className="text-xs truncate" style={{ color: "hsl(var(--sb-muted))" }}>
              {user.name}
            </p>
          </div>
        </div>

        {/* Nav items — §6.1: h-11 rounded-xl px-12 gap-12, ícone 20px + label 14px */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => router.push(item.href)}
              className="w-full flex items-center gap-3 rounded-xl px-3 transition-colors"
              style={{
                height: "44px",
                color: "hsl(var(--sb-muted))",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "hsl(0 0% 97%)";
                e.currentTarget.style.color = "hsl(var(--sb-fg))";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "";
                e.currentTarget.style.color = "hsl(var(--sb-muted))";
              }}
            >
              <NavIcon name={item.icon} className="h-5 w-5" />
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="p-3" style={{ borderTop: "1px solid hsl(var(--sb-border))" }}>
          <button
            onClick={() => {
              logout();
              router.push("/backoffice");
            }}
            className="w-full flex items-center gap-3 rounded-xl px-3 transition-colors"
            style={{ height: "44px", color: "hsl(var(--sb-danger))" }}
          >
            <NavIcon name="LogOut" className="h-5 w-5" />
            <span className="text-sm">Sair</span>
          </button>
        </div>
      </aside>

      {/* ============================================================
       * Main content — DESIGN-SYSTEM.md §6.1
       * ============================================================ */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6" style={{ maxWidth: "80rem" }}>
          <h1
            className="font-semibold mb-6"
            style={{ fontSize: "20px", color: "hsl(var(--sb-fg-strong))" }}
          >
            Dashboard
          </h1>

          {/* KPI cards — §6.4.1: grid 4 col desktop, 2 col mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard label="Sessões Hoje" value={counters?.sessions_today ?? 0} />
            <MetricCard label="Bloqueios (Rate Limit)" value={counters?.edge_blocks_today ?? 0} />
            <MetricCard label="Intenções Hoje" value={Object.keys(counters?.intent_distribution ?? {}).length} />
            <MetricCard label="Sessões Ativas" value={sessions.filter((s) => s.status === "active" || s.status === "valida").length} />
          </div>

          {/* Intent distribution */}
          {counters?.intent_distribution && Object.keys(counters.intent_distribution).length > 0 && (
            <div
              className="bg-white mb-6"
              style={{
                borderRadius: "var(--sb-radius-2xl)",
                border: "1px solid hsl(var(--sb-border))",
                padding: "16px",
                boxShadow: "0 1px 2px rgb(0 0 0 / 0.05)",
              }}
            >
              <h3
                className="font-semibold mb-3"
                style={{ fontSize: "14px", color: "hsl(var(--sb-fg))" }}
              >
                Distribuição de Intenções (Hoje)
              </h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(counters.intent_distribution).map(
                  ([intent, count]) => (
                    <span
                      key={intent}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
                      style={{
                        background: "hsl(var(--sb-bubble-assistant))",
                        color: "hsl(var(--sb-fg))",
                      }}
                    >
                      <span className="font-medium">{intent}</span>
                      <span style={{ color: "hsl(var(--sb-muted))" }}>{count}</span>
                    </span>
                  ),
                )}
              </div>
            </div>
          )}

          {/* Session table — §6.2 */}
          <div
            className="bg-white"
            style={{
              borderRadius: "var(--sb-radius-2xl)",
              border: "1px solid hsl(var(--sb-border))",
              boxShadow: "0 1px 2px rgb(0 0 0 / 0.05)",
            }}
          >
            <div className="px-4 py-3" style={{ borderBottom: "1px solid hsl(var(--sb-border))" }}>
              <h3 className="text-sm font-semibold" style={{ color: "hsl(var(--sb-fg))" }}>
                Sessões Recentes
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                {/* Table header — §2: 500 12px wide uppercase muted */}
                <thead style={{ background: "hsl(var(--sb-canvas-backoffice))" }}>
                  <tr>
                    {["Status", "Intenção", "Turnos", "Origem", "E-mail", "Flag"].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-2 uppercase tracking-wide"
                        style={{
                          fontSize: "12px",
                          fontWeight: 500,
                          color: "hsl(var(--sb-muted))",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody style={{ borderTop: "1px solid hsl(var(--sb-border))" }}>
                  {sessions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center"
                        style={{ color: "hsl(var(--sb-muted))", fontSize: "14px" }}
                      >
                        Nenhuma sessão encontrada.
                      </td>
                    </tr>
                  ) : (
                    sessions.map((s) => (
                      <tr
                        key={s.session_id}
                        className="transition-colors"
                        style={{ borderBottom: "1px solid hsl(var(--sb-border))" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "hsl(0 0% 97%)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "";
                        }}
                      >
                        {/* Status — proper badge, not just dot */}
                        <td className="px-4 py-2">
                          <StatusBadge status={s.status} />
                        </td>
                        {/* Table cell — §2: 400 14px foreground */}
                        <td className="px-4 py-2" style={{ fontSize: "14px", color: "hsl(var(--sb-fg))" }}>
                          {s.intent || "—"}
                        </td>
                        <td className="px-4 py-2" style={{ fontSize: "14px", color: "hsl(var(--sb-fg))" }}>
                          {s.turn_count}
                        </td>
                        <td className="px-4 py-2" style={{ fontSize: "14px", color: "hsl(var(--sb-fg))" }}>
                          {s.origem}
                        </td>
                        <td className="px-4 py-2" style={{ fontSize: "14px", color: "hsl(var(--sb-fg))" }}>
                          {s.email_state}
                        </td>
                        <td className="px-4 py-2">
                          {s.flagged && (
                            <span
                              className="text-xs px-1.5 py-0.5 rounded"
                              style={{
                                color: "hsl(var(--sb-warning))",
                                background: "hsl(var(--sb-warning) / 0.1)",
                              }}
                            >
                              ⚑ Flag
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
