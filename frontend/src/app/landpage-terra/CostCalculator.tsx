"use client";

import { useMemo, useState } from "react";
import styles from "./page.module.css";

const formatCurrency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatNumber = new Intl.NumberFormat("pt-BR");

const formatServiceRate = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

function CalculatorIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <rect x="4" y="2.75" width="16" height="18.5" rx="2.25" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 7.5h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path d="M4 10h11M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function CostCalculator() {
  const [monthlyConversations, setMonthlyConversations] = useState(10000);
  const [messagesPerConversation, setMessagesPerConversation] = useState(8);
  const [serviceRate, setServiceRate] = useState(0.035);
  const [ownedChannelCost, setOwnedChannelCost] = useState(450);
  const [qualificationRate, setQualificationRate] = useState(20);

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
    <section id="calculadora" className="border-t border-[#d6ddd0] bg-[#eef1e8] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.15em] text-[#55814e]">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#ddff97] text-[#254321]"><CalculatorIcon /></span>
              Simulador transparente
            </div>
            <h2 className="mt-5 text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-[#10211d] sm:text-5xl">Coloque o volume da sua operação na conta.</h2>
          </div>
          <p className="max-w-2xl text-base leading-7 text-[#4d5c55] sm:text-lg">A calculadora separa o custo Meta do custo operacional do canal próprio. Ajuste as variáveis para transformar uma hipótese de migração em uma conversa de negócio mais concreta.</p>
        </div>

        <div className="mt-12 grid gap-5 xl:grid-cols-[.94fr_1.06fr]">
          <form className="rounded-[2rem] border border-[#d6ddd0] bg-white p-6 shadow-[0_18px_50px_rgba(24,48,39,.06)] sm:p-8" onSubmit={(event) => event.preventDefault()}>
            <div className="flex items-start justify-between gap-4 border-b border-[#e2e7df] pb-6">
              <div>
                <h3 className="text-xl font-semibold tracking-[-0.03em] text-[#10211d]">Premissas da operação</h3>
                <p className="mt-1 text-sm leading-6 text-[#65736b]">Todos os valores são editáveis e a franquia de 1.000 mensagens já está no cálculo.</p>
              </div>
              <span className="rounded-full bg-[#eef1e8] px-3 py-1 text-xs font-semibold text-[#41643b]">mensal</span>
            </div>

            <div className="mt-7 space-y-7">
              <div>
                <div className="flex items-end justify-between gap-5">
                  <label htmlFor="monthly-conversations" className="text-sm font-semibold text-[#243a31]">Conversas por mês</label>
                  <output htmlFor="monthly-conversations" className="text-lg font-semibold tracking-[-0.03em] text-[#10211d]">{formatNumber.format(monthlyConversations)}</output>
                </div>
                <input id="monthly-conversations" className={`mt-3 ${styles.calculatorRange}`} type="range" min="1000" max="100000" step="1000" value={monthlyConversations} onChange={(event) => setMonthlyConversations(Number(event.target.value))} />
                <div className="mt-2 flex justify-between text-[11px] font-medium text-[#7a8980]"><span>1 mil</span><span>50 mil</span><span>100 mil</span></div>
              </div>

              <div>
                <div className="flex items-end justify-between gap-5">
                  <label htmlFor="messages-per-conversation" className="text-sm font-semibold text-[#243a31]">Mensagens da empresa por conversa</label>
                  <output htmlFor="messages-per-conversation" className="text-lg font-semibold tracking-[-0.03em] text-[#10211d]">{messagesPerConversation}</output>
                </div>
                <input id="messages-per-conversation" className={`mt-3 ${styles.calculatorRange}`} type="range" min="1" max="20" step="1" value={messagesPerConversation} onChange={(event) => setMessagesPerConversation(Number(event.target.value))} />
                <div className="mt-2 flex justify-between text-[11px] font-medium text-[#7a8980]"><span>1 · resposta rápida</span><span>8 · qualificação</span><span>20 · suporte</span></div>
              </div>

              <div>
                <div className="flex items-end justify-between gap-5">
                  <label htmlFor="service-rate" className="text-sm font-semibold text-[#243a31]">Tarifa Meta por mensagem de serviço</label>
                  <output htmlFor="service-rate" className="text-lg font-semibold tracking-[-0.03em] text-[#10211d]">{formatServiceRate.format(serviceRate)}</output>
                </div>
                <input id="service-rate" className={`mt-3 ${styles.calculatorRange}`} type="range" min="0.01" max="0.1" step="0.005" value={serviceRate} onChange={(event) => setServiceRate(Number(event.target.value))} />
                <div className="mt-2 flex justify-between text-[11px] font-medium text-[#7a8980]"><span>R$ 0,010</span><span>R$ 0,035 · Brasil</span><span>R$ 0,100</span></div>
              </div>

              <div>
                <div className="flex items-end justify-between gap-5">
                  <label htmlFor="owned-channel-cost" className="text-sm font-semibold text-[#243a31]">Custo próprio estimado: infra + IA</label>
                  <output htmlFor="owned-channel-cost" className="text-lg font-semibold tracking-[-0.03em] text-[#10211d]">{formatCurrency.format(ownedChannelCost)}</output>
                </div>
                <input id="owned-channel-cost" className={`mt-3 ${styles.calculatorRange}`} type="range" min="0" max="5000" step="50" value={ownedChannelCost} onChange={(event) => setOwnedChannelCost(Number(event.target.value))} />
                <div className="mt-2 flex justify-between text-[11px] font-medium text-[#7a8980]"><span>R$ 0</span><span>R$ 2,5 mil</span><span>R$ 5 mil</span></div>
              </div>

              <div>
                <div className="flex items-end justify-between gap-5">
                  <label htmlFor="qualification-rate" className="text-sm font-semibold text-[#243a31]">Taxa estimada de leads qualificados</label>
                  <output htmlFor="qualification-rate" className="text-lg font-semibold tracking-[-0.03em] text-[#10211d]">{qualificationRate}%</output>
                </div>
                <input id="qualification-rate" className={`mt-3 ${styles.calculatorRange}`} type="range" min="5" max="80" step="5" value={qualificationRate} onChange={(event) => setQualificationRate(Number(event.target.value))} />
                <div className="mt-2 flex justify-between text-[11px] font-medium text-[#7a8980]"><span>5%</span><span>20%</span><span>80%</span></div>
              </div>
            </div>
          </form>

          <div className="grid gap-5">
            <div aria-live="polite" className="overflow-hidden rounded-[2rem] bg-[#10211d] p-6 text-[#f7f5eb] shadow-[0_18px_50px_rgba(16,33,29,.16)] sm:p-8">
              <div className="flex flex-col justify-between gap-4 border-b border-white/15 pb-6 sm:flex-row sm:items-start">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#dcff99]">Pressão de mensageria</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Custo direto da Meta</h3>
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-[#c5d0c9]">após 1.000 grátis</span>
              </div>
              <div className="mt-7 grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#b5c5b9]">Mensagens faturáveis</p>
                  <p className="mt-2 text-3xl font-semibold tracking-[-0.055em] text-white">{formatNumber.format(calculation.billableMessages)}</p>
                  <p className="mt-1 text-xs leading-5 text-[#b5c5b9]">franquia mensal descontada</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#b5c5b9]">Custo mensal estimado</p>
                  <p className="mt-2 text-3xl font-semibold tracking-[-0.055em] text-[#dcff99]">{formatCurrency.format(calculation.metaMonthlyCost)}</p>
                  <p className="mt-1 text-xs leading-5 text-[#b5c5b9]">somente tarifa Meta</p>
                </div>
              </div>
            </div>

            <div aria-live="polite" className={`rounded-[2rem] border p-6 sm:p-8 ${hasSavings ? "border-[#b6dc7e] bg-[#ddff97]" : "border-[#e8c5bb] bg-[#f6e1db]"}`}>
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <p className={`text-xs font-bold uppercase tracking-[0.14em] ${hasSavings ? "text-[#41643b]" : "text-[#8c4433]"}`}>{hasSavings ? "Potencial de economia" : "Ponto de equilíbrio"}</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#10211d]">{hasSavings ? "O canal próprio abre margem." : "O volume ainda não cobre o custo próprio."}</h3>
                </div>
                <span className="rounded-full bg-white/55 px-3 py-1.5 text-xs font-bold text-[#10211d]">{calculation.differencePercentage.toFixed(1)}%</span>
              </div>
              <div className="mt-7 grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#4d5c55]">{hasSavings ? "Diferença mensal" : "Diferença mensal a cobrir"}</p>
                  <p className="mt-2 text-3xl font-semibold tracking-[-0.055em] text-[#10211d]">{formatCurrency.format(Math.abs(calculation.monthlyDifference))}</p>
                  <p className="mt-1 text-xs leading-5 text-[#4d5c55]">Meta vs. seu custo operacional estimado</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#4d5c55]">Impacto anual</p>
                  <p className="mt-2 text-3xl font-semibold tracking-[-0.055em] text-[#10211d]">{formatCurrency.format(Math.abs(calculation.annualDifference))}</p>
                  <p className="mt-1 text-xs leading-5 text-[#4d5c55]">projeção simples de 12 meses</p>
                </div>
              </div>
            </div>

            <div aria-live="polite" className="grid gap-4 rounded-[2rem] border border-[#d6ddd0] bg-white p-6 sm:grid-cols-[1fr_1px_1fr] sm:items-center sm:p-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#55814e]">Custo por lead qualificado</p>
                <p className="mt-2 text-sm leading-6 text-[#65736b]">Com {formatNumber.format(calculation.qualifiedLeads)} leads qualificados projetados por mês:</p>
              </div>
              <div aria-hidden="true" className="hidden h-16 bg-[#e2e7df] sm:block" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#7a8980]">Meta</p>
                  <p className="mt-1 text-xl font-semibold tracking-[-0.04em] text-[#10211d]">{formatCurrency.format(calculation.metaCostPerQualifiedLead)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#7a8980]">Canal próprio</p>
                  <p className="mt-1 text-xl font-semibold tracking-[-0.04em] text-[#10211d]">{formatCurrency.format(calculation.ownedCostPerQualifiedLead)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-[#d6ddd0] bg-[#f6f6ef] px-5 py-4 text-xs leading-5 text-[#607067] sm:flex-row sm:items-center sm:justify-between">
          <p>Metodologia: <strong className="font-semibold text-[#30443a]">conversas × mensagens da empresa − 1.000 mensagens gratuitas</strong>, multiplicado pela tarifa selecionada. O canal próprio é uma estimativa configurável, não uma tabela de preços.</p>
          <a className="inline-flex shrink-0 items-center gap-1.5 font-semibold text-[#315c36] underline underline-offset-4" href="https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing" target="_blank" rel="noreferrer">Ver fonte Meta <ArrowIcon /></a>
        </div>
      </div>
    </section>
  );
}
