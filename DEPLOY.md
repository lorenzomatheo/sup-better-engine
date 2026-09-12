# Publicar a Elo para um piloto

A entrega contém landing page pública, cadastro de empresas, login, conta, recuperação de senha por e-mail, tour por perfil e tema claro/escuro. Nenhuma conta de cloud foi alterada: os passos abaixo são executados por você.

## Railway: uma aplicação + PostgreSQL

1. Envie os arquivos deste repositório para seu Git remoto. Crie o serviço a partir desse repositório no Railway. O `railway.json` usa o Dockerfile; não configure um segundo servidor frontend.
2. Adicione PostgreSQL ao projeto. No serviço Elo, defina `DATABASE_URL` como referência à variável do banco (`${{Postgres.DATABASE_URL}}`, ajustando o nome do serviço). Use um banco novo de produção, sem os dados da demo.
3. Gere um domínio HTTPS para a aplicação. Defina `PUBLIC_URL` e `ALLOWED_ORIGINS` com esse endereço exato, sem barra final. Exemplo: `https://elo-exemplo.up.railway.app`. Se usar mais de uma origem, separe com vírgulas.
4. Copie as variáveis de `.env.production.example` para as configurações do serviço. Preencha OpenAI e SMTP. O SMTP precisa aceitar STARTTLS na porta configurada e um remetente autorizado pelo provedor. Configure `SMTP_USER` e `SMTP_PASSWORD` quando houver autenticação. A recuperação de senha e os convites dependem desse serviço.
5. Mantenha `APP_ENV=production`, `DEMO_MODE=false`, `COOKIE_SECURE=true`. A API recusa iniciar em produção se faltarem configuração essencial, PostgreSQL, HTTPS ou cookies seguros. O botão de demo não aparece. Nunca envie `.env` ou chaves ao Git.
6. Use **uma réplica** e o comando do Dockerfile (um worker). O processo respeita `PORT`; o healthcheck está em `/api/health`. Não habilite vários workers/réplicas nesta versão: coordenação de conversas e limites de tentativas ainda usam memória local.
7. Configure backups do PostgreSQL no provedor antes de convidar clientes e valide a restauração em um banco separado. Deploys preservam os dados no PostgreSQL; não use SQLite em disco efêmero.

## Conferir no endereço publicado

- `/` abre a landing quando você está deslogado; `/login?register=1` abre o cadastro. Após entrar, `/` abre o dashboard. `/welcome` permite rever a landing mesmo autenticado.
- Crie sua empresa. O convite para o tour aparece no primeiro acesso; o tour pode ser refeito em **Minha conta**. O tema fica salvo no navegador.
- Em **Minha conta**, salve o nome e troque a senha. A troca encerra todas as sessões anteriores; entre com a senha nova.
- Saia e use **Esqueci minha senha**. Confirme o recebimento do e-mail, a redefinição e a rejeição da reutilização do link. O link expira em 30 minutos. A resposta pública não informa se um endereço tem conta.
- Cadastre documentos, serviços e produtos; publique o canal. Teste dúvida anônima → agendamento com identificação → retorno à dúvida. Confira a reserva na agenda.
- Crie um operador e teste em janela anônima: assumir, responder, devolver ao agente. Confira o link de ativação do cliente por e-mail.
- Confira logs e custos da OpenAI durante o piloto. Valide o áudio com um microfone autorizado no domínio HTTPS.

## Atualizações e retorno de versão

Faça backup antes de mudanças no banco. Esta entrega cria tabelas ausentes com SQLAlchemy `create_all`, incluindo a tabela de recuperação de senha; não transforma colunas existentes. Mudanças futuras de esquema precisam de migrações versionadas. Para reverter uma alteração somente de código, retorne à imagem anterior. Para mudanças de dados, restaure uma cópia do backup em banco separado e confirme os dados antes de trocar a referência.

## Limites do piloto

Há isolamento por empresa e papéis verificados no backend, senhas com scrypt, cookies HttpOnly/SameSite/Secure, verificação de origem, limite de tentativas e recuperação com token de uso único armazenado por hash. Isso não substitui auditoria de segurança ou teste de carga.

O cadastro interno ainda não exige confirmação de posse do e-mail e não há MFA. Operação comercial ampla requer essas medidas, política de privacidade, monitoramento e migrações. Histórico de conversa expira em 24 horas; contatos e solicitações permanecem. Pagamentos, chat nativo WhatsApp e adaptadores específicos de CRM/ERP continuam fora desta entrega.

Credenciais SMTP e Twilio são independentes da OpenAI. O envio real de e-mail e OTP precisa ser validado com seus provedores no ambiente publicado.

## Validação desta revisão

Em 12/09/2026: 25 testes de API aprovados, incluindo recuperação de senha, uso único do link, revogação de sessões e bloqueio de configuração de produção incompleta. As cinco jornadas de navegador passaram na imagem Docker com PostgreSQL, incluindo landing mobile, tema persistente, conta e tour reaberto. Uma jornada excedeu a espera inicial de cinco segundos sob carga do notebook e passou ao ser repetida com espera de dez segundos. Build TypeScript/Vite, imagem Docker e formatação verificados. SMTP real ainda precisa de configuração e teste de entrega no seu provedor.
