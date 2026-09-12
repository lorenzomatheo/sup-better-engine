/**
 * API client — wraps backend endpoints for the chat frontend.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// --- Types ---

export interface ChatMessageResponse {
  session_id: string;
  response: string;
  intent: string;
  handler: string;
  show_email_modal: boolean;
  turn_count: number;
}

export interface EmailSubmitResponse {
  success: boolean;
  message: string;
  lead_id: string | null;
}

export interface SessionState {
  session_id: string;
  turn_count: number;
  email_state: string;
  email_modal_displays: number;
  expired: boolean;
  origem: string;
  first_intent: string | null;
}

// --- Chat API ---

export async function sendMessage(
  message: string,
  sessionId: string | null,
  origem: string,
): Promise<ChatMessageResponse> {
  const res = await fetch(`${API_BASE}/api/chat/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, session_id: sessionId, origem }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail?.message || err.detail || "Failed to send message");
  }

  return res.json();
}

export async function submitEmail(
  sessionId: string,
  email: string,
): Promise<EmailSubmitResponse> {
  const res = await fetch(`${API_BASE}/api/chat/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, email }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail || "Failed to submit email");
  }

  return res.json();
}

export async function getSessionState(sessionId: string): Promise<SessionState> {
  const res = await fetch(`${API_BASE}/api/chat/session/${sessionId}`);

  if (!res.ok) throw new Error("Failed to get session state");
  return res.json();
}
