import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Moon, Sun, X, ArrowRight, Compass } from "lucide-react";
import { useAuth } from "../lib";
const ThemeContext = createContext({ dark: false, toggle: () => {} });
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("elo-theme");
    return saved
      ? saved === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem("elo-theme", dark ? "dark" : "light");
  }, [dark]);
  return (
    <ThemeContext.Provider value={{ dark, toggle: () => setDark((v) => !v) }}>
      {children}
    </ThemeContext.Provider>
  );
}
export function ThemeToggle() {
  const { dark, toggle } = useContext(ThemeContext);
  return (
    <button
      className="icon-button"
      onClick={toggle}
      aria-label={dark ? "Ativar modo claro" : "Ativar modo escuro"}
      title={dark ? "Modo claro" : "Modo escuro"}
    >
      {dark ? <Sun size={19} /> : <Moon size={19} />}
    </button>
  );
}
const TourContext = createContext({ start: () => {} });
export const useTour = () => useContext(TourContext);
export function TourProvider({ children }: { children: ReactNode }) {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(-1);
  const [welcome, setWelcome] = useState(false);
  const key = `elo-tour-v1:${auth?.user.id}`;
  const steps =
    auth?.user.role === "manager"
      ? [
          [
            "/features",
            "Escolha o que seu agente faz",
            "Ative atendimento, qualificação, agenda, catálogo ou suporte. Seu plano e o contexto necessário acompanham essa escolha.",
          ],
          [
            "/context",
            "Dê contexto para boas respostas",
            "Adicione informações da empresa e critérios de qualificação. Conexões por API podem importar documentos autorizados.",
          ],
          [
            "/catalog",
            "Prepare as operações",
            "Cadastre produtos e serviços. Esses dados permitem registrar pedidos e oferecer horários reais.",
          ],
          [
            "/flow",
            "A intenção vem primeiro",
            "Dúvidas seguem sem cadastro. Apenas agendamento e resolução de problemas pedem identificação.",
          ],
          [
            "/settings",
            "Publique seu canal",
            "Configure seu agente, horários e transferência para humanos. Com o contexto pronto, publique e compartilhe o link.",
          ],
          [
            "/conversations",
            "Trabalhe junto com a IA",
            "Acompanhe a fila, assuma uma conversa ou distribua para a equipe. A IA pausa durante o atendimento humano.",
          ],
          [
            "/account",
            "Este espaço é seu",
            "Atualize seu nome e senha, alterne o tema e reabra este tour quando quiser. Agora é com você!",
          ],
        ]
      : [
          [
            "/conversations",
            "Seu ponto de atendimento",
            "Acompanhe a fila e assuma uma conversa para responder. O agente fica pausado enquanto você atende.",
          ],
          [
            "/appointments",
            "Acompanhe os próximos passos",
            "Consulte os agendamentos da empresa e acompanhe as solicitações ligadas ao atendimento.",
          ],
          [
            "/operations",
            "Dê continuidade às solicitações",
            "Consulte pedidos e chamados. As ações disponíveis respeitam seu perfil e a atribuição do atendimento.",
          ],
          [
            "/account",
            "Sua conta, do seu jeito",
            "Atualize seu nome ou senha, escolha o tema e reabra este tour sempre que precisar.",
          ],
        ];
  useEffect(() => {
    setWelcome(
      !!auth && !auth.tenant.config?.demo && !localStorage.getItem(key),
    );
    setStep(-1);
  }, [auth?.user.id, key]);
  useEffect(() => {
    if (step < 0) return;
    navigate(steps[step][0]);
    const id = window.setTimeout(
      () =>
        document
          .querySelector(".main-content")
          ?.scrollIntoView({ block: "start" }),
      50,
    );
    return () => clearTimeout(id);
  }, [step]);
  function finish() {
    setStep(-1);
    setWelcome(false);
    localStorage.setItem(key, "done");
  }
  function start() {
    setWelcome(false);
    setStep(0);
  }
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
    };
    if (step >= 0) window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [step, key]);
  return (
    <TourContext.Provider value={{ start }}>
      {children}
      {auth && (welcome || step >= 0) && (
        <aside
          className="tour-card"
          role="dialog"
          aria-label="Tour da plataforma"
          aria-live="polite"
        >
          <button
            className="icon-button tour-close"
            aria-label="Fechar tour"
            onClick={finish}
          >
            <X size={18} />
          </button>
          <span className="eyebrow">
            <Compass size={16} />{" "}
            {step < 0
              ? "BEM-VINDO À ELO"
              : `PASSO ${step + 1} DE ${steps.length}`}
          </span>
          <h2>{step < 0 ? "Vamos dar uma volta?" : steps[step][1]}</h2>
          <p>
            {step < 0
              ? "Conheça os espaços da plataforma em um tour rápido. Você pode refazê-lo em Minha conta."
              : steps[step][2]}
          </p>
          <div className="tour-controls">
            <button
              className="button ghost"
              onClick={step > 0 ? () => setStep(step - 1) : finish}
            >
              {step > 0 ? "Voltar" : "Agora não"}
            </button>
            <button
              className="button primary"
              onClick={
                step < 0
                  ? start
                  : step === steps.length - 1
                    ? finish
                    : () => setStep(step + 1)
              }
            >
              {step < 0
                ? "Começar tour"
                : step === steps.length - 1
                  ? "Concluir tour"
                  : "Próximo"}
              <ArrowRight size={16} />
            </button>
          </div>
          {step >= 0 && (
            <div className="tour-progress">
              {steps.map((_, i) => (
                <span key={i} className={i <= step ? "done" : ""} />
              ))}
            </div>
          )}
        </aside>
      )}
    </TourContext.Provider>
  );
}
