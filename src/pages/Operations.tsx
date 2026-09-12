import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Download,
  Users,
  ShoppingBag,
  CalendarDays,
  Pencil,
  Trash2,
  ArrowUpRight,
  Package,
  LifeBuoy,
  Mail,
  ExternalLink,
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
  Empty,
  Badge,
  Field,
  SaveButton,
  Modal,
  money,
  dateTime,
  initials,
} from "../lib";
import type { Item } from "../lib";
export function Catalog() {
  const [tab, setTab] = useState("product");
  const { data, loading, error, refresh } = useData<Item[]>(`/items/${tab}`);
  const { auth } = useAuth();
  const toast = useToast();
  const [editing, setEditing] = useState<Item | null>(null);
  const [busy, setBusy] = useState(false);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    try {
      await api(
        `/items/${tab}${editing.id ? "/" + editing.id : ""}`,
        send(editing.id ? "PATCH" : "POST", { data: editing }),
      );
      setEditing(null);
      await refresh();
      toast("Item salvo. O contexto da funcionalidade foi atualizado.");
    } catch (e) {
      toast((e as Error).message, true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageTitle
        eyebrow="O QUE SUA EMPRESA OFERECE"
        title="Boas escolhas começam aqui."
        description="Produtos para descobrir. Serviços para agendar. Tudo conectado à conversa."
        actions={
          auth?.user.role === "manager" && (
            <button
              className="button primary"
              onClick={() =>
                setEditing({
                  name: "",
                  description: "",
                  price: 0,
                  duration: 30,
                  color: "sage",
                  active: true,
                })
              }
            >
              <Plus size={17} />
              {tab === "product" ? "Novo produto" : "Novo serviço"}
            </button>
          )
        }
      />
      <div className="list-toolbar">
        <div className="tabs">
          <button
            className={tab === "product" ? "active" : ""}
            onClick={() => setTab("product")}
          >
            <ShoppingBag size={16} />
            Catálogo
          </button>
          <button
            className={tab === "service" ? "active" : ""}
            onClick={() => setTab("service")}
          >
            <CalendarDays size={16} />
            Serviços da agenda
          </button>
        </div>
        <span className="subtle-text">
          {data?.length || 0} itens cadastrados
        </span>
      </div>
      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorState message={error} retry={refresh} />
      ) : data?.length ? (
        <div className="product-grid">
          {data.map((p, i) => (
            <article className="product-card" key={p.id}>
              <div
                className={`product-art ${p.color || ["sage", "peach", "lilac"][i % 3]}`}
              >
                <span
                  className={`product-shape shape-${i % 3}`}
                  aria-hidden="true"
                >
                  {tab === "service" ? (
                    <CalendarDays size={54} strokeWidth={1.2} />
                  ) : i % 3 === 0 ? (
                    "Aa"
                  ) : i % 3 === 1 ? (
                    "↗"
                  ) : (
                    "✳"
                  )}
                </span>
                <span className="product-type">
                  {tab === "service" ? "SERVIÇO" : "CATÁLOGO"}
                </span>
                <Badge value={p.active ? "ready" : "pending"}>
                  {p.active ? "Ativo" : "Pausado"}
                </Badge>
              </div>
              <div className="product-info">
                <h2>{p.name}</h2>
                <p>
                  {p.description ||
                    `${p.duration} minutos para dar o próximo passo.`}
                </p>
                <div className="product-footer">
                  <strong>
                    {p.price ? money(p.price) : "Gratuito"}
                    {tab === "service" && <small> / {p.duration} min</small>}
                  </strong>
                  {auth?.user.role === "manager" && (
                    <div>
                      <button
                        className="icon-button"
                        aria-label={`Editar ${p.name}`}
                        onClick={() => setEditing(p)}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Excluir ${p.name}`}
                        onClick={async () => {
                          if (!confirm(`Excluir ${p.name}?`)) return;
                          try {
                            await api(`/items/${tab}/${p.id}`, send("DELETE"));
                            await refresh();
                            toast("Item removido.");
                          } catch (e) {
                            toast((e as Error).message, true);
                          }
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Empty
          title={
            tab === "product"
              ? "Seu catálogo está começando."
              : "Abra espaço na sua agenda."
          }
          description="Adicione os itens para preparar esta funcionalidade."
        />
      )}
      {editing && (
        <Modal
          title={
            editing.id
              ? "Editar item"
              : tab === "product"
                ? "Adicionar produto"
                : "Adicionar serviço"
          }
          onClose={() => setEditing(null)}
        >
          <form onSubmit={save}>
            <Field label="Nome">
              <input
                required
                maxLength={120}
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
              />
            </Field>
            <Field label="Descrição">
              <textarea
                rows={3}
                maxLength={2000}
                value={editing.description}
                onChange={(e) =>
                  setEditing({ ...editing, description: e.target.value })
                }
              />
            </Field>
            <div className="form-grid">
              <Field label="Preço (R$)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={editing.price / 100}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      price: Math.round(+e.target.value * 100),
                    })
                  }
                />
              </Field>
              {tab === "service" ? (
                <Field label="Duração">
                  <select
                    value={editing.duration}
                    onChange={(e) =>
                      setEditing({ ...editing, duration: +e.target.value })
                    }
                  >
                    {[15, 30, 45, 60, 90, 120].map((n) => (
                      <option key={n} value={n}>
                        {n} minutos
                      </option>
                    ))}
                  </select>
                </Field>
              ) : (
                <Field label="Cor do cartão">
                  <select
                    value={editing.color}
                    onChange={(e) =>
                      setEditing({ ...editing, color: e.target.value })
                    }
                  >
                    <option value="sage">Verde sálvia</option>
                    <option value="peach">Pêssego</option>
                    <option value="lilac">Lavanda</option>
                    <option value="blue">Azul</option>
                  </select>
                </Field>
              )}
            </div>
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={editing.active}
                onChange={(e) =>
                  setEditing({ ...editing, active: e.target.checked })
                }
              />
              Disponível para clientes
            </label>
            <div className="modal-actions">
              <button
                type="button"
                className="button"
                onClick={() => setEditing(null)}
              >
                Cancelar
              </button>
              <SaveButton busy={busy}>Salvar item</SaveButton>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
export function Contacts() {
  const { data, loading, error, refresh } = useData<Item[]>("/contacts");
  const { auth } = useAuth();
  const [search, setSearch] = useState("");
  const list =
    data?.filter((c) =>
      (c.name + c.email).toLowerCase().includes(search.toLowerCase()),
    ) || [];
  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} retry={refresh} />;
  return (
    <>
      <PageTitle
        eyebrow="CONEXÕES COM IDENTIDADE"
        title="Pessoas, não apenas contatos."
        description="Clientes que se identificaram para agendar ou resolver um problema. Dúvidas continuam anônimas."
        actions={
          auth?.user.role !== "operator" && (
            <a className="button" href="/api/contacts/export">
              <Download size={16} />
              Exportar CSV
            </a>
          )
        }
      />
      <div className="list-toolbar">
        <div className="tabs">
          <button className="active">
            Todos os contatos<span>{data?.length || 0}</span>
          </button>
        </div>
        <div className="search-input">
          <Search size={17} />
          <input
            placeholder="Buscar por nome ou e-mail…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <section className="panel table-panel">
        {list.length ? (
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>E-mail</th>
                <th>Conta</th>
                <th>Identificado em</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="table-person">
                      <span className="avatar sage">{initials(c.name)}</span>
                      <strong>{c.name}</strong>
                    </div>
                  </td>
                  <td>{c.email}</td>
                  <td>
                    <Badge value={c.status}>
                      {c.status === "active"
                        ? "Conta ativa"
                        : "Aguardando ativação"}
                    </Badge>
                  </td>
                  <td>{dateTime(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Empty
            title="A identificação vem na hora certa."
            description="Quando alguém agendar ou abrir uma solicitação, o contato aparece aqui."
            action={
              <Link to="/flow" className="button">
                Entender o fluxo
                <ArrowUpRight size={15} />
              </Link>
            }
          />
        )}
      </section>
      <div className="privacy-note">
        <Users size={18} />
        <p>
          Mesmo e-mail na mesma empresa resolve para o mesmo contato. A
          verificação de posse acontece pelo link de ativação.
        </p>
      </div>
    </>
  );
}
export function Appointments() {
  return <OperationsList fixed="appointment" />;
}
export function OperationsList({ fixed }: { fixed?: string }) {
  const [kind, setKind] = useState(fixed || "ticket");
  const { data, loading, error, refresh } = useData<Item[]>(
    `/items/${kind}`,
    15000,
  );
  const toast = useToast();
  const [filter, setFilter] = useState("all");
  const list =
    data?.filter((x) => filter === "all" || x.status === filter) || [];
  const statuses: Record<string, string[]> = {
    appointment: ["confirmed", "completed", "cancelled"],
    ticket: ["open", "in_progress", "resolved"],
    order: ["requested", "processing", "completed", "cancelled"],
  };
  const titles: Record<string, string> = {
    appointment: "Tempo reservado para conectar.",
    ticket: "Cada solicitação merece cuidado.",
    order: "Da conversa para o próximo pedido.",
  };
  async function status(item: Item, status: string) {
    try {
      await api(`/operations/${kind}/${item.id}`, send("PATCH", { status }));
      await refresh();
      toast("Status atualizado.");
    } catch (e) {
      toast((e as Error).message, true);
    }
  }
  return (
    <>
      <PageTitle
        eyebrow={
          kind === "appointment" ? "SUA AGENDA EM DIA" : "OPERAÇÃO CONECTADA"
        }
        title={titles[kind]}
        description={
          kind === "appointment"
            ? "Reservas feitas pelo chat, com identificação e confirmação de disponibilidade."
            : "Acompanhe pedidos e problemas registrados nas conversas da sua empresa."
        }
      />
      <div className="list-toolbar">
        <div className="tabs">
          {fixed ? (
            <button className="active">
              <CalendarDays size={16} />
              Agendamentos<span>{data?.length || 0}</span>
            </button>
          ) : (
            <>
              <button
                className={kind === "ticket" ? "active" : ""}
                onClick={() => {
                  setKind("ticket");
                  setFilter("all");
                }}
              >
                <LifeBuoy size={16} />
                Chamados
              </button>
              <button
                className={kind === "order" ? "active" : ""}
                onClick={() => {
                  setKind("order");
                  setFilter("all");
                }}
              >
                <Package size={16} />
                Pedidos
              </button>
            </>
          )}
        </div>
        <select
          className="filter-select"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">Todos os status</option>
          {statuses[kind].map((s) => (
            <option key={s} value={s}>
              {
                (
                  {
                    confirmed: "Confirmados",
                    completed: "Concluídos",
                    cancelled: "Cancelados",
                    open: "Abertos",
                    in_progress: "Em andamento",
                    resolved: "Resolvidos",
                    requested: "Solicitados",
                    processing: "Em preparação",
                  } as Record<string, string>
                )[s]
              }
            </option>
          ))}
        </select>
      </div>
      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorState message={error} retry={refresh} />
      ) : (
        <section className="panel table-panel">
          {list.length ? (
            <table>
              <thead>
                <tr>
                  <th>
                    {kind === "appointment"
                      ? "Serviço"
                      : kind === "ticket"
                        ? "Solicitação"
                        : "Pedido"}
                  </th>
                  <th>Cliente</th>
                  <th>
                    {kind === "appointment"
                      ? "Data e horário"
                      : kind === "order"
                        ? "Total"
                        : "Abertura"}
                  </th>
                  <th>Status</th>
                  <th>Atualizar</th>
                </tr>
              </thead>
              <tbody>
                {list.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>
                        {item.service ||
                          item.subject ||
                          `#${item.id.slice(0, 6).toUpperCase()}`}
                      </strong>
                      <small className="table-description">
                        {item.description?.slice(0, 80) ||
                          item.items
                            ?.map((x: Item) => `${x.quantity}× ${x.name}`)
                            .join(", ") ||
                          `${item.duration} minutos`}
                      </small>
                    </td>
                    <td>{item.name}</td>
                    <td>
                      {kind === "appointment"
                        ? dateTime(item.start)
                        : kind === "order"
                          ? money(item.total)
                          : dateTime(item.created_at)}
                    </td>
                    <td>
                      <Badge value={item.status} />
                    </td>
                    <td>
                      <select
                        className="status-select"
                        aria-label={`Status de ${item.subject || item.service || item.id}`}
                        value={item.status}
                        onChange={(e) => status(item, e.target.value)}
                      >
                        {statuses[kind].map((s) => (
                          <option key={s} value={s}>
                            {
                              (
                                {
                                  confirmed: "Confirmado",
                                  completed: "Concluído",
                                  cancelled: "Cancelado",
                                  open: "Aberto",
                                  in_progress: "Em andamento",
                                  resolved: "Resolvido",
                                  requested: "Solicitado",
                                  processing: "Em preparação",
                                } as Record<string, string>
                              )[s]
                            }
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Empty
              title={
                kind === "appointment"
                  ? "Sua próxima conversa já pode ter hora marcada."
                  : "Tudo em dia por aqui."
              }
              description={
                kind === "appointment"
                  ? "Agendamentos confirmados pelo chat aparecem aqui automaticamente."
                  : "Os registros feitos pelo cliente vão aparecer aqui para acompanhamento."
              }
            />
          )}
        </section>
      )}
    </>
  );
}
export function Outbox() {
  const { data, loading, error, refresh } = useData<Item[]>(
    "/items/outbox",
    15000,
  );
  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} retry={refresh} />;
  return (
    <>
      <PageTitle
        eyebrow="DEPOIS DA BOA CONVERSA"
        title="Um convite para continuar."
        description="Acompanhe o envio dos links de ativação para clientes identificados."
      />
      <div className="info-strip">
        <Mail size={21} />
        <div>
          <strong>Envio real exige configuração SMTP.</strong>
          <span>
            No ambiente de demonstração, os convites ficam aqui para testar a
            ativação sem enviar e-mail.
          </span>
        </div>
      </div>
      <div className="outbox-list">
        {data?.length ? (
          data.map((item) => (
            <article className="panel outbox-card" key={item.id}>
              <div className="panel-heading">
                <div>
                  <h3>{item.subject}</h3>
                  <p>
                    Para {item.to} · {dateTime(item.created_at)}
                  </p>
                </div>
                <Badge value={item.status} />
              </div>
              <p className="outbox-body">{item.body}</p>
              {item.demo &&
                item.status === "demo" &&
                item.body.match(/https?:\/\/\S+/) && (
                  <a
                    className="button"
                    href={item.body.match(/https?:\/\/\S+/)[0]}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Testar ativação do cliente
                    <ExternalLink size={15} />
                  </a>
                )}
            </article>
          ))
        ) : (
          <section className="panel">
            <Empty
              title="Os próximos passos chegam por aqui."
              description="Ao confirmar um agendamento ou registrar um problema, o convite de ativação é preparado."
            />
          </section>
        )}
      </div>
    </>
  );
}
