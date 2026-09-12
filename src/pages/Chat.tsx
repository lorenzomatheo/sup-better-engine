import { ThemeToggle } from "../components/Experience";
import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Send,
  ArrowUpRight,
  Sparkles,
  Mic,
  Square,
  ArrowRight,
  CalendarDays,
  ShoppingBag,
  ShieldCheck,
  Check,
  Download,
  LifeBuoy,
  LoaderCircle,
  MessageCircle,
  Plus,
  Minus,
  RotateCcw,
  LockKeyhole,
  CheckCircle2,
  Smartphone,
} from "lucide-react";
import {
  api,
  send,
  useToast,
  Logo,
  Field,
  Badge,
  money,
  dateTime,
} from "../lib";
import type { Item } from "../lib";
interface ChatState {
  conversation: Item;
  token: string;
}
export default function Chat() {
  const { slug } = useParams();
  const toast = useToast();
  const [tenant, setTenant] = useState<Item | null>(null);
  const [state, setState] = useState<ChatState | null>(null);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [identityOpen, setIdentityOpen] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const recordTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const conversation = state?.conversation;
  const headers: Record<string, string> = state
    ? { "X-Chat-Token": state.token }
    : {};
  useEffect(() => {
    let active = true;
    api(`/public/${slug}`)
      .then(async (t) => {
        if (!active) return;
        setTenant(t);
        const saved = sessionStorage.getItem(`elo-chat-${slug}`);
        if (saved) {
          try {
            const s = JSON.parse(saved);
            const c = await api(`/chat/${s.conversation.id}`, {
              headers: { "X-Chat-Token": s.token },
            });
            if (active) {
              setState({ ...s, conversation: c });
              return;
            }
          } catch {
            sessionStorage.removeItem(`elo-chat-${slug}`);
          }
        }
        const s = await api(
          `/public/${slug}/sessions`,
          send("POST", {
            origin:
              new URLSearchParams(location.search).get("origem") || "site",
          }),
        );
        if (active) setState(s);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [slug]);
  useEffect(() => {
    if (state)
      sessionStorage.setItem(`elo-chat-${slug}`, JSON.stringify(state));
  }, [state, slug]);
  useEffect(() => {
    if (!state) return;
    const id = setInterval(async () => {
      try {
        const c = await api(`/chat/${state.conversation.id}`, {
          headers: { "X-Chat-Token": state.token },
        });
        setState((s) => (s ? { ...s, conversation: c } : s));
      } catch {
        /* preserve conversation while reconnecting */
      }
    }, 4000);
    return () => clearInterval(id);
  }, [state?.conversation.id, state?.token]);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [
    conversation?.messages?.length,
    busy,
    conversation?.needs_identity,
    conversation?.action,
  ]);
  useEffect(() => {
    setIdentityOpen(!!conversation?.needs_identity);
  }, [conversation?.needs_identity, conversation?.intent]);
  useEffect(
    () => () => {
      if (recorder.current?.state === "recording") recorder.current.stop();
      stream.current?.getTracks().forEach((t) => t.stop());
      if (recordTimer.current) clearTimeout(recordTimer.current);
    },
    [],
  );
  async function update(path: string, body?: unknown) {
    if (!state) return;
    const c = await api(`/chat/${state.conversation.id}/${path}`, {
      ...send("POST", body),
      headers,
    });
    setState((s) => (s ? { ...s, conversation: c } : s));
    return c;
  }
  async function message(content: string) {
    if (!content.trim() || busy || !state) return;
    setBusy(true);
    setText("");
    try {
      await update("messages", { content, request_id: crypto.randomUUID() });
    } catch (e) {
      setText(content);
      toast((e as Error).message, true);
    } finally {
      setBusy(false);
    }
  }
  async function refresh() {
    if (state) {
      const c = await api(`/chat/${state.conversation.id}`, { headers });
      setState((s) => (s ? { ...s, conversation: c } : s));
    }
  }
  async function startNew() {
    if (busy) return;
    setBusy(true);
    try {
      const s = await api(
        `/public/${slug}/sessions`,
        send("POST", { origin: "site" }),
      );
      setState(s);
      setText("");
      setIdentityOpen(false);
    } catch (e) {
      toast((e as Error).message, true);
    } finally {
      setBusy(false);
    }
  }
  async function audio() {
    if (recording) {
      recorder.current?.stop();
      if (recordTimer.current) clearTimeout(recordTimer.current);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      toast(
        "Seu navegador não permite gravação. Envie uma mensagem de texto.",
        true,
      );
      return;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = s;
      chunks.current = [];
      const r = new MediaRecorder(s);
      recorder.current = r;
      r.ondataavailable = (e) => {
        if (e.data.size) chunks.current.push(e.data);
      };
      r.onstop = async () => {
        setRecording(false);
        s.getTracks().forEach((t) => t.stop());
        setTranscribing(true);
        try {
          const f = new FormData();
          f.append(
            "file",
            new Blob(chunks.current, { type: r.mimeType }),
            r.mimeType.includes("mp4") ? "audio.mp4" : "audio.webm",
          );
          const result = await api(`/chat/${state?.conversation.id}/audio`, {
            method: "POST",
            headers,
            body: f,
          });
          setText(result.text);
          toast("Áudio transcrito. Revise a mensagem antes de enviar.");
        } catch (e) {
          toast((e as Error).message, true);
        } finally {
          setTranscribing(false);
        }
      };
      r.start();
      setRecording(true);
      recordTimer.current = setTimeout(() => {
        if (r.state === "recording") r.stop();
      }, 60000);
    } catch {
      toast(
        "Não foi possível acessar o microfone. Verifique a permissão do navegador.",
        true,
      );
    }
  }
  if (error)
    return (
      <div className="public-error">
        <Logo />
        <h1>Este canal ainda não está disponível.</h1>
        <p>{error}</p>
        <Link to="/" className="button">
          Ir ao workspace
          <ArrowRight size={16} />
        </Link>
      </div>
    );
  if (!tenant || !state)
    return (
      <div className="public-error">
        <Logo />
        <LoaderCircle className="spin" />
        <p>Preparando uma boa conversa…</p>
      </div>
    );
  const actions = [
    {
      intent: "atendimento",
      text: "Tirar uma dúvida",
      message: "Quais são os horários de atendimento?",
      icon: MessageCircle,
    },
    {
      intent: "agendamento",
      text: "Agendar uma conversa",
      message: "Quero agendar uma conversa",
      icon: CalendarDays,
    },
    {
      intent: "venda",
      text: "Conhecer o catálogo",
      message: "Quero ver o catálogo de produtos",
      icon: ShoppingBag,
    },
    {
      intent: "resolucao_problemas",
      text: "Resolver um problema",
      message: "Preciso resolver um problema",
      icon: LifeBuoy,
    },
  ].filter((a) => tenant.features.includes(a.intent));
  return (
    <div
      className="public-page"
      style={{ "--brand": tenant.color } as React.CSSProperties}
    >
      <header className="public-header">
        <Link to="/" aria-label="Elo início">
          <Logo />
        </Link>
        <span className="public-header-label">
          UMA CONVERSA PODE MUDAR TUDO
        </span>
        <ThemeToggle />
        <span className="public-secure">
          <ShieldCheck size={15} />
          Ambiente seguro
        </span>
      </header>
      <div className="public-layout">
        <aside className="public-story">
          <span className="eyebrow">
            BEM-VINDO À {tenant.name.toUpperCase()}
          </span>
          <h1>
            Vamos começar
            <br />
            com uma
            <br />
            <em>boa conversa?</em>
          </h1>
          <p>{tenant.description}</p>
          <div className="public-promise">
            <span>
              <Check size={15} />
            </span>
            <p>
              Sem formulários para tirar dúvidas.
              <br />
              Identificação só quando você precisar.
            </p>
          </div>
          <div className="public-art" aria-hidden="true">
            <div className="public-flower">✳</div>
            <div className="public-orbit" />
            <span className="public-art-caption">
              menos barreiras
              <br />
              <strong>mais conexões.</strong>
            </span>
            <span className="public-art-dot" />
          </div>
          <div className="public-company">
            <div className="company-monogram">{tenant.name[0]}</div>
            <div>
              <strong>{tenant.name}</strong>
              <span>Conectada com Elo</span>
            </div>
          </div>
        </aside>
        <section className="public-chat">
          <header className="public-chat-header">
            <div className="agent-avatar">
              <Sparkles size={23} />
              <span />
            </div>
            <div>
              <h2>{tenant.agent_name}</h2>
              <p>
                {conversation?.status === "human"
                  ? `Você está com ${conversation.assignee_name}`
                  : conversation?.status === "waiting"
                    ? "Aguardando a equipe"
                    : conversation?.status === "closed"
                      ? "Conversa finalizada"
                      : `Assistente da ${tenant.name}`}
              </p>
            </div>
            <button
              className="icon-button"
              aria-label="Nova conversa"
              title="Nova conversa"
              onClick={startNew}
            >
              <RotateCcw size={17} />
            </button>
          </header>
          {tenant.demo && (
            <div className="demo-chat-banner">
              Empresa fictícia para demonstração ·{" "}
              {tenant.ai ? "OpenAI conectada" : "modo local sem IA generativa"}
            </div>
          )}
          <div className="public-messages" role="log" aria-live="polite">
            <div className="conversation-beginning">
              O começo de uma boa conversa
            </div>
            {conversation?.messages.map((m: Item) => (
              <div
                key={m.id}
                className={`public-message ${m.role === "user" ? "user" : m.role === "system" ? "system" : "assistant"}`}
              >
                {m.role !== "user" && m.role !== "system" && (
                  <span className="message-mini-avatar">
                    <Sparkles size={12} />
                  </span>
                )}
                <div>
                  <p>{m.content}</p>
                  {m.appointment_id && (
                    <button
                      className="calendar-download"
                      onClick={async () => {
                        try {
                          const r = await fetch(
                            `/api/chat/${conversation.id}/appointments/${m.appointment_id}/ics`,
                            { headers },
                          );
                          if (!r.ok)
                            throw new Error(
                              "Não foi possível baixar o convite.",
                            );
                          const url = URL.createObjectURL(await r.blob());
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = "agendamento.ics";
                          a.click();
                          URL.revokeObjectURL(url);
                        } catch (e) {
                          toast((e as Error).message, true);
                        }
                      }}
                    >
                      <Download size={14} />
                      Adicionar ao calendário
                    </button>
                  )}
                  <time>
                    {new Date(m.at).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {m.role === "user" && <Check size={11} />}
                  </time>
                </div>
              </div>
            ))}
            {conversation?.messages.length === 1 && (
              <div className="quick-actions">
                {actions.map((a) => (
                  <button
                    key={a.intent}
                    onClick={() => message(a.message)}
                    disabled={busy}
                  >
                    <a.icon size={15} />
                    {a.text}
                    <ArrowUpRight size={13} />
                  </button>
                ))}
              </div>
            )}
            {busy && (
              <div className="typing-indicator">
                <span />
                <span />
                <span />
              </div>
            )}
            {identityOpen &&
              conversation?.status === "active" &&
              !conversation.identified && (
                <IdentityForm
                  onSubmit={async (data) => {
                    await update("identify", data);
                    setIdentityOpen(false);
                  }}
                  onSkip={async () => {
                    await update("skip-identification");
                    setIdentityOpen(false);
                  }}
                />
              )}
            {!identityOpen &&
              conversation?.can_identify &&
              !conversation.identified &&
              conversation.status === "active" &&
              ["agendamento", "resolucao_problemas"].includes(
                conversation.intent,
              ) && (
                <button
                  className="button continue-request"
                  onClick={() => setIdentityOpen(true)}
                >
                  <LockKeyhole size={15} />
                  Continuar solicitação
                </button>
              )}
            {conversation?.action === "schedule" &&
              conversation.status === "active" && (
                <ScheduleForm slug={slug!} chat={state} onDone={refresh} />
              )}{" "}
            {conversation?.action === "support" &&
              conversation.status === "active" && (
                <SupportForm chat={state} onDone={refresh} />
              )}{" "}
            {conversation?.action === "catalog" &&
              conversation.status === "active" && (
                <CatalogForm slug={slug!} chat={state} onDone={refresh} />
              )}
            <div ref={bottom} />
          </div>
          <div className="public-composer">
            {conversation?.status === "closed" ? (
              <button className="button primary full" onClick={startNew}>
                <Plus size={16} />
                Começar outra conversa
              </button>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  message(text);
                }}
              >
                <textarea
                  rows={1}
                  aria-label="Mensagem"
                  placeholder={
                    recording
                      ? "Gravando áudio…"
                      : transcribing
                        ? "Transcrevendo…"
                        : "Escreva sua mensagem…"
                  }
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={4000}
                  disabled={recording || transcribing}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      message(text);
                    }
                  }}
                />
                {tenant.audio && (
                  <button
                    type="button"
                    className={`icon-button ${recording ? "recording" : ""}`}
                    aria-label={recording ? "Parar gravação" : "Gravar áudio"}
                    disabled={busy || transcribing}
                    onClick={audio}
                  >
                    {recording ? <Square size={18} /> : <Mic size={18} />}
                  </button>
                )}
                <button
                  className="send-button"
                  aria-label="Enviar mensagem"
                  disabled={busy || !text.trim() || recording || transcribing}
                >
                  <Send size={18} />
                </button>
              </form>
            )}
            <div className="composer-bottom">
              <span>
                <LockKeyhole size={11} />
                Seu contexto permanece nesta conversa.
              </span>
              {conversation?.status !== "closed" && (
                <button
                  disabled={busy}
                  onClick={async () => {
                    try {
                      await update("close");
                    } catch (e) {
                      toast((e as Error).message, true);
                    }
                  }}
                >
                  Finalizar
                </button>
              )}
            </div>
          </div>
          <footer className="public-chat-footer">
            Conversas que conectam, com <Logo small />
          </footer>
        </section>
      </div>
      <footer className="public-page-footer">
        <span>Uma experiência {tenant.name} + Elo</span>
        <Link to={`/portal?empresa=${slug}`}>
          Já tem uma conta? Acompanhe suas solicitações
          <ArrowUpRight size={13} />
        </Link>
      </footer>
    </div>
  );
}
function IdentityForm({
  onSubmit,
  onSkip,
}: {
  onSubmit: (data: Item) => Promise<void>;
  onSkip: () => Promise<void>;
}) {
  const [form, setForm] = useState({ name: "", email: "", consent: false });
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  return (
    <div className="chat-action-card identity-card">
      <div className="action-card-heading">
        <span className="feature-icon sage">
          <LockKeyhole size={18} />
        </span>
        <div>
          <h3>Um próximo passo, com você.</h3>
          <p>Identifique-se para continuar sua solicitação.</p>
        </div>
      </div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await onSubmit(form);
          } catch (e) {
            toast((e as Error).message, true);
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field label="Seu nome">
          <input
            required
            minLength={2}
            autoComplete="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Como podemos te chamar?"
          />
        </Field>
        <Field label="Seu e-mail">
          <input
            required
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="voce@email.com"
          />
        </Field>
        <label className="checkbox-field">
          <input
            required
            type="checkbox"
            checked={form.consent}
            onChange={(e) => setForm({ ...form, consent: e.target.checked })}
          />
          <span>
            Autorizo usar estes dados para minha solicitação, acompanhamento e
            convite de ativação da conta. Sem marketing.
          </span>
        </label>
        <button
          className="button primary full"
          disabled={busy || !form.consent}
        >
          {busy ? "Continuando…" : "Continuar solicitação"}
          <ArrowRight size={16} />
        </button>
        <button
          className="skip-button"
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onSkip();
            } catch (e) {
              toast((e as Error).message, true);
            } finally {
              setBusy(false);
            }
          }}
        >
          Agora não, quero só tirar dúvidas
        </button>
      </form>
    </div>
  );
}
function ScheduleForm({
  slug,
  chat,
  onDone,
}: {
  slug: string;
  chat: ChatState;
  onDone: () => Promise<void>;
}) {
  const [services, setServices] = useState<Item[]>([]);
  const [service, setService] = useState("");
  const [day, setDay] = useState(new Date().toLocaleDateString("en-CA"));
  const [slots, setSlots] = useState<string[]>([]);
  const [slot, setSlot] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requestId] = useState(() => crypto.randomUUID());
  const toast = useToast();
  useEffect(() => {
    api<Item[]>(`/public/${slug}/services`)
      .then((s) => {
        setServices(s);
        setService(s[0]?.id || "");
      })
      .catch((e) => toast(e.message, true));
  }, [slug]);
  useEffect(() => {
    if (!service || !day) return;
    let active = true;
    setSlot("");
    setLoading(true);
    api<string[]>(`/public/${slug}/slots?service_id=${service}&day=${day}`)
      .then((s) => {
        if (active) setSlots(s);
      })
      .catch((e) => toast(e.message, true))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug, service, day]);
  return (
    <div className="chat-action-card">
      <div className="action-card-heading">
        <span className="feature-icon lilac">
          <CalendarDays size={18} />
        </span>
        <div>
          <h3>Encontre o melhor momento.</h3>
          <p>Escolha um horário disponível para confirmar.</p>
        </div>
      </div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await api(`/chat/${chat.conversation.id}/book`, {
              ...send("POST", {
                service_id: service,
                start: slot,
                request_id: requestId,
              }),
              headers: { "X-Chat-Token": chat.token },
            });
            await onDone();
            toast("Agendamento confirmado!");
          } catch (e) {
            toast((e as Error).message, true);
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field label="Serviço">
          <select value={service} onChange={(e) => setService(e.target.value)}>
            {services.map((s) => (
              <option value={s.id} key={s.id}>
                {s.name} · {s.duration} min
                {s.price ? ` · ${money(s.price)}` : ""}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Dia">
          <input
            required
            type="date"
            value={day}
            min={new Date().toLocaleDateString("en-CA")}
            onChange={(e) => setDay(e.target.value)}
          />
        </Field>
        <div className="slots-grid">
          {loading ? (
            <small>Buscando horários…</small>
          ) : slots.length ? (
            slots.map((s) => (
              <button
                type="button"
                className={slot === s ? "selected" : ""}
                key={s}
                onClick={() => setSlot(s)}
              >
                {s.slice(11, 16)}
              </button>
            ))
          ) : (
            <p>Sem horários neste dia. Escolha outro dia útil.</p>
          )}
        </div>
        <p className="slot-zone">
          Horário local da empresa. A confirmação bloqueia a disponibilidade.
        </p>
        <button className="button primary full" disabled={busy || !slot}>
          {busy ? "Confirmando…" : "Confirmar agendamento"}
          <Check size={16} />
        </button>
      </form>
    </div>
  );
}
function SupportForm({
  chat,
  onDone,
}: {
  chat: ChatState;
  onDone: () => Promise<void>;
}) {
  const [form, setForm] = useState({ subject: "", description: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [requestId] = useState(() => crypto.randomUUID());
  const toast = useToast();
  if (done) return null;
  return (
    <div className="chat-action-card">
      <div className="action-card-heading">
        <span className="feature-icon peach">
          <LifeBuoy size={18} />
        </span>
        <div>
          <h3>Vamos cuidar disso juntos.</h3>
          <p>Descreva o problema para a equipe acompanhar.</p>
        </div>
      </div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await api(`/chat/${chat.conversation.id}/tickets`, {
              ...send("POST", { ...form, request_id: requestId }),
              headers: { "X-Chat-Token": chat.token },
            });
            setDone(true);
            await onDone();
            toast("Solicitação registrada.");
          } catch (e) {
            toast((e as Error).message, true);
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field label="Sobre o que é o problema?">
          <input
            required
            minLength={3}
            maxLength={160}
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            placeholder="Ex.: Não consigo abrir os arquivos"
          />
        </Field>
        <Field label="Conte o que aconteceu">
          <textarea
            required
            minLength={10}
            maxLength={4000}
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="O que você tentou e como podemos ajudar?"
          />
        </Field>
        <button className="button primary full" disabled={busy}>
          {busy ? "Registrando…" : "Registrar solicitação"}
          <ArrowRight size={16} />
        </button>
      </form>
    </div>
  );
}
function CatalogForm({
  slug,
  chat,
  onDone,
}: {
  slug: string;
  chat: ChatState;
  onDone: () => Promise<void>;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const toast = useToast();
  useEffect(() => {
    api<Item[]>(`/public/${slug}/catalog`)
      .then(setItems)
      .catch((e) => toast(e.message, true));
  }, [slug]);
  const total = items.reduce((sum, p) => sum + p.price * (cart[p.id] || 0), 0);
  return (
    <div className="chat-action-card chat-catalog">
      <div className="action-card-heading">
        <span className="feature-icon blue">
          <ShoppingBag size={18} />
        </span>
        <div>
          <h3>Escolhas com a sua cara.</h3>
          <p>Explore o catálogo. Sem cadastro para comprar.</p>
        </div>
      </div>
      {items.map((p) => (
        <div className="chat-product" key={p.id}>
          <div className={`chat-product-art ${p.color || "sage"}`}>✳</div>
          <div>
            <h4>{p.name}</h4>
            <p>{p.description}</p>
            <strong>{money(p.price)}</strong>
          </div>
          <div className="quantity-control">
            <button
              aria-label={`Remover ${p.name}`}
              disabled={!cart[p.id] || busy}
              onClick={() =>
                setCart({ ...cart, [p.id]: Math.max(0, (cart[p.id] || 0) - 1) })
              }
            >
              <Minus size={12} />
            </button>
            <span>{cart[p.id] || 0}</span>
            <button
              aria-label={`Adicionar ${p.name}`}
              disabled={busy || (cart[p.id] || 0) >= 20}
              onClick={() =>
                setCart({ ...cart, [p.id]: (cart[p.id] || 0) + 1 })
              }
            >
              <Plus size={12} />
            </button>
          </div>
        </div>
      ))}
      <div className="cart-total">
        <span>Total do pedido</span>
        <strong>{money(total)}</strong>
      </div>
      <button
        className="button primary full"
        disabled={busy || !Object.values(cart).some((x) => x > 0)}
        onClick={async () => {
          setBusy(true);
          try {
            await api(`/chat/${chat.conversation.id}/orders`, {
              ...send("POST", {
                items: Object.entries(cart)
                  .filter(([, q]) => q > 0)
                  .map(([id, quantity]) => ({ id, quantity })),
                request_id: requestId,
              }),
              headers: { "X-Chat-Token": chat.token },
            });
            setCart({});
            setRequestId(crypto.randomUUID());
            await onDone();
            toast("Pedido registrado. Nenhum pagamento cobrado.");
          } catch (e) {
            toast((e as Error).message, true);
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Registrando…" : "Registrar pedido"}
        <ArrowRight size={16} />
      </button>
      <small className="cart-note">
        O registro não realiza cobrança. A equipe continua o atendimento por
        aqui.
      </small>
    </div>
  );
}
export function CustomerPortal() {
  const toast = useToast();
  const [token, setToken] = useState(
    sessionStorage.getItem("elo-customer") || "",
  );
  const [data, setData] = useState<Item | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [slug, setSlug] = useState(
    new URLSearchParams(location.search).get("empresa") || "",
  );
  const [sent, setSent] = useState(false);
  const activation = new URLSearchParams(location.search).get("token");
  useEffect(() => {
    if (!token) return;
    api("/customer/me", { headers: { "X-Customer-Token": token } })
      .then(setData)
      .catch((e) => {
        setError(e.message);
        setToken("");
        sessionStorage.removeItem("elo-customer");
      });
  }, [token]);
  async function activate() {
    if (!activation) return;
    setBusy(true);
    try {
      const d = await api(
        "/customer/activate",
        send("POST", { token: activation }),
      );
      sessionStorage.setItem("elo-customer", d.token);
      setToken(d.token);
      history.replaceState(null, "", "/portal");
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="portal-page">
      <header>
        <Link to="/">
          <Logo />
        </Link>
        <span>SEU ESPAÇO DE ACOMPANHAMENTO</span>
        <ThemeToggle />
        {token && (
          <button
            className="button"
            onClick={async () => {
              await api("/customer/logout", {
                ...send("POST"),
                headers: { "X-Customer-Token": token },
              });
              sessionStorage.removeItem("elo-customer");
              setToken("");
              setData(null);
            }}
          >
            Sair
          </button>
        )}
      </header>
      {data ? (
        <main className="portal-content">
          <span className="eyebrow">{data.tenant}</span>
          <h1>
            Olá, {data.contact.name.split(" ")[0]}.<br />
            Vamos continuar de onde paramos?
          </h1>
          <p>Seus agendamentos e solicitações, em um só lugar.</p>
          <div className="portal-grid">
            <section className="panel form-panel">
              <h2>
                <CalendarDays size={20} />
                Seus agendamentos
              </h2>
              {data.appointments.length ? (
                data.appointments.map((a: Item) => (
                  <article className="portal-record" key={a.id}>
                    <strong>{a.service}</strong>
                    <p>
                      {dateTime(a.start)} · {a.duration} min
                    </p>
                    <Badge value={a.status} />
                    <CustomerBookingActions
                      appointment={a}
                      token={token}
                      slug={data.slug}
                      onDone={async () =>
                        setData(
                          await api("/customer/me", {
                            headers: { "X-Customer-Token": token },
                          }),
                        )
                      }
                    />
                  </article>
                ))
              ) : (
                <p>Nenhum agendamento por enquanto.</p>
              )}
            </section>
            <section className="panel form-panel">
              <h2>
                <LifeBuoy size={20} />
                Suas solicitações
              </h2>
              {data.tickets.length ? (
                data.tickets.map((t: Item) => (
                  <article className="portal-record" key={t.id}>
                    <strong>{t.subject}</strong>
                    <p>{t.description}</p>
                    <Badge value={t.status} />
                  </article>
                ))
              ) : (
                <p>Nenhuma solicitação por enquanto.</p>
              )}
            </section>
          </div>
          {data.whatsapp_available && (
            <WhatsAppVerification token={token} existing={data.phone} />
          )}
        </main>
      ) : (
        <main className="activation-card">
          <div className="feature-icon sage">
            <LockKeyhole size={27} />
          </div>
          <h1>
            {activation
              ? "Sua próxima conexão começa aqui."
              : "Bom te ver de novo."}
          </h1>
          <p>
            {activation
              ? "Ative sua conta para acompanhar agendamentos e solicitações com segurança."
              : "Receba um link de acesso no e-mail usado durante seu atendimento."}
          </p>
          {error && <div className="inline-error">{error}</div>}
          {activation ? (
            <button
              className="button primary full"
              disabled={busy}
              onClick={activate}
            >
              {busy ? "Ativando…" : "Ativar minha conta"}
              <ArrowRight size={16} />
            </button>
          ) : sent ? (
            <div className="success-note">
              <CheckCircle2 size={22} />
              <p>
                Se o e-mail estiver cadastrado, o convite será preparado pelo
                canal de envio da empresa.
              </p>
            </div>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                try {
                  await api(
                    "/customer/request-access",
                    send("POST", { slug, email }),
                  );
                  setSent(true);
                } catch (e) {
                  toast((e as Error).message, true);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Field label="Identificador da empresa">
                <input
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="Ex.: studio-aurora"
                />
              </Field>
              <Field label="Seu e-mail">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@email.com"
                />
              </Field>
              <button className="button primary full" disabled={busy}>
                Enviar link de acesso
                <ArrowRight size={16} />
              </button>
            </form>
          )}
          <small>
            <ShieldCheck size={13} />
            Seu acesso é pessoal. O link só pode ser usado uma vez.
          </small>
        </main>
      )}
    </div>
  );
}

function WhatsAppVerification({
  token,
  existing,
}: {
  token: string;
  existing: Item | null;
}) {
  const [phone, setPhone] = useState("");
  const [challenge, setChallenge] = useState<Item | null>(null);
  const [code, setCode] = useState("");
  const [verified, setVerified] = useState<Item | null>(existing);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const headers = { "X-Customer-Token": token };
  return (
    <section className="panel form-panel phone-verification">
      <div className="section-title">
        <div className="feature-icon sage">
          <Smartphone size={20} />
        </div>
        <div>
          <h2>Seu WhatsApp, verificado.</h2>
          <p>Vincule seu número à conta. Esta etapa é opcional.</p>
        </div>
      </div>
      {verified ? (
        <div className="success-note">
          <CheckCircle2 size={20} />
          <p>
            {verified.phone} ·{" "}
            {verified.verification_mode === "demo" || verified.demo
              ? "Verificação simulada no ambiente de demonstração."
              : "Número verificado pelo WhatsApp."}
          </p>
        </div>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              if (challenge) {
                const result = await api("/customer/whatsapp/verify", {
                  ...send("POST", {
                    challenge_id: challenge.challenge_id,
                    code,
                  }),
                  headers,
                });
                setVerified(result);
                toast("Verificação concluída.");
              } else {
                setChallenge(
                  await api("/customer/whatsapp/request", {
                    ...send("POST", { phone }),
                    headers,
                  }),
                );
              }
            } catch (e) {
              toast((e as Error).message, true);
            } finally {
              setBusy(false);
            }
          }}
        >
          {challenge ? (
            <>
              <Field label="Código de verificação">
                <input
                  required
                  inputMode="numeric"
                  pattern="[0-9]{4,10}"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Código recebido no WhatsApp"
                />
              </Field>
              {challenge.demo && (
                <div className="otp-demo">
                  Demonstração: nenhum WhatsApp foi enviado. Use o código{" "}
                  <strong>{challenge.demo_code}</strong>.
                </div>
              )}
            </>
          ) : (
            <Field label="WhatsApp com código do país">
              <input
                required
                type="tel"
                pattern="[+][1-9][0-9]{7,14}"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+5511999999999"
              />
            </Field>
          )}
          <div className="phone-actions">
            <button className="button primary" disabled={busy}>
              {busy
                ? "Aguarde…"
                : challenge
                  ? "Verificar código"
                  : "Receber código"}
              <ArrowRight size={15} />
            </button>
            {challenge && (
              <button
                type="button"
                className="button"
                disabled={busy}
                onClick={() => {
                  setChallenge(null);
                  setCode("");
                }}
              >
                Solicitar novo código
              </button>
            )}
          </div>
        </form>
      )}
    </section>
  );
}
function CustomerBookingActions({
  appointment,
  token,
  slug,
  onDone,
}: {
  appointment: Item;
  token: string;
  slug: string;
  onDone: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [day, setDay] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [slot, setSlot] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const headers = { "X-Customer-Token": token };
  useEffect(() => {
    if (!editing || !day) return;
    api<string[]>(
      `/public/${slug}/slots?service_id=${appointment.service_id}&day=${day}`,
    )
      .then(setSlots)
      .catch((e) => toast(e.message, true));
    setSlot("");
  }, [editing, day, appointment.service_id, slug]);
  async function download() {
    try {
      const r = await fetch(
        `/api/customer/appointments/${appointment.id}/ics`,
        { headers },
      );
      if (!r.ok) throw new Error("Não foi possível baixar o convite.");
      const url = URL.createObjectURL(await r.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = "agendamento.ics";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast((e as Error).message, true);
    }
  }
  async function act(action: string) {
    setBusy(true);
    try {
      await api(`/customer/appointments/${appointment.id}/${action}`, {
        ...send("POST", action === "reschedule" ? { start: slot } : undefined),
        headers,
      });
      setEditing(false);
      await onDone();
      toast(
        action === "cancel"
          ? "Agendamento cancelado."
          : "Agendamento remarcado. Baixe o convite atualizado.",
      );
    } catch (e) {
      toast((e as Error).message, true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="portal-booking-actions">
      <button className="button" onClick={download}>
        <Download size={13} />
        Calendário
      </button>
      {appointment.status === "confirmed" && (
        <>
          <button
            className="button"
            disabled={busy}
            onClick={() => setEditing(!editing)}
          >
            Remarcar
          </button>
          <button
            className="text-button danger"
            disabled={busy}
            onClick={() => {
              if (confirm("Cancelar este agendamento?")) act("cancel");
            }}
          >
            Cancelar
          </button>
        </>
      )}
      {editing && (
        <div className="portal-reschedule">
          <Field label="Novo dia">
            <input
              type="date"
              value={day}
              min={new Date().toLocaleDateString("en-CA")}
              onChange={(e) => setDay(e.target.value)}
            />
          </Field>
          <div className="slots-grid">
            {slots.map((s) => (
              <button
                className={slot === s ? "selected" : ""}
                key={s}
                onClick={() => setSlot(s)}
              >
                {s.slice(11, 16)}
              </button>
            ))}
          </div>
          <button
            className="button primary"
            disabled={!slot || busy}
            onClick={() => act("reschedule")}
          >
            Confirmar remarcação
          </button>
        </div>
      )}
    </div>
  );
}
