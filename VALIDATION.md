# Validação funcional — 12/09/2026

## Escopo e evidências

A validação cobre a implementação no repositório, executada localmente e em Docker com PostgreSQL. Não é uma garantia de ausência de defeitos nem uma validação de um domínio publicado.

| Área | Evidência |
|---|---|
| Navegador | Seis jornadas aprovadas em Docker com PostgreSQL; quatro na rodada conjunta e duas na repetição isolada após excederem o tempo sob carga do notebook. |
| API e regras de negócio | 32 casos aprovados em SQLite e os mesmos 32 em PostgreSQL 17, com banco separado. |
| Intenção e identificação | Dúvidas, qualificação e catálogo anônimos; agenda e suporte identificados; recusa e mudança de intenção; seis transições também testadas com OpenAI real. |
| Agendamentos | Persistência, conflito de horários, idempotência, ICS, cancelamento e remarcação pelo portal. |
| Pedidos e chamados | Pedido anônimo com preço do servidor; abertura de chamado, atribuição e atualização pelo operador; chamado continua operável após exclusão do chat. |
| Atendimento humano | Quatro políticas de transbordo testadas; pausa da IA; tomada de controle durante chamada de IA; operador autenticado em contexto de navegador separado. |
| Empresas e permissões | Cadastro, isolamento entre empresas, operações restritas por papel e rejeição de origem não autorizada. |
| Contexto | Cadastro, upload válido, rejeição de arquivo vazio/formato inválido; conector HTTPS simulado, domínio autorizado, substituição sem duplicação e preservação após falha. |
| Contas e senhas | Perfil, senha incorreta, troca autenticada, recuperação com envio simulado, token de uso único, invalidação da senha anterior e revogação das sessões. |
| Portal e OTP | Ativação de uso único, novo acesso após ativação, dados do cliente, agenda e código de demonstração. Twilio real não configurado. |
| Entrada e aparência | Landing responsiva, cadastro/onboarding/publicação, tema persistente, tour de gestor e operador, reabertura pela conta. |
| Modo produção | Inicialização com PostgreSQL e HTTPS simulado; cadastro, cookie Secure/HttpOnly/SameSite, HSTS, sessão, demo desativada e rejeição de origem externa. Provedores fictícios nesse teste. |
| Build | Imagem Docker final compilada; TypeScript/Vite e formatação verificados. |

## Correções feitas nesta revisão

1. A atribuição de atendimento passou a ser preservada nos pedidos, agendamentos e chamados. Antes, o operador dependia do registro do chat para atualizar um chamado e perdia essa capacidade depois da limpeza do histórico. A limpeza também preserva atribuições de registros anteriores.
2. Upload de contexto vazio ou contendo somente espaços é recusado.
3. A lista `INTEGRATION_ALLOWED_HOSTS` tolera espaços entre domínios e normaliza letras maiúsculas.

As regressões foram reproduzidas em testes antes das correções e passaram depois, nos dois bancos.

## Áudio e OpenAI real

A API de transcrição recebeu um WAV com voz sintética em português. A primeira frase teve erros de reconhecimento que alteraram palavras importantes. Uma repetição com fala mais lenta também teve uma palavra trocada, mas preservou a intenção de agendamento, classificada corretamente. A interface permite revisar o texto antes de enviá-lo. Isso valida o caminho técnico, não precisão perfeita de transcrição. Permissão e captura de um microfone físico ainda precisam ser conferidas no dispositivo e domínio final.

A conversa real passou por agendamento, atendimento, qualificação, catálogo, retorno a atendimento e resolução de problemas; as respostas indicaram OpenAI, sem fallback, com a identificação conforme a intenção.

## O que continua pendente

- SMTP real: `SMTP_HOST` e `SMTP_FROM` não estão configurados. Recuperação de senha e convites foram testados com envio simulado, não entrega em caixa de e-mail.
- Twilio real: credenciais ausentes. OTP de demonstração não comprova posse real de telefone.
- CRM/ERP de uma empresa: conector validado com contrato simulado; nenhum fornecedor real foi conectado.
- Deploy público: domínio, HTTPS do provedor, variáveis, backups/restauração e teste após deploy permanecem sob o roteiro de `DEPLOY.md`.
- Carga e disponibilidade: não foi feito teste de carga nem auditoria independente. O notebook chegou a usar aproximadamente 13 GB de RAM e praticamente 8 GB de swap durante a validação; testes de navegador que excederam o tempo foram repetidos isoladamente com limite maior. Isso não comprova desempenho sob carga de usuários.

## Reproduzir

```bash
.venv/bin/python -m pytest -q
npm run build
npm run test:e2e
```

`ELO_TEST_DATABASE_URL` permite rodar os testes de API em um **banco de teste vazio dedicado**. Nunca aponte essa variável para produção: os testes criam e alteram dados. `ELO_BASE_URL` seleciona o servidor de teste do navegador. Os testes de navegador esperam demonstração habilitada e modo local de IA; use um ambiente de validação separado do serviço de produção.
