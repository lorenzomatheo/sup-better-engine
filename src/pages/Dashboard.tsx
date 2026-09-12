import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  MessagesSquare,
  Users,
  CalendarDays,
  Clock3,
  Sparkles,
  Check,
  Circle,
  Workflow,
  BookOpen,
  Plus,
  Radio,
  Leaf,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  useAuth,
  useData,
  Spinner,
  ErrorState,
  PageTitle,
  Badge,
  initials,
  dateTime,
} from "../lib";
export default function Dashboard() {
  const { auth } = useAuth();
  const { data, error, loading, refresh } = useData("/dashboard", 15000);
  const workspace = useData("/workspace");
  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} retry={refresh} />;
  const features = workspace.data?.features || [];
  const ready = features.filter((f: any) => f.enabled && f.ready).length;
  const enabled = features.filter((f: any) => f.enabled).length;
  const cards = [
    {
      label: "Conversas",
      value: data.total,
      icon: MessagesSquare,
      sub: "Conversas nas últimas 24h",
      color: "sage",
    },
    {
      label: "Clientes identificados",
      value: data.identified,
      icon: Users,
      sub: "Só quando a intenção pede",
      color: "peach",
    },
    {
      label: "Agendamentos",
      value: data.appointments,
      icon: CalendarDays,
      sub: "Reservas registradas",
      color: "lilac",
    },
    {
      label: "Aguardando a equipe",
      value: data.waiting,
      icon: Clock3,
      sub: "Conversas na fila humana",
      color: "yellow",
    },
  ];
  return (
    <>
      <PageTitle
        eyebrow="SEU PONTO DE ENCONTRO"
        title={`Olá, ${auth?.user.name.split(" ")[0]}. Tudo conectado?`}
        description="Um olhar para suas conversas e para as oportunidades que elas criam."
        actions={
          <a
            className="button primary"
            href={`/c/${auth?.tenant.slug}`}
            target="_blank"
            rel="noreferrer"
          >
            <MessagesSquare size={17} />
            Testar meu agente
            <ArrowUpRight size={16} />
          </a>
        }
      />
      <section className="welcome-banner">
        <div>
          <span className="banner-tag">
            <span /> SEU AGENTE, DO SEU JEITO
          </span>
          <h2>
            Boas conversas.
            <br />
            Próximos passos melhores.
          </h2>
          <p>
            Seu contexto encontra a intenção de cada cliente.
            <br />O resto flui naturalmente.
          </p>
          <Link to="/flow">
            Conhecer o fluxo <ArrowRight size={16} />
          </Link>
        </div>
        <div className="banner-art" aria-hidden="true">
          <div className="orbit orbit-1" />
          <div className="orbit orbit-2" />
          <div className="art-tile tile-message">
            <MessagesSquare size={30} />
            <span>intenção</span>
          </div>
          <div className="art-tile tile-center">
            <span className="asterisk">✳</span>
            <strong>uma boa conversa</strong>
          </div>
          <div className="art-tile tile-leaf">
            <Leaf size={28} />
            <span>conexão</span>
          </div>
          <div className="floating-dot dot-1" />
          <div className="floating-dot dot-2" />
          <div className="floating-spark">✧</div>
        </div>
      </section>
      <section className="stat-grid">
        {cards.map((c) => (
          <article className="stat-card" key={c.label}>
            <div className="stat-top">
              <span>{c.label}</span>
              <div className={`stat-icon ${c.color}`}>
                <c.icon size={18} />
              </div>
            </div>
            <strong>{c.value}</strong>
            <div className="stat-caption">{c.sub}</div>
          </article>
        ))}
      </section>
      <div className="dashboard-columns">
        <section className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <h2>O ritmo das conversas</h2>
              <p>Cada novo oi é uma oportunidade.</p>
            </div>
            <span className="select-pill">Últimos 7 dias</span>
          </div>
          <div className="chart-legend">
            <i />
            Conversas iniciadas
          </div>
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data.timeline}
                margin={{ left: -25, right: 8, top: 10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3d8060" stopOpacity={0.22} />
                    <stop
                      offset="100%"
                      stopColor="#3d8060"
                      stopOpacity={0.01}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 5"
                  vertical={false}
                  stroke="#e9ece7"
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) =>
                    new Date(d + "T12:00:00")
                      .toLocaleDateString("pt-BR", { weekday: "short" })
                      .replace(".", "")
                  }
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#879087" }}
                  dy={10}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#879087" }}
                />
                <Tooltip
                  labelFormatter={(d) => String(d)}
                  formatter={(v) => [v, "Conversas"]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e7ebe5",
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="conversations"
                  stroke="#418363"
                  strokeWidth={2.5}
                  fill="url(#chartFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-note">
            <span className="tiny-dot" /> Histórico de conversas sujeito à
            retenção de 24h.
          </div>
        </section>
        <section className="panel agent-health">
          <div className="panel-heading">
            <div>
              <h2>Seu agente está crescendo</h2>
              <p>Um passo de cada vez.</p>
            </div>
            <Sparkles size={19} />
          </div>
          <div className="health-progress">
            <div>
              <strong>
                {ready}
                <span>/{enabled || 1}</span>
              </strong>
              <span>funcionalidades preparadas</span>
            </div>
            <div className="progress-track">
              <div
                style={{ width: `${enabled ? (ready / enabled) * 100 : 0}%` }}
              />
            </div>
          </div>
          <div className="checklist">
            <Link to="/features">
              <span className={`check-circle ${enabled ? "done" : ""}`}>
                {enabled ? <Check size={13} /> : <Circle size={13} />}
              </span>
              <div>
                <strong>Escolha as funcionalidades</strong>
                <small>O que seu agente vai fazer</small>
              </div>
              <ArrowUpRight size={16} />
            </Link>
            <Link to="/context">
              <span
                className={`check-circle ${ready === enabled && ready ? "done" : ""}`}
              >
                <BookOpen size={13} />
              </span>
              <div>
                <strong>Adicione o contexto</strong>
                <small>O conhecimento da sua empresa</small>
              </div>
              <ArrowUpRight size={16} />
            </Link>
            <Link to="/settings">
              <span
                className={`check-circle ${workspace.data?.tenant.config.published ? "done" : ""}`}
              >
                <Radio size={13} />
              </span>
              <div>
                <strong>Coloque seu canal no ar</strong>
                <small>Compartilhe seu link com o mundo</small>
              </div>
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="health-bottom">
            <span
              className={`status-dot ${workspace.data?.ai === "openai" ? "" : "amber"}`}
            />
            {workspace.data?.ai === "openai"
              ? "OpenAI conectada"
              : "Modo local · configure a OpenAI"}
          </div>
        </section>
      </div>
      <div className="dashboard-columns lower">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>As conversas mais recentes</h2>
              <p>Veja o que está acontecendo por aqui.</p>
            </div>
            <Link className="text-link" to="/conversations">
              Ver todas <ArrowRight size={15} />
            </Link>
          </div>
          {data.recent.length ? (
            <div className="conversation-table">
              {data.recent.map((c: any) => (
                <Link
                  to={`/conversations?selected=${c.id}`}
                  className="conversation-row"
                  key={c.id}
                >
                  <div
                    className={`avatar ${c.identified ? "sage" : "neutral"}`}
                  >
                    {c.name ? initials(c.name) : <Users size={17} />}
                  </div>
                  <div className="conversation-person">
                    <strong>{c.name || "Visitante anônimo"}</strong>
                    <span>
                      {c.messages?.at(-1)?.content.slice(0, 62) ||
                        "Nova conversa"}
                    </span>
                  </div>
                  <Badge value={c.intent} />
                  <span className="row-time">{dateTime(c.created_at)}</span>
                  <ArrowUpRight size={15} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty">
              <div className="empty-art">
                <MessagesSquare size={25} />
              </div>
              <strong>A primeira conversa começa com um oi.</strong>
              <p>
                Abra seu canal e teste o atendimento. Ela vai aparecer aqui.
              </p>
              <a
                href={`/c/${auth?.tenant.slug}`}
                target="_blank"
                rel="noreferrer"
                className="text-link"
              >
                Iniciar uma conversa <ArrowUpRight size={15} />
              </a>
            </div>
          )}
        </section>
        <section className="intent-card">
          <span className="eyebrow">INTENÇÃO ANTES DE IDENTIFICAÇÃO</span>
          <Workflow size={29} />
          <h2>
            Cada conversa
            <br />
            tem seu caminho.
          </h2>
          <p>
            Dúvidas fluem sem cadastro. Agendamentos e resolução de problemas
            pedem identificação na hora certa.
          </p>
          <Link to="/flow" className="button">
            Explorar meu fluxo
            <ArrowUpRight size={16} />
          </Link>
          <span className="intent-decoration" aria-hidden="true">
            ✳
          </span>
        </section>
      </div>
      <div className="dashboard-bottom">
        <span>
          <Sparkles size={14} /> Uma plataforma que respeita o momento de cada
          cliente.
        </span>
        <Link to="/context">
          <Plus size={14} />
          Enriquecer contexto
        </Link>
      </div>
    </>
  );
}
