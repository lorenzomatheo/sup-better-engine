# Design: Plataforma de conversa com lead — fatia 1

| Field | Value |
|-------|-------|
| **Slug** | `plataforma-conversa-lead` |
| **Date** | 2026-09-12 |
| **WRS** | 100/100 |
| **Revisão** | r9 — r8 recebeu FIX-FIRST (8 achados, 4 bloqueantes). Rate limit acoplado ao teto, que o r8 deixara maior que ele e portanto inalcançável; vazamento do numerador de *abertura do link* para `desconhecido` declarado e a assimetria de leitura corrigida; go/no-go ganhou evidência nomeada capaz de sustentar adoção **positiva**, sem a qual só era pré-registrável na direção do no-go; reconciliação do contador separada em teste de código e desigualdade em quiescência; população do baseline unificada numa regra só |

## Problem

Empresas conversam com leads pelo WhatsApp, que resolve alcance mas limita a
riqueza da interação e produz identidade bagunçada — uma base grande acaba
disparando marketing para o lead errado, ou duas vezes para o que é uma
pessoa só.

Importa porque os dois problemas são o mesmo problema: sem um canal próprio,
não há nem experiência diferenciada nem identidade confiável. Esta fatia
testa a premissa que sustenta tudo — se o lead aceita sair do WhatsApp e
conversar num link nosso.

### O que esta fatia NÃO resolve

Declarado de frente, porque é o problema que motivou o projeto: **a fatia 1
não resolve identidade única — ela evita piorá-la.** Com e-mail como único
identificador, a plataforma garante "mesmo e-mail → mesmo lead" e nada além
disso. A mesma pessoa com dois e-mails produz dois leads, e a plataforma é
incapaz de perceber. Detectar duplicidade exige um segundo identificador,
que esta fatia deliberadamente não coleta.

A ordem é intencional: resolver identidade num canal que ninguém usa é
capital morto. R1 vem primeiro. Mas a fatia já assenta o substrato — chave
única de e-mail normalizado, consentimento registrado, lead durável — sobre o
qual a resolução de identidade é construída depois.

**Esta seção deve ser carregada literalmente para o WISH.md.**

### Vocabulário

| Termo | Significa |
|-------|-----------|
| **Tenant** | A empresa que contrata a plataforma (cliente pagante) |
| **Lead** | A pessoa que conversa com o agente (cliente do tenant) |
| **Agente** | O interlocutor automatizado da plataforma |
| **Sessão** | Uma visita ao link, anônima até a identificação |

## Scope

### IN

- Landing por link único, com `?origem=` para atribuição (site, WhatsApp, busca).
- Chat com o agente, iniciando **anônimo** — sem barreira na entrada.
- Classificador sobre a mensagem do lead, emitindo um campo: `intencao` ∈
  {`qualificacao`, `atendimento`, `agendamento`, `venda`, `indefinida`}.
  `indefinida` é **abstenção explícita** — a saudação, o "oi", a mensagem que
  não carrega intenção alguma. Sem ela o classificador é obrigado a rotular
  ruído com uma das quatro, e a distribuição de intenções vira ficção.
- **Roteamento — reavaliado a cada mensagem.** Quem responde é decidido pela
  intenção da **mensagem corrente**: `qualificacao` vai ao handler real, as
  outras três ao fallback, `indefinida` recebe uma pergunta de esclarecimento
  do próprio agente, sem handler. Congelar o roteamento na primeira mensagem
  faria o handler de qualificação responder um pedido de agendamento que chega
  no turno 3.
- **Agregação mensagem → sessão — só para o contador.** A sessão herda a
  `intencao` da **primeira mensagem que produz rótulo diferente de
  `indefinida`**; se nenhuma produzir, a sessão fica `indefinida`. É regra de
  medição, não de comportamento: sem ela, cada turno seria uma nova chance de
  o classificador errar e a taxa de erro composta cresceria com o tamanho da
  conversa — 5% por mensagem ao longo de 6 mensagens vira ≈26% na sessão.
  **Custo declarado:** uma segunda intenção que surge no meio da conversa é
  invisível ao contador — a sessão que começa em `qualificacao` e pede
  agendamento no turno 3 conta como `qualificacao`. Isso subestima a demanda
  pelas intenções não atendidas e torna o gatilho do segundo handler mais
  difícil de disparar. Erra na direção de deferir, que é a direção aceita. O
  custo é só de contagem: como o fallback é terminal para o turno e não para a
  sessão, o comportamento do agente não é afetado pela regra.
- **Um** handler real: `qualificacao` — descobre intenção, urgência e fit, e
  produz uma saída estruturada para o time comercial do tenant.
- **Um** fallback gracioso para as outras três intenções, que reconhece o
  pedido, aponta o contato do tenant e não finge capacidade que não existe.
  **É terminal para o turno, não para a sessão:** o lead pode continuar, e se
  a conversa voltar a `qualificacao` o handler retoma. Encerrar a sessão
  mataria uma qualificação em andamento — e com ela o pedido de e-mail —
  porque o lead perguntou de agendamento no turno 3. Uma sessão que só
  produziu fallback fica aberta até o TTL, que emite a contagem normalmente.
- Mini tela de identificação disparada **no meio da conversa**, com espaço de
  oferta como contrapartida. Três coisas declaradas, porque "momento
  contextual" não é testável:
  - **Quem dispara:** o handler de `qualificacao`. O fallback nunca pede
    e-mail — prometer retorno sobre uma conversa que declaramos não saber
    atender é contrapartida vazia.
  - **Quando:** assim que o handler tiver capturado intenção, urgência e fit,
    ou no turno 4, o que vier primeiro. O teto de turno existe para que uma
    qualificação que não converge não deixe a sessão sem nenhum pedido.
  - **Quantas vezes:** no máximo **duas exibições por sessão**. Uma recusa da
    validação reabre a mesma tela para correção e não conta como nova
    exibição — é a mesma tentativa. Sem esse teto, `pedido_sem_envio` deixa de
    ter significado estável.
- **Validação do e-mail:** sintaxe + blocklist pública de domínios
  descartáveis. Sem envio de e-mail, sem código de confirmação.
- **Consentimento como porta de envio, com finalidade restrita à fatia 1:** a
  mini tela declara ao lado do botão que o e-mail serve *para o time comercial
  do tenant retornar sobre esta conversa*, e o envio é o próprio ato de
  consentir. Consentimento para disparo de marketing **não** é coletado aqui —
  fica com a fatia que dispara marketing. Não existe estado de "forneceu
  e-mail mas recusou consentimento": recusar é não enviar.
- Promoção de sessão a lead durável no envio, deduplicado por e-mail
  normalizado (trim + lowercase), com o aceite e a finalidade registrados.
- **Processo manual documentado de acesso e exclusão a pedido do titular**
  (LGPD Art. 18). Com um tenant piloto configurado à mão, é um runbook, não
  uma tela — mas precisa existir e ter dono nomeado.
- **Rate limiting** por IP e teto de mensagens por sessão, protegendo o
  endpoint de LLM público. O teto é dimensionado a partir da conversa legítima
  mais longa do histórico de WhatsApp do tenant — mesmo corpus da rotulagem
  (R12), porque na plataforma ainda não existe conversa nenhuma. Se o tenant
  não autorizar o corpus, entra arbitrado em 40 mensagens por sessão.
- **Parâmetros operacionais, todos provisórios e revistos na semana 2.** Não
  são escolhas de design; são números que o wish precisa para construir e
  testar, e deixá-los em aberto tornaria três critérios não testáveis:
  - TTL da sessão: **24 h**. Governa a emissão terminal, o descarte de
    transcrição e o critério "Retenção".
  - Rate limit: **30 mensagens por IP por hora**.
  - Teto de mensagens por sessão: ver acima.
  - Janela do piloto: **12 semanas**. É a mesma janela da aritmética de R2a
    (200 ÷ 12 ≈ 17 sessões/semana) e precisa ser declarada, já que "estender a
    janela" é um desfecho nomeado do go/no-go.
- Contadores anônimos **pré-agregados**, sem PII e sem identificador de
  sessão: no encerramento ou no vencimento do TTL, a sessão faz uma **emissão
  terminal** única que incrementa um bucket de contagem sobre quatro dimensões
  categóricas. O artefato persistido é o **contador agregado** — incremento
  sobre uma linha de bucket que já existe, sem timestamp por sessão e sem
  registro individual. Não é uma tabela de emissões: com N baixo, uma linha
  por sessão com carimbo de tempo seria um log de eventos correlacionáveis por
  ordem, que é exatamente o que foi removido de propósito.
  - `origem` (4) — as três de atribuição mais `desconhecido`, para visita
    direta, parâmetro removido ou valor não reconhecido. É parâmetro vindo do
    cliente e nunca deve cair num default silencioso.
  - `intencao` (6) — as quatro reais, mais `indefinida` (digitou, mas nenhuma
    mensagem produziu rótulo) e `nenhuma` (nunca digitou). São populações
    diferentes: a primeira aceitou conversar, a segunda não. O denominador de
    engajamento depende de distingui-las.
  - `estado_email` (4) — estado **terminal** da sessão, por máximo alcançado:
    `nao_pedido`, `pedido_sem_envio`, `enviado_recusado` (tentou ao menos uma
    vez e nenhuma foi aceita), `enviado_aceito` (ao menos uma aceita, com ou
    sem recusa antes). Assim `enviado_aceito` ⟺ existe lead durável, e retry
    não produz divergência entre métrica e base.
  - `sessao_valida` (3) — `valida`, `excluida_rate_limit`, `excluida_teto`.
    Rate limit é abuso; teto atinge as conversas mais engajadas. São
    populações opostas e não podem compartilhar um bucket.

  288 buckets possíveis.
- **Snapshot semanal**, fora do bucket: nas fronteiras de semana é arquivado
  **um escalar** — o total de sessões válidas acumulado —, e a série de
  diferenças dá sessões/semana. Um escalar, não o corte por bucket: arquivar
  os 288 semanalmente seria funcionalmente idêntico a uma dimensão `semana`,
  daria resolução temporal a combinações raras e transformaria a semana com
  uma sessão numa combinação incomum em registro de evento. R2a só consome o
  escalar, então é só o escalar que se paga.
- **Contador escalar operacional de bloqueios de borda**, por IP e por dia,
  fora do bucket. Requisição barrada na borda não tem sessão — criar um
  registro de sessão para ela misturaria unidades (requisição num contador
  cuja unidade é sessão),
  daria a um IP abusivo 5.000 "sessões" e faria o mecanismo de contenção de
  custo escalar com o ataque. R10 exige só que a exclusão seja auditável, e um
  escalar ao lado do relatório basta.
- Um tenant piloto, configurado à mão.

### OUT

- Carrossel e botões interativos — diferencial, não premissa; entram depois de R1 provado.
- Handoff ao vivo, presença ("bolinha") e inbox do atendente.
- Áudio e vídeo no modal — o subsistema mais caro do portfólio.
- **Qualquer sinal quantitativo de demanda por atendente humano.** O campo
  `quer_humano` foi removido da fatia; o gatilho de handoff passa a ser relato
  do tenant, como o de merge de identidade. Ver Risco 11.
- Handlers reais de `atendimento`, `agendamento` e `venda` — a distribuição de
  intenções medida no piloto decide qual vem primeiro.
- Verificação de posse do e-mail (código de confirmação, double opt-in).
- **Detecção de bot** — fingerprinting, captcha ou serviço de terceiro. Rate
  limiting é o único mecanismo; ver Risco 9.
- Admin do tenant e autosserviço.
- Disparo de marketing e campanhas — consumidor da identidade, não produtor.
- Multi-tenant.
- Integração de API com WhatsApp em qualquer direção.
- Endereço, cadastro completo, qualquer formulário longo (restrição dura).
- Costura de sessão anônima a lead via cookie ou device token.
- Persistência de transcrição de conversa além do TTL da sessão.

## Approach

**Next.js na frente, FastAPI atrás, Postgres como única fonte de verdade.**

O Next.js serve a landing do link, lê `?origem=`, e renderiza o chat com
streaming e a mini tela de identificação. O backend Python detém o motor do
agente: classificador, handler de qualificação, fallback, validação de e-mail
e a promoção de sessão a lead.

A sessão anônima vive numa tabela Postgres com TTL, não em Redis — para um
tenant piloto, um serviço a mais não se paga. A sessão carrega o contexto da
conversa enquanto o lead está anônimo e é varrida no vencimento do TTL. Só na
identificação a sessão é promovida a registro durável de lead; o que não
identifica é descartado com o TTL, transcrição inclusive.

**Contadores sem correlação de sessão.** A métrica exige saber, para a mesma
sessão, a origem, a intenção e o desfecho do e-mail. Em vez de uma stream de
eventos correlacionados por chave de sessão — que reintroduziria rastreamento
individual — a sessão faz uma **emissão terminal** única no encerramento ou no
TTL, que incrementa um bucket de contagem indexado só por dimensões
categóricas de baixa cardinalidade. O que fica no banco é o contador, não a
emissão: nenhum identificador de sessão e nenhum carimbo de tempo por sessão
são retidos. Dois objetos distintos, deliberadamente nomeados diferente: o
**registro de sessão** é a linha efêmera do Postgres que carrega a conversa e
morre no TTL; a **emissão terminal** é o incremento que ela dispara ao morrer.

O estado do e-mail é um campo monotônico de quatro valores em vez de três
booleanos independentes: a progressão `nao_pedido → pedido_sem_envio →
enviado_{recusado|aceito}` elimina por construção as combinações impossíveis,
e como o consentimento é a porta de envio, não há estado de recusa de aceite
para representar. O valor gravado é o **máximo alcançado na sessão**, não o
da última tentativa — sem isso, um lead recusado pela blocklist que reenvia um
e-mail válido ficaria marcado como recusado enquanto um lead durável existe na
base, reintroduzindo exatamente a divergência que o consentimento-como-porta
eliminou.

O classificador é uma unidade de propósito único com interface explícita
(`mensagem → intencao`), testável isolada com um conjunto de mensagens
rotuladas. Os handlers plugam atrás de um contrato único (`sessão → resposta`)
e são escolhidos pela intenção da **mensagem corrente**, então adicionar o
segundo handler não toca o roteador. Roteamento e contagem leem o
classificador em cadências diferentes — por mensagem e por sessão — e essa
separação é deliberada: a regra que protege a métrica do erro composto não
pode congelar o comportamento do agente no primeiro turno.

**Alternativas consideradas:**

| Alternativa | Por que perdeu |
|-------------|----------------|
| App único Next.js, sem backend separado | O time é forte em Python, e o motor do agente é o coração do produto. Custo aceito e explícito: dois deploys e um contrato entre eles. |
| Identificação obrigatória na porta | Atrito alto num fluxo cujo maior risco já é o lead não aceitar sair do WhatsApp. Perde-se a chance de pedir o e-mail quando ele já está engajado. |
| Quatro handlers reais | Contraria a fatia fina; puxa calendário, base de conhecimento e catálogo para dentro da fatia 1. Vira o produto inteiro. |
| Três handlers-stub além do real | Maquinário dormente. Um fallback único entrega o mesmo comportamento com menos superfície. |
| Campo `quer_humano` no classificador | Era o único sinal quantitativo do gatilho de handoff, e sobreviveu a três rodadas de review. Caiu na quarta porque **nenhuma cadência de agregação serve**, e as duas estavam disponíveis: OR sobre a sessão dá o sinal tardio mas compõe o falso positivo a cada turno (os mesmos ≈26% em 6 mensagens), enquanto a primeira mensagem não compõe mas suprime justamente o sinal, já que pedir humano emerge depois de o bot falhar. Corrigir a composição exigiria calibrar TPR/FPR em nível de sessão — dado que N baixo não fornece. Somado a isso, o gatilho defere por padrão abaixo de N=200 (#18) e, mesmo em N=200, o intervalo é largo demais para ele disparar antes de a prevalência real ser muito alta. A conta, explicitada para ficar auditável: em ~150 sessões engajadas o IC de 95% bruto é ±8,0pp; a correção de prevalência infla a largura por ≈1/(TPR−FPR), o que dá **±11pp com separação saudável (0,75) e ±27pp com separação no piso de 0,3**. Revisões anteriores citavam ±15pp, que era otimista — a conta correta reforça o argumento em vez de enfraquecê-lo. Seis mecanismos — barra de especificidade, medição de TPR/FPR, correção de prevalência, piso de separação, uma dimensão de bucket e um rótulo de "indicativa" — para um gatilho que não dispara. Ver Risco 11. |
| Pedir e-mail também no fallback | Aumentaria o denominador de leads, mas pediria dado pessoal numa conversa que acabamos de declarar que não sabemos atender — a contrapartida da mini tela ("o time comercial retorna sobre esta conversa") fica vazia quando não há conversa a retornar. Custo aceito e declarado: três das quatro intenções não produzem lead na fatia 1. |
| `intencao` sem valor de abstenção | Forçaria um dos quatro rótulos sobre "oi" e "bom dia". A sessão inteira herdaria a classificação de uma saudação, a distribuição de intenções viraria ruído e o denominador de engajamento não teria como distinguir "digitou sem dizer o que quer" de "nunca digitou". |
| Consentimento como checkbox separado | Cria um estado "e-mail válido, aceite recusado" que diverge silenciosamente entre a métrica e a contagem de leads, e exigiria uma sexta dimensão para ficar visível. |
| Consentimento amplo, já cobrindo disparo de marketing | Empacotaria entrega do serviço, oferta e disparo futuro num ato único, sem caminho para obter o primeiro sem o terceiro — o ponto exato onde a LGPD exige granularidade (Art. 8 §§3–4). Colher o consentimento de marketing na fatia que dispara marketing é mais barato e mais defensável. |
| Verificação de posse do e-mail por código | Resolveria identidade de verdade, mas quebra a conversa no meio, derruba a taxa de identificação — que é justamente a métrica sob teste — e traz infra de envio para a fatia 1. |
| Detecção de bot por fingerprint ou captcha | Único item que engrossaria a fatia de verdade. Rate limiting cobre o abuso grosseiro; o resto é ruído declarado (R9). |
| Stream de eventos correlacionada por chave de sessão | Daria segmentação mais rica, ao preço de reintroduzir rastreamento individual e reverter parte da decisão de descarte. |
| Redis para sessão efêmera | Um serviço operacional a mais sem requisito de carga presente. |
| Costurar sessão anônima ao lead via cookie | Adiciona estado durável, consentimento de cookie e uma regra de merge, para recuperar histórico de um lead que ainda não existe. |
| Telefone como chave de identidade | Menos estável no tempo, e o link estático não nos entrega telefone de canal nenhum — nenhum dos dois é herdado, então vence o mais estável. |

## Simplicity Case

- **Simplest complete design:** landing por link → chat anônimo → classificador
  → handler de qualificação → pedido contextual de e-mail → lead durável.
  Um front, um backend, um banco, uma tabela de leads, uma tabela de sessão
  efêmera, um bucket de contadores.

- **Added machinery:**
  - *Classificador com quatro intenções, uma abstenção e um único handler.*
    Requisito presente e duplo: (a) sem ele, um pedido de agendamento é
    respondido pelo handler de qualificação, degradando a experiência e
    contaminando o baseline — é a guarda de fora-de-escopo, e ela vale a cada
    turno, não só no primeiro; (b) o critério "Distribuição de intenções com
    IC de 95%" e o gatilho de 20% do segundo handler **exigem** a distribuição
    das quatro, então a saída de múltiplas vias é requisito, não efeito
    colateral. A abstenção `indefinida` é o quinto valor que impede o
    classificador de inventar rótulo para saudação.
  - *Roteamento por mensagem e agregação por sessão, em cadências diferentes.*
    Requisito presente para cada um, e são requisitos distintos: o roteamento
    precisa acompanhar a deriva da conversa (guarda de fora-de-escopo), a
    agregação precisa não compor erro de classificador ao longo dos turnos.
    Uma regra só não atende os dois.
  - *Runbook de acesso e exclusão do titular.* Requisito presente: a partir do
    momento em que existe lead durável com dado pessoal, o Art. 18 se aplica,
    e prometer opt-out sem caminho de execução é risco fingido de mitigar.
    Processo manual, não tela — o tenant é um só e já é configurado à mão.
  - *Contadores pré-agregados.* Requisito presente: o critério de sucesso é
    uma taxa por sessão, e descartar sessão não identificada removeria o
    denominador.
  - *Validação de e-mail (sintaxe + blocklist).* Requisito presente: sem ela,
    um descartável conta como identificação e como lead durável, e o único
    número que justifica a fatia inteira fica indefensável.
  - *Rate limiting.* Requisito presente: o endpoint de LLM é público e
    anônimo por design. Sem teto, é vetor de custo direto.
  - *Backend Python separado.* **Não é requisito presente — é preferência
    fundamentada.** O que a sustenta é a competência do time, não uma
    necessidade técnica; o app único atenderia. Custo de dois deploys
    conscientemente aceito, e registrado como tal.

- **Deferred until measured:**

  Sobrou **um** gatilho numérico, e ele pertence à camada inferencial:
  **assume deferir enquanto N < 200 sessões válidas** (#18). Um gatilho não
  avaliável nunca é lido como gatilho atingido. Os demais são qualitativos ou
  contratuais, e por isso não estão sujeitos à porta de N.

  - Segundo handler — gatilho **numérico**: o limite inferior do IC de 95% da
    participação de uma intenção não atendida ficar acima de 20%, sobre o
    denominador de sessões engajadas (critério "Distribuição de intenções com
    IC de 95%").
  - Componentes ricos (carrossel, botões) — gatilho: decisão go/no-go
    pré-registrada sobre R1 (critério "Go/no-go pré-registrado"), não leitura
    pós-hoc do número.
  - Handoff ao vivo, áudio e vídeo — gatilho: **relato do tenant**, no mesmo
    canal do merge de identidade. Não é gatilho numérico e por isso não está
    sujeito à porta de N. Canal lossy e assumido como tal (Risco 11): o time
    comercial do tenant recebe as saídas de qualificação e diz se os leads
    estão pedindo gente. É pior que uma taxa medida, e é melhor que uma taxa
    que a própria aritmética do design diz que não dispara.
  - Detecção de bot — gatilho: custo de LLM ou volume de sessões inválidas
    acima do que o rate limiting contém, observado na fatura do piloto.
  - Multi-tenant — gatilho: segundo tenant contratado.
  - Merge assistido de identidade — gatilho: relato do tenant. Canal lossy mas
    real: o time comercial recebe as saídas de qualificação e reconhece
    "já falei com essa pessoa". A plataforma não detecta (R8).

- **Complexity removed:**
  - Sincronização de estado entre WhatsApp e plataforma (#3).
  - A pergunta "o mesmo lead em dois tenants é a mesma pessoa?" (#2).
  - Fila de revisão humana de duplicatas (chave única de e-mail).
  - Regra de merge entre sessão anônima e lead identificado (descarte).
  - Consentimento de cookie de tracking (sem costura por cookie).
  - Correlação de eventos por chave de sessão (emissão terminal única).
  - Estados impossíveis de e-mail (campo monotônico) e o estado de recusa de
    consentimento (aceite é a porta de envio).
  - Detecção de bot, fingerprinting e captcha.
  - Todo o aparato de `quer_humano`: campo no classificador, barra de
    especificidade, medição de TPR/FPR, estimador de Rogan-Gladen, piso de
    separação e uma dimensão de bucket. Contabilidade exata, porque r6 também
    cresceu: 480 → 240 pela remoção do campo, 240 → 288 pela abstenção (#5).
  - Linha de sessão para requisição barrada na borda (contador escalar).
  - Infra de envio de e-mail (validação sem confirmação de posse).
  - Redis (sessão em Postgres com TTL).
  - Um subsistema inteiro de integração WhatsApp, colapsado num parâmetro de URL.

## Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Fatia vertical fina como primeira entrega | O pedido original atravessa 7 subsistemas independentes. Uma fatia fina prova a premissa mais arriscada (R1) antes de investir em identidade sofisticada ou mídia ao vivo. |
| 2 | Um tenant piloto; multi-tenant só com segunda demanda | Elimina a ambiguidade de identidade cross-tenant, que dobraria a complexidade do dedup sem evidência presente de necessidade. |
| 3 | WhatsApp é porta de entrada, não canal | Auto-resposta entrega link estático. Sincronização bidirecional é dos custos mais caros que existem, e o cenário descrito como ideal já é site → plataforma. |
| 3a | Todo lead chega anônimo, em qualquer canal | Derivado de #3: link estático não identifica quem clicou. A origem vira `?origem=` só para atribuição, e não existe atalho de identificação em caminho nenhum. |
| 4 | E-mail é a chave primária de identidade, normalizado por trim + lowercase | Nenhum identificador é herdado do canal (#3a), então **o custo mecânico de obter é igual** para telefone ou e-mail — ambos custam exatamente um pedido. Igualado esse custo, vence o mais estável no tempo. Isto não é o mesmo que atrito percebido: o retorno por pedido é pior para e-mail, e esse custo está registrado em R3. |
| 5 | Classificador emite um só campo: `intencao` com 4 valores reais mais a abstenção `indefinida` | A intenção roteia e alimenta a distribuição que decide o segundo handler. A abstenção existe porque sem ela o classificador é forçado a rotular "oi" como uma das quatro, e a distribuição — que é o único consumidor do rótulo — vira ruído. |
| 6 | Um handler real (`qualificacao`) e um fallback único | Os stubs não se pagam: o fallback entrega o mesmo comportamento com menos superfície. |
| 7 | Conversa começa anônima; e-mail pedido no meio, quando a intenção justifica | Menor atrito no ponto de maior risco de abandono, e o pedido vira merecido em vez de pedágio. A mini tela com oferta é o momento da identificação, não a entrada. |
| 8 | Next.js na frente, FastAPI atrás, Postgres | **Preferência fundamentada, não requisito.** O time é forte em Python e o motor do agente é o núcleo do produto. O app único atenderia tecnicamente; os dois deploys e o contrato entre eles são custo aceito com os olhos abertos. |
| 9 | Sessão não identificada é descartada no TTL; contadores pré-agregados guardam o denominador | Base limpa por construção e LGPD leve, sem perder a métrica. O histórico de quem voltou várias vezes antes de decidir é perda aceita. |
| 10 | Sessão efêmera em tabela Postgres com TTL, promovida a lead só na identificação | Sustenta o contexto da conversa enquanto anônimo sem adicionar um serviço operacional. |
| 11 | E-mail validado por sintaxe + blocklist de descartáveis, sem confirmação de posse | Protege a métrica e a base do lixo óbvio a custo zero de atrito. Confirmação de posse resolveria identidade de verdade, mas quebraria justamente a métrica sob teste. Limitação aceita e declarada: não sabemos se o e-mail existe. |
| 12 | Consentimento é a porta de envio da mini tela, não um checkbox à parte | Finalidade declarada ao lado do botão; o envio é o ato afirmativo, que é o que a LGPD exige — não um checkbox. Elimina o estado divergente "e-mail válido, aceite recusado", em que a métrica contaria identificação e a base não ganharia lead. |
| 13 | Finalidade restrita ao retorno comercial sobre esta conversa; consentimento de marketing fica com a fatia que dispara marketing | Um ato único cobrindo serviço, oferta e disparo futuro não passa no teste de granularidade do Art. 8 §§3–4, porque não há como obter o primeiro sem o terceiro. Estreitar é mais barato que construir granularidade. |
| 14 | Runbook manual de acesso e exclusão do titular, nomeado e com dono | Existe lead durável com dado pessoal, logo o Art. 18 se aplica. Prometer opt-out sem caminho de execução seria risco fingido de mitigar. Manual porque há um tenant só. |
| 15 | `estado_email` monotônico de 4 valores, gravando o **máximo alcançado** na sessão | Combinações impossíveis ficam irrepresentáveis, e a regra do máximo garante `enviado_aceito` ⟺ lead durável mesmo com retry após recusa. |
| 16 | `sessao_valida` com 3 valores; `origem` com `desconhecido` | Rate limit e teto de mensagens atingem populações opostas — abuso versus os leads mais engajados — e não podem compartilhar bucket. `origem` vem do cliente e nunca deve cair num default silencioso que contamine a segmentação. |
| 17 | Rate limiting por IP e teto de mensagens; sem detecção de bot | O endpoint de LLM é público e anônimo por design, então um teto é obrigatório. Detecção de bot é o único item que engrossaria a fatia de verdade — fica fora, com o ruído declarado em R9. |
| 18 | **Relatório em dois níveis, adaptativo ao N alcançado.** Piso descritivo sempre reportável; camada inferencial só acima de N=200, e todo gatilho numérico assume deferir abaixo disso | O volume do tenant piloto é baixo ou incerto (R2), então dimensionar o relatório para N=200 e torcer produziria ou números inferenciais sem significado ou uma fatia que não entrega nada. Dois níveis absorvem a incerteza em vez de escondê-la: o piso responde R1 de forma honesta com qualquer N, e a inferência fica explicitamente indisponível até ser merecida. Falha para o lado conservador — deferir. |
| 19 | **Duas cadências, declaradas em separado:** o roteamento reavalia a intenção a cada mensagem; o contador herda a primeira intenção rotulada da sessão | São problemas diferentes com respostas opostas. O roteamento precisa acompanhar a deriva — congelá-lo faria o handler de qualificação responder um agendamento pedido no turno 3, violando o critério "Fallback isolado". O contador precisa do oposto: reavaliar a cada turno comporia o erro do classificador ao longo da conversa (5% por mensagem em 6 mensagens ≈ 26% na sessão) e faria sessões longas parecerem sistematicamente diferentes das curtas. |
| 20 | **`quer_humano` removido da fatia 1;** o gatilho de handoff, áudio e vídeo passa a relato do tenant | O argumento é estrutural, não estatístico: **nenhuma cadência de agregação serve.** OR sobre a sessão dá o sinal tardio e compõe o falso positivo; primeira mensagem não compõe e suprime o sinal; calibrar em nível de sessão exigiria dado que N baixo não dá. Isso não é consequência de #19 — #19 mostra que a cadência é escolhida por consumidor, e o ponto aqui é que **as duas escolhas disponíveis falham**. Somado ao deferimento padrão abaixo de N=200 (#18) e a um intervalo de ±11 a ±27pp mesmo em N=200, eram seis mecanismos para um gatilho que não dispara. Relato do tenant é lossy e honesto; ver Risco 11. |
| 21 | Segmentação do piso só com célula mínima de 30; abaixo disso, agregado com rótulo de indicativa | O piso descritivo foi escrito como "livre de N" mas exigia engajamento e conversão segmentados por `origem` — 8 células. Com 40 sessões, são ~5 por célula. Rotular `origem × intencao` como indicativa em N=200 e não rotular 8 células em N=40 era incoerente. O mesmo princípio passa a valer nos dois lugares, com forma diferente: rótulo fixo no crosstab, limiar por célula no piso. O 30 é contado **no denominador da própria métrica**, que difere entre engajamento e conversão. Não é um número mágico — é o ponto a partir do qual uma proporção começa a ser lida sem constranger, e errar entre 25 e 30 custa um rótulo, não uma conclusão. |
| 22 | "Inconclusivo" é desfecho legal e nomeado do go/no-go, e a regra pré-registrada é **qualitativa** | Um critério binário sem opção de não decidir força uma decisão sobre dado insuficiente. E não havia o que pré-registrar: "sem meta numérica, este é o baseline" contra "a decisão não pode ser formulada depois de ver o número" deixava o pré-registro vazio por construção. A regra pré-registrada passa a ser uma avaliação escrita com dois juízos separados — adoção e qualidade — mais a regra de composição entre eles; os números do piso entram como contexto, não como limiar. |
| 23 | Fallback é terminal para o **turno**, não para a sessão; e o pedido de e-mail sai do handler de `qualificacao`, com condição e teto de exibições declarados | Fallback terminal para a sessão mataria uma qualificação em andamento, junto com o pedido de e-mail, porque o lead perguntou de agendamento no meio. Manter o pedido no handler mantém a contrapartida verdadeira: só prometemos retorno sobre a conversa quando existe conversa a retornar. E "momento contextual" não é testável, então a condição (intenção + urgência + fit capturados, ou turno 4) e o teto (duas exibições) são parte da decisão, não detalhe de implementação. |

## Risks & Assumptions

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| 1 | **Premissa central não confirmada:** o lead aceita sair do WhatsApp e conversar num link. Se cair, o produto vira "mais um widget de site". | High | Esta fatia existe para testar isto. **R1 tem duas metades e elas são medidas por instrumentos diferentes:** a metade "clicou e abriu" só aparece na taxa de abertura do link (sessões ÷ envios declarados pelo tenant), grosseira porque o denominador é autodeclarado e não auditável; a metade "aceitou conversar" é o *engajamento*, cujo denominador já é pós-clique. As duas vivem no critério "Baseline decomposto em três números", **decompostas** para que R1 não seja confundido com atrito de e-mail. Elas **informam** a decisão do critério "Go/no-go pré-registrado"; não a determinam. |
| 2 | **Risco de design — mitigado.** O volume do tenant piloto é baixo ou incerto, e um relatório dimensionado para N=200 produziria números inferenciais sem significado. | Medium | Relatório em dois níveis (#18): o piso descritivo entrega com qualquer N, a inferência fica suspensa até N=200, e a segmentação respeita célula mínima (#21). O design deixou de assumir o volume resolvido. Não bloqueia o wish. |
| 2a | **Risco de aprendizado — declarado, não mitigado.** O que #18 conserta é o relatório, não o aprendizado. Se o volume for muito baixo, construímos a fatia inteira e não aprendemos nada decisivo sobre R1 — que é o risco High que justifica o projeto. Degradar o relatório com elegância não substitui evidência. | High | Nenhuma mitigação técnica; a honestidade é a mitigação. Duas consequências concretas em vez de otimismo: (a) "Inconclusivo — estender ou trocar o piloto" é desfecho legal e nomeado do go/no-go (#22), então não somos forçados a decidir sobre dado insuficiente; (b) o número de sessões/semana ganha consumidor — se na semana 2 a taxa observada projetar N=200 além de 12 semanas (200 ÷ 12 ≈ 17 sessões/semana), dispara reavaliação nomeada, decidida por **quem decide o go/no-go**, com as opções já escritas: estender a janela, somar um segundo tenant, comprar tráfego, ou encerrar como inconclusivo. Escolher "estender" obriga a datar a nova janela no ato, e no fim dela **"inconclusivo" é o desfecho padrão** — sem isso, a opção nula pode ser reescolhida para sempre e o piloto vira um projeto sem fim. O dado vem do snapshot semanal do contador. Sem essa regra, o número seria coleta sem uso — o mesmo defeito que este design condena em gatilhos que não disparam. |
| 3 | Atrito percebido do e-mail: incomoda mais que telefone e convida ao descartável. | Medium | Pedido contextual (#7) e oferta como contrapartida reduzem a recusa; validação (#11) barra o descartável óbvio. O baseline é reportado bruto e líquido, de modo que o efeito fique visível em vez de mascarado. |
| 4 | Classificador erra a intenção e joga lead qualificável no fallback. | Medium | Barra de acerto explícita no critério "Classificador validado". Taxa de fallback monitorada em produção como sinal de deriva. |
| 5 | Paridade com WhatsApp é um baseline maior do que parece — o lead compara com o WhatsApp, não com o nada. | Medium | Escopo estreito (um job) reduz a superfície de comparação. Aceito conscientemente na fatia 1. |
| 6 | LGPD: coleta de e-mail exige base legal, consentimento granular e caminho de revogação. Consentimento amplo cobrindo disparo futuro não passa no teste de granularidade do Art. 8 §§3–4. | Medium | Três frentes: descarte de sessão anônima e ausência de cookie encolhem a superfície; finalidade estreitada ao retorno comercial desta conversa (#13) resolve a granularidade; runbook de acesso e exclusão (#14) dá caminho de execução ao Art. 18. Verificados pelos critérios "Consentimento" e "Direitos do titular". |
| 7 | **PII em trânsito para o provedor de LLM.** O lead digita e-mail e dados pessoais no chat; o provedor pode reter em logs e backups. O descarte no TTL não alcança a retenção de terceiro. | Medium | Contratar provedor com retenção zero e DPA assinado antes do piloto. O critério "Retenção" cobre base própria **e** confirmação documental da política do provedor. |
| 8 | **A mesma pessoa com dois e-mails produz dois leads, e a plataforma não consegue perceber.** É o problema central do projeto, e a fatia 1 é cega a ele por construção. | Medium | Nenhuma mitigação técnica nesta fatia — limitação declarada na seção "O que esta fatia NÃO resolve", que segue literalmente para o wish. O gatilho de merge depende de relato do time comercial do tenant. |
| 9 | **Endpoint de LLM público e anônimo, com rate limiting mas sem detecção de bot.** Tráfego automatizado sofisticado passa, consome LLM e infla o denominador. | Medium | Rate limiting contém o abuso grosseiro e o custo. Bot sofisticado é ruído **não detectado e não corrigido** no baseline — limitação aceita e declarada, não mitigada. Custo de LLM monitorado como gatilho de reconsideração. |
| 10 | Excluir do N as sessões que estouram o teto remove justamente as mais engajadas. Na maior parte do baseline a direção do viés é desconhecida, mas **na conversão ela é conhecida**: o teto atinge preferencialmente quem ficou tempo suficiente para converter, então a conversão sai **subestimada**. | Low | A abertura do link já conta `excluida_teto` no numerador justamente por isso. Teto dimensionado a partir da conversa mais longa do histórico de WhatsApp do tenant — não da plataforma, onde ainda não há conversa nenhuma — e declarado provisório, revisto na semana 2. `sessao_valida = excluida_teto` contado separadamente de `excluida_rate_limit` (#16), e bloqueios de borda por IP num escalar fora do bucket, para que a exclusão seja auditável sem contaminar as contagens por sessão. |
| 11 | **O subsistema mais caro do portfólio passa a ser governado por relato qualitativo.** Com `quer_humano` removido (#20), não existe sinal medido de demanda por atendente humano; o gatilho de handoff, áudio e vídeo depende do time comercial do tenant reportar o que ouve. | Medium | Limitação aceita e declarada, não mitigada — mesmo formato de R8 e R9. A alternativa medida foi avaliada e reprovou na própria aritmética do design: sob N baixo, um intervalo de ±11 a ±27pp e nenhuma cadência de agregação viável, ela produziria confiança falsa em vez de sinal. Um relato lossy que se sabe lossy erra de forma visível; uma taxa que não pode disparar erra de forma invisível. Se o tenant relatar demanda, a decisão de construir é tomada com a evidência que existe, sem fingir precisão. |
| 12 | O corpus de rotulagem são mensagens reais de leads do tenant, reaproveitadas para uma finalidade nova. O tenant é controlador; nós seríamos operador. | Low | Autorização formal do tenant e despersonalização antes do uso. Se o tenant não autorizar, o critério "Classificador validado" admite corpus sintético com a limitação declarada no relatório, em vez de travar a fatia. |

## Success Criteria

- [ ] **Fluxo completo:** um lead abre o link, conversa anônimo, tem a intenção classificada, recebe o pedido de e-mail e vira lead durável — em ambiente real do tenant piloto. O pedido é verificado contra a condição declarada (#23), não contra "momento contextual": aparece depois que o handler captura intenção, urgência e fit, ou no turno 4 se isso não acontecer antes, e no máximo duas vezes na sessão — uma recusa da validação reabre a mesma tela sem contar como nova exibição.
- [ ] **Fallback isolado:** uma mensagem classificada como uma das outras três intenções reais (`atendimento`, `agendamento`, `venda`) é respondida pelo fallback gracioso, sem o handler de qualificação responder no lugar — **inclusive quando ela chega depois de a sessão já ter sido rotulada `qualificacao` pelo contador.** O roteamento é por mensagem, a contagem é por sessão (#19), e o teste precisa exercitar exatamente essa divergência. O teste também verifica que a sessão **continua aberta** depois do fallback e que uma mensagem de qualificação subsequente volta ao handler real (#23).
- [ ] **Abstenção roteada:** uma mensagem classificada `indefinida` recebe pergunta de esclarecimento do agente, sem acionar handler nem fallback, e não fixa a `intencao` da sessão.
- [ ] **Classificador validado** num conjunto de ≥ 125 mensagens rotuladas à mão — ≥ 25 por intenção real e ≥ 25 exemplos de abstenção (saudações, "oi", mensagens sem intenção), que é o que os pisos por classe já somam:
  - `intencao`: acerto ≥ 85% sobre as quatro intenções reais.
  - Abstenção: uma saudação não pode ser rotulada como uma das quatro em mais de 15% dos casos. É o rótulo que protege a distribuição de virar ruído, então tem barra própria.
  - Corpus extraído do histórico real de WhatsApp do tenant piloto, mediante autorização formal e despersonalização. Se o tenant não autorizar, corpus sintético é admitido com a limitação declarada no relatório (R12).
- [ ] **Validação de e-mail:** sintaxe inválida e domínio da blocklist são recusados na mini tela. Uma sessão que só recusou registra `estado_email = enviado_recusado`; se um reenvio for aceito, o estado avança para `enviado_aceito`.
- [ ] **Dedup:** dois cadastros com o mesmo e-mail diferindo em caixa ou espaço resolvem para um único lead.
- [ ] **Contadores:** a emissão terminal ocorre em toda sessão, inclusive nas abandonadas (via varredura de TTL), nas que nunca digitaram (`intencao = nenhuma`) e nas que digitaram sem produzir rótulo (`intencao = indefinida`), com as quatro dimensões preenchidas e `origem` caindo em `desconhecido` quando o parâmetro falta ou não é reconhecido. O que persiste é o contador agregado: nenhum identificador de sessão e nenhum timestamp por sessão. A relação `enviado_aceito` ⟺ lead durável vale **por sessão** e por isso **não** fecha por igualdade de contagem — verificá-la assim falharia sempre, por duas causas legítimas: dedup (duas sessões com o mesmo e-mail somam 2 e produzem 1 lead) e exclusões (uma sessão que converte e depois estoura o teto sai do N mas o lead permanece). A verificação são duas asserções direcionais mais uma desigualdade: nenhum lead existe sem uma sessão `enviado_aceito`; nenhuma sessão `enviado_aceito` deixou de fazer upsert; e `soma(enviado_aceito) ≥ leads distintos`, com a diferença explicada por dedup. A reconciliação varre **todos** os buckets, inclusive os excluídos.
- [ ] **Rate limiting ativo:** uma sessão que existe e depois estoura o limite ou o teto registra `sessao_valida = excluida_rate_limit` ou `excluida_teto` conforme a causa, fica fora do N e das taxas, e as duas contagens são reportadas **separadamente** — abuso e leads engajados demais não podem ser somados. Requisição barrada na borda por IP **não** cria registro de sessão: é contada num escalar operacional por IP e por dia, reportado ao lado do bucket. A exclusão fica auditável (R10) sem que uma unidade de requisição entre num contador cuja unidade é sessão, e sem que o mecanismo de contenção de custo escale com o ataque.

### Piso descritivo — obrigatório com qualquer N

Sempre reportável **no agregado**, sem premissa de volume. Nenhuma segmentação
é livre de N, então a segmentação carrega regra de célula (#21) em vez de
fingir que carrega.

- [ ] **Contagens brutas** por cada uma das quatro dimensões, mais o total de sessões válidas alcançado e o escalar de bloqueios de borda.
- [ ] **Baseline decomposto em três números,** para que R1 não seja confundido com atrito de e-mail e para que suas duas metades não sejam confundidas entre si:
  - *abertura do link* = sessões com `origem = whatsapp`, contando as válidas **e** as excluídas por teto, ÷ **envios de WhatsApp** declarados pelo tenant — a única medida da metade "clicou e saiu do WhatsApp". Três precisões que o número exige para não medir outra coisa: o numerador é restrito a `origem = whatsapp`, porque uma sessão vinda do site é de alguém que nunca esteve no WhatsApp e inflaria a razão acima de 100%; inclui `excluida_teto`, porque excluir a sessão mais engajada da amostra é subtrair evidência a favor de R1 justamente do número que existe para medir R1; e **aqui a repetição infla o numerador**, não o denominador — uma pessoa, três visitas, um envio. Declaradamente **grosseira**: o denominador é autodeclarado, não auditável, e precisa de fonte nomeada — o wish registra quem no tenant o informa e com que cadência (semanal, junto do snapshot). **Assimetria de leitura:** valor baixo é inequívoco e lê adoção falha; valor alto é ambíguo entre adoção real e contaminação por tráfego automatizado (R9, declarado não mitigado), e por isso **não sustenta *go* sozinho**;
  - *engajamento* = sessões com `intencao ≠ nenhuma` ÷ sessões válidas — a metade "aceitou conversar", com denominador já pós-clique. **Inclui `indefinida`:** quem digitou "oi" e saiu aceitou conversar, mesmo sem dizer o que queria. O que fica de fora é só quem nunca digitou;
  - *conversão de identificação* = sessões com `estado_email = enviado_aceito` ÷ sessões com `estado_email ≠ nao_pedido` — mede a recusa em fornecer e-mail **sob a finalidade declarada**. O denominador é exatamente esse, e não "sessões qualificadas": os dois conjuntos divergem nos dois sentidos, porque o roteamento é por mensagem e o contador herda o primeiro rótulo (#19, #23) — uma sessão contada como `agendamento` pode voltar a qualificação no turno 3 e receber o pedido, e uma sessão contada como `qualificacao` pode morrer antes dele. Além disso "sessões qualificadas" **não é computável a partir do bucket**, que guarda o primeiro rótulo e não o caminho de handler, enquanto `estado_email ≠ nao_pedido` é exato e auditável. A taxa não separa atrito de digitar e-mail de recusa da finalidade; as duas coisas vivem juntas em `pedido_sem_envio` e a fatia 1 não as distingue.
  Os três reportados no agregado sempre, e **segmentados por `origem` apenas quando cada célula tiver ≥ 30 no denominador da própria métrica** — que é diferente para cada uma, e para a conversão é bem menor que o total de sessões. Abaixo disso a célula sai com rótulo de **indicativa**. Mesmo princípio do crosstab `origem × intencao`, aplicado com limiar em vez de rótulo fixo. A conversão também sai em versão bruta (contando `enviado_recusado` como tentativa), de modo que o efeito da validação fique visível — `enviado_recusado` cobre erro de sintaxe, não só domínio descartável. Taxas **por sessão, não por pessoa**: visitas repetidas contam separadamente, inflando o denominador em engajamento e conversão e o numerador em abertura. Sem meta numérica: este é o baseline.

  **`intencao × estado_email` não é atribuição de origem do lead.** O pedido só sai do handler de `qualificacao`, nunca do fallback — mas como o contador herda o primeiro rótulo, um `enviado_aceito` vai aparecer em sessões contadas como `venda` ou `agendamento`. Isso não significa que o fallback pediu e-mail; significa que aquela sessão passou por qualificação num turno posterior. Sem esta frase, o relatório se lê como violação de #23.
- [ ] **Distribuição de intenções — proporções simples** sobre sessões engajadas, sem intervalo, com `indefinida` reportada como fatia própria e não diluída nas quatro. O rótulo **indicativa** é por célula, não pelo relatório: uma intenção com menos de 30 sessões sai rotulada, e as demais não perdem crédito por causa dela. Nome distinto do critério inferencial homônimo de propósito: são dois relatórios diferentes, e uma referência a "distribuição de intenções" sem qualificador seria ambígua.
- [ ] **Sessões por semana observadas, com fonte e consumidor:** a série vem do snapshot semanal do contador agregado, não de timestamp por sessão. Se na semana 2 a taxa projetar N=200 além de 12 semanas — 200 ÷ 12 ≈ 17 sessões/semana — dispara a reavaliação nomeada de R2a, cujo decisor e cujas opções já estão escritos. O número tem consumidor; não é coleta sem uso.

### Camada inferencial — só acima de N = 200 sessões válidas

Enquanto N < 200, nada nesta seção é reportável, e **todo gatilho numérico assume deferir** (#18). Um gatilho não avaliável não é um gatilho atingido.

- [ ] **Volume:** N = 200 sessões válidas alcançado. É a porta desta seção inteira, não um critério de sucesso do produto.
- [ ] **Distribuição de intenções com IC de 95%** sobre o denominador de sessões engajadas — que inclui `indefinida`. O gatilho de 20% do segundo handler é avaliado pelo **limite inferior** do intervalo. O denominador inflado por `indefinida` empurra as participações para baixo, o que torna o gatilho mais difícil de disparar: erra na direção de deferir, que é a direção certa.
- [ ] **Tabulação cruzada `origem × intencao`** reportada como indicativa apenas, por ser subdimensionada mesmo em N=200.

### Encerramento

- [ ] **Go/no-go pré-registrado** — com três desfechos. Antes de coletar qualquer dado, o wish registra quem decide sobre R1 e com base em quê. Os desfechos legais são **go**, **no-go** e **inconclusivo — estender a janela, somar tenant, comprar tráfego ou encerrar** (#22, R2a); o terceiro é o desfecho correto quando o volume observado não sustenta leitura, e existir por escrito é o que impede uma decisão forçada sobre dado insuficiente.
  - **A regra pré-registrada é qualitativa,** porque não há meta numérica a pré-registrar: é o fluxo executado ponta a ponta em ambiente real mais uma avaliação escrita do tenant, com os critérios redigidos **antes** de ver qualquer dado. Essa avaliação tem **dois juízos separados e ambos obrigatórios**, porque medem construtos diferentes que se dissociam nos dois sentidos:
    - **adoção do canal** — o lead está vindo e conversando? É o juízo que responde R1;
    - **qualidade dos leads** — o que chega serve ao time comercial?

    Cinco leads excelentes de quinhentos links enviados é qualidade alta com adoção falida. Um juízo só, sobre qualidade, decidiria *go* num cenário em que R1 caiu — exatamente o erro que esta fatia existe para não cometer.
  - **Regra de composição, pré-registrada junto com os juízos.** Exigir os dois insumos sem fixar como eles compõem deixaria a decisão livre depois de ver o dado, que é o que o pré-registro existe para impedir. A regra: **adoção é necessária para *go*.** Adoção negativa produz *no-go*, ou *inconclusivo* quando o volume observado não sustenta leitura. Qualidade só modula entre os cenários de adoção positiva — **qualidade alta nunca compensa adoção negativa.**
  - **Quem emite cada juízo:** adoção é do tenant, que declara os envios e observa o comportamento do canal; qualidade é do time comercial, que vê os leads e não vê os cliques. Atribuir adoção a quem só vê lead é pedir um juízo sobre evidência que essa pessoa não tem.
  - **Os números do piso entram como contexto, não como limiar** — abertura do link, engajamento, conversão de identificação e distribuição de intenções informam a leitura e não a decidem. É o que resolve a contradição entre "sem meta numérica, este é o baseline" e "a decisão não pode ser formulada depois de ver o número".
  - O registro precisa dizer, com todas as letras, que estas taxas medem **adoção do canal, não resolução de identidade**, para que um número bom não seja lido como progresso no problema que motivou o projeto.
  - Inclui uma checagem de sanidade de contaminação, que **lê o número de abertura do link** em vez de recomputá-lo: uma abertura alta demais para o tráfego declarado é sinal de tráfego automatizado, não de adoção (R9).
- [ ] **Consentimento:** a finalidade estreita — retorno comercial sobre esta conversa — é exibida na mini tela junto ao botão de envio, e o aceite é registrado com o lead. Não existe lead gravado sem aceite, por construção do fluxo. Nenhum consentimento de disparo de marketing é coletado nesta fatia.
- [ ] **Direitos do titular:** runbook de acesso e exclusão documentado, com dono nomeado, e exercitado ao menos uma vez em ambiente real antes do fim do piloto.
- [ ] **Retenção:** nenhum dado pessoal de sessão não identificada persiste após o TTL — verificado por inspeção da base própria. A política de retenção zero do provedor de LLM está documentada e o DPA assinado **antes da primeira sessão real do piloto**: é pré-condição, não resultado, porque uma vez que a primeira conversa vazou para o provedor não há como desfazer (R7).

## Next Step

After an independent design review returns SHIP, persist the evidence below and verify its content digest before running `wish`.

<!-- genie-design-review:start -->
## Design Review Evidence

- **Verdict:** PENDING
- **Reviewed content SHA-256:** PENDING
- **Reviewer:** PENDING
- **Reviewed at:** PENDING
<!-- genie-design-review:end -->
