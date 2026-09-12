import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  Sparkles,
  MessagesSquare,
  CalendarDays,
  BookOpen,
  Workflow,
  ShieldCheck,
  Users,
  Check,
} from "lucide-react";
import { Logo } from "../lib";
import { ThemeToggle } from "../components/Experience";
export default function Landing() {
  return (
    <div className="landing">
      <header className="landing-nav">
        <Link to="/" aria-label="Elo início">
          <Logo />
        </Link>
        <nav>
          <a href="#como-funciona">Como funciona</a>
          <a href="#funcionalidades">Funcionalidades</a>
        </nav>
        <div>
          <ThemeToggle />
          <Link to="/login" className="button ghost">
            Entrar
          </Link>
          <Link to="/login?register=1" className="button primary">
            Criar minha conta <ArrowUpRight size={16} />
          </Link>
        </div>
      </header>
      <main>
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <span className="landing-kicker">
              <span /> CONTEXTO QUE CONECTA
            </span>
            <h1>
              Um bom atendimento começa com um <em>bom encontro.</em>
            </h1>
            <p>
              Conecte o conhecimento da sua empresa a uma IA que entende cada
              intenção. Da primeira dúvida ao agendamento, com sua equipe por
              perto.
            </p>
            <div className="landing-cta">
              <Link to="/login?register=1" className="button primary">
                Dê vida ao seu agente <ArrowRight size={18} />
              </Link>
              <a href="#como-funciona" className="button ghost">
                Conheça a Elo ↓
              </a>
            </div>
            <div className="landing-assurance">
              <span>
                <Check size={15} /> Seu contexto
              </span>
              <span>
                <Check size={15} /> Seu jeito de atender
              </span>
              <span>
                <Check size={15} /> Sua equipe no controle
              </span>
            </div>
          </div>
          <div className="landing-art">
            <div className="landing-orbit" />
            <span className="floating-label">
              <BookOpen size={17} /> Conhecimento da empresa
            </span>
            <div className="landing-chat">
              <div className="landing-chat-head">
                <div className="avatar sage">
                  <Sparkles size={21} />
                </div>
                <div>
                  <strong>Lia · seu agente</strong>
                  <small>Uma conversa, muitas possibilidades</small>
                </div>
                <span className="online-dot" />
              </div>
              <div className="landing-bubble guest">
                Oi! Como funciona o atendimento?
              </div>
              <div className="landing-bubble agent">
                Olá! Posso tirar suas dúvidas e ajudar a encontrar o próximo
                passo. O que você precisa?
              </div>
              <div className="landing-intent">
                <Workflow size={15} /> Intenção: tirar uma dúvida{" "}
                <span>Sem cadastro</span>
              </div>
              <div className="landing-bubble guest">
                Quero agendar uma conversa ✨
              </div>
              <div className="landing-bubble agent">
                Vamos lá! Para fazer a reserva, preciso identificar você.
              </div>
              <div className="landing-chat-footer">
                <CalendarDays size={17} /> Da conversa ao próximo passo{" "}
                <ArrowUpRight size={17} />
              </div>
            </div>
            <span className="floating-label bottom">
              <ShieldCheck size={17} /> Identificação só quando precisa
            </span>
            <span className="landing-spark">✳</span>
            <small className="illustrative">Conversa ilustrativa</small>
          </div>
        </section>
        <section className="landing-strip">
          <span>Menos barreiras na conversa.</span>
          <strong>Mais contexto em cada decisão.</strong>
          <Sparkles size={27} />
        </section>
        <section id="como-funciona" className="landing-section">
          <span className="landing-kicker">
            SIMPLES PARA COMEÇAR. SEU PARA EVOLUIR.
          </span>
          <h2>
            Você conhece seu negócio.
            <br />
            Seu agente também pode conhecer.
          </h2>
          <div className="landing-steps">
            {[
              [
                "01",
                "Escolha as funcionalidades",
                "Atendimento, qualificação, catálogo, agenda ou suporte. Ative o que faz sentido para sua empresa.",
              ],
              [
                "02",
                "Adicione seu contexto",
                "Documentos, produtos, serviços e informações autorizadas. A Elo mostra o que falta preparar.",
              ],
              [
                "03",
                "Abra a conversa",
                "Publique seu canal e compartilhe o link. Acompanhe a operação e entre quando o atendimento pedir uma pessoa.",
              ],
            ].map(([n, title, text]) => (
              <article key={n}>
                <span>{n}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
        <section
          id="funcionalidades"
          className="landing-section landing-features"
        >
          <div>
            <span className="landing-kicker">
              DO PRIMEIRO OI AO PRÓXIMO PASSO
            </span>
            <h2>
              Uma plataforma.
              <br />
              Muitas boas conexões.
            </h2>
            <p>
              Uma experiência para quem conversa.
              <br />
              Um espaço organizado para quem atende.
            </p>
            <Link to="/login?register=1" className="button primary">
              Preparar meu workspace <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="landing-feature-grid">
            {[
              [
                MessagesSquare,
                "Conversas com contexto",
                "Respostas com as informações da sua empresa, sem cadastro obrigatório para tirar dúvidas.",
              ],
              [
                CalendarDays,
                "Agenda e solicitações",
                "Reservas, pedidos e chamados registrados para dar continuidade ao atendimento.",
              ],
              [
                Users,
                "Pessoas no controle",
                "Transfira para sua equipe conforme a política da empresa, mantendo o contexto da conversa.",
              ],
              [
                Workflow,
                "Intenção antes de ação",
                "O caminho muda com a necessidade do cliente. Identificação para agendamento e resolução.",
              ],
            ].map(([Icon, title, text]: any) => (
              <article key={title}>
                <Icon size={24} />
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="landing-final">
          <span>SEU PRÓXIMO CAPÍTULO COMEÇA AQUI</span>
          <h2>
            Abra espaço para
            <br />
            boas conversas.
          </h2>
          <Link to="/login?register=1" className="button primary">
            Começar com a Elo <ArrowUpRight size={18} />
          </Link>
          <p>Crie sua empresa e prepare seu primeiro canal.</p>
        </section>
      </main>
      <footer className="landing-footer">
        <Logo />
        <span>Feito para conectar pessoas.</span>
        <Link to="/login">
          Acessar minha conta <ArrowUpRight size={14} />
        </Link>
      </footer>
    </div>
  );
}
