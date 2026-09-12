"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import styles from "./page.module.css";

/* ─────────────────────────────────────────────────────────
 *  Bilingual Copy (PT-BR / EN) matching Terra Design System
 * ───────────────────────────────────────────────────────── */
const copy = {
  pt: {
    nav: {
      brand: "TERRA · GEMINI 38",
      impact: "O impacto",
      calculator: "Simulador",
      howItWorks: "Como funciona",
      hackathon: "Hackathon FIAP",
      comparison: "Comparativo",
      demo: "Ver a demo",
    },
    hero: {
      badge: "Agents, Everywhere — AI Tinkerers × OpenAI @ FIAP, São Paulo",
      title: "Quando conversar custa mais, cada conversa precisa valer mais.",
      subtitle:
        "Terra é a experiência do Sup Better para transformar o clique do lead em uma conversa própria, qualificada por IA e mensurável — sem fazer da sua empresa refém das novas tarifas por mensagem do WhatsApp em outubro de 2026.",
      ctaPrimary: "Experimentar o agente",
      ctaSecondary: "Entender a mudança",
      disclaimer: "Uma proposta para validar a migração de canal com dados reais — não com achismo.",
      leadStatus: "lead em conversa",
      assistantName: "Sup Better",
      assistantRole: "Assistente de qualificação",
      statusOnline: "online",
      agentVerified: "intenção identificada · conversa atribuída · zero tarifa Meta",
      inputPlaceholder: "Escolha um cenário ou escreva uma mensagem…",
      nextStepBadge: "Próximo passo",
      nextStepTitle: "Lead qualificado",
      nextStepSub: "com contexto, LGPD e sem duplicidade",
    },
    presets: [
      {
        label: "Reduzir custos WhatsApp",
        userMsg: "Quero reduzir os custos do meu atendimento no WhatsApp.",
        botMsg: "Perfeito! A partir de outubro de 2026, cada mensagem de serviço no WhatsApp será tarifada. No canal próprio do Sup Better, suas conversas têm custo fixo de infraestrutura e inteligência OpenAI. Hoje seu maior volume é vendas, suporte ou agendamento?",
        intent: "qualificação comercial",
      },
      {
        label: "Agendar demonstração",
        userMsg: "Gostaria de agendar uma demonstração técnica da plataforma.",
        botMsg: "Excelente! Para reservarmos seu horário com nosso time de engenharia e enviar o convite, por favor informe seu melhor e-mail corporativo.",
        intent: "agendamento",
      },
      {
        label: "Preços e ROI",
        userMsg: "Qual a economia real frente à Meta para 30 mil conversas?",
        botMsg: "Para 30 mil conversas com média de 8 mensagens, a Meta cobraria mais de R$ 8.000/mês. Com o Sup Better + OpenAI, seu custo fica abaixo de R$ 650/mês — mais de 90% de margem preservada.",
        intent: "orçamento & ROI",
      },
    ],
    impact: {
      tag: "A virada de preço da Meta",
      title: "A janela de 24 horas continua. A gratuidade, não.",
      leadText:
        "A partir de 1º de outubro de 2026, mensagens de serviço enviadas pela WhatsApp Business Platform/API passam a ser cobradas individualmente. A conversa iniciada pelo cliente ainda abre a janela de atendimento; o que mudou é que responder dentro dela agora tem preço por mensagem.",
      cards: [
        {
          tag: "Nova referência Brasil",
          value: "R$ 0,035",
          desc: "por mensagem de serviço entregue, na tarifa de lista da Meta (podendo chegar a R$ 0,35 com taxas e intermediários).",
        },
        {
          tag: "Franquia preservada",
          value: "1.000",
          desc: "mensagens de serviço gratuitas por número comercial, a cada mês.",
          highlight: true,
        },
        {
          tag: "O dreno dos bots",
          title: "Chatbots longos pagam a conta",
          desc: "Um bot de qualificação troca de 6 a 10 mensagens por conversa. Sem canal próprio, você paga por cada confirmação e pergunta enviada a curiosos.",
          dark: true,
        },
      ],
      scenariosTitle: "Escala muda a conversa",
      scenariosHeading: "Não é uma taxa pequena quando se repete milhares de vezes.",
      scenariosDesc: "Simulação com tarifa Meta de R$ 0,035 e a franquia mensal de 1.000 mensagens. Não inclui custos de BSP/CRM ou custos ocultos.",
      scenarios: [
        { volume: "1.000", label: "mensagens de serviço / mês", cost: "R$ 0", note: "franquia mensal da Meta" },
        { volume: "120 mil", label: "mensagens de serviço / mês", cost: "R$ 4.165", note: "custo Meta estimado / mês", active: true },
        { volume: "1 milhão", label: "mensagens de serviço / mês", cost: "R$ 34.965", note: "custo Meta estimado / mês" },
      ],
    },
    countdown: {
      alertBadge: "Prazo final de migração",
      heading: "Contagem regressiva para a cobrança da Meta (01/10/2026)",
      days: "dias",
      hours: "horas",
      mins: "min",
      secs: "seg",
    },
    calculator: {
      tag: "Simulador transparente",
      title: "Coloque o volume da sua operação na conta.",
      desc: "A calculadora separa o custo Meta do custo operacional do canal próprio. Ajuste as variáveis para transformar uma hipótese de migração em uma conversa de negócio concreta.",
      cardTitle: "Premissas da operação",
      cardSub: "Valores editáveis com franquia de 1.000 mensagens inclusa no cálculo.",
      badgeMonthly: "mensal",
      lblConversations: "Conversas por mês",
      lblMessages: "Mensagens da empresa por conversa",
      lblMessagesSub: "1 · resposta rápida | 8 · qualificação | 20 · suporte",
      lblRate: "Tarifa Meta por mensagem de serviço",
      lblOwnedCost: "Custo próprio estimado: infra + IA OpenAI",
      lblQualificationRate: "Taxa estimada de leads qualificados",
      metaPressureTag: "Pressão de mensageria",
      metaPressureTitle: "Custo direto da Meta",
      metaPressureBadge: "após 1.000 grátis",
      billableMsgsLabel: "Mensagens faturáveis",
      billableMsgsSub: "franquia mensal descontada",
      metaCostLabel: "Custo mensal estimado",
      metaCostSub: "somente tarifa Meta",
      savingsTag: "Potencial de economia",
      savingsTitleActive: "O canal próprio abre margem.",
      savingsTitleInactive: "O volume ainda não cobre o custo próprio.",
      diffMonthlyLabel: "Diferença mensal",
      diffMonthlySub: "Meta vs. seu custo operacional estimado",
      diffAnnualLabel: "Impacto anual",
      diffAnnualSub: "projeção simples de 12 meses",
      costPerLeadTag: "Custo por lead qualificado",
      costPerLeadSub: "leads qualificados projetados por mês:",
      lblMetaShort: "Meta",
      lblOwnedShort: "Canal próprio",
      methodology: "Metodologia: conversas × mensagens da empresa − 1.000 gratuitas, multiplicado pela tarifa. O canal próprio é configurável com base em infraestrutura e IA.",
      metaLink: "Ver fonte Meta",
    },
    howItWorks: {
      tag: "Uma escolha de arquitetura e experiência",
      title: "O WhatsApp pode abrir a porta. A relação acontece no seu terreno.",
      desc: "O Sup Better não exige que o cliente mude de hábito de uma vez. O link de campanha vem do WhatsApp, do seu anúncio ou da bio. A partir do clique, você controla a experiência, os dados e a inteligência de qualificação.",
      journey: [
        {
          step: "01",
          title: "O lead chega",
          text: "Link de campanha com tag ?origem=, QR code ou bio. A origem já vem identificada e atribuída atomicamente.",
        },
        {
          step: "02",
          title: "A conversa acontece",
          text: "Agente autônomo com OpenAI acolhe, entende intenções (venda, suporte, agendamento) e conduz sem formulários chatos na porta.",
        },
        {
          step: "03",
          title: "O time recebe contexto",
          text: "E-mail com consentimento LGPD, intenção e fit comercial estruturado prontos no backoffice para fechamento.",
        },
      ],
      proofPoints: [
        { title: "Canal próprio", text: "A conversa vive na sua experiência — sem risco de banimento de número." },
        { title: "Identidade unificada", text: "Mesmo e-mail normalizado → mesmo lead. Sem duplicidade na base." },
        { title: "Decisões com evidência", text: "Atribuição precisa por campanha e backoffice em 3 níveis (Operador, Liderança, Gestão)." },
      ],
    },
    hackathon: {
      dateBadge: "AI Tinkerers × OpenAI Hackathon · FIAP São Paulo",
      title: "Um agente no lugar onde a atenção já acontece.",
      desc: "Nossa resposta para 'Agents, Everywhere': em vez de prender o agente em uma interface isolada, o Sup Better o injeta exatamente no ponto de conversão comercial da empresa, gerando valor real de negócio e independência de plataformas.",
      boxTag: "O que estamos demonstrando na FIAP",
      bullets: [
        "Uma alternativa de canal soberano que respeita a experiência do lead e a LGPD.",
        "Classificação em tempo real de 5 intenções com modelos OpenAI em FastAPI assíncrono.",
        "Modelo econômico transparente que salva até 98% dos custos de mensageria da Meta a partir de outubro de 2026.",
      ],
      liveLink: "Abrir o protótipo ao vivo",
    },
    comparison: {
      tag: "Diferencial de Modelo",
      title: "Por que canal próprio supera WhatsApp e formulários?",
      desc: "Uma análise objetiva das três abordagens de captura de leads no mercado.",
      headers: ["Critério", "WhatsApp Business API", "Formulário Estático", "Sup Better Engine"],
      rows: [
        {
          item: "Custo com mensagens",
          wa: "Tarifado por resposta (Out/2026)",
          form: "Fixo, mas com 80% de abandono",
          sb: "Fixo de infraestrutura + frações de centavo IA",
        },
        {
          item: "Atrito na entrada",
          wa: "Exige expor número pessoal logo no início",
          form: "Formulário estático com muitos campos",
          sb: "Conversa anônima instantânea sem login",
        },
        {
          item: "Inteligência conversacional",
          wa: "Árvores rígidas ou bots caros",
          form: "Nenhuma (passivo)",
          sb: "Agente OpenAI com roteamento por intenção",
        },
        {
          item: "Risco de indisponibilidade",
          wa: "Alto: bloqueios e políticas da Meta",
          form: "Nenhum",
          sb: "Zero: seu domínio, seus servidores",
        },
      ],
    },
    cta: {
      tag: "Mais conversa, menos dependência",
      title: "A próxima mensagem pode custar. A próxima relação pode ser sua.",
      desc: "Conheça o agente e veja uma conversa de ponta a ponta: clique, intenção, contexto e lead qualificado.",
      btn: "Ver Sup Better em ação",
    },
    footer: {
      rights: "TERRA / GEMINI 38 · Uma experiência Sup Better Engine para AI Tinkerers × OpenAI @ FIAP.",
      sourceNote: "Fonte de preços: tabela da WhatsApp Business Platform vigente em 01/10/2026. Tarifas oficiais da Meta.",
    },
  },
  en: {
    nav: {
      brand: "TERRA · GEMINI 38",
      impact: "The Impact",
      calculator: "Simulator",
      howItWorks: "How it works",
      hackathon: "FIAP Hackathon",
      comparison: "Comparison",
      demo: "Live Demo",
    },
    hero: {
      badge: "Agents, Everywhere — AI Tinkerers × OpenAI @ FIAP, São Paulo",
      title: "When conversations cost more, every conversation must create more value.",
      subtitle:
        "Terra is Sup Better's solution to turn lead clicks into an owned, AI-qualified, measurable conversation — without holding your business hostage to Meta's upcoming October 2026 WhatsApp message fees.",
      ctaPrimary: "Try the agent",
      ctaSecondary: "Understand the shift",
      disclaimer: "A practical proposal to validate channel migration with real data — not guesswork.",
      leadStatus: "lead in conversation",
      assistantName: "Sup Better",
      assistantRole: "Qualification Assistant",
      statusOnline: "online",
      agentVerified: "intent detected · session attributed · zero Meta toll",
      inputPlaceholder: "Pick a test scenario or type a message…",
      nextStepBadge: "Next step",
      nextStepTitle: "Qualified lead",
      nextStepSub: "with context, LGPD/GDPR consent & no duplicate data",
    },
    presets: [
      {
        label: "Reduce WhatsApp costs",
        userMsg: "I want to cut down my customer messaging costs on WhatsApp.",
        botMsg: "Starting October 2026, every WhatsApp service reply will be billed. On Sup Better's owned channel, conversations enjoy fixed infrastructure costs and OpenAI intelligence. Is your primary volume sales, support, or scheduling?",
        intent: "commercial qualification",
      },
      {
        label: "Book a demo",
        userMsg: "I would like to schedule a technical platform walkthrough.",
        botMsg: "Great! To reserve a slot with our engineering team and dispatch the calendar invitation, please share your best business email.",
        intent: "scheduling",
      },
      {
        label: "Pricing & ROI",
        userMsg: "What is the real savings compared to Meta for 30,000 monthly chats?",
        botMsg: "For 30k chats averaging 8 messages, Meta would bill over R$ 8,000/month. With Sup Better + OpenAI, your total cost stays below R$ 650/month — preserving over 90% of your operational margin.",
        intent: "pricing & ROI",
      },
    ],
    impact: {
      tag: "Meta's Pricing Pivot",
      title: "The 24-hour window remains. The free ride does not.",
      leadText:
        "Starting October 1st, 2026, service messages sent via the WhatsApp Business Platform/API will be billed per message. Inbound customer chats still initiate the service window, but replying inside it now carries a unit cost.",
      cards: [
        {
          tag: "Brazil Benchmark",
          value: "R$ 0,035",
          desc: "per delivered service message on Meta's base list rate (reaching up to R$ 0.35 with carrier and BSP overhead).",
        },
        {
          tag: "Preserved Tier",
          value: "1,000",
          desc: "free service messages per registered business phone number each month.",
          highlight: true,
        },
        {
          tag: "Chatbot Penalty",
          title: "Multi-turn bots pay the price",
          desc: "A qualification bot exchanges 6 to 10 messages per user. Without an owned channel, you pay Meta for every automated reply sent to tire-kickers.",
          dark: true,
        },
      ],
      scenariosTitle: "Scale alters the conversation",
      scenariosHeading: "It is not a small fee when repeated thousands of times.",
      scenariosDesc: "Simulation based on Meta's R$ 0.035 rate and 1,000 free tier. Excludes BSP, CRM, or hidden integration fees.",
      scenarios: [
        { volume: "1,000", label: "service messages / month", cost: "R$ 0", note: "Meta free monthly tier" },
        { volume: "120k", label: "service messages / month", cost: "R$ 4,165", note: "estimated Meta cost / month", active: true },
        { volume: "1 million", label: "service messages / month", cost: "R$ 34,965", note: "estimated Meta cost / month" },
      ],
    },
    countdown: {
      alertBadge: "Migration Deadline",
      heading: "Countdown to Meta's Per-Message Billing (10/01/2026)",
      days: "days",
      hours: "hours",
      mins: "mins",
      secs: "secs",
    },
    calculator: {
      tag: "Transparent Simulator",
      title: "Plug your operating volume into the equation.",
      desc: "The calculator contrasts direct Meta fees against owned-channel operational costs. Adjust the sliders to ground your migration in hard numbers.",
      cardTitle: "Operational Assumptions",
      cardSub: "All values are editable and the 1,000 free tier is included in the formula.",
      badgeMonthly: "monthly",
      lblConversations: "Monthly conversations",
      lblMessages: "Company messages per conversation",
      lblMessagesSub: "1 · quick answer | 8 · qualification | 20 · deep support",
      lblRate: "Meta tariff per service message",
      lblOwnedCost: "Estimated owned cost: infra + OpenAI",
      lblQualificationRate: "Estimated qualified lead rate",
      metaPressureTag: "Messaging Pressure",
      metaPressureTitle: "Direct Meta Cost",
      metaPressureBadge: "after 1,000 free tier",
      billableMsgsLabel: "Billable messages",
      billableMsgsSub: "free tier deducted",
      metaCostLabel: "Estimated monthly cost",
      metaCostSub: "Meta messaging tariff only",
      savingsTag: "Margin Potential",
      savingsTitleActive: "An owned channel opens margin.",
      savingsTitleInactive: "Volume does not yet cover owned fixed cost.",
      diffMonthlyLabel: "Monthly difference",
      diffMonthlySub: "Meta vs. your estimated operational cost",
      diffAnnualLabel: "Annual impact",
      diffAnnualSub: "simple 12-month projection",
      costPerLeadTag: "Cost per qualified lead",
      costPerLeadSub: "projected qualified leads per month:",
      lblMetaShort: "Meta",
      lblOwnedShort: "Owned channel",
      methodology: "Methodology: conversations × company replies − 1,000 free messages, multiplied by tariff. The owned channel cost is configurable.",
      metaLink: "View Meta Docs",
    },
    howItWorks: {
      tag: "An Architecture & Experience Choice",
      title: "WhatsApp can open the door. The relationship belongs on your ground.",
      desc: "Sup Better does not force customers to change habits abruptly. The campaign link stems from WhatsApp, ads, or your social bio. From the first click, you own the experience, data, and qualification logic.",
      journey: [
        {
          step: "01",
          title: "The lead arrives",
          text: "Campaign link labeled with ?origem=, QR code, or bio link. Source attribution is captured automatically.",
        },
        {
          step: "02",
          title: "The conversation flows",
          text: "OpenAI autonomous agent welcomes, classifies intent (sales, support, booking), and conducts dialogue without form barriers.",
        },
        {
          step: "03",
          title: "The team gets context",
          text: "Verified email with LGPD/GDPR consent, structured intent, and campaign attribution delivered in one backoffice view.",
        },
      ],
      proofPoints: [
        { title: "Owned channel", text: "The conversation lives in your domain — zero risk of phone number bans." },
        { title: "Unified identity", text: "Same normalized email → same durable lead record without corrupted duplicates." },
        { title: "Evidence-based decisions", text: "Granular campaign attribution and a 3-tier backoffice (Operator, Leadership, Management)." },
      ],
    },
    hackathon: {
      dateBadge: "AI Tinkerers × OpenAI Hackathon · FIAP São Paulo",
      title: "An agent where real attention already lives.",
      desc: "Our vision for 'Agents, Everywhere': rather than confining the agent to an isolated sandbox, Sup Better injects autonomous agents into the real customer acquisition frontlines, solving real unit economics.",
      boxTag: "What we demonstrate at FIAP",
      bullets: [
        "A sovereign conversational alternative respecting lead experience and privacy regulations.",
        "Real-time 5-intent classification powered by OpenAI on asynchronous FastAPI.",
        "A transparent economic model saving up to 98% of Meta's messaging tolls starting October 2026.",
      ],
      liveLink: "Launch live demo prototype",
    },
    comparison: {
      tag: "Model Comparison",
      title: "Why an owned channel outperforms WhatsApp and forms",
      desc: "An objective assessment of the three primary lead generation mechanisms.",
      headers: ["Criterion", "WhatsApp Business API", "Static Form", "Sup Better Engine"],
      rows: [
        {
          item: "Messaging Costs",
          wa: "Billed per response (Oct/2026)",
          form: "Fixed, but with 80% bounce rate",
          sb: "Fixed infra + sub-cent OpenAI inference",
        },
        {
          item: "Entry Barrier",
          wa: "Forces exposing personal phone instantly",
          form: "Fatiguing multi-field form wall",
          sb: "Frictionless anonymous instant chat",
        },
        {
          item: "Conversational AI",
          wa: "Rigid trees or costly per-turn LLM calls",
          form: "None (passive data entry)",
          sb: "OpenAI agent with intent-driven routing",
        },
        {
          item: "Outage / Ban Risk",
          wa: "High: arbitrary Meta policies & blocks",
          form: "None",
          sb: "Zero: your domain, your infrastructure",
        },
      ],
    },
    cta: {
      tag: "More conversation, zero dependency",
      title: "The next message may cost. The next customer relationship can be yours.",
      desc: "Experience the agent end-to-end: click, intent, contextual data, and qualified pipeline.",
      btn: "See Sup Better in action",
    },
    footer: {
      rights: "TERRA / GEMINI 38 · A Sup Better Engine experience for AI Tinkerers × OpenAI @ FIAP.",
      sourceNote: "Pricing source: WhatsApp Business Platform schedule effective 10/01/2026. Meta official documentation.",
    },
  },
};

type Lang = "pt" | "en";

/* ─────────────────────────────────────────────────────────
 *  Clean Inline SVG Icons (Matching Terra's stroke & style)
 * ───────────────────────────────────────────────────────── */
function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path d="M4 10h11M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path d="M10.3 13.7a4 4 0 0 0 5.66 0l3.54-3.54a4 4 0 1 0-5.66-5.66l-2.03 2.02M13.7 10.3a4 4 0 0 0-5.66 0L4.5 13.84a4 4 0 1 0 5.66 5.66l2.02-2.03" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path d="m12 2 1.54 5.46L19 9l-5.46 1.54L12 16l-1.54-5.46L5 9l5.46-1.54L12 2ZM19 16l.77 2.23L22 19l-2.23.77L19 22l-.77-2.23L16 19l2.23-.77L19 16Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path d="M4 19V5m0 14h16M8 16v-4m4 4V8m4 8v-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path d="m4.5 10 3.4 3.4 7.6-7.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CalculatorIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <rect x="4" y="2.75" width="16" height="18.5" rx="2.25" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 7.5h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export default function LandpageGemini38() {
  const [lang, setLang] = useState<Lang>("pt");
  const t = copy[lang];

  /* Mobile menu open state */
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /* Back to top visibility */
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* Smooth scroll to section */
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  /* ─────────────────────────────────────────────────────────
   * Countdown to October 1st, 2026
   * ───────────────────────────────────────────────────────── */
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const targetDate = new Date("2026-10-01T00:00:00Z").getTime();
    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  /* ─────────────────────────────────────────────────────────
   * Interactive Hero Chat Simulator
   * ───────────────────────────────────────────────────────── */
  const [selectedPreset, setSelectedPreset] = useState<number>(0);
  const activePreset = t.presets[selectedPreset];

  /* ─────────────────────────────────────────────────────────
   * Interactive Transparent Cost Calculator (Terra Style)
   * ───────────────────────────────────────────────────────── */
  const [monthlyConversations, setMonthlyConversations] = useState<number>(10000);
  const [messagesPerConversation, setMessagesPerConversation] = useState<number>(8);
  const [serviceRate, setServiceRate] = useState<number>(0.035);
  const [ownedChannelCost, setOwnedChannelCost] = useState<number>(450);
  const [qualificationRate, setQualificationRate] = useState<number>(20);

  const formatCurrency = useMemo(
    () =>
      new Intl.NumberFormat(lang === "pt" ? "pt-BR" : "en-US", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [lang]
  );

  const formatNumber = useMemo(
    () => new Intl.NumberFormat(lang === "pt" ? "pt-BR" : "en-US"),
    [lang]
  );

  const calculation = useMemo(() => {
    const totalMessages = monthlyConversations * messagesPerConversation;
    const billableMessages = Math.max(0, totalMessages - 1000);
    const metaMonthlyCost = billableMessages * serviceRate;
    const monthlyDifference = metaMonthlyCost - ownedChannelCost;
    const qualifiedLeads = Math.max(1, Math.round(monthlyConversations * (qualificationRate / 100)));

    return {
      billableMessages,
      metaMonthlyCost,
      monthlyDifference,
      annualDifference: monthlyDifference * 12,
      differencePercentage: metaMonthlyCost > 0 ? Math.abs(monthlyDifference / metaMonthlyCost) * 100 : 0,
      qualifiedLeads,
      metaCostPerQualifiedLead: metaMonthlyCost / qualifiedLeads,
      ownedCostPerQualifiedLead: ownedChannelCost / qualifiedLeads,
    };
  }, [messagesPerConversation, monthlyConversations, ownedChannelCost, qualificationRate, serviceRate]);

  const hasSavings = calculation.monthlyDifference >= 0;

  return (
    <main className={`min-h-screen w-full bg-[#f6f6ef] text-[#10211d] scroll-smooth ${styles.terra}`}>
      {/* ─────────────────────────────────────────────────────────
       * STICKY HEADER & NAVIGATION
       * ───────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0e211c]/95 border-b border-white/10 transition-all">
        <nav aria-label="Navegação principal" className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8">
          <Link href="/landpage-gemini38" className="flex items-center gap-2.5 rounded-md focus-visible:outline-offset-4 text-white">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#c8ff4d] text-sm font-black text-[#0e211c]">T</span>
            <span className="text-sm font-semibold tracking-[0.16em]">{t.nav.brand}</span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden items-center gap-7 text-sm text-[#c5d0c9] md:flex">
            <a className="transition-colors hover:text-white" href="#impacto" onClick={(e) => scrollToSection(e, "impacto")}>
              {t.nav.impact}
            </a>
            <a className="transition-colors hover:text-white" href="#calculadora" onClick={(e) => scrollToSection(e, "calculadora")}>
              {t.nav.calculator}
            </a>
            <a className="transition-colors hover:text-white" href="#produto" onClick={(e) => scrollToSection(e, "produto")}>
              {t.nav.howItWorks}
            </a>
            <a className="transition-colors hover:text-white" href="#hackathon" onClick={(e) => scrollToSection(e, "hackathon")}>
              {t.nav.hackathon}
            </a>
            <a className="transition-colors hover:text-white" href="#comparativo" onClick={(e) => scrollToSection(e, "comparativo")}>
              {t.nav.comparison}
            </a>
          </div>

          <div className="flex items-center gap-3">
            {/* Bilingual Toggle Button */}
            <button
              onClick={() => setLang(lang === "pt" ? "en" : "pt")}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-[#c8ff4d] hover:text-[#c8ff4d]"
              title="Mudar idioma / Switch language"
            >
              <span>🌐</span>
              <span>{lang === "pt" ? "English" : "Português"}</span>
            </button>

            <Link
              href="/?origem=hackathon-fiap-gemini38"
              className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-[#c8ff4d] hover:bg-[#c8ff4d] hover:text-[#10211d]"
            >
              {t.nav.demo} <ArrowIcon />
            </Link>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden grid h-9 w-9 place-items-center rounded-lg border border-white/20 text-white hover:bg-white/10"
              aria-label="Abrir menu de navegação"
            >
              {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </nav>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-[#0e211c] px-6 py-5 space-y-4 text-sm text-[#c5d0c9]">
            <div>
              <a className="block py-2 hover:text-white font-medium" href="#impacto" onClick={(e) => scrollToSection(e, "impacto")}>
                {t.nav.impact}
              </a>
            </div>
            <div>
              <a className="block py-2 hover:text-white font-medium" href="#calculadora" onClick={(e) => scrollToSection(e, "calculadora")}>
                {t.nav.calculator}
              </a>
            </div>
            <div>
              <a className="block py-2 hover:text-white font-medium" href="#produto" onClick={(e) => scrollToSection(e, "produto")}>
                {t.nav.howItWorks}
              </a>
            </div>
            <div>
              <a className="block py-2 hover:text-white font-medium" href="#hackathon" onClick={(e) => scrollToSection(e, "hackathon")}>
                {t.nav.hackathon}
              </a>
            </div>
            <div>
              <a className="block py-2 hover:text-white font-medium" href="#comparativo" onClick={(e) => scrollToSection(e, "comparativo")}>
                {t.nav.comparison}
              </a>
            </div>
            <div className="pt-2">
              <Link
                href="/?origem=hackathon-fiap-gemini38"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#c8ff4d] py-3 text-sm font-bold text-[#10211d]"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t.nav.demo} <ArrowIcon />
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ─────────────────────────────────────────────────────────
       * 1. HERO SECTION (Dark Forest Green with Terra Orbs & Glow)
       * ───────────────────────────────────────────────────────── */}
      <section id="inicio" className="relative isolate overflow-hidden bg-[#0e211c] pb-16 pt-10 text-[#f7f5eb] sm:pb-20 lg:pb-28">
        <div aria-hidden="true" className={styles.heroOrb} />
        <div aria-hidden="true" className={styles.heroGlow} />
        <div aria-hidden="true" className={styles.heroGrid} />

        {/* Hero Content Grid */}
        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[1.03fr_.97fr] lg:items-center lg:gap-16">
          <div className="max-w-3xl">
            {/* Badge FIAP / AI Tinkerers */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#c8ff4d]/25 bg-[#c8ff4d]/10 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-[#dcff99]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#c8ff4d]" />
              {t.hero.badge}
            </div>

            {/* Editorial Headline */}
            <h1 className="mt-7 max-w-3xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-balance sm:text-6xl lg:text-7xl">
              {t.hero.title}
            </h1>

            {/* Subtitle */}
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#c5d0c9] sm:text-xl">
              {t.hero.subtitle}
            </p>

            {/* CTA Buttons */}
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/?origem=hackathon-fiap-gemini38"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#c8ff4d] px-6 py-3.5 text-sm font-bold text-[#10211d] transition hover:bg-[#e0ff9b] focus-visible:outline-[#c8ff4d]"
              >
                {t.hero.ctaPrimary} <ArrowIcon />
              </Link>
              <a
                href="#impacto"
                onClick={(e) => scrollToSection(e, "impacto")}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3.5 text-sm font-semibold text-white transition hover:border-white/50 hover:bg-white/10"
              >
                {t.hero.ctaSecondary}
              </a>
            </div>
            <p className="mt-5 text-xs leading-5 text-[#93a49d]">
              {t.hero.disclaimer}
            </p>
          </div>

          {/* Interactive Hero Chat Window (Terra Design) */}
          <div className="relative mx-auto w-full max-w-[32rem] lg:mr-0">
            <div className={`${styles.floatSlow} absolute -right-6 -top-5 hidden rounded-full border border-white/10 bg-[#16352b] px-4 py-2 text-xs font-medium text-[#dcff99] shadow-xl sm:block`}>
              <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[#c8ff4d]" />
              {t.hero.leadStatus}
            </div>

            <div className="rounded-[2rem] border border-white/15 bg-[#f7f5eb] p-3 shadow-2xl shadow-black/25">
              <div className="overflow-hidden rounded-[1.45rem] bg-[#e8eee4] text-[#10211d]">
                {/* Window Header */}
                <div className="flex items-center justify-between border-b border-[#d5ded4] px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-[#10211d] text-xs font-bold text-[#c8ff4d]">S</span>
                    <div>
                      <p className="text-sm font-semibold">{t.hero.assistantName}</p>
                      <p className="text-[11px] text-[#65736b]">{t.hero.assistantRole}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-[#d7eeae] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#315022]">
                    {t.hero.statusOnline}
                  </span>
                </div>

                {/* Scenario Selector Chips */}
                <div className="flex gap-1.5 overflow-x-auto px-4 py-2.5 bg-[#dfe7db] border-b border-[#d5ded4] text-xs">
                  {t.presets.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedPreset(idx)}
                      className={`px-3 py-1 rounded-full whitespace-nowrap text-[11px] font-semibold transition ${
                        selectedPreset === idx
                          ? "bg-[#10211d] text-[#c8ff4d]"
                          : "bg-white/70 text-[#3c5046] hover:bg-white"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Chat turns */}
                <div className="space-y-4 px-5 py-6">
                  {/* User message */}
                  <div className="ml-auto max-w-[82%] rounded-2xl rounded-tr-sm bg-[#10211d] px-4 py-3 text-sm leading-5 text-white">
                    {activePreset.userMsg}
                  </div>

                  {/* Bot reply */}
                  <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-white px-4 py-3 text-sm leading-5 shadow-sm text-[#10211d]">
                    {activePreset.botMsg}
                  </div>

                  {/* Live telemetry stamp */}
                  <div className="flex items-center gap-2 pt-1 text-[11px] font-medium text-[#547548]">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-[#d7eeae]">
                      <CheckIcon />
                    </span>
                    <span>
                      {activePreset.intent} · {t.hero.agentVerified}
                    </span>
                  </div>
                </div>

                {/* Composer footer */}
                <div className="border-t border-[#d5ded4] px-5 py-4">
                  <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-sm text-[#829087] shadow-sm">
                    <span>{t.hero.inputPlaceholder}</span>
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-[#c8ff4d] text-[#10211d]">
                      <ArrowIcon />
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom floating badge */}
            <div className={`${styles.floatFast} absolute -bottom-6 -left-4 rounded-2xl border border-[#d5ded4] bg-white p-3.5 shadow-xl shadow-[#10211d]/10 sm:-left-10`}>
              <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#75847c]">{t.hero.nextStepBadge}</p>
              <p className="mt-1 text-sm font-semibold">{t.hero.nextStepTitle}</p>
              <p className="mt-0.5 text-xs text-[#547548]">{t.hero.nextStepSub}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
       * 2. THE WHATSAPP 2026 PRICING SHIFT SECTION
       * ───────────────────────────────────────────────────────── */}
      <section id="impacto" className="bg-[#f6f6ef] py-20 sm:py-28 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#55814e]">{t.impact.tag}</p>
              <h2 className="mt-4 max-w-xl text-4xl font-semibold leading-[1.02] tracking-[-0.045em] text-[#10211d] sm:text-5xl">
                {t.impact.title}
              </h2>
            </div>
            <div className="max-w-2xl text-base leading-7 text-[#4d5c55] sm:text-lg">
              {t.impact.leadText}
            </div>
          </div>

          {/* Countdown Pill Card */}
          <div className="mt-10 rounded-2xl border border-[#d6ddd0] bg-[#eef1e8] p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[#ea5044] text-white text-xs font-bold">!</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#8c4433]">{t.countdown.alertBadge}</p>
                <p className="text-sm font-semibold text-[#10211d]">{t.countdown.heading}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-center font-mono">
              <div className="bg-white border border-[#d6ddd0] rounded-xl px-3 py-1.5 min-w-[55px]">
                <div className="text-lg font-bold text-[#10211d]">{timeLeft.days}</div>
                <div className="text-[10px] text-[#75847c] uppercase">{t.countdown.days}</div>
              </div>
              <div className="bg-white border border-[#d6ddd0] rounded-xl px-3 py-1.5 min-w-[55px]">
                <div className="text-lg font-bold text-[#10211d]">{String(timeLeft.hours).padStart(2, "0")}</div>
                <div className="text-[10px] text-[#75847c] uppercase">{t.countdown.hours}</div>
              </div>
              <div className="bg-white border border-[#d6ddd0] rounded-xl px-3 py-1.5 min-w-[55px]">
                <div className="text-lg font-bold text-[#10211d]">{String(timeLeft.minutes).padStart(2, "0")}</div>
                <div className="text-[10px] text-[#75847c] uppercase">{t.countdown.mins}</div>
              </div>
              <div className="bg-white border border-[#d6ddd0] rounded-xl px-3 py-1.5 min-w-[55px]">
                <div className="text-lg font-bold text-[#10211d]">{String(timeLeft.seconds).padStart(2, "0")}</div>
                <div className="text-[10px] text-[#75847c] uppercase">{t.countdown.secs}</div>
              </div>
            </div>
          </div>

          {/* 3 Impact Stat Cards */}
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <article className="rounded-3xl border border-[#d6ddd0] bg-white p-6 sm:p-7">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6c7b72]">{t.impact.cards[0].tag}</p>
              <p className="mt-5 text-5xl font-semibold tracking-[-0.06em] text-[#10211d]">{t.impact.cards[0].value}</p>
              <p className="mt-2 text-sm leading-6 text-[#5e6c64]">{t.impact.cards[0].desc}</p>
            </article>

            <article className="rounded-3xl bg-[#ddff97] p-6 sm:p-7">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#41643b]">{t.impact.cards[1].tag}</p>
              <p className="mt-5 text-5xl font-semibold tracking-[-0.06em] text-[#10211d]">{t.impact.cards[1].value}</p>
              <p className="mt-2 text-sm leading-6 text-[#38523a]">{t.impact.cards[1].desc}</p>
            </article>

            <article className="rounded-3xl bg-[#10211d] p-6 text-[#f7f5eb] sm:p-7">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#b5c5b9]">{t.impact.cards[2].tag}</p>
              <p className="mt-5 text-2xl font-semibold leading-tight tracking-[-0.04em]">{t.impact.cards[2].title}</p>
              <p className="mt-3 text-sm leading-6 text-[#c5d0c9]">{t.impact.cards[2].desc}</p>
            </article>
          </div>

          {/* Pricing Scenarios */}
          <div className="mt-16 overflow-hidden rounded-[2rem] border border-[#d6ddd0] bg-[#eef1e8] p-5 sm:p-8 lg:p-10">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#55814e]">{t.impact.scenariosTitle}</p>
                <h3 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-[#10211d] sm:text-4xl">
                  {t.impact.scenariosHeading}
                </h3>
              </div>
              <p className="max-w-sm text-sm leading-6 text-[#5e6c64]">
                {t.impact.scenariosDesc}
              </p>
            </div>
            <div className="mt-8 grid gap-3 md:grid-cols-3">
              {t.impact.scenarios.map((scenario) => (
                <div key={scenario.volume} className={`rounded-2xl p-5 ${scenario.active ? "bg-[#10211d] text-white" : "border border-[#d6ddd0] bg-white"}`}>
                  <p className={`text-sm font-semibold ${scenario.active ? "text-[#dcff99]" : "text-[#10211d]"}`}>{scenario.volume}</p>
                  <p className={`mt-1 text-xs ${scenario.active ? "text-[#b5c5b9]" : "text-[#6c7b72]"}`}>{scenario.label}</p>
                  <p className="mt-6 text-3xl font-semibold tracking-[-0.05em]">{scenario.cost}</p>
                  <p className={`mt-1 text-xs ${scenario.active ? "text-[#b5c5b9]" : "text-[#6c7b72]"}`}>{scenario.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
       * 3. TRANSPARENT COST CALCULATOR (Terra Style)
       * ───────────────────────────────────────────────────────── */}
      <section id="calculadora" className="border-t border-[#d6ddd0] bg-[#eef1e8] py-20 sm:py-28 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.15em] text-[#55814e]">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#ddff97] text-[#254321]">
                  <CalculatorIcon />
                </span>
                {t.calculator.tag}
              </div>
              <h2 className="mt-5 text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-[#10211d] sm:text-5xl">
                {t.calculator.title}
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-[#4d5c55] sm:text-lg">
              {t.calculator.desc}
            </p>
          </div>

          <div className="mt-12 grid gap-5 xl:grid-cols-[.94fr_1.06fr]">
            {/* Form Sliders */}
            <form className="rounded-[2rem] border border-[#d6ddd0] bg-white p-6 shadow-[0_18px_50px_rgba(24,48,39,.06)] sm:p-8" onSubmit={(e) => e.preventDefault()}>
              <div className="flex items-start justify-between gap-4 border-b border-[#e2e7df] pb-6">
                <div>
                  <h3 className="text-xl font-semibold tracking-[-0.03em] text-[#10211d]">{t.calculator.cardTitle}</h3>
                  <p className="mt-1 text-sm leading-6 text-[#65736b]">{t.calculator.cardSub}</p>
                </div>
                <span className="rounded-full bg-[#eef1e8] px-3 py-1 text-xs font-semibold text-[#41643b]">
                  {t.calculator.badgeMonthly}
                </span>
              </div>

              <div className="mt-7 space-y-7">
                {/* Conversations slider */}
                <div>
                  <div className="flex items-end justify-between gap-5">
                    <label htmlFor="gemini-monthly-convs" className="text-sm font-semibold text-[#243a31]">
                      {t.calculator.lblConversations}
                    </label>
                    <output htmlFor="gemini-monthly-convs" className="text-lg font-semibold tracking-[-0.03em] text-[#10211d]">
                      {formatNumber.format(monthlyConversations)}
                    </output>
                  </div>
                  <input
                    id="gemini-monthly-convs"
                    className={`mt-3 ${styles.calculatorRange}`}
                    type="range"
                    min="1000"
                    max="100000"
                    step="1000"
                    value={monthlyConversations}
                    onChange={(e) => setMonthlyConversations(Number(e.target.value))}
                  />
                  <div className="mt-2 flex justify-between text-[11px] font-medium text-[#7a8980]">
                    <span>1.000</span>
                    <span>50.000</span>
                    <span>100.000</span>
                  </div>
                </div>

                {/* Messages per conversation */}
                <div>
                  <div className="flex items-end justify-between gap-5">
                    <label htmlFor="gemini-msgs-per-conv" className="text-sm font-semibold text-[#243a31]">
                      {t.calculator.lblMessages}
                    </label>
                    <output htmlFor="gemini-msgs-per-conv" className="text-lg font-semibold tracking-[-0.03em] text-[#10211d]">
                      {messagesPerConversation}
                    </output>
                  </div>
                  <input
                    id="gemini-msgs-per-conv"
                    className={`mt-3 ${styles.calculatorRange}`}
                    type="range"
                    min="1"
                    max="20"
                    step="1"
                    value={messagesPerConversation}
                    onChange={(e) => setMessagesPerConversation(Number(e.target.value))}
                  />
                  <div className="mt-2 flex justify-between text-[11px] font-medium text-[#7a8980]">
                    <span>1 · rápida</span>
                    <span>8 · qualificação</span>
                    <span>20 · consultoria</span>
                  </div>
                </div>

                {/* Meta Rate */}
                <div>
                  <div className="flex items-end justify-between gap-5">
                    <label htmlFor="gemini-service-rate" className="text-sm font-semibold text-[#243a31]">
                      {t.calculator.lblRate}
                    </label>
                    <output htmlFor="gemini-service-rate" className="text-lg font-semibold tracking-[-0.03em] text-[#10211d]">
                      {formatCurrency.format(serviceRate)}
                    </output>
                  </div>
                  <input
                    id="gemini-service-rate"
                    className={`mt-3 ${styles.calculatorRange}`}
                    type="range"
                    min="0.01"
                    max="0.1"
                    step="0.005"
                    value={serviceRate}
                    onChange={(e) => setServiceRate(Number(e.target.value))}
                  />
                  <div className="mt-2 flex justify-between text-[11px] font-medium text-[#7a8980]">
                    <span>R$ 0,010</span>
                    <span>R$ 0,035 · Lista Meta</span>
                    <span>R$ 0,100</span>
                  </div>
                </div>

                {/* Owned Channel Cost */}
                <div>
                  <div className="flex items-end justify-between gap-5">
                    <label htmlFor="gemini-owned-cost" className="text-sm font-semibold text-[#243a31]">
                      {t.calculator.lblOwnedCost}
                    </label>
                    <output htmlFor="gemini-owned-cost" className="text-lg font-semibold tracking-[-0.03em] text-[#10211d]">
                      {formatCurrency.format(ownedChannelCost)}
                    </output>
                  </div>
                  <input
                    id="gemini-owned-cost"
                    className={`mt-3 ${styles.calculatorRange}`}
                    type="range"
                    min="0"
                    max="5000"
                    step="50"
                    value={ownedChannelCost}
                    onChange={(e) => setOwnedChannelCost(Number(e.target.value))}
                  />
                  <div className="mt-2 flex justify-between text-[11px] font-medium text-[#7a8980]">
                    <span>R$ 0</span>
                    <span>R$ 2.500</span>
                    <span>R$ 5.000</span>
                  </div>
                </div>

                {/* Qualified lead rate */}
                <div>
                  <div className="flex items-end justify-between gap-5">
                    <label htmlFor="gemini-qual-rate" className="text-sm font-semibold text-[#243a31]">
                      {t.calculator.lblQualificationRate}
                    </label>
                    <output htmlFor="gemini-qual-rate" className="text-lg font-semibold tracking-[-0.03em] text-[#10211d]">
                      {qualificationRate}%
                    </output>
                  </div>
                  <input
                    id="gemini-qual-rate"
                    className={`mt-3 ${styles.calculatorRange}`}
                    type="range"
                    min="5"
                    max="80"
                    step="5"
                    value={qualificationRate}
                    onChange={(e) => setQualificationRate(Number(e.target.value))}
                  />
                  <div className="mt-2 flex justify-between text-[11px] font-medium text-[#7a8980]">
                    <span>5%</span>
                    <span>20%</span>
                    <span>80%</span>
                  </div>
                </div>
              </div>
            </form>

            {/* Calculations Output */}
            <div className="grid gap-5">
              {/* Meta direct cost card */}
              <div aria-live="polite" className="overflow-hidden rounded-[2rem] bg-[#10211d] p-6 text-[#f7f5eb] shadow-[0_18px_50px_rgba(16,33,29,.16)] sm:p-8">
                <div className="flex flex-col justify-between gap-4 border-b border-white/15 pb-6 sm:flex-row sm:items-start">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#dcff99]">{t.calculator.metaPressureTag}</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{t.calculator.metaPressureTitle}</h3>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-[#c5d0c9]">
                    {t.calculator.metaPressureBadge}
                  </span>
                </div>
                <div className="mt-7 grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#b5c5b9]">{t.calculator.billableMsgsLabel}</p>
                    <p className="mt-2 text-3xl font-semibold tracking-[-0.055em] text-white">{formatNumber.format(calculation.billableMessages)}</p>
                    <p className="mt-1 text-xs leading-5 text-[#b5c5b9]">{t.calculator.billableMsgsSub}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#b5c5b9]">{t.calculator.metaCostLabel}</p>
                    <p className="mt-2 text-3xl font-semibold tracking-[-0.055em] text-[#dcff99]">{formatCurrency.format(calculation.metaMonthlyCost)}</p>
                    <p className="mt-1 text-xs leading-5 text-[#b5c5b9]">{t.calculator.metaCostSub}</p>
                  </div>
                </div>
              </div>

              {/* Savings Potential Card */}
              <div aria-live="polite" className={`rounded-[2rem] border p-6 sm:p-8 ${hasSavings ? "border-[#b6dc7e] bg-[#ddff97]" : "border-[#e8c5bb] bg-[#f6e1db]"}`}>
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-[0.14em] ${hasSavings ? "text-[#41643b]" : "text-[#8c4433]"}`}>
                      {t.calculator.savingsTag}
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#10211d]">
                      {hasSavings ? t.calculator.savingsTitleActive : t.calculator.savingsTitleInactive}
                    </h3>
                  </div>
                  <span className="rounded-full bg-white/55 px-3 py-1.5 text-xs font-bold text-[#10211d]">
                    {calculation.differencePercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-7 grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#4d5c55]">{t.calculator.diffMonthlyLabel}</p>
                    <p className="mt-2 text-3xl font-semibold tracking-[-0.055em] text-[#10211d]">{formatCurrency.format(Math.abs(calculation.monthlyDifference))}</p>
                    <p className="mt-1 text-xs leading-5 text-[#4d5c55]">{t.calculator.diffMonthlySub}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#4d5c55]">{t.calculator.diffAnnualLabel}</p>
                    <p className="mt-2 text-3xl font-semibold tracking-[-0.055em] text-[#10211d]">{formatCurrency.format(Math.abs(calculation.annualDifference))}</p>
                    <p className="mt-1 text-xs leading-5 text-[#4d5c55]">{t.calculator.diffAnnualSub}</p>
                  </div>
                </div>
              </div>

              {/* Cost per Qualified Lead Card */}
              <div aria-live="polite" className="grid gap-4 rounded-[2rem] border border-[#d6ddd0] bg-white p-6 sm:grid-cols-[1fr_1px_1fr] sm:items-center sm:p-8">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#55814e]">{t.calculator.costPerLeadTag}</p>
                  <p className="mt-2 text-sm leading-6 text-[#65736b]">
                    {t.calculator.costPerLeadSub} <strong>{formatNumber.format(calculation.qualifiedLeads)}</strong>
                  </p>
                </div>
                <div aria-hidden="true" className="hidden h-16 bg-[#e2e7df] sm:block" />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#7a8980]">{t.calculator.lblMetaShort}</p>
                    <p className="mt-1 text-xl font-semibold tracking-[-0.04em] text-[#10211d]">{formatCurrency.format(calculation.metaCostPerQualifiedLead)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#7a8980]">{t.calculator.lblOwnedShort}</p>
                    <p className="mt-1 text-xl font-semibold tracking-[-0.04em] text-[#10211d]">{formatCurrency.format(calculation.ownedCostPerQualifiedLead)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-[#d6ddd0] bg-[#f6f6ef] px-5 py-4 text-xs leading-5 text-[#607067] sm:flex-row sm:items-center sm:justify-between">
            <p>{t.calculator.methodology}</p>
            <a className="inline-flex shrink-0 items-center gap-1.5 font-semibold text-[#315c36] underline underline-offset-4" href="https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing" target="_blank" rel="noreferrer">
              {t.calculator.metaLink} <ArrowIcon />
            </a>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
       * 4. HOW IT WORKS / ARCHITECTURE CHOICE (Dark Moss Green)
       * ───────────────────────────────────────────────────────── */}
      <section id="produto" className="border-y border-[#1e3a30] bg-[#16352b] py-20 text-[#f7f5eb] sm:py-28 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-20">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#dcff99]">{t.howItWorks.tag}</p>
              <h2 className="mt-4 text-4xl font-semibold leading-[1.02] tracking-[-0.05em] sm:text-5xl">
                {t.howItWorks.title}
              </h2>
            </div>
            <p className="self-end text-lg leading-8 text-[#c5d0c9]">
              {t.howItWorks.desc}
            </p>
          </div>

          {/* 3 Steps */}
          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            {t.howItWorks.journey.map((item, idx) => {
              const icons = [<LinkIcon key="1" />, <SparkIcon key="2" />, <ChartIcon key="3" />];
              return (
                <article key={item.step} className="group rounded-3xl border border-white/15 bg-white/[0.04] p-6 transition duration-300 hover:-translate-y-1 hover:border-[#c8ff4d]/50 hover:bg-white/[0.07] sm:p-7">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#dcff99]">{item.step}</span>
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#c8ff4d] text-[#10211d]">
                      {icons[idx]}
                    </span>
                  </div>
                  <h3 className="mt-10 text-2xl font-semibold tracking-[-0.035em]">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#c5d0c9]">{item.text}</p>
                </article>
              );
            })}
          </div>

          {/* Proof points strip */}
          <div className="mt-5 grid gap-3 rounded-3xl border border-white/15 bg-[#0e211c] p-5 sm:grid-cols-3 sm:gap-0 sm:p-0">
            {t.howItWorks.proofPoints.map((point, index) => (
              <div key={point.title} className={`px-4 py-4 sm:px-7 sm:py-7 ${index > 0 ? "sm:border-l sm:border-white/15" : ""}`}>
                <div className="flex items-center gap-2 text-sm font-semibold text-[#dcff99]">
                  <CheckIcon />
                  {point.title}
                </div>
                <p className="mt-2 text-sm leading-6 text-[#c5d0c9]">{point.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
       * 5. HACKATHON AI TINKERERS × OPENAI @ FIAP (Warm Terracotta)
       * ───────────────────────────────────────────────────────── */}
      <section id="hackathon" className="relative overflow-hidden bg-[#e6c4a9] py-20 sm:py-28 scroll-mt-20">
        <div aria-hidden="true" className={styles.orangeSun} />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[1.1fr_.9fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#10211d]/15 bg-[#f6f6ef]/65 px-3 py-1.5 text-xs font-bold tracking-wide text-[#10211d]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ea5044]" />
              {t.hackathon.dateBadge}
            </div>
            <h2 className="mt-7 max-w-3xl text-5xl font-semibold leading-[0.98] tracking-[-0.06em] text-[#10211d] sm:text-6xl">
              {t.hackathon.title}
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#3e5148]">
              {t.hackathon.desc}
            </p>
          </div>

          <div className="rounded-[2rem] border border-[#10211d]/15 bg-[#f6f6ef]/80 p-7 shadow-[0_20px_60px_rgba(81,50,36,.12)] sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#5a6d60]">{t.hackathon.boxTag}</p>
            <ul className="mt-6 space-y-4 text-sm leading-6 text-[#2e4138]">
              {t.hackathon.bullets.map((bullet, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#10211d] text-[#c8ff4d]">
                    <CheckIcon />
                  </span>
                  {bullet}
                </li>
              ))}
            </ul>
            <Link
              href="/?origem=hackathon-fiap-gemini38"
              className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-[#10211d] underline decoration-[#ea5044] decoration-2 underline-offset-4 transition hover:text-[#ea5044]"
            >
              {t.hackathon.liveLink} <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
       * 6. COMPARISON MATRIX (Terra Clean Table Style)
       * ───────────────────────────────────────────────────────── */}
      <section id="comparativo" className="bg-[#f6f6ef] py-20 sm:py-28 border-t border-[#d6ddd0] scroll-mt-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-3xl mb-12">
            <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#55814e]">{t.comparison.tag}</p>
            <h2 className="mt-4 text-4xl font-semibold leading-[1.02] tracking-[-0.045em] text-[#10211d] sm:text-5xl">
              {t.comparison.title}
            </h2>
            <p className="mt-4 text-base leading-7 text-[#5e6c64]">
              {t.comparison.desc}
            </p>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-[#d6ddd0] bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[#e2e7df] bg-[#f6f6ef] text-[#10211d]">
                    <th className="p-5 font-bold">{t.comparison.headers[0]}</th>
                    <th className="p-5 font-semibold text-[#8c4433]">{t.comparison.headers[1]}</th>
                    <th className="p-5 font-semibold text-[#5e6c64]">{t.comparison.headers[2]}</th>
                    <th className="p-5 font-bold text-[#10211d] bg-[#ddff97]/40 border-l border-r border-[#c8ff4d]/60">
                      {t.comparison.headers[3]}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e7df]">
                  {t.comparison.rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#fcfcfa] transition-colors">
                      <td className="p-5 font-semibold text-[#10211d]">{row.item}</td>
                      <td className="p-5 text-[#8c4433]">{row.wa}</td>
                      <td className="p-5 text-[#65736b]">{row.form}</td>
                      <td className="p-5 font-semibold text-[#10211d] bg-[#ddff97]/20 border-l border-r border-[#c8ff4d]/40">
                        {row.sb}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
       * 7. FINAL INVITATION CTA
       * ───────────────────────────────────────────────────────── */}
      <section className="bg-[#f6f6ef] py-20 sm:py-28 border-t border-[#d6ddd0]">
        <div className="mx-auto max-w-4xl px-5 text-center sm:px-8">
          <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#55814e]">{t.cta.tag}</p>
          <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-semibold leading-[1.02] tracking-[-0.055em] text-[#10211d] sm:text-5xl">
            {t.cta.title}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#5e6c64]">
            {t.cta.desc}
          </p>
          <Link
            href="/?origem=hackathon-fiap-gemini38"
            className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#10211d] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#28513f]"
          >
            {t.cta.btn} <ArrowIcon />
          </Link>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
       * 8. FOOTER
       * ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#d6ddd0] bg-[#eef1e8] py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 text-xs leading-5 text-[#607067] sm:flex-row sm:items-end sm:justify-between sm:px-8">
          <p>
            <span className="font-bold tracking-[0.13em] text-[#10211d]">TERRA · GEMINI 38</span> · {t.footer.rights}
          </p>
          <p className="max-w-xl sm:text-right">
            {t.footer.sourceNote}{" "}
            <a className="font-medium text-[#315c36] underline underline-offset-2" href="https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing" target="_blank" rel="noreferrer">
              developers.facebook.com
            </a>
            .
          </p>
        </div>
      </footer>

      {/* ─────────────────────────────────────────────────────────
       * 9. FLOATING BACK TO TOP BUTTON
       * ───────────────────────────────────────────────────────── */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-[#c8ff4d] text-[#0e211c] shadow-2xl transition hover:scale-105 hover:bg-[#e0ff9b] focus:outline-none"
          title="Voltar ao topo"
          aria-label="Voltar ao topo"
        >
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-5 w-5 rotate-180">
            <path d="m5 13 5-5 5 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </main>
  );
}
