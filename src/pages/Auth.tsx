import { useState } from "react";
import { Navigate, useNavigate, Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Sparkles,
  MessageCircle,
  ShieldCheck,
  Layers3,
} from "lucide-react";
import { Logo, Field, useAuth, useToast, useData, api, send } from "../lib";
export default function AuthPage() {
  const { auth, setAuth } = useAuth();
  const { data: health } = useData<{ demo: boolean }>("/health");
  const navigate = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();
  const [register, setRegister] = useState(params.get("register") === "1");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    password: "",
  });
  if (auth) return <Navigate to={register ? "/features" : "/"} replace />;
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      setAuth(
        await api(
          register ? "/auth/register" : "/auth/login",
          send("POST", form),
        ),
      );
      navigate(register ? "/features" : "/");
    } catch (e) {
      toast((e as Error).message, true);
    } finally {
      setBusy(false);
    }
  }
  async function demo() {
    setBusy(true);
    try {
      setAuth(await api("/auth/demo", send("POST")));
      navigate("/");
    } catch (e) {
      toast((e as Error).message, true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <section className="auth-story">
        <Logo light />
        <div className="story-content">
          <span className="story-eyebrow">
            <span /> CONVERSAS QUE CONECTAM
          </span>
          <h1>
            Mais contexto.
            <br />
            Menos barreiras.
            <br />
            <em>Conexões reais.</em>
          </h1>
          <p>
            O agente que entende sua empresa e transforma cada conversa em um
            próximo passo.
          </p>
          <div className="story-chat">
            <div className="story-bubble user">
              Posso tirar uma dúvida antes de agendar?
            </div>
            <div className="story-bubble">
              <span className="story-agent">
                <Sparkles size={15} />
                Lia · seu agente
              </span>
              Claro! Por aqui, uma boa conversa vem primeiro. Como posso ajudar?{" "}
              <span className="bubble-leaf">✳</span>
            </div>
            <div className="story-status">
              <ShieldCheck size={14} /> Sem cadastro para tirar dúvidas
            </div>
          </div>
          <div className="story-features">
            <span>
              <MessageCircle size={17} />
              Conversas naturais
            </span>
            <span>
              <Layers3 size={17} />
              Seu contexto
            </span>
          </div>
        </div>
        <div className="story-footer">
          Tecnologia que aproxima. Do primeiro oi ao próximo passo.
          <span>✳</span>
        </div>
        <div className="orb orb-one" />
        <div className="orb orb-two" />
      </section>
      <section className="auth-form-side">
        <div className="auth-mobile-logo">
          <Logo />
        </div>
        <div className="auth-form-wrap">
          <div className="auth-kicker">SEU PRÓXIMO CAPÍTULO COMEÇA AQUI</div>
          <h2>
            {register
              ? "Crie espaço para boas conversas."
              : "Que bom ter você por aqui."}
          </h2>
          <p>
            {register
              ? "Configure sua empresa e dê vida ao seu agente."
              : "Entre para acompanhar o que acontece no seu workspace."}
          </p>
          {!register && (
            <Link className="recovery-link" to="/forgot-password">
              Esqueci minha senha
            </Link>
          )}
          <form onSubmit={submit}>
            {register && (
              <>
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
                <Field label="Nome da empresa">
                  <input
                    required
                    minLength={2}
                    value={form.company}
                    onChange={(e) =>
                      setForm({ ...form, company: e.target.value })
                    }
                    placeholder="Sua empresa"
                  />
                </Field>
              </>
            )}
            <Field label="E-mail">
              <input
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="voce@empresa.com.br"
              />
            </Field>
            <Field
              label="Senha"
              hint={register ? "Use pelo menos 10 caracteres." : undefined}
            >
              <input
                type="password"
                required
                minLength={register ? 10 : 1}
                autoComplete={register ? "new-password" : "current-password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Sua senha"
              />
            </Field>
            <button className="button primary full" disabled={busy}>
              {busy
                ? "Só um instante…"
                : register
                  ? "Criar meu workspace"
                  : "Entrar no workspace"}
              <ArrowRight size={18} />
            </button>
          </form>
          <div className="auth-switch">
            {register ? "Já faz parte?" : "Primeira vez por aqui?"}{" "}
            <button onClick={() => setRegister(!register)}>
              {register ? "Entrar na conta" : "Criar uma conta"}
            </button>
          </div>
          {health?.demo && (
            <>
              <div className="or-divider">
                <span />
                ou conheça na prática
                <span />
              </div>
              <button
                className="button demo-button full"
                disabled={busy}
                onClick={demo}
              >
                <Sparkles size={17} />
                Explorar demonstração
                <ArrowUpRightSmall />
              </button>
              <p className="demo-caption">
                <Check size={12} /> Workspace fictício. Nenhum cartão
                necessário.
              </p>
            </>
          )}
        </div>
        <div className="auth-bottom">
          Uma plataforma, infinitas boas conversas.
          <span>© {new Date().getFullYear()} Elo</span>
        </div>
      </section>
    </div>
  );
}
function ArrowUpRightSmall() {
  return <ArrowRight size={16} />;
}
