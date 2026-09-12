"use client";

import React, { useState } from "react";

/* ─────────────────────────────────────────────────────────
 *  Bilingual copy — PT-BR / EN
 * ───────────────────────────────────────────────────────── */
const copy = {
  pt: {
    nav: {
      product: "Produto",
      problem: "O Problema",
      solution: "Solução",
      features: "Recursos",
      tech: "Tecnologia",
      cta: "Testar Demo",
    },
    hero: {
      badge: "AI Tinkerers × OpenAI — Hackathon Global 2026",
      title1: "Seu canal.",
      title2: "Seus leads.",
      title3: "Zero dependência do WhatsApp.",
      subtitle:
        "A partir de 1º de outubro de 2026, cada mensagem de atendimento no WhatsApp custará dinheiro. O Sup Better é o canal próprio onde seus leads conversam, se qualificam e se identificam — sem custo por mensagem, sem identidade fragmentada.",
      cta: "Ver demo ao vivo",
      ctaSecondary: "Ver arquitetura",
    },
    crisis: {
      eyebrow: "O problema urgente",
      title: "WhatsApp vai cobrar por mensagem de atendimento",
      description:
        "A Meta anunciou: a partir de 1º de outubro de 2026, toda mensagem de serviço enviada dentro da janela de 24h de atendimento será cobrada por mensagem. Chatbots, agentes de IA, atendentes humanos — tudo conta.",
      before: "Antes (até 30/09/2026)",
      beforeDetail: "Janela de 24h gratuita após o lead enviar mensagem. Respostas ilimitadas sem custo.",
      after: "Depois (a partir de 01/10/2026)",
      afterDetail: "Cada mensagem de serviço é cobrada individualmente. Uma conversa com 5 respostas = 5 cobranças.",
      impact: "Impacto real",
      impactDetail:
        "Empresas com alto volume de atendimento verão custos mensais significativos. Cada mensagem desnecessária, cada confirmação redundante, cada pergunta de esclarecimento — tudo custa.",
      costExample: "~$0.055",
      costLabel: "por mensagem (EUA)",
      costBrazil: "~R$ 0,35",
      costBrazilLabel: "por mensagem (Brasil est.)",
    },
    solution: {
      eyebrow: "A solução",
      title: "Um canal próprio que resolve identidade e custo",
      description:
        "O Sup Better Engine é uma plataforma de conversa com leads que substitui o WhatsApp como canal primário de atendimento. O lead chega por um link único, conversa anonimamente, é classificado por intenção e identificado por e-mail — tudo no seu domínio, sem custo por mensagem.",
      point1: "Canal próprio, marca própria",
      point1Detail: "Seu domínio, sua experiência. Sem depender de plataforma de terceiros.",
      point2: "Custo previsível",
      point2Detail: "Sem cobrança por mensagem. Infraestrutura fixa, não variável por conversa.",
      point3: "Identidade unificada",
      point3Detail: "Mesmo e-mail → mesmo lead. Sem duplicidade invisível, sem base corrompida.",
    },
    features: {
      eyebrow: "Recursos principais",
      title: "Inteligência conversacional do clique ao lead qualificado",
      items: [
        {
          title: "Chat anônimo",
          desc: "O lead abre o link e conversa imediatamente. Sem login, sem formulário, sem atrito. A barreira zero na entrada maximiza o engajamento.",
          icon: "chat",
        },
        {
          title: "Classificação de intenção",
          desc: "Cada mensagem é analisada em tempo real. O agente identifica se é qualificação, atendimento, agendamento, venda ou indefinida — e roteia dinamicamente.",
          icon: "brain",
        },
        {
          title: "Coleta contextual de e-mail",
          desc: "O e-mail é pedido no momento certo — quando a intenção justifica — com proposta de valor clara e consentimento LGPD. Máximo 2 exibições por sessão.",
          icon: "mail",
        },
        {
          title: "Qualificação estruturada",
          desc: "O handler de qualificação descobre necessidade, urgência e fit do lead, produzindo uma saída estruturada para o time comercial.",
          icon: "target",
        },
        {
          title: "Campanhas com atribuição",
          desc: "Links rotulados com ?origem= rastreiam a fonte de cada sessão. WhatsApp, site, busca — cada campanha tem métricas próprias.",
          icon: "link",
        },
        {
          title: "Backoffice com 3 níveis",
          desc: "Operador monitora sessões, Liderança configura parâmetros e gestão decisões estratégicas. RBAC por tabela, não roles hardcoded.",
          icon: "shield",
        },
      ],
    },
    tech: {
      eyebrow: "Stack técnica",
      title: "Arquitetura moderna, pronta para escalar",
      items: [
        { name: "Next.js 16", desc: "App Router, React 19, SSR" },
        { name: "FastAPI", desc: "Python 3.12, async, SQLAlchemy 2.0" },
        { name: "PostgreSQL 18", desc: "Sessão efêmera + lead durável" },
        { name: "JWT + RBAC", desc: "Auth 8h + 3 níveis de acesso" },
      ],
    },
    hackathon: {
      eyebrow: "Hackathon",
      title: "Agents, Everywhere — AI Tinkerers × OpenAI",
      description:
        "Construído para o hackathon global da AI Tinkerers em parceria com OpenAI. 50 cidades, 6 continentes, milhares de builders. O tema: criar agentes que aparecem onde as pessoas já trabalham e vivem.",
      challenge: "O desafio",
      challengeDetail:
        "A maioria dos agentes ainda espera dentro de uma janela de chat separada. Nós invertemos a premissa: o Sup Better aparece no ponto exato onde o lead já está — no link da campanha, no QR code, na bio — e resolve a conversa inteira sem trocar de canal.",
      fit: "Por que se encaixa",
      fitDetail:
        "O agente do Sup Better vive no canal do tenant. Ele classifica intenções, qualifica leads e coleta identificação contextual — tudo dentro da experiência de conversa, sem depender de WhatsApp ou plataformas de terceiros.",
    },
    demo: {
      title: "Experimente agora",
      description: "Abra o chat e converse com o agente. Classifique sua intenção, veja a qualificação em ação.",
      cta: "Abrir chat demo",
    },
    footer: {
      built: "Construído com",
      forThe: "para o",
      globalHackathon: "Hackathon Global AI Tinkerers × OpenAI 2026",
      stack: "Stack",
      docs: "Documentação",
      designSystem: "Design System",
      sdd: "Especificações SDD",
      source: "Código-fonte",
    },
  },
  en: {
    nav: {
      product: "Product",
      problem: "Problem",
      solution: "Solution",
      features: "Features",
      tech: "Technology",
      cta: "Try Demo",
    },
    hero: {
      badge: "AI Tinkerers × OpenAI — Global Hackathon 2026",
      title1: "Your channel.",
      title2: "Your leads.",
      title3: "Zero WhatsApp dependency.",
      subtitle:
        "Starting October 1, 2026, every service message on WhatsApp will cost money. Sup Better is your branded channel where leads chat, get qualified, and identify themselves — no per-message cost, no fragmented identity.",
      cta: "See live demo",
      ctaSecondary: "View architecture",
    },
    crisis: {
      eyebrow: "The urgent problem",
      title: "WhatsApp will charge per service message",
      description:
        "Meta announced: starting October 1, 2026, every service message sent within the 24-hour customer service window will be charged per message. Chatbots, AI agents, human reps — everything counts.",
      before: "Before (until Sep 30, 2026)",
      beforeDetail: "Free 24-hour window after customer sends a message. Unlimited responses at no cost.",
      after: "After (from Oct 1, 2026)",
      afterDetail: "Every service message is charged individually. A conversation with 5 replies = 5 charges.",
      impact: "Real impact",
      impactDetail:
        "High-volume businesses will face significant monthly costs. Every unnecessary message, every redundant confirmation, every clarifying question — it all costs.",
      costExample: "~$0.055",
      costLabel: "per message (US)",
      costBrazil: "~R$0.35",
      costBrazilLabel: "per message (Brazil est.)",
    },
    solution: {
      eyebrow: "The solution",
      title: "An owned channel that solves identity and cost",
      description:
        "Sup Better Engine is a lead conversation platform that replaces WhatsApp as the primary service channel. The lead arrives via a unique link, chats anonymously, gets classified by intent, and identified by email — all on your domain, no per-message cost.",
      point1: "Owned channel, owned brand",
      point1Detail: "Your domain, your experience. No third-party platform dependency.",
      point2: "Predictable cost",
      point2Detail: "No per-message charges. Fixed infrastructure, not variable per conversation.",
      point3: "Unified identity",
      point3Detail: "Same email → same lead. No invisible duplication, no corrupted database.",
    },
    features: {
      eyebrow: "Key features",
      title: "Conversational intelligence from click to qualified lead",
      items: [
        {
          title: "Anonymous chat",
          desc: "The lead opens the link and chats immediately. No login, no form, no friction. Zero barrier at entry maximizes engagement.",
          icon: "chat",
        },
        {
          title: "Intent classification",
          desc: "Every message is analyzed in real time. The agent identifies qualification, service, scheduling, sales, or undefined intent — and routes dynamically.",
          icon: "brain",
        },
        {
          title: "Contextual email collection",
          desc: "Email is requested at the right moment — when intent justifies it — with clear value proposition and LGPD consent. Max 2 displays per session.",
          icon: "mail",
        },
        {
          title: "Structured qualification",
          desc: "The qualification handler discovers need, urgency, and fit, producing a structured output for the commercial team.",
          icon: "target",
        },
        {
          title: "Campaign attribution",
          desc: "Labeled links with ?origem= track the source of each session. WhatsApp, website, search — each campaign has its own metrics.",
          icon: "link",
        },
        {
          title: "3-tier backoffice",
          desc: "Operators monitor sessions, Leadership configures parameters, and Management makes strategic decisions. RBAC by permission table, not hardcoded roles.",
          icon: "shield",
        },
      ],
    },
    tech: {
      eyebrow: "Tech stack",
      title: "Modern architecture, ready to scale",
      items: [
        { name: "Next.js 16", desc: "App Router, React 19, SSR" },
        { name: "FastAPI", desc: "Python 3.12, async, SQLAlchemy 2.0" },
        { name: "PostgreSQL 18", desc: "Ephemeral session + durable lead" },
        { name: "JWT + RBAC", desc: "8h auth + 3 access levels" },
      ],
    },
    hackathon: {
      eyebrow: "Hackathon",
      title: "Agents, Everywhere — AI Tinkerers × OpenAI",
      description:
        "Built for AI Tinkerers' global hackathon in partnership with OpenAI. 50 cities, 6 continents, thousands of builders. The theme: create agents that show up where people already work and live.",
      challenge: "The challenge",
      challengeDetail:
        "Most agents still wait inside a separate chat window. We flipped the premise: Sup Better shows up at the exact point where the lead already is — the campaign link, the QR code, the bio — and resolves the entire conversation without switching channels.",
      fit: "Why it fits",
      fitDetail:
        "Sup Better's agent lives in the tenant's channel. It classifies intents, qualifies leads, and collects contextual identification — all within the conversation experience, without depending on WhatsApp or third-party platforms.",
    },
    demo: {
      title: "Try it now",
      description: "Open the chat and talk to the agent. Classify your intent, see qualification in action.",
      cta: "Open demo chat",
    },
    footer: {
      built: "Built with",
      forThe: "for the",
      globalHackathon: "AI Tinkerers × OpenAI Global Hackathon 2026",
      stack: "Stack",
      docs: "Documentation",
      designSystem: "Design System",
      sdd: "SDD Specifications",
      source: "Source code",
    },
  },
} as const;

type Lang = keyof typeof copy;

/* ─────────────────────────────────────────────────────────
 *  Icon components (inline SVG, Lucide-style)
 * ───────────────────────────────────────────────────────── */
function IconChat() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function IconBrain() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M12 2a5 5 0 0 1 5 5c0 .8-.2 1.5-.5 2.2A5 5 0 0 1 19 14a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5 5 5 0 0 1 2.5-4.3A5 5 0 0 1 7 7a5 5 0 0 1 5-5z" />
      <path d="M12 2v17" />
    </svg>
  );
}
function IconMail() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}
function IconTarget() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
  );
}
function IconLink() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
function IconShield() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function IconArrowRight() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
  );
}
function IconWarning() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" />
    </svg>
  );
}

const featureIcons: Record<string, React.ComponentType> = {
  chat: IconChat,
  brain: IconBrain,
  mail: IconMail,
  target: IconTarget,
  link: IconLink,
  shield: IconShield,
};

/* ─────────────────────────────────────────────────────────
 *  Main component
 * ───────────────────────────────────────────────────────── */
export default function LandingPage() {
  const [lang, setLang] = useState<Lang>("pt");
  const t = copy[lang];

  return (
    <div className="min-h-screen bg-white text-[var(--sb-fg)]" style={{ fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[var(--sb-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--sb-primary)" }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="w-5 h-5">
                <path fillRule="evenodd" d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 4.014 1 5.426v5.148c0 1.413.993 2.672 2.43 2.902 1.168.188 2.352.327 3.55.414.28.02.521.18.642.413l1.713 3.293a.75.75 0 0 0 1.33 0l1.713-3.293a.783.783 0 0 1 .642-.413 41.102 41.102 0 0 0 3.55-.414c1.437-.23 2.43-1.49 2.43-2.902V5.426c0-1.413-.993-2.672-2.43-2.902A41.289 41.289 0 0 0 10 2Z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="font-semibold text-lg tracking-tight" style={{ color: "var(--sb-fg-strong)" }}>Sup Better</span>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm" style={{ color: "var(--sb-muted)" }}>
            <a href="#problem" className="hover:text-[var(--sb-primary)] transition-colors">{t.nav.problem}</a>
            <a href="#solution" className="hover:text-[var(--sb-primary)] transition-colors">{t.nav.solution}</a>
            <a href="#features" className="hover:text-[var(--sb-primary)] transition-colors">{t.nav.features}</a>
            <a href="#tech" className="hover:text-[var(--sb-primary)] transition-colors">{t.nav.tech}</a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setLang(lang === "pt" ? "en" : "pt")}
              className="text-xs font-medium px-3 py-1.5 rounded-full border transition-colors"
              style={{ borderColor: "var(--sb-border)", color: "var(--sb-muted)" }}
            >
              {lang === "pt" ? "EN" : "PT"}
            </button>
            <a
              href="/"
              className="hidden sm:inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full text-white transition-colors"
              style={{ background: "var(--sb-primary)" }}
            >
              {t.nav.cta}
              <IconArrowRight />
            </a>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden landing-gradient-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="max-w-4xl mx-auto text-center">
            <div className="fade-in-up inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium mb-8" style={{ background: "rgba(59,111,232,0.08)", color: "var(--sb-primary)" }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--sb-accent)" }} />
              {t.hero.badge}
            </div>

            <h1 className="fade-in-up fade-in-up-delay-1 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight" style={{ color: "var(--sb-fg-strong)" }}>
              {t.hero.title1}
              <br />
              {t.hero.title2}
              <br />
              <span className="text-gradient">{t.hero.title3}</span>
            </h1>

            <p className="fade-in-up fade-in-up-delay-2 mt-6 text-lg sm:text-xl leading-relaxed max-w-3xl mx-auto" style={{ color: "var(--sb-muted)" }}>
              {t.hero.subtitle}
            </p>

            <div className="fade-in-up fade-in-up-delay-3 mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-white font-medium text-base transition-all hover:shadow-lg"
                style={{ background: "var(--sb-primary)" }}
              >
                {t.hero.cta}
                <IconArrowRight />
              </a>
              <a
                href="#tech"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-medium text-base border transition-colors"
                style={{ borderColor: "var(--sb-border)", color: "var(--sb-fg)" }}
              >
                {t.hero.ctaSecondary}
              </a>
            </div>
          </div>
        </div>

        {/* Decorative grid */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, #3B6FE8 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      </section>

      {/* ── WHATSAPP CRISIS ── */}
      <section id="problem" className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <p className="text-sm font-medium uppercase tracking-wider mb-3" style={{ color: "var(--sb-danger)" }}>
              {t.crisis.eyebrow}
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: "var(--sb-fg-strong)" }}>
              {t.crisis.title}
            </h2>
            <p className="mt-4 text-lg" style={{ color: "var(--sb-muted)" }}>
              {t.crisis.description}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Before */}
            <div className="rounded-2xl border p-6" style={{ borderColor: "var(--sb-border)", background: "var(--sb-card)" }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full" style={{ background: "var(--sb-success)" }} />
                <span className="text-sm font-semibold" style={{ color: "var(--sb-fg-strong)" }}>{t.crisis.before}</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--sb-muted)" }}>{t.crisis.beforeDetail}</p>
            </div>

            {/* After — highlighted */}
            <div className="rounded-2xl border-2 p-6 whatsapp-cost-pulse relative" style={{ borderColor: "var(--sb-danger)", background: "rgba(239,68,68,0.03)" }}>
              <div className="absolute -top-3 left-4 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white" style={{ background: "var(--sb-danger)" }}>
                <span className="flex items-center gap-1"><IconWarning /> 01/10/2026</span>
              </div>
              <div className="flex items-center gap-2 mb-4 mt-2">
                <div className="w-3 h-3 rounded-full" style={{ background: "var(--sb-danger)" }} />
                <span className="text-sm font-semibold" style={{ color: "var(--sb-danger)" }}>{t.crisis.after}</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--sb-muted)" }}>{t.crisis.afterDetail}</p>
            </div>

            {/* Impact */}
            <div className="rounded-2xl border p-6" style={{ borderColor: "var(--sb-border)", background: "var(--sb-card)" }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full" style={{ background: "var(--sb-warning)" }} />
                <span className="text-sm font-semibold" style={{ color: "var(--sb-fg-strong)" }}>{t.crisis.impact}</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--sb-muted)" }}>{t.crisis.impactDetail}</p>
            </div>
          </div>

          {/* Cost callout */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16">
            <div className="text-center">
              <div className="text-4xl font-bold" style={{ color: "var(--sb-danger)" }}>{t.crisis.costExample}</div>
              <div className="text-sm mt-1" style={{ color: "var(--sb-muted)" }}>{t.crisis.costLabel}</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold" style={{ color: "var(--sb-danger)" }}>{t.crisis.costBrazil}</div>
              <div className="text-sm mt-1" style={{ color: "var(--sb-muted)" }}>{t.crisis.costBrazilLabel}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOLUTION ── */}
      <section id="solution" className="py-20 sm:py-28" style={{ background: "var(--sb-canvas-chat)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <p className="text-sm font-medium uppercase tracking-wider mb-3" style={{ color: "var(--sb-primary)" }}>
              {t.solution.eyebrow}
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: "var(--sb-fg-strong)" }}>
              {t.solution.title}
            </h2>
            <p className="mt-4 text-lg" style={{ color: "var(--sb-muted)" }}>
              {t.solution.description}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { title: t.solution.point1, detail: t.solution.point1Detail, color: "var(--sb-primary)" },
              { title: t.solution.point2, detail: t.solution.point2Detail, color: "var(--sb-accent)" },
              { title: t.solution.point3, detail: t.solution.point3Detail, color: "var(--sb-info)" },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border" style={{ borderColor: "var(--sb-border)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg mb-4" style={{ background: item.color }}>
                  {i + 1}
                </div>
                <h3 className="font-semibold text-lg mb-2" style={{ color: "var(--sb-fg-strong)" }}>{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--sb-muted)" }}>{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <p className="text-sm font-medium uppercase tracking-wider mb-3" style={{ color: "var(--sb-primary)" }}>
              {t.features.eyebrow}
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: "var(--sb-fg-strong)" }}>
              {t.features.title}
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {t.features.items.map((item, i) => {
              const Icon = featureIcons[item.icon] || IconChat;
              return (
                <div
                  key={i}
                  className="group rounded-2xl border p-6 transition-all hover:shadow-md"
                  style={{ borderColor: "var(--sb-border)", background: "var(--sb-card)" }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-colors"
                    style={{ background: "rgba(59,111,232,0.08)", color: "var(--sb-primary)" }}
                  >
                    <Icon />
                  </div>
                  <h3 className="font-semibold mb-2" style={{ color: "var(--sb-fg-strong)" }}>{item.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--sb-muted)" }}>{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TECH STACK ── */}
      <section id="tech" className="py-20 sm:py-28" style={{ background: "var(--sb-canvas-chat)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <p className="text-sm font-medium uppercase tracking-wider mb-3" style={{ color: "var(--sb-primary)" }}>
              {t.tech.eyebrow}
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: "var(--sb-fg-strong)" }}>
              {t.tech.title}
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {t.tech.items.map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 text-center shadow-sm border" style={{ borderColor: "var(--sb-border)" }}>
                <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(59,111,232,0.08)" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="var(--sb-primary)" strokeWidth="1.5" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-1" style={{ color: "var(--sb-fg-strong)" }}>{item.name}</h3>
                <p className="text-xs" style={{ color: "var(--sb-muted)" }}>{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Architecture diagram */}
          <div className="mt-16 max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl border p-8 shadow-sm" style={{ borderColor: "var(--sb-border)" }}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
                <div className="text-center px-6 py-4 rounded-xl" style={{ background: "rgba(59,111,232,0.06)" }}>
                  <div className="text-sm font-semibold" style={{ color: "var(--sb-primary)" }}>Frontend</div>
                  <div className="text-xs mt-1" style={{ color: "var(--sb-muted)" }}>Next.js 16 · Port 3000</div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="var(--sb-muted)" strokeWidth="1.5" className="w-6 h-6 rotate-90 sm:rotate-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
                <div className="text-center px-6 py-4 rounded-xl" style={{ background: "rgba(46,173,106,0.06)" }}>
                  <div className="text-sm font-semibold" style={{ color: "var(--sb-accent)" }}>Backend</div>
                  <div className="text-xs mt-1" style={{ color: "var(--sb-muted)" }}>FastAPI · Port 8000</div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="var(--sb-muted)" strokeWidth="1.5" className="w-6 h-6 rotate-90 sm:rotate-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
                <div className="text-center px-6 py-4 rounded-xl" style={{ background: "rgba(59,130,246,0.06)" }}>
                  <div className="text-sm font-semibold" style={{ color: "var(--sb-info)" }}>Database</div>
                  <div className="text-xs mt-1" style={{ color: "var(--sb-muted)" }}>PostgreSQL · Port 5433</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HACKATHON ── */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-sm font-medium uppercase tracking-wider mb-3" style={{ color: "var(--sb-primary)" }}>
                {t.hackathon.eyebrow}
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: "var(--sb-fg-strong)" }}>
                {t.hackathon.title}
              </h2>
              <p className="mt-4 text-lg" style={{ color: "var(--sb-muted)" }}>
                {t.hackathon.description}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-2xl border p-6" style={{ borderColor: "var(--sb-border)" }}>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2" style={{ color: "var(--sb-fg-strong)" }}>
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: "rgba(59,111,232,0.08)", color: "var(--sb-primary)" }}>?</span>
                  {t.hackathon.challenge}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--sb-muted)" }}>{t.hackathon.challengeDetail}</p>
              </div>
              <div className="rounded-2xl border p-6" style={{ borderColor: "var(--sb-border)" }}>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2" style={{ color: "var(--sb-fg-strong)" }}>
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: "rgba(46,173,106,0.08)", color: "var(--sb-accent)" }}>✓</span>
                  {t.hackathon.fit}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--sb-muted)" }}>{t.hackathon.fitDetail}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DEMO CTA ── */}
      <section className="py-20 sm:py-28 landing-gradient">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            {t.demo.title}
          </h2>
          <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">
            {t.demo.description}
          </p>
          <a
            href="/"
            className="mt-8 inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white font-medium text-base transition-all hover:shadow-lg"
            style={{ color: "var(--sb-primary)" }}
          >
            {t.demo.cta}
            <IconArrowRight />
          </a>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-12 border-t" style={{ borderColor: "var(--sb-border)", background: "var(--sb-canvas-chat)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "var(--sb-primary)" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="w-4 h-4">
                    <path fillRule="evenodd" d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 4.014 1 5.426v5.148c0 1.413.993 2.672 2.43 2.902 1.168.188 2.352.327 3.55.414.28.02.521.18.642.413l1.713 3.293a.75.75 0 0 0 1.33 0l1.713-3.293a.783.783 0 0 1 .642-.413 41.102 41.102 0 0 0 3.55-.414c1.437-.23 2.43-1.49 2.43-2.902V5.426c0-1.413-.993-2.672-2.43-2.902A41.289 41.289 0 0 0 10 2Z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="font-semibold text-sm" style={{ color: "var(--sb-fg-strong)" }}>Sup Better Engine</span>
              </div>
              <p className="text-xs" style={{ color: "var(--sb-muted)" }}>
                {t.footer.built} Next.js + FastAPI + Postgres {t.footer.forThe} {t.footer.globalHackathon}
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--sb-fg-strong)" }}>{t.footer.docs}</h4>
              <ul className="space-y-2 text-xs" style={{ color: "var(--sb-muted)" }}>
                <li><a href="#" className="hover:text-[var(--sb-primary)] transition-colors">{t.footer.designSystem}</a></li>
                <li><a href="#" className="hover:text-[var(--sb-primary)] transition-colors">{t.footer.sdd}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--sb-fg-strong)" }}>{t.footer.stack}</h4>
              <div className="flex flex-wrap gap-2">
                {["Next.js 16", "React 19", "FastAPI", "PostgreSQL", "Tailwind CSS", "TypeScript"].map((tech) => (
                  <span key={tech} className="text-[10px] font-medium px-2 py-1 rounded-full" style={{ background: "rgba(59,111,232,0.06)", color: "var(--sb-primary)" }}>
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t text-center text-xs" style={{ borderColor: "var(--sb-border)", color: "var(--sb-muted)" }}>
            © 2026 Sup Better Engine — AI Tinkerers × OpenAI Global Hackathon
          </div>
        </div>
      </footer>
    </div>
  );
}
