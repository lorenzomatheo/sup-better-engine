import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Compass, ShieldCheck } from "lucide-react";
import {
  api,
  send,
  useAuth,
  useToast,
  Field,
  PageTitle,
  Logo,
  labels,
} from "../lib";
import { ThemeToggle, useTour } from "../components/Experience";
export default function Account() {
  const { auth, setAuth } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { start } = useTour();
  const [name, setName] = useState(auth?.user.name || "");
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const result = await api("/auth/profile", send("PATCH", { name }));
      if (auth) setAuth({ ...auth, user: { ...auth.user, name: result.name } });
      toast("Nome atualizado.");
    } catch (e) {
      toast((e as Error).message, true);
    } finally {
      setBusy(false);
    }
  }
  async function change(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api(
        "/auth/change-password",
        send("POST", { current_password: current, password }),
      );
      setAuth(null);
      navigate("/login");
      toast("Senha alterada. Entre novamente com sua nova senha.");
    } catch (e) {
      toast((e as Error).message, true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageTitle
        eyebrow="DO SEU JEITO"
        title="Minha conta"
        description="Cuide do seu acesso e personalize sua experiência."
      />
      <div className="account-grid">
        <section className="account-card">
          <h2>Seu perfil</h2>
          <p>
            {auth?.user.email} · {labels[auth?.user.role || ""]}
          </p>
          <form onSubmit={save}>
            <Field label="Seu nome">
              <input
                required
                minLength={2}
                maxLength={120}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <button className="button primary" disabled={busy}>
              Salvar perfil
            </button>
          </form>
        </section>
        <section className="account-card">
          <h2>Seu espaço</h2>
          <div className="account-option">
            <div>
              <strong>Aparência</strong>
              <p>O tema escolhido fica salvo neste navegador.</p>
            </div>
            <ThemeToggle />
          </div>
          <div className="account-option">
            <div>
              <strong>Conheça a plataforma</strong>
              <p>Refaça o tour guiado a qualquer momento.</p>
            </div>
          </div>
          <button className="button" onClick={start}>
            <Compass size={17} /> Refazer tour
          </button>
        </section>
        <section className="account-card">
          <h2>
            <ShieldCheck size={20} /> Segurança
          </h2>
          <p>
            Ao trocar sua senha, todos os seus acessos atuais são encerrados.
          </p>
          <form onSubmit={change}>
            <Field label="Senha atual">
              <input
                type="password"
                required
                autoComplete="current-password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
              />
            </Field>
            <Field label="Nova senha" hint="Use pelo menos 10 caracteres.">
              <input
                type="password"
                required
                minLength={10}
                maxLength={200}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <button className="button primary" disabled={busy}>
              Alterar senha
            </button>
          </form>
        </section>
      </div>
    </>
  );
}
export function PasswordRecovery() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const toast = useToast();
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api(
        token ? "/auth/reset-password" : "/auth/forgot-password",
        send("POST", token ? { token, password } : { email }),
      );
      setDone(true);
    } catch (e) {
      toast((e as Error).message, true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="recovery-page">
      <div className="account-card">
        <Link to="/">
          <Logo />
        </Link>
        <h1>
          {token
            ? "Uma nova senha. Um novo começo."
            : "Vamos recuperar seu acesso."}
        </h1>
        {done ? (
          <div role="status">
            <p>
              {token
                ? "Sua senha foi redefinida. Entre novamente para continuar."
                : "Se houver uma conta para esse e-mail, você receberá um link de recuperação. Confira também a caixa de spam."}
            </p>
            <Link className="button primary" to="/login">
              Voltar para o login
            </Link>
          </div>
        ) : (
          <form onSubmit={submit}>
            <p>
              {token
                ? "Escolha uma senha de pelo menos 10 caracteres."
                : "Informe o e-mail usado para acessar sua empresa."}
            </p>
            {token ? (
              <Field label="Nova senha">
                <input
                  type="password"
                  minLength={10}
                  maxLength={200}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
            ) : (
              <Field label="E-mail">
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
            )}
            <button className="button primary full" disabled={busy}>
              {busy
                ? "Aguarde…"
                : token
                  ? "Redefinir senha"
                  : "Enviar link de recuperação"}
            </button>
            <Link className="button ghost full" to="/login">
              Voltar para o login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
