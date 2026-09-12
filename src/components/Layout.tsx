import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  MessagesSquare,
  Workflow,
  Layers3,
  BookOpen,
  Users,
  CalendarDays,
  ShoppingBag,
  Settings2,
  ArrowUpRight,
  ChevronDown,
  PanelLeftClose,
  LogOut,
  Sparkles,
  LifeBuoy,
  CreditCard,
  Menu,
  CircleHelp,
  Mail,
} from "lucide-react";
import { Logo, useAuth, api, send, initials, useToast, labels } from "../lib";
import { ThemeToggle, useTour } from "./Experience";
const nav = [
  { label: "Visão geral", path: "/", icon: LayoutDashboard },
  { label: "Conversas", path: "/conversations", icon: MessagesSquare },
  { label: "Contatos", path: "/contacts", icon: Users },
  { label: "Agendamentos", path: "/appointments", icon: CalendarDays },
  { label: "Pedidos e chamados", path: "/operations", icon: LifeBuoy },
];
const agentNav = [
  { label: "Fluxo do agente", path: "/flow", icon: Workflow },
  { label: "Funcionalidades", path: "/features", icon: Layers3 },
  { label: "Base de contexto", path: "/context", icon: BookOpen },
  { label: "Catálogo e serviços", path: "/catalog", icon: ShoppingBag },
];
export default function Layout() {
  const { auth, setAuth } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { start } = useTour();
  const [mobile, setMobile] = useState(false);
  const manager = auth?.user.role === "manager";
  async function logout() {
    try {
      await api("/auth/logout", send("POST"));
      setAuth(null);
      navigate("/login");
    } catch (e) {
      toast((e as Error).message, true);
    }
  }
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobile ? "is-open" : ""}`}>
        <div className="sidebar-brand">
          <Logo />
          <button
            className="icon-button muted"
            aria-label="Fechar menu"
            onClick={() => setMobile(false)}
          >
            <PanelLeftClose size={18} />
          </button>
        </div>
        <div className="workspace-chip">
          <div className="workspace-icon">{initials(auth?.tenant.name)}</div>
          <div>
            <strong>{auth?.tenant.name}</strong>
            <span>Workspace da empresa</span>
          </div>
          <ChevronDown size={15} />
        </div>
        <div className="nav-caption">WORKSPACE</div>
        <nav>
          {nav.map((n) => (
            <NavLink
              key={n.path}
              to={n.path}
              end={n.path === "/"}
              onClick={() => setMobile(false)}
            >
              <n.icon size={18} />
              <span>{n.label}</span>
              {n.path === "/conversations" && <span className="nav-pulse" />}
            </NavLink>
          ))}
        </nav>
        <div className="nav-caption">SEU AGENTE</div>
        <nav>
          {agentNav.map((n) => (
            <NavLink key={n.path} to={n.path} onClick={() => setMobile(false)}>
              <n.icon size={18} />
              <span>{n.label}</span>
              {n.path === "/flow" && <span className="nav-new">novo</span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <Sparkles size={19} />
            <strong>
              Boas conversas começam
              <br />
              com um bom contexto.
            </strong>
            <NavLink to="/context">
              Prepare seu agente <ArrowUpRight size={14} />
            </NavLink>
          </div>
          <nav>
            <NavLink to="/account">
              <Users size={18} />
              Minha conta
            </NavLink>
            {auth?.user.role !== "operator" && (
              <NavLink to="/team">
                <Users size={18} />
                Equipe e acessos
              </NavLink>
            )}
            {manager && (
              <>
                <NavLink to="/plans">
                  <CreditCard size={18} />
                  Plano e funcionalidades
                </NavLink>
                <NavLink to="/outbox">
                  <Mail size={18} />
                  Central de envios
                </NavLink>
                <NavLink to="/settings">
                  <Settings2 size={18} />
                  Configurações
                </NavLink>
              </>
            )}
          </nav>
          <div className="profile">
            <div className="avatar">{initials(auth?.user.name)}</div>
            <div>
              <strong>{auth?.user.name}</strong>
              <span>{labels[auth?.user.role || ""]}</span>
            </div>
            <button
              className="icon-button"
              title="Sair"
              aria-label="Sair"
              onClick={logout}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      {mobile && (
        <div className="sidebar-overlay" onClick={() => setMobile(false)} />
      )}
      <div className="main-shell">
        <div className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-toggle"
              aria-label="Abrir menu"
              onClick={() => setMobile(true)}
            >
              <Menu />
            </button>
            <span>Workspace</span>
            <span className="slash">/</span>
            <strong>{auth?.tenant.name}</strong>
            <span className="tiny-label">
              {auth?.tenant.config?.demo ? "DEMO" : "EMPRESA"}
            </span>
          </div>
          <div className="topbar-actions">
            <ThemeToggle />
            <button
              className="icon-button"
              onClick={start}
              aria-label="Abrir tour"
              title="Conhecer a plataforma"
            >
              <CircleHelp size={19} />
            </button>
            <span className="topbar-divider" />
            <a
              className="public-link"
              href={`/c/${auth?.tenant.slug}`}
              target="_blank"
              rel="noreferrer"
            >
              Abrir meu canal <ArrowUpRight size={16} />
            </a>
          </div>
        </div>
        <main className="main-content">
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>Feito para conectar pessoas.</span>
          <span>
            elo platform <span className="footer-dot">●</span> v1.0
          </span>
        </footer>
      </div>
    </div>
  );
}
