import { useState, useRef } from "react";
import {
  BookOpen,
  Plus,
  Search,
  Upload,
  FileText,
  Database,
  Globe,
  ArrowUpRight,
  Trash2,
  Pencil,
  RefreshCw,
  CheckCircle2,
  Link2,
  ShieldCheck,
} from "lucide-react";
import {
  api,
  send,
  useData,
  useAuth,
  useToast,
  PageTitle,
  Spinner,
  ErrorState,
  Empty,
  Modal,
  Field,
  SaveButton,
  Badge,
  dateTime,
} from "../lib";
import type { Item } from "../lib";
export default function ContextPage() {
  const docs = useData<Item[]>("/items/knowledge");
  const { auth } = useAuth();
  const integrations = useData<Item[]>(
    auth?.user.role === "manager" ? "/items/integration" : null,
  );
  const toast = useToast();
  const uploadRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState("documents");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Item | null>(null);
  const [connect, setConnect] = useState(false);
  const [busy, setBusy] = useState(false);
  const canEdit = auth?.user.role === "manager";
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    try {
      await api(
        `/items/knowledge${editing.id ? "/" + editing.id : ""}`,
        send(editing.id ? "PATCH" : "POST", { data: editing }),
      );
      setEditing(null);
      await docs.refresh();
      toast("Contexto salvo. Seu agente já pode consultar este conhecimento.");
    } catch (e) {
      toast((e as Error).message, true);
    } finally {
      setBusy(false);
    }
  }
  async function upload(file: File | undefined) {
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    setBusy(true);
    try {
      await api("/knowledge/upload", { method: "POST", body: form });
      await docs.refresh();
      toast("Arquivo adicionado ao contexto.");
    } catch (e) {
      toast((e as Error).message, true);
    } finally {
      setBusy(false);
      if (uploadRef.current) uploadRef.current.value = "";
    }
  }
  async function remove(id: string, kind = "knowledge") {
    if (!confirm("Excluir esta fonte de contexto?")) return;
    try {
      await api(`/items/${kind}/${id}`, send("DELETE"));
      await (kind === "knowledge" ? docs.refresh() : integrations.refresh());
      toast("Fonte removida.");
    } catch (e) {
      toast((e as Error).message, true);
    }
  }
  if (docs.loading) return <Spinner />;
  if (docs.error)
    return <ErrorState message={docs.error} retry={docs.refresh} />;
  const items =
    docs.data?.filter((d) =>
      (d.title + " " + d.content).toLowerCase().includes(search.toLowerCase()),
    ) || [];
  return (
    <>
      <PageTitle
        eyebrow="O QUE TORNA SEU AGENTE ÚNICO"
        title="Conhecimento que vira conversa."
        description="Reúna documentos, regras e fontes da empresa. Seu agente responde a partir desse contexto."
        actions={
          canEdit && (
            <>
              <input
                ref={uploadRef}
                type="file"
                accept=".txt,.md,.csv"
                hidden
                onChange={(e) => upload(e.target.files?.[0])}
              />
              <button
                className="button"
                disabled={busy}
                onClick={() => uploadRef.current?.click()}
              >
                <Upload size={16} />
                Importar arquivo
              </button>
              <button
                className="button primary"
                onClick={() =>
                  setEditing({ title: "", content: "", category: "general" })
                }
              >
                <Plus size={17} />
                Adicionar contexto
              </button>
            </>
          )
        }
      />
      <div className="context-summary">
        <div>
          <div className="feature-icon sage">
            <BookOpen size={22} />
          </div>
          <strong>
            {docs.data?.length || 0}
            <span>fontes de conhecimento</span>
          </strong>
        </div>
        <div>
          <div className="feature-icon lilac">
            <Database size={22} />
          </div>
          <strong>
            {integrations.data?.filter((i) => i.status === "connected")
              .length || 0}
            <span>integrações sincronizadas</span>
          </strong>
        </div>
        <div className="context-summary-copy">
          <ShieldCheck size={22} />
          <p>
            <strong>O contexto certo para cada funcionalidade.</strong>
            Documentação pública orienta respostas. Credenciais de APIs ficam no
            servidor.
          </p>
        </div>
      </div>
      <div className="list-toolbar">
        <div className="tabs">
          <button
            className={tab === "documents" ? "active" : ""}
            onClick={() => setTab("documents")}
          >
            Documentação<span>{docs.data?.length || 0}</span>
          </button>
          {canEdit && (
            <button
              className={tab === "integrations" ? "active" : ""}
              onClick={() => setTab("integrations")}
            >
              CRM, ERP e APIs
            </button>
          )}
        </div>
        <div className="search-input">
          <Search size={17} />
          <input
            placeholder="Buscar no contexto…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      {tab === "documents" ? (
        <div className="document-grid">
          {items.map((doc) => (
            <article className="document-card" key={doc.id}>
              <div className="document-card-top">
                <div
                  className={`document-icon ${doc.category === "support" ? "peach" : doc.category === "qualification" ? "lilac" : "sage"}`}
                >
                  <FileText size={22} />
                </div>
                <Badge value="ready">Disponível</Badge>
              </div>
              <span className="document-category">
                {(
                  {
                    general: "CONHECIMENTO GERAL",
                    qualification: "QUALIFICAÇÃO",
                    support: "RESOLUÇÃO DE PROBLEMAS",
                  } as Record<string, string>
                )[doc.category] || "DOCUMENTO"}
              </span>
              <h3>{doc.title}</h3>
              <p>{doc.content}</p>
              <footer>
                <span>
                  {doc.source === "upload"
                    ? "Arquivo importado"
                    : doc.source === "integration"
                      ? "Integração"
                      : "Adicionado manualmente"}
                </span>
                <div>
                  <button
                    className="icon-button"
                    aria-label={`Ler ${doc.title}`}
                    onClick={() => setEditing(doc)}
                  >
                    <Pencil size={15} />
                  </button>
                  {canEdit && (
                    <button
                      className="icon-button"
                      aria-label={`Excluir ${doc.title}`}
                      onClick={() => remove(doc.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </footer>
            </article>
          ))}
          {canEdit && (
            <button
              className="add-document-card"
              onClick={() =>
                setEditing({ title: "", content: "", category: "general" })
              }
            >
              <span>
                <Plus size={25} />
              </span>
              <strong>Seu agente pode saber mais.</strong>
              <p>Adicione uma nova fonte de contexto.</p>
            </button>
          )}
          {!items.length && !canEdit && (
            <Empty
              title="O conhecimento começa aqui."
              description="Peça à gestão para adicionar o contexto da empresa."
            />
          )}
        </div>
      ) : (
        <>
          <div className="integration-intro">
            <div>
              <h2>Traga o contexto de onde ele já está.</h2>
              <p>
                Conecte um endpoint autorizado de CRM, ERP ou API para importar
                documentos públicos.
              </p>
            </div>
            <button className="button primary" onClick={() => setConnect(true)}>
              <Link2 size={16} />
              Nova conexão
            </button>
          </div>
          <div className="integration-grid">
            {integrations.data?.map((i) => (
              <article className="panel integration-card" key={i.id}>
                <div className="integration-heading">
                  <div className="feature-icon blue">
                    <Globe size={24} />
                  </div>
                  <Badge value={i.status} />
                </div>
                <h3>{i.name}</h3>
                <p className="integration-url">{i.url}</p>
                <small>
                  {i.last_sync
                    ? `Última sincronização: ${dateTime(i.last_sync)}`
                    : "Aguardando primeira sincronização"}
                </small>
                <div className="integration-actions">
                  <button
                    className="button"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      try {
                        await api(`/integrations/${i.id}/sync`, send("POST"));
                        await integrations.refresh();
                        await docs.refresh();
                        toast("Contexto sincronizado.");
                      } catch (e) {
                        toast((e as Error).message, true);
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    <RefreshCw size={15} />
                    Sincronizar
                  </button>
                  <button
                    className="icon-button"
                    aria-label="Excluir conexão"
                    onClick={() => remove(i.id, "integration")}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
          <div className="info-strip">
            <CheckCircle2 size={21} />
            <div>
              <strong>Conexão explícita, contexto confiável.</strong>
              <span>
                A URL precisa estar autorizada no servidor. O formato de
                importação está documentado no README.
              </span>
            </div>
            <a
              className="text-link"
              href="/docs"
              target="_blank"
              rel="noreferrer"
            >
              Ver API
              <ArrowUpRight size={16} />
            </a>
          </div>
        </>
      )}
      {editing && (
        <Modal
          title={editing.id ? "Conhecimento da empresa" : "Adicionar contexto"}
          subtitle="Informações que o agente pode usar durante o atendimento."
          onClose={() => setEditing(null)}
        >
          <form onSubmit={save}>
            <Field label="Título">
              <input
                required
                maxLength={120}
                value={editing.title}
                onChange={(e) =>
                  setEditing({ ...editing, title: e.target.value })
                }
                disabled={!canEdit}
                placeholder="Ex.: Política de troca e devolução"
              />
            </Field>
            <Field label="Para qual funcionalidade?">
              <select
                value={editing.category}
                onChange={(e) =>
                  setEditing({ ...editing, category: e.target.value })
                }
                disabled={!canEdit}
              >
                <option value="general">
                  Atendimento · informações gerais
                </option>
                <option value="qualification">
                  Qualificação · critérios e perfil
                </option>
                <option value="support">
                  Resolução · procedimentos de suporte
                </option>
              </select>
            </Field>
            <Field
              label="Conteúdo"
              hint="Inclua somente informações que possam ser usadas no atendimento. Não cole senhas ou chaves."
            >
              <textarea
                required
                rows={9}
                maxLength={50000}
                value={editing.content}
                onChange={(e) =>
                  setEditing({ ...editing, content: e.target.value })
                }
                disabled={!canEdit}
                placeholder="Conte o que o agente precisa saber…"
              />
            </Field>
            {canEdit && (
              <div className="modal-actions">
                <button
                  type="button"
                  className="button"
                  onClick={() => setEditing(null)}
                >
                  Cancelar
                </button>
                <SaveButton busy={busy}>Salvar contexto</SaveButton>
              </div>
            )}
          </form>
        </Modal>
      )}
      {connect && (
        <ConnectionModal
          onClose={() => setConnect(false)}
          onSaved={() => {
            setConnect(false);
            integrations.refresh();
          }}
        />
      )}
    </>
  );
}
function ConnectionModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    type: "crm",
    url: "",
    token_env: "",
  });
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/items/integration", send("POST", { data: form }));
      onSaved();
      toast(
        "Conexão cadastrada. Autorize o domínio no servidor para sincronizar.",
      );
    } catch (e) {
      toast((e as Error).message, true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title="Conectar uma fonte"
      subtitle="Um endpoint HTTPS que fornece o contexto autorizado da empresa."
      onClose={onClose}
    >
      <form onSubmit={save}>
        <Field label="Nome da conexão">
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ex.: CRM da empresa"
          />
        </Field>
        <Field label="Tipo">
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="crm">CRM</option>
            <option value="erp">ERP / sistema</option>
            <option value="api">API</option>
          </select>
        </Field>
        <Field label="Endpoint de contexto">
          <input
            type="url"
            required
            placeholder="https://api.empresa.com/contexto"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
          />
        </Field>
        <Field
          label="Nome da variável de credencial (opcional)"
          hint="A chave fica no servidor. Informe só o nome, com prefixo CONNECTOR_."
        >
          <input
            placeholder="CONNECTOR_CRM_TOKEN"
            value={form.token_env}
            onChange={(e) => setForm({ ...form, token_env: e.target.value })}
          />
        </Field>
        <div className="modal-actions">
          <button className="button" type="button" onClick={onClose}>
            Cancelar
          </button>
          <SaveButton busy={busy}>Cadastrar conexão</SaveButton>
        </div>
      </form>
    </Modal>
  );
}
