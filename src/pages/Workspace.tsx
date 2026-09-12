import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  MessagesSquare,
  Sparkles,
  CalendarDays,
  ShoppingBag,
  LifeBuoy,
  ArrowRight,
  ArrowUpRight,
  Check,
  LockKeyhole,
  BookOpen,
  Users,
  GitBranch,
  Settings2,
  Copy,
  Radio,
  CheckCircle2,
  X,
} from "lucide-react";
import {
  api,
  send,
  useData,
  useToast,
  useAuth,
  Spinner,
  ErrorState,
  PageTitle,
  Field,
  SaveButton,
  Badge,
  featureColors,
} from "../lib";
import type { Item } from "../lib";
const icons: Record<string, typeof MessagesSquare> = {
  atendimento: MessagesSquare,
  qualificacao: Sparkles,
  agendamento: CalendarDays,
  venda: ShoppingBag,
  resolucao_problemas: LifeBuoy,
};
const requirementLabels: Record<string, string> = {
  knowledge: "Documentação e dúvidas frequentes",
  qualification: "Critérios de qualificação",
  services: "Serviços e disponibilidade da agenda",
  products: "Catálogo e preços",
  support: "Procedimentos de resolução",
};
export function Features() {
  const { data, loading, error, refresh } = useData("/workspace");
  const { auth } = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState("");
  async function toggle(id: string) {
    if (!data) return;
    setBusy(id);
    try {
      const config = data.tenant.config;
      const enabled = config.enabled.includes(id)
        ? config.enabled.filter((x: string) => x !== id)
        : [...config.enabled, id];
      await api(
        "/workspace",
        send("PATCH", {
          ...config,
          name: data.tenant.name,
          enabled,
          published: false,
        }),
      );
      await refresh();
      toast(
        "Funcionalidades atualizadas. Revise o contexto e publique seu canal.",
      );
    } catch (e) {
      toast((e as Error).message, true);
    } finally {
      setBusy("");
    }
  }
  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} retry={refresh} />;
  return (
    <>
      <PageTitle
        eyebrow="SEU AGENTE, SUAS ESCOLHAS"
        title="O que vamos fazer juntos?"
        description="Escolha as funcionalidades. A gente organiza o contexto que sua empresa precisa fornecer."
        actions={
          <Link className="button" to="/plans">
            Seu plano: {data.plan}
            <ArrowUpRight size={16} />
          </Link>
        }
      />
      <div className="info-strip">
        <GitBranch size={21} />
        <div>
          <strong>Uma escolha que conecta tudo.</strong>
          <span>
            Funcionalidades → plano recomendado → contexto necessário → agente
            preparado.
          </span>
        </div>
        <Link to="/flow" className="text-link">
          Ver fluxo
          <ArrowRight size={16} />
        </Link>
      </div>
      <div className="feature-grid">
        {data.features.map((f: Item) => {
          const Icon = icons[f.id];
          return (
            <article
              className={`feature-card ${f.enabled ? "enabled" : ""}`}
              key={f.id}
            >
              <div className="feature-card-top">
                <div className={`feature-icon ${featureColors[f.id]}`}>
                  <Icon size={23} />
                </div>
                <button
                  className={`toggle ${f.enabled ? "on" : ""}`}
                  role="switch"
                  aria-checked={f.enabled}
                  aria-label={`Habilitar ${f.name}`}
                  disabled={!!busy || auth?.user.role !== "manager"}
                  onClick={() => toggle(f.id)}
                >
                  <span />
                </button>
              </div>
              <h2>{f.name}</h2>
              <p>{f.description}</p>
              <div className="feature-policy">
                {["agendamento", "resolucao_problemas"].includes(f.id) ? (
                  <>
                    <LockKeyhole size={13} />
                    Identificação quando necessário
                  </>
                ) : (
                  <>
                    <MessagesSquare size={13} />
                    Conversa sem cadastro
                  </>
                )}
              </div>
              <div className="feature-requirements">
                <span>CONTEXTO NECESSÁRIO</span>
                {f.requirements.map((r: string) => (
                  <Link
                    key={r}
                    to={
                      ["services", "products"].includes(r)
                        ? "/catalog"
                        : "/context"
                    }
                  >
                    <span
                      className={`requirement-check ${f.missing.includes(r) ? "" : "done"}`}
                    >
                      {f.missing.includes(r) ? (
                        <BookOpen size={13} />
                      ) : (
                        <Check size={13} />
                      )}
                    </span>
                    {requirementLabels[r]}
                    <ArrowUpRight size={13} />
                  </Link>
                ))}
              </div>
              <footer>
                <span>Plano {f.plan}</span>
                <Badge value={f.ready ? "ready" : "pending"}>
                  {f.ready ? "Contexto pronto" : "Contexto pendente"}
                </Badge>
              </footer>
            </article>
          );
        })}
        <article className="feature-card coming-together">
          <span className="asterisk">✳</span>
          <h2>Conectado à sua empresa.</h2>
          <p>
            CRM, ERP e APIs entram como fontes de contexto para as
            funcionalidades que você escolheu.
          </p>
          <Link to="/context" className="text-link">
            Conectar meu contexto
            <ArrowUpRight size={16} />
          </Link>
        </article>
      </div>
    </>
  );
}
export function Plans() {
  const { data, loading } = useData("/workspace");
  if (loading) return <Spinner />;
  const plans = [
    {
      name: "Essencial",
      tag: "PARA COMEÇAR A CONVERSA",
      desc: "Presença e conhecimento, do primeiro oi em diante.",
      features: [
        "Atendimento com contexto",
        "Qualificação sem cadastro",
        "Documentação e FAQ",
        "Chat público por link",
      ],
    },
    {
      name: "Conexão",
      tag: "PARA DAR O PRÓXIMO PASSO",
      desc: "Uma conversa que se transforma em ação.",
      features: [
        "Tudo do Essencial",
        "Agendamento com calendário",
        "Catálogo e registro de pedidos",
        "Contexto de serviços e produtos",
      ],
    },
    {
      name: "Completo",
      tag: "PARA CUIDAR DE TODA A JORNADA",
      desc: "Do primeiro contato à solução que o cliente precisa.",
      features: [
        "Tudo do Conexão",
        "Resolução e chamados",
        "Procedimentos e fontes conectadas",
        "Identificação e portal do cliente",
      ],
    },
  ];
  return (
    <>
      <PageTitle
        eyebrow="FUNCIONALIDADES QUE DEFINEM O PLANO"
        title="Um plano que acompanha sua operação."
        description="A combinação de funcionalidades indica seu plano e o contexto necessário para começar."
      />
      <div className="plan-note">
        <Sparkles size={20} />
        <p>
          Seu workspace está na configuração <strong>{data?.plan}</strong>.
          Valores e cobrança comercial ainda não estão definidos; nenhum
          pagamento será solicitado nesta versão.
        </p>
      </div>
      <div className="plan-grid">
        {plans.map((p) => (
          <article
            className={`plan-card ${data?.plan === p.name ? "selected" : ""}`}
            key={p.name}
          >
            {data?.plan === p.name && (
              <span className="plan-ribbon">SUA CONFIGURAÇÃO ATUAL</span>
            )}
            <span className="eyebrow">{p.tag}</span>
            <h2>{p.name}</h2>
            <p>{p.desc}</p>
            <div className="plan-price">
              Sob definição<span>comercial</span>
            </div>
            <Link
              to="/features"
              className={`button full ${data?.plan === p.name ? "primary" : ""}`}
            >
              {data?.plan === p.name
                ? "Gerenciar funcionalidades"
                : "Explorar funcionalidades"}
              <ArrowRight size={16} />
            </Link>
            <ul>
              {p.features.map((f) => (
                <li key={f}>
                  <Check size={16} />
                  {f}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <div className="info-strip">
        <BookOpen size={21} />
        <div>
          <strong>Contexto certo. Experiência melhor.</strong>
          <span>
            Ativar uma funcionalidade gera os requisitos de contexto no seu
            workspace.
          </span>
        </div>
        <Link to="/context" className="text-link">
          Preparar contexto
          <ArrowRight size={16} />
        </Link>
      </div>
    </>
  );
}
export function Flow() {
  const { data, loading } = useData("/workspace");
  const [selected, setSelected] = useState("intention");
  if (loading) return <Spinner />;
  const detail: Record<string, { title: string; text: string }> = {
    entry: {
      title: "Entrada anônima",
      text: "O cliente abre o link do seu canal. A conversa começa sem formulário, independente da origem.",
    },
    intention: {
      title: "Nó de identificação da intenção",
      text: "A intenção é reavaliada a cada mensagem. Perguntas gerais continuam sem cadastro. Pedidos concretos de agendamento e resolução seguem para identificação.",
    },
    identity: {
      title: "Identificação condicional",
      text: "Só agendamento e resolução habilitados passam por aqui. Pedimos nome e e-mail com finalidade explícita. Recusar não bloqueia novas dúvidas; mudar de intenção sai do formulário.",
    },
    handoff: {
      title: "Uma pessoa, na hora certa",
      text: "A política da empresa define o transbordo. A fila mantém o contexto, e o agente para de responder quando o operador assume.",
    },
    finish: {
      title: "Próximos passos reais",
      text: "Reserva, pedido ou chamado ficam registrados. Após uma jornada identificada, o cliente recebe um convite de ativação, quando o e-mail estiver configurado.",
    },
  };
  return (
    <>
      <PageTitle
        eyebrow="ARQUITETURA DA CONVERSA"
        title="Cada intenção, um próximo passo."
        description="Este é o grafo que orienta seu agente. Clique nos nós para entender como a conversa flui."
        actions={
          <Link to="/settings" className="button">
            <Settings2 size={16} />
            Configurar agente
          </Link>
        }
      />
      <div className="flow-layout">
        <section className="flow-canvas">
          <div className="flow-toolbar">
            <span>
              <span className="status-dot" />
              Fluxo da empresa
            </span>
            <span>Reavaliado a cada mensagem</span>
          </div>
          <div className="graph">
            <button
              className={`graph-node entry ${selected === "entry" ? "selected" : ""}`}
              onClick={() => setSelected("entry")}
            >
              <MessagesSquare size={20} />
              <div>
                <strong>Uma nova conversa</strong>
                <small>Entrada anônima por link</small>
              </div>
              <span className="node-step">01</span>
            </button>
            <div className="graph-line" />
            <button
              className={`graph-node decision ${selected === "intention" ? "selected" : ""}`}
              onClick={() => setSelected("intention")}
            >
              <GitBranch size={21} />
              <div>
                <strong>Qual é a intenção?</strong>
                <small>Classificador · OpenAI + guarda do servidor</small>
              </div>
              <span className="node-step">02</span>
            </button>
            <div className="graph-split">
              <span>conversa livre</span>
              <span>ação identificada</span>
            </div>
            <div className="graph-branches">
              <div className="graph-lane">
                <div className="lane-label">
                  <MessagesSquare size={13} /> SEM CADASTRO
                </div>
                {data?.features
                  .filter(
                    (f: Item) =>
                      !["agendamento", "resolucao_problemas"].includes(f.id),
                  )
                  .map((f: Item) => {
                    const Icon = icons[f.id];
                    return (
                      <button
                        className={`graph-feature ${!f.enabled ? "disabled" : ""}`}
                        key={f.id}
                        onClick={() => setSelected(f.id)}
                      >
                        <span className={featureColors[f.id]}>
                          <Icon size={17} />
                        </span>
                        <strong>{f.name}</strong>
                        <span
                          className={`node-status ${f.enabled && f.ready ? "on" : ""}`}
                        />
                      </button>
                    );
                  })}
                <small className="lane-note">
                  Dúvidas, descoberta e catálogo fluem sem pedir identificação.
                </small>
              </div>
              <div className="graph-lane">
                <div className="lane-label">
                  <LockKeyhole size={13} /> IDENTIFICAÇÃO NECESSÁRIA
                </div>
                <button
                  className={`graph-node identity ${selected === "identity" ? "selected" : ""}`}
                  onClick={() => setSelected("identity")}
                >
                  <LockKeyhole size={20} />
                  <div>
                    <strong>Identificar o cliente</strong>
                    <small>Nome + e-mail · finalidade explícita</small>
                  </div>
                </button>
                {data?.features
                  .filter((f: Item) =>
                    ["agendamento", "resolucao_problemas"].includes(f.id),
                  )
                  .map((f: Item) => {
                    const Icon = icons[f.id];
                    return (
                      <button
                        className={`graph-feature ${!f.enabled ? "disabled" : ""}`}
                        key={f.id}
                        onClick={() => setSelected(f.id)}
                      >
                        <span className={featureColors[f.id]}>
                          <Icon size={17} />
                        </span>
                        <strong>{f.name}</strong>
                        <span
                          className={`node-status ${f.enabled && f.ready ? "on" : ""}`}
                        />
                      </button>
                    );
                  })}
              </div>
            </div>
            <div className="graph-merge" />
            <div className="graph-bottom">
              <button
                className={`graph-node ${selected === "handoff" ? "selected" : ""}`}
                onClick={() => setSelected("handoff")}
              >
                <Users size={19} />
                <div>
                  <strong>Transbordo configurável</strong>
                  <small>Uma pessoa quando necessário</small>
                </div>
              </button>
              <button
                className={`graph-node ${selected === "finish" ? "selected" : ""}`}
                onClick={() => setSelected("finish")}
              >
                <CheckCircle2 size={19} />
                <div>
                  <strong>Finalizar e acompanhar</strong>
                  <small>Resultado + conta quando identificada</small>
                </div>
              </button>
            </div>
          </div>
          <div className="flow-legend">
            <span>
              <i className="green" />
              Ativo e preparado
            </span>
            <span>
              <i />
              Pendente / desabilitado
            </span>
            <span>Intenção indefinida → esclarecer antes de avançar</span>
          </div>
        </section>
        <aside className="flow-detail">
          <span className="eyebrow">POR DENTRO DO FLUXO</span>
          <div className="feature-icon sage">
            <GitBranch size={23} />
          </div>
          <h2>
            {detail[selected]?.title ||
              data?.features.find((f: Item) => f.id === selected)?.name}
          </h2>
          <p>
            {detail[selected]?.text ||
              data?.features.find((f: Item) => f.id === selected)?.description}
          </p>
          <div className="flow-rule">
            <LockKeyhole size={17} />
            <strong>Uma regra que importa</strong>
            <p>
              A quantidade de mensagens nunca dispara cadastro. Quem decide é a
              intenção atual.
            </p>
          </div>
          <Link to="/features" className="text-link">
            Gerenciar funcionalidades
            <ArrowRight size={15} />
          </Link>
          <div className="flow-example">
            <small>EXEMPLO NA PRÁTICA</small>
            <p>“Qual o horário de vocês?”</p>
            <span>→ Resposta sem cadastro</span>
            <p>“Quero agendar para amanhã”</p>
            <span>→ Identificação → agenda</span>
          </div>
        </aside>
      </div>
    </>
  );
}
export function Settings() {
  const { data, loading, error, refresh } = useData("/workspace");
  const { auth, setAuth } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState<Item | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (data) setForm({ ...data.tenant.config, name: data.tenant.name });
  }, [data]);
  if (loading || !form) return <Spinner />;
  if (error) return <ErrorState message={error} retry={refresh} />;
  function change(key: string, value: any) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const result = await api("/workspace", send("PATCH", form));
      if (auth) setAuth({ ...auth, tenant: result.tenant });
      await refresh();
      toast("Configurações salvas. Seu agente já está atualizado.");
    } catch (e) {
      toast((e as Error).message, true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageTitle
        eyebrow="O JEITO DA SUA EMPRESA"
        title="Dê personalidade à conversa."
        description="Identidade, disponibilidade e regras que deixam seu agente com a sua cara."
      />
      <form className="settings-layout" onSubmit={save}>
        <div>
          <section className="panel form-panel">
            <div className="section-title">
              <div className="feature-icon sage">
                <Sparkles size={20} />
              </div>
              <div>
                <h2>Identidade do agente</h2>
                <p>Como sua empresa aparece para o cliente.</p>
              </div>
            </div>
            <div className="form-grid">
              <Field label="Nome da empresa">
                <input
                  required
                  value={form.name}
                  onChange={(e) => change("name", e.target.value)}
                />
              </Field>
              <Field label="Nome do agente">
                <input
                  required
                  value={form.agent_name}
                  onChange={(e) => change("agent_name", e.target.value)}
                />
              </Field>
            </div>
            <Field label="Descrição do canal">
              <textarea
                rows={3}
                maxLength={500}
                value={form.description}
                onChange={(e) => change("description", e.target.value)}
              />
            </Field>
            <div className="form-grid">
              <Field label="Tom da conversa">
                <select
                  value={form.tone}
                  onChange={(e) => change("tone", e.target.value)}
                >
                  <option value="acolhedor e objetivo">
                    Acolhedor e objetivo
                  </option>
                  <option value="profissional e direto">
                    Profissional e direto
                  </option>
                  <option value="leve e descontraído">
                    Leve e descontraído
                  </option>
                </select>
              </Field>
              <Field label="Cor da marca">
                <div className="color-input">
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => change("color", e.target.value)}
                  />
                  <span>{form.color}</span>
                </div>
              </Field>
            </div>
          </section>
          <section className="panel form-panel">
            <div className="section-title">
              <div className="feature-icon lilac">
                <Users size={20} />
              </div>
              <div>
                <h2>Quando chamar uma pessoa?</h2>
                <p>A empresa decide como o transbordo funciona.</p>
              </div>
            </div>
            <div className="radio-options">
              {[
                {
                  id: "none",
                  name: "Sem transbordo",
                  desc: "Informe o canal alternativo quando necessário.",
                },
                {
                  id: "client",
                  name: "Quando o cliente pedir",
                  desc: "Um pedido explícito envia a conversa para a fila.",
                },
                {
                  id: "agent",
                  name: "Quando o agente precisar",
                  desc: "O agente encaminha quando não encontra uma resposta.",
                },
                {
                  id: "both",
                  name: "Nos dois momentos",
                  desc: "O cliente e o agente podem acionar a equipe.",
                },
              ].map((o) => (
                <label
                  className={`radio-card ${form.handoff === o.id ? "selected" : ""}`}
                  key={o.id}
                >
                  <input
                    type="radio"
                    name="handoff"
                    checked={form.handoff === o.id}
                    onChange={() => change("handoff", o.id)}
                  />
                  <div>
                    <strong>{o.name}</strong>
                    <small>{o.desc}</small>
                  </div>
                </label>
              ))}
            </div>
            <Field label="Contato ou orientação alternativa">
              <input
                value={form.contact}
                onChange={(e) => change("contact", e.target.value)}
                placeholder="E-mail, telefone ou orientação para o cliente"
              />
            </Field>
          </section>
          <section className="panel form-panel">
            <div className="section-title">
              <div className="feature-icon peach">
                <CalendarDays size={20} />
              </div>
              <div>
                <h2>Disponibilidade da agenda</h2>
                <p>
                  Uma agenda compartilhada por empresa, com bloqueio de
                  conflitos.
                </p>
              </div>
            </div>
            <div className="form-grid">
              <Field label="Início do expediente">
                <input
                  type="number"
                  min={0}
                  max={22}
                  value={form.hours_start}
                  onChange={(e) => change("hours_start", +e.target.value)}
                />
              </Field>
              <Field label="Fim do expediente">
                <input
                  type="number"
                  min={1}
                  max={23}
                  value={form.hours_end}
                  onChange={(e) => change("hours_end", +e.target.value)}
                />
              </Field>
            </div>
            <Field label="Fuso horário">
              <select
                value={form.timezone}
                onChange={(e) => change("timezone", e.target.value)}
              >
                <option>America/Sao_Paulo</option>
                <option>America/Manaus</option>
                <option>America/Recife</option>
                <option>Europe/Lisbon</option>
                <option>UTC</option>
              </select>
            </Field>
            <div className="weekday-picker">
              {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d, i) => (
                <button
                  type="button"
                  key={d}
                  className={form.weekdays.includes(i) ? "selected" : ""}
                  onClick={() =>
                    change(
                      "weekdays",
                      form.weekdays.includes(i)
                        ? form.weekdays.filter((x: number) => x !== i)
                        : [...form.weekdays, i],
                    )
                  }
                >
                  {d}
                </button>
              ))}
            </div>
          </section>
        </div>
        <aside className="settings-side">
          <section className="panel form-panel">
            <div className="section-title">
              <Radio size={21} />
              <h2>Seu canal no mundo</h2>
            </div>
            <label className="publish-toggle">
              <div>
                <strong>Canal publicado</strong>
                <small>Disponível pelo link público</small>
              </div>
              <button
                type="button"
                className={`toggle ${form.published ? "on" : ""}`}
                role="switch"
                aria-checked={form.published}
                aria-label="Publicar canal"
                onClick={() => change("published", !form.published)}
              >
                <span />
              </button>
            </label>
            <p className="subtle-text">
              Todas as funcionalidades ativas precisam ter seu contexto
              preparado antes de publicar.
            </p>
            <div className="share-link">
              <span>
                {window.location.host}/c/{data.tenant.slug}
              </span>
              <button
                className="icon-button"
                type="button"
                aria-label="Copiar link"
                onClick={() => {
                  navigator.clipboard
                    .writeText(
                      `${window.location.origin}/c/${data.tenant.slug}`,
                    )
                    .then(() => toast("Link copiado!"))
                    .catch(() => toast("Não foi possível copiar.", true));
                }}
              >
                <Copy size={16} />
              </button>
            </div>
            <SaveButton busy={busy} />
          </section>
          <section className="panel form-panel">
            <h3>Conexões do ambiente</h3>
            <div className="environment-row">
              <span>OpenAI</span>
              <Badge value={data.ai === "openai" ? "connected" : "pending"}>
                {data.ai === "openai" ? "Conectada" : "Sem chave"}
              </Badge>
            </div>
            <div className="environment-row">
              <span>E-mail</span>
              <Badge value={data.email ? "connected" : "pending"}>
                {data.email ? "Configurado" : "Pendente"}
              </Badge>
            </div>
            <p className="subtle-text">
              Credenciais são configuradas no servidor. Elas nunca ficam no
              navegador.
            </p>
          </section>
          <div className="privacy-note">
            <LockKeyhole size={18} />
            <p>
              Identificação apenas para agendamento e resolução. Essa regra faz
              parte do motor e não pode ser desabilitada pelo agente.
            </p>
          </div>
        </aside>
      </form>
    </>
  );
}
export function Team() {
  const { data, loading, error, refresh } = useData<Item[]>("/team");
  const { auth } = useAuth();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "operator",
  });
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/team", send("POST", form));
      setOpen(false);
      setForm({ name: "", email: "", password: "", role: "operator" });
      await refresh();
      toast(
        "Pessoa adicionada à equipe. Compartilhe o acesso por um canal seguro.",
      );
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
        eyebrow="PESSOAS QUE FAZEM ACONTECER"
        title="A boa conversa também é humana."
        description="Operadores, liderança e gestão. Cada pessoa com o acesso certo."
        actions={
          auth?.user.role === "manager" && (
            <button className="button primary" onClick={() => setOpen(!open)}>
              <Users size={17} />
              Adicionar pessoa
            </button>
          )
        }
      />
      {open && (
        <section className="panel form-panel">
          <div className="panel-heading">
            <h2>Novo acesso</h2>
            <button
              className="icon-button"
              onClick={() => setOpen(false)}
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          </div>
          <form onSubmit={submit}>
            <div className="form-grid">
              <Field label="Nome">
                <input
                  required
                  minLength={2}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </Field>
              <Field label="E-mail">
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </Field>
              <Field label="Perfil">
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="operator">Operador</option>
                  <option value="leader">Liderança</option>
                  <option value="manager">Gestão</option>
                </select>
              </Field>
              <Field label="Senha inicial" hint="Mínimo de 10 caracteres.">
                <input
                  type="password"
                  minLength={10}
                  required
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                />
              </Field>
            </div>
            <SaveButton busy={busy}>Criar acesso</SaveButton>
          </form>
        </section>
      )}
      <section className="panel table-panel">
        <table>
          <thead>
            <tr>
              <th>Pessoa</th>
              <th>E-mail</th>
              <th>Acesso</th>
              <th>Desde</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data?.map((u) => (
              <tr key={u.id}>
                <td>
                  <strong>{u.name}</strong>
                  {u.id === auth?.user.id && (
                    <span className="you-label">você</span>
                  )}
                </td>
                <td>{u.email}</td>
                <td>
                  <Badge value={u.role} />
                </td>
                <td>{new Date(u.created_at).toLocaleDateString("pt-BR")}</td>
                <td>
                  {auth?.user.role === "manager" && u.id !== auth?.user.id && (
                    <button
                      className="text-button danger"
                      onClick={async () => {
                        if (!confirm(`Remover o acesso de ${u.name}?`)) return;
                        try {
                          await api(`/team/${u.id}`, send("DELETE"));
                          await refresh();
                          toast("Acesso removido.");
                        } catch (e) {
                          toast((e as Error).message, true);
                        }
                      }}
                    >
                      Remover
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <div className="role-grid">
        {[
          {
            name: "Operador",
            text: "Assume conversas, responde clientes e atualiza solicitações atribuídas.",
          },
          {
            name: "Liderança",
            text: "Acompanha a equipe, distribui atendimentos e gerencia a operação.",
          },
          {
            name: "Gestão",
            text: "Configura empresa, funcionalidades, contexto e acessos da equipe.",
          },
        ].map((r) => (
          <div className="role-card" key={r.name}>
            <Users size={20} />
            <h3>{r.name}</h3>
            <p>{r.text}</p>
          </div>
        ))}
      </div>
    </>
  );
}
