import type { Metadata } from "next";
import Link from "next/link";
import CostCalculator from "./CostCalculator";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Terra — conversas que viram oportunidades | Sup Better",
  description:
    "Uma nova forma de transformar conversas em leads qualificados, com uma experiência própria e custo previsível.",
};

const pricingScenarios = [
  {
    volume: "1.000",
    label: "mensagens de serviço / mês",
    cost: "R$ 0",
    note: "franquia mensal da Meta",
  },
  {
    volume: "120 mil",
    label: "mensagens de serviço / mês",
    cost: "R$ 4.165",
    note: "custo Meta estimado / mês",
  },
  {
    volume: "1 milhão",
    label: "mensagens de serviço / mês",
    cost: "R$ 34.965",
    note: "custo Meta estimado / mês",
  },
];

const journey = [
  {
    step: "01",
    title: "O lead chega",
    text: "Link de campanha, QR code, bio ou WhatsApp. A origem já vem identificada.",
    icon: <LinkIcon />,
  },
  {
    step: "02",
    title: "A conversa acontece",
    text: "Um agente acolhe, entende intenção e conduz sem formulário na porta.",
    icon: <SparkIcon />,
  },
  {
    step: "03",
    title: "O time recebe contexto",
    text: "E-mail com consentimento, intenção, necessidade e atribuição em uma visão só.",
    icon: <ChartIcon />,
  },
];

const proofPoints = [
  ["Canal próprio", "A conversa vive na sua experiência — não no limite de uma plataforma."],
  ["Identidade com contexto", "E-mail, consentimento e intenção conectados no momento certo."],
  ["Decisões com evidência", "Atribuição por campanha e backoffice para acompanhar o que converte."],
];

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

export default function TerraLandingPage() {
  return (
    <main className={`min-h-screen overflow-hidden bg-[#f6f6ef] text-[#10211d] ${styles.terra}`}>
      <section className="relative isolate overflow-hidden bg-[#0e211c] pb-16 pt-5 text-[#f7f5eb] sm:pb-20 lg:pb-28">
        <div aria-hidden="true" className={styles.heroOrb} />
        <div aria-hidden="true" className={styles.heroGlow} />
        <div aria-hidden="true" className={styles.heroGrid} />

        <nav aria-label="Navegação principal" className="relative mx-auto flex max-w-7xl items-center justify-between px-5 py-3 sm:px-8">
          <a href="#inicio" className="flex items-center gap-2.5 rounded-md focus-visible:outline-offset-4">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#c8ff4d] text-sm font-black text-[#0e211c]">T</span>
            <span className="text-sm font-semibold tracking-[0.16em]">TERRA</span>
          </a>
          <div className="hidden items-center gap-7 text-sm text-[#c5d0c9] md:flex">
            <a className="transition-colors hover:text-white" href="#impacto">O impacto</a>
            <a className="transition-colors hover:text-white" href="#calculadora">Simulador</a>
            <a className="transition-colors hover:text-white" href="#produto">Como funciona</a>
            <a className="transition-colors hover:text-white" href="#hackathon">Hackathon</a>
          </div>
          <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold transition hover:border-[#c8ff4d] hover:bg-[#c8ff4d] hover:text-[#10211d]">
            Ver a demo <ArrowIcon />
          </Link>
        </nav>

        <div id="inicio" className="relative mx-auto grid max-w-7xl gap-12 px-5 pt-14 sm:px-8 lg:grid-cols-[1.03fr_.97fr] lg:items-center lg:gap-16 lg:pt-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#c8ff4d]/25 bg-[#c8ff4d]/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-[#dcff99]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#c8ff4d]" />
              Agents, Everywhere — Impacta, São Paulo
            </div>
            <h1 className="mt-7 max-w-3xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-balance sm:text-6xl lg:text-7xl">
              Quando conversar custa mais, cada conversa precisa valer mais.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#c5d0c9] sm:text-xl">
              Terra é a nova experiência do Sup Better para transformar o clique em uma conversa própria, qualificada e mensurável — sem fazer da sua operação refém de cada mensagem.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#c8ff4d] px-6 py-3.5 text-sm font-bold text-[#10211d] transition hover:bg-[#e0ff9b] focus-visible:outline-[#c8ff4d]">
                Experimentar o agente <ArrowIcon />
              </Link>
              <a href="#impacto" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3.5 text-sm font-semibold text-white transition hover:border-white/50 hover:bg-white/10">
                Entender a mudança
              </a>
            </div>
            <p className="mt-5 text-xs leading-5 text-[#93a49d]">Uma proposta para validar a mudança de canal com dados reais — não com achismo.</p>
          </div>

          <div className="relative mx-auto w-full max-w-[31rem] lg:mr-0">
            <div className={`${styles.floatSlow} absolute -right-6 -top-5 hidden rounded-full border border-white/10 bg-[#16352b] px-4 py-2 text-xs font-medium text-[#dcff99] shadow-xl sm:block`}>
              <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[#c8ff4d]" />lead em conversa
            </div>
            <div className="rounded-[2rem] border border-white/15 bg-[#f7f5eb] p-3 shadow-2xl shadow-black/25">
              <div className="overflow-hidden rounded-[1.45rem] bg-[#e8eee4] text-[#10211d]">
                <div className="flex items-center justify-between border-b border-[#d5ded4] px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-[#10211d] text-xs font-bold text-[#c8ff4d]">S</span>
                    <div>
                      <p className="text-sm font-semibold">Sup Better</p>
                      <p className="text-[11px] text-[#65736b]">Assistente comercial</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-[#d7eeae] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#315022]">online</span>
                </div>
                <div className="space-y-4 px-5 py-7">
                  <div className="max-w-[82%] rounded-2xl rounded-tl-sm bg-white px-4 py-3 text-sm leading-5 shadow-sm">Olá! Posso entender o que você procura e encontrar o melhor próximo passo?</div>
                  <div className="ml-auto max-w-[79%] rounded-2xl rounded-tr-sm bg-[#10211d] px-4 py-3 text-sm leading-5 text-white">Quero reduzir o volume do meu atendimento no WhatsApp.</div>
                  <div className="max-w-[86%] rounded-2xl rounded-tl-sm bg-white px-4 py-3 text-sm leading-5 shadow-sm">Perfeito. Hoje o maior volume é suporte, vendas ou agendamentos?</div>
                  <div className="flex items-center gap-2 pt-2 text-[11px] font-medium text-[#547548]">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-[#d7eeae]"><CheckIcon /></span>
                    intenção identificada · conversa atribuída
                  </div>
                </div>
                <div className="border-t border-[#d5ded4] px-5 py-4">
                  <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-sm text-[#829087] shadow-sm">
                    Escreva sua mensagem… <span className="grid h-6 w-6 place-items-center rounded-full bg-[#c8ff4d] text-[#10211d]"><ArrowIcon /></span>
                  </div>
                </div>
              </div>
            </div>
            <div className={`${styles.floatFast} absolute -bottom-6 -left-4 rounded-2xl border border-[#d5ded4] bg-white p-3.5 shadow-xl shadow-[#10211d]/10 sm:-left-10`}>
              <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#75847c]">Próximo passo</p>
              <p className="mt-1 text-sm font-semibold">Lead qualificado</p>
              <p className="mt-0.5 text-xs text-[#547548]">com contexto, não só contato</p>
            </div>
          </div>
        </div>
      </section>

      <section id="impacto" className="bg-[#f6f6ef] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#55814e]">A virada de preço</p>
              <h2 className="mt-4 max-w-xl text-4xl font-semibold leading-[1.02] tracking-[-0.045em] text-[#10211d] sm:text-5xl">A janela de 24 horas continua. A gratuidade, não.</h2>
            </div>
            <div className="max-w-2xl text-base leading-7 text-[#4d5c55] sm:text-lg">
              Desde <strong className="font-semibold text-[#10211d]">1º de outubro de 2026</strong>, mensagens de serviço enviadas pela WhatsApp Business Platform/API passaram a ser cobradas. A conversa iniciada pelo cliente ainda abre a janela de atendimento; o que mudou é que responder dentro dela agora tem preço por mensagem.
            </div>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            <article className="rounded-3xl border border-[#d6ddd0] bg-white p-6 sm:p-7">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6c7b72]">Nova referência Brasil</p>
              <p className="mt-5 text-5xl font-semibold tracking-[-0.06em] text-[#10211d]">R$ 0,035</p>
              <p className="mt-2 text-sm leading-6 text-[#5e6c64]">por mensagem de serviço entregue, na tarifa de lista da Meta.</p>
            </article>
            <article className="rounded-3xl bg-[#ddff97] p-6 sm:p-7">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#41643b]">Franquia preservada</p>
              <p className="mt-5 text-5xl font-semibold tracking-[-0.06em] text-[#10211d]">1.000</p>
              <p className="mt-2 text-sm leading-6 text-[#38523a]">mensagens de serviço gratuitas por número comercial, a cada mês.</p>
            </article>
            <article className="rounded-3xl bg-[#10211d] p-6 text-[#f7f5eb] sm:p-7">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#b5c5b9]">O que não muda</p>
              <p className="mt-5 text-2xl font-semibold leading-tight tracking-[-0.04em]">O app WhatsApp Business comum não entra nessa cobrança.</p>
              <p className="mt-3 text-sm leading-6 text-[#c5d0c9]">A alteração se aplica à plataforma/API, CRMs e automações conectadas a ela.</p>
            </article>
          </div>

          <div className="mt-16 overflow-hidden rounded-[2rem] border border-[#d6ddd0] bg-[#eef1e8] p-5 sm:p-8 lg:p-10">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#55814e]">Escala muda a conversa</p>
                <h3 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-[#10211d] sm:text-4xl">Não é uma taxa pequena quando se repete milhares de vezes.</h3>
              </div>
              <p className="max-w-sm text-sm leading-6 text-[#5e6c64]">Simulação com tarifa Meta de R$ 0,035 e a franquia mensal de 1.000 mensagens. Não inclui custos de BSP/CRM, IA ou operação.</p>
            </div>
            <div className="mt-8 grid gap-3 md:grid-cols-3">
              {pricingScenarios.map((scenario, index) => (
                <div key={scenario.volume} className={`rounded-2xl p-5 ${index === 1 ? "bg-[#10211d] text-white" : "border border-[#d6ddd0] bg-white"}`}>
                  <p className={`text-sm font-semibold ${index === 1 ? "text-[#dcff99]" : "text-[#10211d]"}`}>{scenario.volume}</p>
                  <p className={`mt-1 text-xs ${index === 1 ? "text-[#b5c5b9]" : "text-[#6c7b72]"}`}>{scenario.label}</p>
                  <p className="mt-6 text-3xl font-semibold tracking-[-0.05em]">{scenario.cost}</p>
                  <p className={`mt-1 text-xs ${index === 1 ? "text-[#b5c5b9]" : "text-[#6c7b72]"}`}>{scenario.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <CostCalculator />

      <section id="produto" className="border-y border-[#1e3a30] bg-[#16352b] py-20 text-[#f7f5eb] sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-20">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#dcff99]">Uma escolha de arquitetura e experiência</p>
              <h2 className="mt-4 text-4xl font-semibold leading-[1.02] tracking-[-0.05em] sm:text-5xl">WhatsApp pode abrir a porta. A relação acontece no seu terreno.</h2>
            </div>
            <p className="self-end text-lg leading-8 text-[#c5d0c9]">Terra não exige que o cliente mude de hábito de uma vez. O link de campanha vem do WhatsApp, do seu site ou da mídia. A partir do clique, você controla a experiência, os dados e a forma de transformar conversa em oportunidade.</p>
          </div>

          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            {journey.map((item) => (
              <article key={item.step} className="group rounded-3xl border border-white/15 bg-white/[0.04] p-6 transition duration-300 hover:-translate-y-1 hover:border-[#c8ff4d]/50 hover:bg-white/[0.07] sm:p-7">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#dcff99]">{item.step}</span>
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#c8ff4d] text-[#10211d]">{item.icon}</span>
                </div>
                <h3 className="mt-10 text-2xl font-semibold tracking-[-0.035em]">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#c5d0c9]">{item.text}</p>
              </article>
            ))}
          </div>

          <div className="mt-5 grid gap-3 rounded-3xl border border-white/15 bg-[#0e211c] p-5 sm:grid-cols-3 sm:gap-0 sm:p-0">
            {proofPoints.map(([title, text], index) => (
              <div key={title} className={`px-4 py-4 sm:px-7 sm:py-7 ${index > 0 ? "sm:border-l sm:border-white/15" : ""}`}>
                <div className="flex items-center gap-2 text-sm font-semibold text-[#dcff99]"><CheckIcon />{title}</div>
                <p className="mt-2 text-sm leading-6 text-[#c5d0c9]">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="hackathon" className="relative overflow-hidden bg-[#e6c4a9] py-20 sm:py-28">
        <div aria-hidden="true" className={styles.orangeSun} />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[1.1fr_.9fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#10211d]/15 bg-[#f6f6ef]/65 px-3 py-1.5 text-xs font-bold tracking-wide text-[#10211d]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ea5044]" /> 12 de setembro de 2026 · Impacta, São Paulo
            </div>
            <h2 className="mt-7 max-w-3xl text-5xl font-semibold leading-[0.98] tracking-[-0.06em] text-[#10211d] sm:text-6xl">Um agente no lugar onde o trabalho já acontece.</h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#3e5148]">Terra é a nossa resposta para <em className="font-medium">Agents, Everywhere</em>, o hackathon global da AI Tinkerers com OpenAI: um agente que chega pelo canal certo, conversa com contexto e cria valor sem aumentar a dependência da empresa de plataformas alheias.</p>
          </div>
          <div className="rounded-[2rem] border border-[#10211d]/15 bg-[#f6f6ef]/80 p-7 shadow-[0_20px_60px_rgba(81,50,36,.12)] sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#5a6d60]">O que estamos demonstrando</p>
            <ul className="mt-6 space-y-4 text-sm leading-6 text-[#2e4138]">
              <li className="flex gap-3"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#10211d] text-[#c8ff4d]"><CheckIcon /></span>Uma alternativa de canal que respeita a experiência do lead.</li>
              <li className="flex gap-3"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#10211d] text-[#c8ff4d]"><CheckIcon /></span>Qualificação e identificação sem interromper a conversa.</li>
              <li className="flex gap-3"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#10211d] text-[#c8ff4d]"><CheckIcon /></span>Uma base para comparar custo, adoção e qualidade de lead com dados reais.</li>
            </ul>
            <Link href="/" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-[#10211d] underline decoration-[#ea5044] decoration-2 underline-offset-4 transition hover:text-[#ea5044]">Abrir o protótipo ao vivo <ArrowIcon /></Link>
          </div>
        </div>
      </section>

      <section className="bg-[#f6f6ef] py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-5 text-center sm:px-8">
          <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#55814e]">Mais conversa, menos dependência</p>
          <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-semibold leading-[1.02] tracking-[-0.055em] text-[#10211d] sm:text-5xl">A próxima mensagem pode custar. A próxima relação pode ser sua.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#5e6c64]">Conheça o agente e veja uma conversa de ponta a ponta: clique, intenção, contexto e lead qualificado.</p>
          <Link href="/" className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#10211d] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#28513f]">
            Ver Sup Better em ação <ArrowIcon />
          </Link>
        </div>
      </section>

      <footer className="border-t border-[#d6ddd0] bg-[#eef1e8] py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 text-xs leading-5 text-[#607067] sm:flex-row sm:items-end sm:justify-between sm:px-8">
          <p><span className="font-bold tracking-[0.13em] text-[#10211d]">TERRA</span> · Uma experiência Sup Better Engine para AI Tinkerers × OpenAI.</p>
          <p className="max-w-xl sm:text-right">Fonte de preços: tabela da WhatsApp Business Platform, vigente em 01/10/2026. Tarifas podem variar por mercado e são atualizadas pela Meta. <a className="font-medium text-[#315c36] underline underline-offset-2" href="https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing" target="_blank" rel="noreferrer">Consultar a documentação</a>.</p>
        </div>
      </footer>
    </main>
  );
}
