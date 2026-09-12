import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useId,
  isValidElement,
  cloneElement,
} from "react";
import type { ReactNode } from "react";
import {
  X,
  LoaderCircle,
  Check,
  AlertCircle,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";

export type Item = Record<string, any>;
export async function api<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const isForm = options.body instanceof FormData;
  const response = await fetch(`/api${path}`, {
    credentials: "include",
    ...options,
    headers: {
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      ...options.headers,
    },
  });
  if (!response.ok) {
    let message = "Não foi possível concluir. Tente novamente.";
    try {
      const data = await response.json();
      message =
        typeof data.detail === "string"
          ? data.detail
          : data.detail?.[0]?.msg || message;
    } catch {
      /* non-JSON response */
    }
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}
export const send = (method: string, body?: unknown): RequestInit => ({
  method,
  body: body === undefined ? undefined : JSON.stringify(body),
});
export function useData<T = any>(path: string | null, interval = 0) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    if (!path) return;
    try {
      setData(await api<T>(path));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [path]);
  useEffect(() => {
    setLoading(true);
    void refresh();
    if (interval) {
      const id = setInterval(refresh, interval);
      return () => clearInterval(id);
    }
  }, [refresh, interval]);
  return { data, error, loading, refresh, setData };
}
export const labels: Record<string, string> = {
  atendimento: "Atendimento",
  qualificacao: "Qualificação",
  agendamento: "Agendamento",
  venda: "Catálogo",
  resolucao_problemas: "Resolução",
  indefinida: "Em descoberta",
  nenhuma: "Nova conversa",
  active: "Com o agente",
  human: "Com operador",
  waiting: "Na fila",
  closed: "Finalizada",
  pending: "Aguardando ativação",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  open: "Aberto",
  in_progress: "Em andamento",
  resolved: "Resolvido",
  requested: "Solicitado",
  processing: "Em preparação",
  manager: "Gestão",
  leader: "Liderança",
  operator: "Operador",
  ready: "Pronto",
  connected: "Conectado",
  sent: "Enviado",
  demo: "Demonstração",
  activated: "Ativado",
  failed: "Falha no envio",
  unconfigured: "E-mail não configurado",
};
export const money = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    cents / 100,
  );
export const dateTime = (date: string) =>
  new Date(date).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
export const initials = (name: string = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0])
    .join("")
    .toUpperCase() || "?";
export const featureColors: Record<string, string> = {
  atendimento: "sage",
  qualificacao: "peach",
  agendamento: "lilac",
  venda: "blue",
  resolucao_problemas: "yellow",
};

interface Auth {
  user: Item;
  tenant: Item;
}
const AuthContext = createContext<{
  auth: Auth | null;
  setAuth: (a: Auth | null) => void;
  loading: boolean;
}>({ auth: null, setAuth: () => {}, loading: true });
export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<Auth | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api<Auth>("/auth/me")
      .then(setAuth)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  return (
    <AuthContext.Provider value={{ auth, setAuth, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
const ToastContext = createContext<(text: string, error?: boolean) => void>(
  () => {},
);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ text: string; error: boolean } | null>(
    null,
  );
  useEffect(() => {
    if (toast) {
      const id = setTimeout(() => setToast(null), 4500);
      return () => clearTimeout(id);
    }
  }, [toast]);
  return (
    <ToastContext.Provider
      value={(text, error = false) => setToast({ text, error })}
    >
      {children}
      {toast && (
        <div className={`toast ${toast.error ? "error" : ""}`} role="status">
          {toast.error ? <AlertCircle size={18} /> : <Check size={18} />}
          <span>{toast.text}</span>
          <button
            className="icon-button"
            aria-label="Fechar aviso"
            onClick={() => setToast(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </ToastContext.Provider>
  );
}
export const useToast = () => useContext(ToastContext);
export function Logo({
  light = false,
  small = false,
}: {
  light?: boolean;
  small?: boolean;
}) {
  return (
    <span className={`logo ${light ? "light" : ""} ${small ? "small" : ""}`}>
      <span className="logo-mark">
        <span />
        <span />
      </span>
      <span>
        elo<span className="logo-dot">.</span>
      </span>
    </span>
  );
}
export function Badge({
  value,
  children,
}: {
  value?: string;
  children?: ReactNode;
}) {
  return (
    <span className={`badge ${value || ""}`}>
      <i />
      {children || labels[value || ""] || value}
    </span>
  );
}
export function Spinner() {
  return (
    <div className="loading-state">
      <LoaderCircle className="spin" size={25} />
      <span>Preparando tudo para você…</span>
    </div>
  );
}
export function ErrorState({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <div className="empty-state">
      <AlertCircle size={30} />
      <h3>Algo não saiu como esperado</h3>
      <p>{message}</p>
      {retry && (
        <button className="button" onClick={retry}>
          Tentar novamente
        </button>
      )}
    </div>
  );
}
export function Empty({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-art">
        <Sparkles size={26} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function PageTitle({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="page-title">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}
export function Modal({
  title,
  subtitle,
  children,
  onClose,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    const before = document.activeElement as HTMLElement;
    const listener = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const els = Array.from(
          document.querySelectorAll<HTMLElement>(
            ".modal button, .modal input, .modal textarea, .modal select, .modal a",
          ),
        ).filter((e) => !e.hasAttribute("disabled"));
        const first = els[0],
          last = els.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", listener);
    document.body.style.overflow = "hidden";
    setTimeout(
      () =>
        document
          .querySelector<HTMLElement>(
            ".modal input, .modal textarea, .modal button",
          )
          ?.focus(),
      30,
    );
    return () => {
      document.removeEventListener("keydown", listener);
      document.body.style.overflow = "";
      before?.focus();
    };
  }, [onClose]);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modal-heading">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Fechar">
            <X />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  const id = useId();
  return (
    <label className="field">
      <span id={id}>{label}</span>
      {isValidElement<Record<string, unknown>>(children)
        ? cloneElement(children, {
            "aria-labelledby": id,
            "aria-describedby": hint ? id + "-hint" : undefined,
          })
        : children}
      {hint && <small id={id + "-hint"}>{hint}</small>}
    </label>
  );
}
export function SaveButton({
  busy,
  children = "Salvar alterações",
}: {
  busy: boolean;
  children?: ReactNode;
}) {
  return (
    <button className="button primary" type="submit" disabled={busy}>
      {busy ? <LoaderCircle size={17} className="spin" /> : <Check size={17} />}{" "}
      {children}
    </button>
  );
}
export function External({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a className="button" href={href} target="_blank" rel="noreferrer">
      {children}
      <ArrowUpRight size={16} />
    </a>
  );
}
