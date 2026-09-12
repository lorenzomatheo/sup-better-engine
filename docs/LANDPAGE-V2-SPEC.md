# Especificação Completa: Nova Landing Page (`/landpage-gemini38`)
> **Documento de Continuidade para Agentes de IA e Desenvolvedores**  
> **Projeto:** Sup Better Engine — Hackathon Global AI Tinkerers × OpenAI @ FIAP São Paulo  
> **Data de Atualização:** 12 de Setembro de 2026  
> **Branch de Referência:** `landpage-v2`  
> **Rota da Página:** `/landpage-gemini38`  
> **Arquivos do Código:**  
> - Componente principal: `frontend/src/app/landpage-gemini38/page.tsx`  
> - Estilos e animações: `frontend/src/app/landpage-gemini38/page.module.css`  
> - Design System de Referência (intocado): `frontend/src/app/landpage-terra/`

---

## 1. Visão Geral do Negócio & Tese de Venda

### 1.1 O Negócio: Sup Better Engine
O **Sup Better Engine** é uma plataforma de canal próprio para aquisição, triagem e qualificação de leads com agentes autônomos de IA (OpenAI + FastAPI + PostgreSQL 18 + Next.js 16).
- **Sem barreiras na entrada:** O lead clica em um link de campanha (anúncio, QR code, bio, WhatsApp) com tag de rastreamento `?origem=` e entra imediatamente em um chat acolhedor e anônimo, sem exigir login, download de app ou formulários de 10 campos.
- **Inteligência em tempo real:** Um agente com OpenAI analisa cada mensagem, identifica a intenção do usuário (`qualificacao`, `venda`, `agendamento`, `atendimento`, `indefinida`) e conduz o diálogo.
- **Captura contextual LGPD:** O e-mail é solicitado apenas no momento ótimo da conversa (Turn 4 ou intenção de agendamento/orçamento), limitado a 2 exibições por sessão.
- **Deduplicação e Atribuição:** Leads são deduplicados por e-mail normalizado e integrados ao backoffice RBAC em 3 níveis (Operador, Liderança, Gestão).

### 1.2 A Crise de Precificação do WhatsApp (01 de Outubro de 2026)
A Meta anunciou o fim definitivo da janela gratuita de 24 horas para mensagens de atendimento/serviço:
1. **Fim da Gratuidade na Janela:** Antes de 01/10/2026, quando o cliente mandava mensagem, a empresa tinha 24h para trocar mensagens ilimitadas sem custo adicional de serviço. A partir de 01/10/2026, **cada resposta enviada pela empresa ou chatbot é faturada individualmente** (~R$ 0,035 na tarifa base da Meta, podendo atingir R$ 0,35 com intermediários e BSPs no Brasil).
2. **A "Punição" dos Chatbots:** Um bot de IA ou atendente gasta de 6 a 10 mensagens para qualificar um lead. No WhatsApp, isso custará de **R$ 2,10 a R$ 3,50 por conversa**, inclusive para curiosos, contatos errados e spams (que representam mais de 60% do tráfego).
3. **A Solução Sup Better:** Ao transferir o primeiro contato para um canal próprio no seu domínio, o custo de mensageria da Meta cai para **R$ 0,00**, com infraestrutura fixa e custo de inferência OpenAI de frações de centavos (~R$ 0,02 por lead), gerando mais de **90% a 98% de economia de margem**.

### 1.3 O Hackathon Global AI Tinkerers × OpenAI @ FIAP
- **Tema Oficial:** *"Agents, Everywhere"*
- **Tese:** A maioria dos projetos cria agentes isolados em aplicativos de demonstração. O Sup Better injeta inteligência autônoma no ponto exato onde a atenção comercial já acontece (no clique do anúncio ou link de campanha), resolvendo um problema macroeconômico real e urgente para empresas brasileiras, garantindo posse dos dados e conformidade com a LGPD.

---

## 2. O Design System "Terra" Aplicado

A landing page `/landpage-gemini38` segue estritamente a identidade estética e estrutural do design **Terra** (`/landpage-terra`).

### 2.1 Paleta de Cores
| Token / Valor Hex | Nome Visual | Aplicação Principal |
| :--- | :--- | :--- |
| `#0e211c` | Deep Forest Green | Fundo do Hero, Navegação Sticky, superfícies de destaque |
| `#16352b` | Deep Moss Green | Seção "Como funciona / Arquitetura" |
| `#10211d` | Forest Dark Ink | Cor de texto principal, containers escuros de telemetria |
| `#f6f6ef` | Warm Linho / Ecru | Fundo padrão claro acolhedor (seções de conteúdo) |
| `#eef1e8` | Light Sage | Fundo da Calculadora e do Rodapé |
| `#e8eee4` | Muted Sage | Fundo interno da janela de chat no Hero |
| `#e6c4a9` | Terracotta Warm | Fundo da seção oficial do Hackathon FIAP |
| `#f7ecbf` | Solar Warmth | Esfera de iluminação solar (`orangeSun`) na seção Hackathon |
| `#c8ff4d` | Electric Lime | Botões primários, logotipo "T", manopla do slider, badges |
| `#ddff97` | Soft Lime | Cards de franquia preservada e badges de economia positiva |
| `#dcff99` | Pale Lime Text | Textos em destaque sobre fundo escuro |
| `#ea5044` / `#8c4433` | Alert Terracotta/Red | Alerta de contagem regressiva da Meta e comparativo de risco |
| `#d6ddd0` / `#e2e7df` | Light Border | Bordas suaves de cards no tema claro |

### 2.2 Efeitos Gráficos (`page.module.css`)
- **`heroOrb`:** Círculo difuso de 45rem posicionado em `right: -12rem; top: -18rem;` com gradiente radial de `#c8ff4d` e verde floresta.
- **`heroGlow`:** Iluminação radial difusa no canto inferior esquerdo do Hero.
- **`heroGrid`:** Malha quadriculada de 54px × 54px com opacidade 0.28 e máscara de gradiente vertical (`mask-image: linear-gradient(to bottom, black, transparent 82%)`).
- **`orangeSun`:** Esfera solar translúcida no canto superior da seção Hackathon.
- **`calculatorRange`:** Input `type="range"` estilizado com trilho gradiente `#8fbc63` → `#c8ff4d`, manopla circular com borda `#10211d` e foco acessível.
- **`floatSlow` & `floatFast`:** Animações CSS com `@keyframes terra-float` para badges flutuantes.

---

## 3. Arquitetura da Rolagem e Navegação (Problema Resolvido)

> [!WARNING]
> **Lição Crítica de Arquitetura de Layout:**
> No `layout.tsx`, o `html` e o `body` possuem as classes `h-full flex flex-col`.
> Se uma página filha colocar a classe `overflow-hidden` na tag `<main>`, o navegador **bloqueia totalmente a rolagem vertical**, travando a página no topo e impedindo a navegação por âncoras (`#impacto`, etc.).

### 3.1 Solução Implementada em `/landpage-gemini38`
1. **Remoção de `overflow-hidden` no `<main>`:**
   - `<main className="min-h-screen w-full bg-[#f6f6ef] text-[#10211d] scroll-smooth ...">`
   - O confinamento de elementos que transbordam (`heroOrb`, `heroGlow`, `orangeSun`) é feito **dentro das próprias `<section>`** que os contêm, usando `overflow-hidden` nelas, e não no `<main>`.
2. **Regras Globais em `page.module.css`:**
   ```css
   :global(html) {
     height: auto;
     min-height: 100%;
     scroll-behavior: smooth;
   }
   :global(body) {
     height: auto;
     min-height: 100%;
     overflow-y: auto;
   }
   ```
3. **Cabeçalho Sticky:**
   - `<header className="sticky top-0 z-50 backdrop-blur-md bg-[#0e211c]/95 border-b border-white/10">`
   - Permite que o usuário navegue entre seções ou troque de idioma em qualquer momento da leitura.
4. **Alinhamento de Âncoras com `scroll-mt-20`:**
   - Todas as seções possuem `scroll-mt-20` para compensar a altura do cabeçalho fixo, impedindo que o título da seção fique encoberto.
5. **Função `scrollToSection`:**
   - Rola suavemente usando `element.scrollIntoView({ behavior: 'smooth', block: 'start' })`.
6. **Menu Mobile Responsivo & Botão "Voltar ao Topo":**
   - Menu hambúrguer dropdown para telas menores (`< md`).
   - Botão flutuante circular com ícone de seta que surge após 400px de scroll.

---

## 4. Estrutura Detalhada das Seções

### Seção 1: Header Sticky + Hero
- **Navbar:** Logotipo com "T" verde limão, links para `#impacto`, `#calculadora`, `#produto`, `#hackathon`, `#comparativo`, botão de idioma (`🌐 English / Português`) e CTA "Ver a demo" (`/?origem=hackathon-fiap-gemini38`).
- **Hero:**
  - Badge: `Agents, Everywhere — AI Tinkerers × OpenAI @ FIAP, São Paulo`
  - Headline monumental: *"Quando conversar custa mais, cada conversa precisa valer mais."*
  - Subtítulo com posicionamento anti-custo Meta.
  - CTAs: "Experimentar o agente" e "Entender a mudança" (scroll suave para `#impacto`).
- **Mockup Interativo do Chat:**
  - Janela no padrão Terra (`rounded-[2rem] bg-[#f7f5eb] p-3 shadow-2xl`).
  - Chips de cenários rápidos para teste:
    1. *Reduzir custos WhatsApp* (intenção: qualificação comercial)
    2. *Agendar demonstração* (intenção: agendamento com solicitação de e-mail)
    3. *Preços e ROI* (intenção: orçamento e cálculo de economia)
  - Balões de conversa dinâmicos e telemetria: `intenção identificada · conversa atribuída · zero tarifa Meta`.

### Seção 2: O Impacto 2026 (`#impacto`)
- **Contador Regressivo em Tempo Real:** Dias, horas, minutos e segundos calculados dinamicamente até `2026-10-01T00:00:00Z`.
- **3 Cards de Estatística:**
  1. *Nova referência Brasil:* R$ 0,035 por mensagem de serviço na lista Meta (podendo atingir R$ 0,35 com intermediários).
  2. *Franquia preservada:* 1.000 mensagens gratuitas por mês por número.
  3. *O dreno dos bots:* O custo acumulado de 6 a 10 mensagens automáticas enviadas para curiosos.
- **Cenários de Escala:** 1.000 msgs (R$ 0) | 120 mil msgs (R$ 4.165/mês) | 1 milhão msgs (R$ 34.965/mês).

### Seção 3: Simulador Transparente & ROI (`#calculadora`)
Implementado com os sliders no padrão Terra (`calculatorRange`):
- **Inputs:**
  - `monthlyConversations` (1.000 a 100.000)
  - `messagesPerConversation` (1 a 20)
  - `serviceRate` (R$ 0,01 a R$ 0,10)
  - `ownedChannelCost` (R$ 0 a R$ 5.000)
  - `qualificationRate` (5% a 80%)
- **Fórmula de Cálculo:**
  $$\text{totalMessages} = \text{monthlyConversations} \times \text{messagesPerConversation}$$
  $$\text{billableMessages} = \max(0, \text{totalMessages} - 1000)$$
  $$\text{metaMonthlyCost} = \text{billableMessages} \times \text{serviceRate}$$
  $$\text{monthlyDifference} = \text{metaMonthlyCost} - \text{ownedChannelCost}$$
  $$\text{annualDifference} = \text{monthlyDifference} \times 12$$
- **Cards Reativos:**
  1. *Pressão de Mensageria Meta:* Mensagens faturáveis e custo total estimado da Meta.
  2. *Potencial de Economia:* Diferença mensal e impacto anual com badge percentual de margem preservada.
  3. *Custo por Lead Qualificado:* Comparativo lado a lado Meta vs. Canal Próprio.

### Seção 4: Como Funciona / Arquitetura (`#produto`)
Fundo verde musgo profundo (`#16352b`):
- **01 O lead chega:** Atribuição atômica via link com `?origem=`.
- **02 A conversa acontece:** Agente autônomo OpenAI acolhe sem formulários de barreira.
- **03 O time recebe contexto:** E-mail com consentimento LGPD e intenção estruturada prontos no backoffice.
- **Faixa de Pontos de Prova:** Canal próprio, identidade unificada e decisões com evidência.

### Seção 5: Hackathon AI Tinkerers × OpenAI @ FIAP (`#hackathon`)
Fundo terracota acolhedor (`#e6c4a9`) com o elemento `orangeSun`:
- Posicionamento da tese *"Agents, Everywhere"*.
- O que estamos demonstrando na FIAP (soberania de canal, classificação em 5 intenções com modelos OpenAI em FastAPI assíncrono, viabilidade macroeconômica comprovada).

### Seção 6: Matriz Comparativa (`#comparativo`)
Tabela clean no estilo Terra comparando:
- Critérios: Custo com mensagens, Atrito na entrada, Inteligência conversacional, Risco de indisponibilidade.
- Colunas: WhatsApp Business API vs. Formulário Estático (Typeform) vs. Sup Better Engine.

### Seção 7: CTA Final de Conversão & Rodapé
- Chamada final: *"A próxima mensagem pode custar. A próxima relação pode ser sua."*
- Botão para testar o agente no chat de produção (`/?origem=hackathon-fiap-gemini38`).
- Rodapé com créditos institucionais e link para a documentação de preços da Meta.

---

## 5. Suporte Bilíngue (PT-BR / EN)

- Estado centralizado: `const [lang, setLang] = useState<Lang>("pt");`
- Todos os textos de todas as 8 seções estão organizados no objeto `copy = { pt: { ... }, en: { ... } }`.
- Moeda e números utilizam `Intl.NumberFormat` reativo ao idioma selecionado:
  - Português: `R$ 4.165,00` e separadores de milhar com ponto (`10.000`).
  - Inglês: `$4,165.00` e separadores com vírgula (`10,000`).

---

## 6. Guia para o Próximo Agente de IA (Próximos Passos Recomendados)

Se você for continuar desenvolvendo nesta página ou no ecossistema:
1. **Conexão Real com a API de Chat:**
   - O mockup no Hero atualmente usa cenários mockados interativos (`t.presets`).
   - Se desejar conectar o próprio mockup ao endpoint real da FastAPI (`POST /api/chat/message`), basta importar o hook `useChat` de `@/hooks/useChat` ou usar `api-client.ts`.
2. **Captação do E-mail da Calculadora:**
   - Você pode adicionar um modal ou campo de submissão opcional ao final do simulador para que o visitante receba o relatório de ROI em PDF/E-mail, integrando diretamente com `POST /api/chat/email` ou `/api/leads`.
3. **Não Modificar `/landpage-terra` nem `/landing`:**
   - As duas rotas existentes devem permanecer intactas. Toda inovação deve ser mantida em `src/app/landpage-gemini38/` ou em novas variantes dedicadas.
4. **Verificação de Build Obrigatória:**
   - Antes de qualquer commit, rode sempre no terminal `frontend`:
     ```bash
     npx tsc --noEmit
     npx eslint src/app/landpage-gemini38/page.tsx
     npm run build
     ```
