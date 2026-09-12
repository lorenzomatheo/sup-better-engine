# DRAFT — Plataforma de conversa com lead (pós-WhatsApp)

**Slug:** `plataforma-conversa-lead`
**Status:** Ready — cristalizado em [DESIGN.md](DESIGN.md)
**WRS:** 100/100 — Problem ✅ | Scope ✅ | Decisions ✅ | Risks ✅ | Criteria ✅

---

## Problem (✅)

Empresas conversam com leads pelo WhatsApp. O WhatsApp resolve o alcance
(todo mundo já usa) mas limita a interação — não dá para montar
experiência rica, e a identidade do lead fica bagunçada. Uma empresa com
base grande acaba disparando marketing para o cliente errado, ou
disparando duas vezes para o que na verdade é uma pessoa só.

A aposta: um canal próprio, acessado por link, onde um agente conversa com
o lead com todos os recursos que o WhatsApp não permite — e onde a
identidade do lead é resolvida na porta de entrada.

> "A primeira coisa que eles compram é a experiência."

---

## Vocabulário

| Termo | Significa |
|-------|-----------|
| **Tenant** | A empresa que contrata a plataforma (nosso cliente pagante) |
| **Lead** | A pessoa que conversa com o agente (cliente do tenant) |
| **Agente** | O interlocutor automatizado da plataforma |
| **Atendente** | O humano do tenant que assume a conversa ao vivo |

---

## Decisions

### Fechadas

| # | Decisão | Racional |
|---|---------|----------|
| **D1** | **Fatia inicial: vertical fina.** Link → chat com agente → identificação mínima na porta, ponta a ponta. | Prova a premissa mais arriscada (R1) antes de investir em identidade sofisticada ou mídia ao vivo. |
| **D2** | **Um tenant piloto primeiro.** Multi-tenant só quando houver segunda demanda comprovada. | Elimina a pergunta "o mesmo lead em dois tenants é a mesma pessoa?" — que dobraria a complexidade de identidade sem evidência de que precisamos dela hoje. |
| **D3** | **WhatsApp é porta de entrada, não canal.** Auto-resposta entrega link estático; zero integração de API; zero sincronização de estado entre canais. | Sincronização bidirecional é dos custos mais caros que existem, e o cenário descrito como ideal já é site → nossa plataforma. |
| **D4** | **E-mail é a chave primária de identidade do lead.** | Mais estável que telefone ao longo do tempo e único de verdade. Ver D3-a: não herdamos telefone de canal nenhum, então o atrito é igual para qualquer identificador. |

### D3-a — Consequência derivada de D3 (importante)

Link estático significa que **não sabemos quem clicou**. Todo lead chega
anônimo, venha do site, do Google ou do WhatsApp. Consequências:

- O canal de origem vira um parâmetro `?origem=` na URL, só para atribuição.
- O "subsistema de integração WhatsApp" deixa de existir na fatia 1.
- Não há atalho de identificação: pedir o identificador é obrigatório em
  todos os caminhos de entrada.

### Abertas — bloqueando o refinamento

- **D5 — Job-to-be-done do agente.** O que o agente efetivamente faz na
  conversa. Sem isso não existe critério de aceite testável.
- **D6 — Momento e contrapartida da identificação.** Quando pedimos o
  e-mail e o que o lead ganha em troca.
- **D7 — Stack.** Repositório vazio, nada decidido.

---

## Scope (parcial — depende de D5)

### IN — fatia 1

- Landing por link único, com `?origem=` para atribuição.
- Mini tela de entrada: identificação por e-mail + espaço de oferta.
- Conversa com o agente.
- Registro do lead identificado, deduplicado por e-mail.
- Um tenant piloto.

### OUT — sub-projetos posteriores

| # | Sub-projeto | Por que fica fora agora |
|---|------------|------------------------|
| 2 | Carrossel e botões interativos | Diferencial, não premissa. Entra depois que R1 for provado. |
| 3 | Handoff ao vivo + presença ("bolinha") | Subsistema próprio, exige disponibilidade humana. |
| 4 | Áudio e vídeo no modal | O mais caro de todos (infra de mídia). |
| 5 | Admin do tenant / autosserviço | Um tenant piloto é configurado à mão. |
| 6 | Disparo de marketing / campanhas | É o *consumidor* da identidade, não produtor. Traz LGPD junto (R5). |
| 7 | Multi-tenant | Ver D2. |

Explicitamente fora, por restrição do usuário: endereço, cadastro completo,
qualquer formulário longo.

---

## Risks / Assumptions (✅)

- **R1 — Premissa central, não confirmada.** O lead aceita sair do WhatsApp
  e conversar num link. Sustenta o produto inteiro; se cair, isto vira "mais
  um widget de site". A fatia 1 existe para testar exatamente isto.
- **R2 — Atrito do e-mail na porta.** E-mail tem atrito maior que telefone
  para um lead que veio do WhatsApp, e é mais fácil de digitar errado ou
  descartável. Mitigação candidata: contrapartida na mini tela (D6).
- **R3 — Identidade com poucos dados é ambígua por construção.** E-mail
  resolve muito, mas não resolve a pessoa que usa dois e-mails.
- **R4 — Paridade com WhatsApp é um baseline maior do que parece.** O lead
  compara com o WhatsApp, não com o nada.
- **R5 — LGPD entra em escopo** assim que identidade + contato existirem
  juntos com intenção de disparo: consentimento, base legal, opt-out.
  Fatia 1 já coleta e-mail, então o consentimento nasce aqui, mesmo com o
  disparo fora de escopo.
- **R6 — Assumido, não confirmado:** o tenant piloto existe e está disposto
  a mandar tráfego real. Sem tráfego real, R1 não é testável.

---

## Criteria

Nenhum critério testável ainda — depende de D5.

---

## Itens carregados para o WISH (não bloqueiam o design)

Levantados no review r4, que retornou SHIP classificando-os como
wish-level. Não entraram no DESIGN.md para não invalidar o digest de
evidência.

1. **Agregação mensagem → sessão está indefinida.** O contrato do
   classificador é `mensagem → (intencao, quer_humano)`, mas ambos são
   dimensões de bucket em nível de sessão. Se `quer_humano` da sessão for
   "qualquer mensagem verdadeira", o FPR compõe — 5% por mensagem ao longo de
   6 mensagens dá ≈26% — e o critério 11 importaria TPR/FPR de mensagem para
   uma correção de sessão. Resolver com uma frase antes de escrever código:
   a sessão herda a classificação da primeira mensagem que produz rótulo.
   **É o item de maior valor da lista.**
2. **Falta piso de TPR.** `p̂ = (obs − FPR) ÷ (TPR − FPR)` é o estimador de
   Rogan-Gladen correto, mas o denominador não tem limite inferior. Adicionar:
   se `TPR − FPR < 0,3`, a taxa corrigida não é reportável e o gatilho assume
   deferir.
3. **Caminho de emissão do critério 7.** Requisição barrada na borda por IP
   não tem linha de sessão. Garantir que a sessão seja criada e marcada antes
   de o limite ser aplicado.
4. **Taxa corrigida de `quer_humano` é indicativa em N=200.** Com ~150
   sessões engajadas o IC fica em ±15pp, então o gatilho de 15% só dispara
   perto de 25–30% de prevalência real. O wish deve rotulá-la como indicativa,
   como já se faz com `origem × intencao`. Falha conservadora — deferir o
   subsistema mais caro é a direção certa de errar.
5. **Estrutura do wish:** dividir o Scope IN em ~4 grupos de execução, não um.
6. Carregar a seção "O que esta fatia NÃO resolve" literalmente para o
   WISH.md.

## Log

- **2026-09-12** — Brainstorm aberto a partir de transcrição de conversa.
  Problem capturado. Scope-size check disparou decomposição em 7
  sub-projetos. D1–D4 fechadas com o usuário; D3-a derivada. Risks
  preenchido. WRS 20 → 40. Aguardando D5–D7.
- **2026-09-12** — D5–D7 respondidas. Duas colisões sinalizadas e resolvidas
  com o usuário: (a) os 4 jobs contra a fatia fina → classificador de intenção
  como espinha, um handler real; (b) "anônimo primeiro" contra "identificação
  na porta" → pedido contextual no meio da conversa, métrica vira taxa por
  sessão. Simplicity Gate cortou os 3 stubs em favor de um fallback único e
  exigiu contadores anônimos para preservar o denominador da métrica.
  WRS 40 → 100. Cristalizado em DESIGN.md.
- **2026-09-12** — Quatro rodadas de design review independente.
  r1 FIX-FIRST (11 itens), r2 FIX-FIRST (9 de 11 fechados, 8 novos),
  r3 FIX-FIRST (8 de 8 fechados, 8 novos), **r4 SHIP**. Achado de maior
  valor: o gatilho de `quer_humano` disparava com ruído de classificador
  numa classe minoritária, governando o subsistema mais caro do portfólio.
  Correções que encolheram escopo: detecção de bot removida, consentimento
  virou porta de envio, finalidade estreitada à fatia 1. Evidência SHIP
  carimbada e verificada. Wish bloqueado até R2 ser confirmado.
