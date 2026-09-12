# Elo · Conversas que conectam

Plataforma conversacional para empresas, construída para o hackathon. A empresa escolhe as funcionalidades; essa escolha define seu plano e o contexto necessário. O agente entende a intenção antes de solicitar qualquer identificação.

**Dúvidas, qualificação e catálogo não exigem cadastro. Agendamento e resolução de problemas passam pela identificação.** Essa regra é aplicada no backend, não depende de obediência do modelo.

## Entrega para novos usuários

Landing pública, tour por perfil (reabertura em **Minha conta**), modo escuro persistente, edição de perfil, troca e recuperação de senha estão implementados. Para publicar um piloto, siga [DEPLOY.md](DEPLOY.md) e use [.env.production.example](.env.production.example).

## Rodar agora

Requisitos: **Node 22.12+**, **Python 3.13 ou 3.14** e `uv` ou `pip`.

```bash
cp .env.example .env
# Adicione OPENAI_API_KEY no .env para usar IA generativa real.
bash scripts/dev.sh
```

- Plataforma: <http://localhost:5173>
- Canal demonstrativo: <http://localhost:5173/c/studio-aurora>
- API / Swagger: <http://localhost:8010/docs>
- Saúde: <http://localhost:8010/api/health>

Clique em **Explorar demonstração** na tela de login. O Studio Aurora é uma empresa fictícia com documentos, produtos e serviços. Conversas, contatos, pedidos, chamados e métricas são criados pelas interações reais com a demo; não há indicadores inventados.

Também é possível **criar uma conta** e configurar uma empresa do zero. O workspace novo começa vazio e separado dos demais.

Sem `OPENAI_API_KEY`, há um modo local explícito: classificador por regras e busca lexical nos documentos. Ele serve para testar operações e apresentação offline; **não substitui a OpenAI para conversação livre**. Com a chave, o servidor utiliza a Responses API para classificar e responder, com saídas estruturadas. Falhas do provedor caem no modo local sem inventar execução de operações.

### Inicialização manual

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.lock
npm ci
# Terminal 1:
.venv/bin/python -m uvicorn backend.main:app --env-file .env --host 127.0.0.1 --port 8010
# Terminal 2:
npm run dev -- --host 127.0.0.1 --port 5173
```

## O que está implementado

| Área | Comportamento |
|---|---|
| Empresas e acessos | Cadastro de empresa, login, cookie HttpOnly, logout, isolamento por tenant e papéis de gestão/liderança/operador. |
| Funcionalidades e planos | Seleção de cinco funcionalidades, plano derivado e checklist de contexto. Publicação bloqueada enquanto faltar contexto. Planos sem cobrança ou preços comerciais inventados. |
| Contexto | Documentos editáveis, categorias geral/qualificação/suporte, upload TXT/Markdown/CSV em UTF-8 e conector HTTPS de importação JSON. |
| Chat | Canal público por empresa, histórico da sessão, classificação a cada mensagem e guarda de identificação. Texto e gravação de áudio com transcrição OpenAI. |
| Qualificação | Descoberta anônima de necessidade, urgência e fit, sem pedido automático de e-mail ou cadastro por número de turnos. |
| Agenda | Serviços e disponibilidade configuráveis, reservas persistentes, bloqueio transacional de conflitos e download ICS. |
| Resolução | Identificação, procedimentos da empresa, registro de chamado e atualização operacional de status. Registrar chamado não é apresentado como resolver o problema. |
| Catálogo | Produtos, preços, quantidades e registro de pedido anônimo. Total calculado no servidor; nenhum pagamento é cobrado. |
| Atendimento humano | Inbox com atualização automática, fila, distribuição pela liderança, assumir conversa, responder, devolver ao agente e finalizar. O agente não responde em paralelo com o operador. |
| Clientes | Deduplicação por empresa/e-mail, exportação CSV, conta pendente, convite de ativação de uso único e portal com dados apenas daquele cliente. |
| Pós-atendimento | Convite transacional via SMTP. Portal permite cancelar/remarcar agendamentos, baixar ICS atualizado e acompanhar chamados. |
| OTP WhatsApp | Vínculo opcional de telefone no portal, com Twilio Verify, expiração e limite de tentativas. Em demo fictícia, código simulado identificado como tal. |
| Operação | Dashboard com dados persistidos, equipe, configurações, estado dos provedores e central de envios. |

## Roteiro de apresentação · 4 minutos

1. Abra a demonstração. Mostre **Funcionalidades** e **Base de contexto**: cada função exige informações específicas, e o plano acompanha a escolha.
2. Abra **Fluxo do agente**. Mostre os caminhos anônimos e o nó condicional de identificação.
3. Abra o canal público em outra aba. Pergunte **“Qual o horário de vocês?”**. A resposta usa o contexto e não solicita cadastro.
4. Diga **“Quero agendar uma conversa”**. Identifique-se, escolha serviço, dia útil e horário, confirme e baixe o convite ICS.
5. No workspace, abra **Agendamentos** e **Conversas**. Assuma a conversa e responda. A mensagem aparece no chat do cliente, e o agente fica pausado.
6. Abra **Central de envios**. No modo demo, use o link exibido para ativar a conta e mostrar o portal com a reserva. Mostre remarcação ou OTP simulado, se houver tempo.
7. Caminhos extras: **“Quero ver o catálogo”** registra pedido sem cadastro; **“Preciso resolver um problema”** identifica e permite abrir um chamado.

## OpenAI

Configure no ambiente do **backend**:

```dotenv
OPENAI_API_KEY=sua-chave
OPENAI_MODEL=gpt-4.1-mini
OPENAI_TRANSCRIBE_MODEL=gpt-4o-mini-transcribe
```

O modelo é configurável. A aplicação usa `POST /v1/responses`, JSON Schema estrito, validação Pydantic, timeout e `store: false`. A chave não é enviada ao navegador. O modelo classifica intenção e redige respostas; **reservas, chamados e pedidos são executados por endpoints determinísticos com validação de estado**.

O áudio é gravado pelo navegador, enviado para transcrição e devolvido como texto editável antes do envio. Precisa de microfone autorizado, localhost ou HTTPS e credencial OpenAI. O arquivo de áudio não é persistido pela aplicação.

`store: false` evita armazenar a resposta como recurso consultável da API; não é uma declaração de retenção zero de todos os sistemas do provedor. Verifique as configurações da sua organização antes de usar dados reais.

Referências: [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [modelo de transcrição](https://developers.openai.com/api/docs/models/gpt-4o-mini-transcribe).

## Deploy no Railway

Tudo necessário está neste repositório: `Dockerfile`, `railway.json`, frontend e backend.

1. Conecte este repositório como serviço no Railway. O Dockerfile compila o frontend e o FastAPI serve os arquivos gerados.
2. Adicione PostgreSQL e configure `DATABASE_URL` com a referência do serviço. Formatos `postgres://`, `postgresql://` e `postgresql+psycopg://` são aceitos.
3. Configure `OPENAI_API_KEY`, `OPENAI_MODEL` e as variáveis abaixo:

```dotenv
PUBLIC_URL=https://seu-dominio.up.railway.app
ALLOWED_ORIGINS=https://seu-dominio.up.railway.app
COOKIE_SECURE=true
DEMO_MODE=true
```

4. Gere o domínio público. O healthcheck está em `/api/health`, e a porta vem de `PORT`.
5. Para uma instância com clientes reais, use `DEMO_MODE=false` **desde a criação do banco**. O botão da demo não permite login nesse modo. Não reutilize um banco de demonstração com dados reais.

O deploy usa **um worker e uma réplica**. Os limites de requisições e a coordenação de respostas do agente são locais ao processo; precisam de armazenamento distribuído antes de escalar horizontalmente. Reserva de horários e consumo de links usam proteções transacionais no banco.

SQLite funciona localmente. Em cloud com disco efêmero, use PostgreSQL ou volume persistente. **Cloudflare Pages isoladamente não executa este backend Python.** É possível publicar o frontend lá, mas seria necessário configurar proxy para a API; a entrega pronta aqui usa Railway em uma origem única.

### Docker local com PostgreSQL

```bash
cp .env.example .env
# Configure OpenAI no .env, se disponível.
docker compose up --build
```

Abra <http://localhost:8080>. O volume `elo-postgres` persiste os dados.

## E-mail e ativação

O envio real requer `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` e `SMTP_FROM`. A implementação usa SMTP com STARTTLS. Configure também `PUBLIC_URL` para que o link aponte para o domínio correto.

- Convite expira em 24 horas e só pode ser usado uma vez.
- Conta já ativa não é rebaixada por outra conversa; login posterior usa novo link.
- Sem SMTP, o status é explícito. Em demo fictícia, o link pode ser aberto pela Central de envios da gestão; fora da demo o corpo do convite não é exposto na API administrativa.
- Com SMTP configurado, falha de envio fica registrada. O cliente pode solicitar outro link; confira o provedor antes de apresentar esse fluxo como entrega de e-mail concluída.
- `OPENAI_API_KEY` não habilita e-mail nem WhatsApp: são serviços independentes.

## CRM, ERP e APIs de contexto

O conector genérico lê um endpoint HTTPS autorizado e importa conhecimento público para o agente. Nenhuma integração específica com um CRM de mercado é presumida ou apresentada como conectada sem sincronização real.

Formato de resposta do endpoint:

```json
{
  "documents": [
    {
      "title": "Horário de atendimento",
      "category": "general",
      "content": "Segunda a sexta, das 9h às 18h."
    },
    {
      "title": "Perfil de qualificação",
      "category": "qualification",
      "content": "Atendemos pequenas empresas. Descubra objetivo e urgência."
    },
    {
      "title": "Procedimentos de suporte",
      "category": "support",
      "content": "Passos autorizados para diagnóstico e encaminhamento."
    }
  ]
}
```

Cadastre a conexão na interface, autorize o domínio em `INTEGRATION_ALLOWED_HOSTS` e, se necessário, configure uma variável `CONNECTOR_NOME_TOKEN` no servidor e informe **somente o nome dessa variável** no formulário. O token vira Bearer no endpoint autorizado. A sincronização é manual, tem timeout, limite de payload e não segue redirecionamentos. Repetir a sincronização substitui os documentos dessa conexão sem duplicá-los.

A lista de domínios deve conter somente provedores públicos confiáveis. Adaptadores de CRM/ERP que precisem autenticação específica ou exportação de leads são trabalhos de integração do fornecedor; esta versão fornece o contrato de importação e operações internas funcionais. Não inventa acesso a sistemas de terceiros.

## OTP no WhatsApp

Configure um serviço **Twilio Verify com WhatsApp habilitado**, mais:

```dotenv
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_VERIFY_SERVICE_SID=...
```

O cliente já autenticado pelo link de e-mail pode verificar um número em formato E.164 (`+5511999999999`). O fluxo não autentica alguém por ter vindo de um link do WhatsApp. São permitidos três pedidos por dez minutos e cinco tentativas por código; o desafio local expira em dez minutos. Códigos reais nunca são devolvidos ao navegador.

Sem Twilio, somente o tenant fictício da demo oferece verificação simulada, identificada como tal. [Referência de envio](https://www.twilio.com/docs/verify/api/verification) e [checagem](https://www.twilio.com/docs/verify/api/verification-check).

## Verificação

A revisão funcional ampliada, correções e dependências pendentes estão em [VALIDATION.md](VALIDATION.md).

```bash
.venv/bin/python -m pytest -q
npm run build
# Com API e frontend locais rodando:
npx playwright install chromium
npm run test:e2e
```

Os testes de API usam banco temporário isolado e não chamam provedores pagos. Cobrem intenção, guarda de identificação, recusa, mudança de rota, deduplicação, isolamento entre empresas, papéis, CSRF, idempotência, agenda, conflitos, ICS, ativação, OTP e transbordo concorrente. A integração OpenAI tem testes de contrato simulados; validação com a conta real depende de configurar a chave.

Os testes de navegador percorrem o painel, onboarding de empresa, contexto, publicação, chat, agenda, handoff, portal e layout mobile. Capturas ficam em `test-results/`. CI está em `.github/workflows/ci.yml`.

Validação da entrega em 12/09/2026: **23 testes de API aprovados**, **4 testes de navegador aprovados** no ambiente local e novamente na imagem Docker com PostgreSQL 17. Build TypeScript/Vite e build Docker concluídos. A validação dos provedores reais é independente desses testes, que usam o modo local ou respostas simuladas.

Após configurar a credencial no ambiente local, uma conversa real com OpenAI também passou pelos três caminhos: dúvida anônima → pedido de agendamento com identificação → retorno à dúvida sem identificação. Todas as três respostas usaram OpenAI, sem fallback. Envio real de e-mail, OTP WhatsApp e transcrição com microfone não fazem parte dessa evidência de validação.

## Estrutura

```text
backend/
  main.py         API, política de negócio e operações
  agent.py        nós de intenção e resposta com OpenAI
  db.py           persistência SQLAlchemy
  security.py     senha, sessão, papéis e limites
src/
  components/     shell do workspace
  pages/          telas operacionais, onboarding e chat público
  lib.tsx         cliente de API, estado de autenticação e componentes
  styles.css      identidade visual responsiva
scripts/dev.sh    inicialização local
tests/           testes de API e navegador
Dockerfile       imagem única de produção
railway.json     deploy e healthcheck
compose.yaml     ambiente local com PostgreSQL
```

O contexto original e as decisões anteriores continuam em `.genie/brainstorms/plataforma-conversa-lead/DESIGN.md`. O pedido do hackathon ampliou o escopo para a plataforma funcional; a arquitetura implementada e seus limites estão em [ARCHITECTURE.md](ARCHITECTURE.md).
