import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  MessagesSquare,
  Send,
  CheckCheck,
  UserRound,
  Bot,
  ArrowLeft,
  RotateCcw,
  Mail,
  CalendarDays,
  ShieldCheck,
} from "lucide-react";
import {
  useData,
  useAuth,
  useToast,
  api,
  send,
  PageTitle,
  Spinner,
  ErrorState,
  Badge,
  Empty,
  initials,
  dateTime,
  labels,
} from "../lib";
import type { Item } from "../lib";
export default function Inbox() {
  const { data, loading, error, refresh } = useData<Item[]>(
    "/conversations",
    3500,
  );
  const { auth } = useAuth();
  const canAssign = ["manager", "leader"].includes(auth?.user.role);
  const { data: team } = useData<Item[]>(canAssign ? "/team" : null);
  const toast = useToast();
  const [params] = useSearchParams();
  const [selected, setSelected] = useState<string | null>(
    params.get("selected"),
  );
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const conversation = data?.find((c) => c.id === selected);
  const list =
    data?.filter(
      (c) =>
        (filter === "all" || c.status === filter) &&
        (c.name || "Visitante anônimo")
          .toLowerCase()
          .includes(search.toLowerCase()),
    ) || [];
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [conversation?.messages?.length, selected]);
  async function action(action: string, assignee_id?: string) {
    if (!conversation) return;
    setBusy(true);
    try {
      await api(
        `/conversations/${conversation.id}/action`,
        send("POST", { action, content: text, assignee_id }),
      );
      if (action === "reply") setText("");
      await refresh();
      if (action !== "reply") toast("Atendimento atualizado.");
    } catch (e) {
      toast((e as Error).message, true);
    } finally {
      setBusy(false);
    }
  }
  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} retry={refresh} />;
  return (
    <>
      <PageTitle
        eyebrow="ONDE AS CONEXÕES ACONTECEM"
        title="Toda conversa importa."
        description="Acompanhe seu agente e entre em cena quando uma pessoa fizer a diferença."
        actions={
          <span className="live-indicator">
            <span />
            Atualização automática
          </span>
        }
      />
      <div className={`inbox-layout ${conversation ? "has-selection" : ""}`}>
        <aside className="inbox-list">
          <div className="inbox-list-header">
            <h2>
              Conversas<span>{data?.length || 0}</span>
            </h2>
            <div className="search-input">
              <Search size={16} />
              <input
                placeholder="Buscar conversa…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="inbox-filters">
              {[
                ["all", "Todas"],
                ["waiting", "Na fila"],
                ["human", "Humanas"],
                ["closed", "Finalizadas"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  className={filter === id ? "active" : ""}
                  onClick={() => setFilter(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="inbox-scroll">
            {list.length ? (
              list.map((c) => (
                <button
                  className={`inbox-item ${c.id === selected ? "selected" : ""}`}
                  key={c.id}
                  onClick={() => setSelected(c.id)}
                >
                  <div
                    className={`avatar ${c.identified ? "sage" : "neutral"}`}
                  >
                    {c.name ? initials(c.name) : <UserRound size={18} />}
                  </div>
                  <div className="inbox-item-content">
                    <div>
                      <strong>{c.name || "Visitante anônimo"}</strong>
                      <time>
                        {new Date(c.updated_at).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    </div>
                    <p>{c.messages?.at(-1)?.content || "Nova conversa"}</p>
                    <div className="inbox-item-badges">
                      <Badge value={c.status} />
                      <small>{labels[c.intent]}</small>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="inbox-empty-list">
                <MessagesSquare size={24} />
                <p>Nenhuma conversa por aqui ainda.</p>
              </div>
            )}
          </div>
        </aside>
        {conversation ? (
          <>
            <section className="inbox-chat">
              <header className="inbox-chat-header">
                <button
                  className="icon-button inbox-back"
                  aria-label="Voltar à lista"
                  onClick={() => setSelected(null)}
                >
                  <ArrowLeft size={18} />
                </button>
                <div className="avatar sage">
                  {conversation.name ? (
                    initials(conversation.name)
                  ) : (
                    <UserRound size={18} />
                  )}
                </div>
                <div>
                  <h3>{conversation.name || "Visitante anônimo"}</h3>
                  <span>
                    {conversation.status === "human"
                      ? `Com ${conversation.assignee_name}`
                      : labels[conversation.status]}
                  </span>
                </div>
                <Badge value={conversation.intent} />
              </header>
              <div className="inbox-chat-messages">
                <div className="chat-date">
                  {new Date(conversation.created_at).toLocaleDateString(
                    "pt-BR",
                    { day: "numeric", month: "long" },
                  )}
                </div>
                {conversation.messages.map((m: Item) => (
                  <div
                    key={m.id}
                    className={`message ${m.role === "user" ? "incoming" : "outgoing"} ${m.role === "system" ? "system-message" : ""}`}
                  >
                    {m.role === "system" ? (
                      <span>{m.content}</span>
                    ) : (
                      <>
                        <span className="message-author">
                          {m.role === "user"
                            ? conversation.name || "Cliente"
                            : m.role === "operator"
                              ? m.author || "Equipe"
                              : "Agente virtual"}
                        </span>
                        <p>{m.content}</p>
                        <time>
                          {new Date(m.at).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </time>
                      </>
                    )}
                  </div>
                ))}
                <div ref={bottom} />
              </div>
              <div className="inbox-reply">
                {conversation.status === "human" &&
                (conversation.assignee_id === auth?.user.id ||
                  auth?.user.role !== "operator") ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (text.trim()) action("reply");
                    }}
                  >
                    <textarea
                      rows={2}
                      placeholder="Escreva sua resposta…"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      maxLength={4000}
                    />
                    <div>
                      <span>
                        <ShieldCheck size={13} />O agente está pausado nesta
                        conversa.
                      </span>
                      <button
                        className="button primary"
                        disabled={busy || !text.trim()}
                      >
                        <Send size={16} />
                        Enviar
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="takeover-prompt">
                    <Bot size={20} />
                    <p>
                      {conversation.status === "closed"
                        ? "Atendimento finalizado."
                        : conversation.status === "waiting"
                          ? "Este cliente está aguardando a equipe."
                          : "O agente está cuidando desta conversa."}
                    </p>
                    {conversation.status !== "closed" && (
                      <button
                        className="button primary"
                        disabled={busy}
                        onClick={() => action("claim")}
                      >
                        <UserRound size={16} />
                        Assumir conversa
                      </button>
                    )}
                  </div>
                )}
              </div>
            </section>
            <aside className="inbox-details">
              <div className="detail-avatar">
                <UserRound size={28} />
              </div>
              <h3>{conversation.name || "Visitante anônimo"}</h3>
              <Badge value={conversation.identified ? "ready" : "pending"}>
                {conversation.identified ? "Identificado" : "Sem cadastro"}
              </Badge>
              <div className="detail-section">
                <span>CONTEXTO DO CLIENTE</span>
                <p>
                  <Mail size={15} />
                  {conversation.email || "E-mail não solicitado"}
                </p>
                <p>
                  <CalendarDays size={15} />
                  {dateTime(conversation.created_at)}
                </p>
                <p>
                  <MessagesSquare size={15} />
                  {conversation.origin}
                </p>
              </div>
              <div className="detail-section">
                <span>INTENÇÃO ATUAL</span>
                <strong>{labels[conversation.intent]}</strong>
                <p className="detail-note">
                  O roteamento acompanha a intenção a cada mensagem.
                </p>
              </div>
              <div className="detail-actions">
                {canAssign && conversation.status !== "closed" && (
                  <label>
                    Atribuir atendimento
                    <select
                      aria-label="Atribuir atendimento"
                      value={conversation.assignee_id || ""}
                      disabled={busy}
                      onChange={(e) => {
                        if (e.target.value)
                          void action("assign", e.target.value);
                      }}
                    >
                      <option value="" disabled>
                        Escolher pessoa
                      </option>
                      {team?.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {conversation.status === "human" && (
                  <button
                    className="button"
                    disabled={busy}
                    onClick={() => action("release")}
                  >
                    <RotateCcw size={15} />
                    Devolver ao agente
                  </button>
                )}
                {conversation.status !== "closed" && (
                  <button
                    className="button"
                    disabled={busy}
                    onClick={() => action("close")}
                  >
                    <CheckCheck size={15} />
                    Finalizar atendimento
                  </button>
                )}
              </div>
            </aside>
          </>
        ) : (
          <section className="inbox-placeholder">
            <Empty
              title="Escolha uma conversa para acompanhar."
              description="O contexto fica junto da mensagem, para que cada atendimento continue de onde parou."
            />
          </section>
        )}
      </div>
    </>
  );
}
