import { test, expect } from "@playwright/test";
test("demo workspace, real anonymous chat, intent change and identified booking", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/login");
  await page.getByRole("button", { name: "Explorar demonstração" }).click();
  await expect(
    page.getByRole("heading", { name: /Olá, Marina/ }),
  ).toBeVisible();
  await page.screenshot({ path: "test-results/dashboard.png", fullPage: true });
  await page.getByRole("link", { name: /Fluxo do agente/ }).click();
  await expect(
    page.getByRole("heading", { name: "Cada intenção, um próximo passo." }),
  ).toBeVisible();
  await page.screenshot({ path: "test-results/flow.png", fullPage: true });
  await page
    .getByRole("link", { name: "Base de contexto", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Conhecimento que vira conversa." }),
  ).toBeVisible();
  const chat = await context.newPage();
  await chat.goto("/c/studio-aurora");
  await expect(
    chat.getByRole("button", { name: "Tirar uma dúvida", exact: true }),
  ).toBeVisible();
  await chat
    .getByRole("button", { name: "Tirar uma dúvida", exact: true })
    .click();
  await expect(chat.locator(".public-message.assistant").last()).toContainText(
    "9h",
  );
  await expect(chat.getByLabel("Seu e-mail", { exact: true })).toHaveCount(0);
  await chat
    .getByRole("textbox", { name: "Mensagem", exact: true })
    .fill("Quero agendar uma conversa");
  await chat
    .getByRole("button", { name: "Enviar mensagem", exact: true })
    .click();
  await expect(chat.getByLabel("Seu e-mail", { exact: true })).toBeVisible();
  await chat.getByLabel("Seu nome", { exact: true }).fill("Ana Demo");
  await chat
    .getByLabel("Seu e-mail", { exact: true })
    .fill("anademo@gmail.com");
  await chat.getByRole("checkbox").check();
  await chat
    .getByRole("button", { name: "Continuar solicitação", exact: true })
    .click();
  await expect(chat.getByLabel("Dia", { exact: true })).toBeVisible();
  const date = new Date();
  date.setDate(date.getDate() + 3);
  while ([0, 6].includes(date.getDay())) date.setDate(date.getDate() + 1);
  await chat
    .getByLabel("Dia", { exact: true })
    .fill(date.toLocaleDateString("en-CA"));
  await expect(chat.locator(".slots-grid button").first()).toBeVisible();
  await chat.locator(".slots-grid button").first().click();
  await chat
    .getByRole("button", { name: "Confirmar agendamento", exact: true })
    .click();
  await expect(
    chat.getByRole("button", { name: "Adicionar ao calendário" }),
  ).toBeVisible();
  await chat.screenshot({ path: "test-results/chat.png", fullPage: true });
  await page.getByRole("link", { name: "Agendamentos", exact: true }).click();
  await expect(
    page.getByRole("cell", { name: "Ana Demo", exact: true }).first(),
  ).toBeVisible();
  await page.getByRole("link", { name: "Conversas", exact: true }).click();
  await expect(
    page.locator(".inbox-item").filter({ hasText: "Ana Demo" }).first(),
  ).toBeVisible();
  await page
    .locator(".inbox-item")
    .filter({ hasText: "Ana Demo" })
    .first()
    .click();
  await page.getByRole("button", { name: "Assumir conversa" }).click();
  await page
    .getByPlaceholder("Escreva sua resposta…")
    .fill("Olá Ana! Estamos à disposição.");
  await page.getByRole("button", { name: "Enviar", exact: true }).click();
  await expect(
    chat
      .locator(".public-message")
      .filter({ hasText: "Olá Ana! Estamos à disposição." }),
  ).toBeVisible({ timeout: 12000 });
  expect(errors).toEqual([]);
});
test("mobile workspace and public channel fit viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/login");
  await page.getByRole("button", { name: "Explorar demonstração" }).click();
  await expect(
    page.getByRole("heading", { name: /Olá, Marina/ }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: "test-results/mobile-dashboard.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Abrir menu" }).click();
  await page
    .getByRole("link", { name: "Funcionalidades", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "O que vamos fazer juntos?" }),
  ).toBeVisible();
  await page.goto("/c/studio-aurora");
  await expect(
    page.getByRole("button", { name: "Tirar uma dúvida", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: "test-results/mobile-chat.png",
    fullPage: true,
  });
});
test("company onboarding derives requirements, saves context and publishes a real channel", async ({
  page,
}) => {
  const stamp = Date.now();
  await page.goto("/login");
  await page
    .getByRole("button", { name: "Criar uma conta", exact: true })
    .click();
  await page.getByLabel("Seu nome", { exact: true }).fill("Gestora Hackathon");
  await page
    .getByLabel("Nome da empresa", { exact: true })
    .fill(`Empresa ${stamp}`);
  await page
    .getByLabel("E-mail", { exact: true })
    .fill(`gestora${stamp}@example.org`);
  await page.getByLabel("Senha", { exact: true }).fill("HackathonSeguro2026!");
  await page.getByRole("button", { name: "Criar meu workspace" }).click();
  await expect(
    page.getByRole("heading", { name: "O que vamos fazer juntos?" }),
  ).toBeVisible();
  await page
    .getByRole("switch", { name: "Habilitar Agendamentos", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: /Seu plano: Conexão/ }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Base de contexto", exact: true })
    .click();
  for (const doc of [
    {
      title: "Informações públicas",
      content:
        "Atendemos de segunda a sexta, das 9h às 18h. Nosso serviço é consultoria digital.",
      category: "general",
    },
    {
      title: "Perfil de clientes",
      content:
        "Atendemos empresas que procuram consultoria para sites. Descubra objetivos e urgência sem pedir dados.",
      category: "qualification",
    },
  ]) {
    await page
      .getByRole("button", { name: "Adicionar contexto", exact: true })
      .click();
    await page.getByLabel("Título", { exact: true }).fill(doc.title);
    await page
      .getByLabel("Para qual funcionalidade?")
      .selectOption(doc.category);
    await page.getByLabel("Conteúdo", { exact: true }).fill(doc.content);
    await page
      .getByRole("button", { name: "Salvar contexto", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: doc.title, exact: true }),
    ).toBeVisible();
  }
  await page
    .getByRole("link", { name: "Catálogo e serviços", exact: true })
    .click();
  await page.getByRole("button", { name: "Serviços da agenda" }).click();
  await page.getByRole("button", { name: "Novo serviço" }).click();
  await page.getByLabel("Nome", { exact: true }).fill("Conversa inicial");
  await page.getByRole("button", { name: "Salvar item" }).click();
  await expect(
    page.getByRole("heading", { name: "Conversa inicial" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Configurações", exact: true }).click();
  await page.getByRole("switch", { name: "Publicar canal" }).click();
  await page
    .getByRole("button", { name: "Salvar alterações", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Configurações salvas");
  await page.goto(`/c/empresa-${stamp}`);
  await expect(
    page.getByRole("button", { name: "Agendar uma conversa", exact: true }),
  ).toBeVisible();
});
test("support creates a ticket, activates portal and verifies optional demo OTP", async ({
  page,
  context,
}) => {
  const stamp = Date.now();
  const email = `cliente${stamp}@gmail.com`;
  await page.goto("/login");
  await page.getByRole("button", { name: "Explorar demonstração" }).click();
  await expect(
    page.getByRole("heading", { name: /Olá, Marina/ }),
  ).toBeVisible();
  const chat = await context.newPage();
  await chat.goto("/c/studio-aurora");
  await chat
    .getByRole("button", { name: "Resolver um problema", exact: true })
    .click();
  await chat.getByLabel("Seu nome", { exact: true }).fill("Cliente Portal");
  await chat.getByLabel("Seu e-mail", { exact: true }).fill(email);
  await chat.getByRole("checkbox").check();
  await chat
    .getByRole("button", { name: "Continuar solicitação", exact: true })
    .click();
  await chat.getByLabel("Sobre o que é o problema?").fill("Arquivo do projeto");
  await chat
    .getByLabel("Conte o que aconteceu")
    .fill("Recebi o arquivo mas não consigo abrir no meu computador.");
  await chat
    .getByRole("button", { name: "Registrar solicitação", exact: true })
    .click();
  await expect(
    chat
      .locator(".public-message")
      .filter({ hasText: "Solicitação registrada:" }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Central de envios", exact: true })
    .click();
  const card = page.locator(".outbox-card").filter({ hasText: email });
  await expect(card).toBeVisible();
  const href = await card
    .getByRole("link", { name: "Testar ativação do cliente" })
    .getAttribute("href");
  const portal = await context.newPage();
  await portal.goto(href!);
  await portal
    .getByRole("button", { name: "Ativar minha conta", exact: true })
    .click();
  await expect(
    portal.getByRole("heading", { name: /Olá, Cliente/ }),
  ).toBeVisible();
  await expect(
    portal.getByText("Arquivo do projeto", { exact: true }),
  ).toBeVisible();
  await portal.getByLabel("WhatsApp com código do país").fill("+5511999999999");
  await portal
    .getByRole("button", { name: "Receber código", exact: true })
    .click();
  await expect(portal.locator(".otp-demo strong")).toBeVisible();
  const code = await portal.locator(".otp-demo strong").innerText();
  await portal.getByLabel("Código de verificação").fill(code);
  await portal
    .getByRole("button", { name: "Verificar código", exact: true })
    .click();
  await expect(
    portal.getByText(/Verificação simulada no ambiente de demonstração/),
  ).toBeVisible();
  await portal.screenshot({ path: "test-results/portal.png", fullPage: true });
});

test("landing, persistent dark mode, account and repeatable guided tour", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Um bom atendimento/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ativar modo escuro" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.screenshot({
    path: "test-results/landing-dark.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Entrar", exact: true }).click();
  await page.getByRole("button", { name: "Explorar demonstração" }).click();
  await page.getByRole("link", { name: "Minha conta", exact: true }).click();
  await page.getByRole("button", { name: "Refazer tour" }).click();
  const tour = page.getByRole("dialog", { name: "Tour da plataforma" });
  await expect(tour).toContainText("Escolha o que seu agente faz");
  await page.getByRole("button", { name: "Próximo", exact: true }).click();
  await expect(page).toHaveURL(/\/context$/);
  await page.getByRole("button", { name: "Fechar tour" }).click();
  await expect(tour).toHaveCount(0);
  await page.getByRole("link", { name: "Minha conta", exact: true }).click();
  await page.getByRole("button", { name: "Refazer tour" }).click();
  for (let i = 0; i < 6; i++)
    await page.getByRole("button", { name: "Próximo", exact: true }).click();
  await page.getByRole("button", { name: "Concluir tour" }).click();
  await expect(page).toHaveURL(/\/account$/);
  await page.screenshot({
    path: "test-results/account-dark.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Visão geral" }).click();
  await expect(
    page.getByRole("heading", { name: /Olá, Marina/ }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/dashboard-dark.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/welcome");
  await expect(
    page.getByRole("heading", { name: /Um bom atendimento/ }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: "test-results/landing-mobile.png",
    fullPage: true,
  });
});

test("operator login, assigned conversation, permissions and password change", async ({
  page,
  browser,
}) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Explorar demonstração" }).click();
  await expect(
    page.getByRole("heading", { name: /Olá, Marina/ }),
  ).toBeVisible();
  const base = new URL(page.url()).origin;
  const email = `operator-${Date.now()}@example.org`;
  const created = await page.request.post("/api/team", {
    data: {
      name: "Operador Jornada",
      email,
      password: "Operator-before-2026",
      role: "operator",
    },
  });
  expect(created.ok()).toBeTruthy();
  const member = await created.json();
  const session = await (
    await page.request.post("/api/public/studio-aurora/sessions", {
      data: { origin: "web" },
    })
  ).json();
  const id = session.conversation.id;
  expect(
    (
      await page.request.post(`/api/conversations/${id}/action`, {
        data: { action: "assign", assignee_id: member.id },
      })
    ).ok(),
  ).toBeTruthy();
  const operatorContext = await browser.newContext();
  const op = await operatorContext.newPage();
  try {
    await op.goto(base + "/login");
    await op.getByLabel("E-mail", { exact: true }).fill(email);
    await op.getByLabel("Senha", { exact: true }).fill("Operator-before-2026");
    await op
      .getByRole("button", { name: "Entrar no workspace", exact: true })
      .click();
    await expect(op.getByRole("heading", { name: /Olá,/ })).toBeVisible();
    await expect(
      op.getByRole("link", { name: "Configurações", exact: true }),
    ).toHaveCount(0);
    await expect(
      op.getByRole("link", { name: "Equipe e acessos", exact: true }),
    ).toHaveCount(0);
    await op.goto(base + `/conversations?selected=${id}`);
    await op
      .getByPlaceholder("Escreva sua resposta…")
      .fill("Olá! Vou acompanhar sua solicitação.");
    await op.getByRole("button", { name: "Enviar", exact: true }).click();
    await expect(
      op.getByText("Olá! Vou acompanhar sua solicitação.", { exact: true }),
    ).toBeVisible();
    const clientState = await (
      await page.request.get(`/api/chat/${id}`, {
        headers: { "X-Chat-Token": session.token },
      })
    ).json();
    expect(clientState.messages.at(-1).content).toBe(
      "Olá! Vou acompanhar sua solicitação.",
    );
    await op.getByRole("link", { name: "Minha conta", exact: true }).click();
    await op.getByRole("button", { name: "Refazer tour" }).click();
    await expect(op.getByRole("dialog")).toContainText(
      "Seu ponto de atendimento",
    );
    await op.getByRole("button", { name: "Fechar tour" }).click();
    await op.getByRole("link", { name: "Minha conta", exact: true }).click();
    await op
      .getByLabel("Seu nome", { exact: true })
      .fill("Operador Atualizado");
    await op
      .getByRole("button", { name: "Salvar perfil", exact: true })
      .click();
    await expect(op.getByRole("status")).toContainText("Nome atualizado");
    await op
      .getByLabel("Senha atual", { exact: true })
      .fill("Operator-before-2026");
    await op
      .getByLabel("Nova senha", { exact: true })
      .fill("Operator-after-2026");
    await op
      .getByRole("button", { name: "Alterar senha", exact: true })
      .click();
    await expect(op).toHaveURL(/\/login$/);
    await op.getByLabel("E-mail", { exact: true }).fill(email);
    await op.getByLabel("Senha", { exact: true }).fill("Operator-after-2026");
    await op
      .getByRole("button", { name: "Entrar no workspace", exact: true })
      .click();
    await expect(
      op.getByRole("heading", { name: /Olá, Operador/ }),
    ).toBeVisible();
  } finally {
    await operatorContext.close();
  }
});
