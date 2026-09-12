# Arquitetura da entrega do hackathon

Esta implementação atende ao pedido de ampliar a primeira fatia para uma plataforma demonstrável completa. Ela substitui o recorte de implementação da r11, mantendo a regra de intenção confirmada pelo usuário. Não alega que todos os requisitos operacionais de uma plataforma comercial já foram certificados.

## Decisões concretas

- **React + Vite + TypeScript**, em vez de Next.js, porque esta experiência é uma aplicação interativa com um backend Python; não há requisito de SSR. O frontend de produção é compilado e servido pelo FastAPI, reduzindo a entrega a uma imagem e uma origem.
- **FastAPI** mantém autenticação, autorização e operações. SQLAlchemy usa SQLite local ou PostgreSQL via `DATABASE_URL`.
- **Multiempresa desde a entrega**: usuários, contexto, contatos, registros e agenda são escopados por tenant no servidor.
- **Um processo, uma réplica** no hackathon. Os bloqueios de chat e rate limits em memória são limites explícitos dessa topologia; escalar exige coordenação distribuída.
- **Responses API OpenAI** com contratos estruturados. O classificador retorna intenção e pedido de humano; o gerador retorna resposta e necessidade de intervenção humana. O modelo nunca decide sozinho criar uma reserva, pedido ou chamado.

## Grafo executável

```text
mensagem
  → autenticar sessão anônima e aplicar limites
  → verificar controle humano
      → humano/fila: persistir mensagem e não acionar agente
      → agente: classificar intenção atual
          → solicitação de humano + política permite: fila
          → intenção indefinida: esclarecer
          → capacidade desabilitada ou sem contexto: fallback sem cadastro
          → atendimento / qualificação: resposta contextual anônima
          → catálogo: produtos e pedido sem identificação obrigatória
          → agendamento / resolução
              → sem identificação: formulário com finalidade explícita
              → identificado: serviço de agenda / abertura de chamado
```

Identificação enviada em uma rota anônima é recusada pelo servidor. A primeira intenção registrada para estatística nunca substitui a intenção atual. Mudar para uma dúvida sai do formulário; recusar identificação não bloqueia as rotas anônimas.

A tomada de controle por um humano tem precedência sobre uma resposta OpenAI em andamento. Antes de persistir uma resposta, o motor relê o estado da conversa e descarta a resposta automática se alguém assumiu, se entrou na fila ou se foi encerrada.

## Planos e contexto

Os planos são combinações funcionais, sem preços comerciais inventados:

| Plano | Capacidades |
|---|---|
| Essencial | Dúvidas e qualificação |
| Conexão | Essencial mais catálogo e agenda |
| Completo | Conexão mais resolução de problemas |

Ativar uma função cria uma exigência real de configuração: documentos gerais, critérios de qualificação, catálogo, serviços ou procedimentos de suporte. Publicar é recusado enquanto uma função selecionada estiver sem contexto. Alterar as funcionalidades despublica para revisão; excluir uma fonte essencial faz a guarda de disponibilidade bloquear sua execução mesmo que o canal já estivesse publicado.

O conector genérico importa documentos de um endpoint HTTPS autorizado. Não há adaptadores específicos nem escrita em CRMs de terceiros. A agenda, catálogo, pedidos e chamados são serviços internos completos; conectá-los ao sistema operacional real de uma empresa exige o adaptador do fornecedor.

## Dados e autenticação

- `tenants`: empresa, slug e configuração.
- `users`: membros internos e papéis; e-mail de login único na plataforma.
- `auth_sessions`: tokens aleatórios armazenados por hash; cookie HttpOnly, SameSite=Lax e Secure configurável.
- `contacts`: identidade declarada pelo cliente, única por `(tenant_id, email)`.
- `records`: documentos, produtos, serviços, conversas, solicitações, convites e sessões do cliente, sempre com tenant e tipo explícitos.
- `reservations`: blocos de 15 minutos com unicidade por empresa/horário. Uma agenda compartilhada por empresa. Serviços reservam todos os blocos da duração.

A sintaxe de e-mail não comprova posse. Informar um e-mail durante a conversa autoriza somente registrar **a nova solicitação daquela sessão**. Dados anteriores são acessíveis pelo portal apenas após o link de ativação ser consumido. O token de ativação é consumido com uma atualização condicional no banco, antes de emitir uma sessão de cliente. Conta de cliente nunca ganha permissão interna.

Os papéis são verificados no backend. Operador precisa assumir uma conversa para responder e só atualiza operações atribuídas; liderança administra atendimento; gestão administra configuração, conteúdo e membros. Todos permanecem dentro de sua empresa.

## Persistência, retenção e métricas

Conversas têm TTL de 24 horas. A varredura roda a cada cinco minutos: a sessão expirada deixa de ser acessível imediatamente e seu conteúdo é removido na próxima varredura. O contador terminal armazena apenas agregados categóricos. Contatos e operações identificadas são duráveis para acompanhamento; não são um histórico ilimitado do chat.

O dashboard desta entrega mostra conversas vivas, contatos e operações. Não implementa o aparato inferencial de 200 sessões, ICs ou o go/no-go estatístico do experimento inicial. As estatísticas de r9–r11 ficam como especificação histórica e não devem ser apresentadas como resultados validados da aplicação.

Áudio é processado em memória e não é arquivado pela aplicação. Logs não incluem transcrições ou chaves. Retenção do provedor de IA/SMTP/WhatsApp depende do contrato e da configuração de cada provedor.

## Integrações e limites de entrega

- IA e transcrição reais exigem `OPENAI_API_KEY` e acesso aos modelos configurados. Sem chave, a interface informa modo local.
- Convites reais exigem SMTP. Demonstração local exibe o convite apenas ao gestor da instância de demo. Não há cobrança ou envio de marketing.
- WhatsApp OTP exige Twilio Verify habilitado para WhatsApp. Modo simulado não verifica posse real.
- Planos não têm billing. Pedidos registrados não executam pagamento.
- Não há chamadas de vídeo, catálogo de adaptadores específicos, múltiplas agendas por profissional, analytics inferencial ou SSO nesta entrega.
- O banco é inicializado com `create_all` porque não existia aplicação anterior. Evoluções de esquema posteriores precisam de migrações versionadas.

## Evidência

`tests/test_platform.py` verifica os invariantes de negócio e acesso em banco temporário. `tests/e2e/platform.spec.ts` executa as jornadas no navegador em desktop e mobile. A configuração CI repete os testes, compila o frontend e arquiva as capturas.

Referências de implementação: [FastAPI e autenticação](https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/), [Vite](https://vite.dev/guide/), [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs). O mecanismo de sessão adotado é opaco e armazenado no banco, não JWT.

## Preparação do piloto e experiência de entrada

Landing pública em `/` (visitantes) e `/welcome` (todos), cadastro em `/login?register=1`, conta em `/account`. O tour oferece um convite no primeiro acesso de uma conta não demonstrativa e percorre as telas conforme o perfil. Pode ser fechado, concluído e reaberto pela conta ou pelo botão de ajuda. O progresso de conclusão e o tema são preferências locais do navegador, não configurações globais da empresa.

Recuperação de senha interna usa tabela `password_resets`, token aleatório armazenado por hash, validade de 30 minutos e consumo transacional de uso único. A versão da senha invalida links anteriores após qualquer troca. Redefinição e troca autenticada removem todas as sessões do usuário. Tokens não são retornados pela API ou mostrados no backoffice; envio depende de SMTP. O cadastro de usuário interno ainda não exige validação de e-mail nem MFA.

`APP_ENV=production` aplica validações obrigatórias na inicialização: PostgreSQL, HTTPS público, cookies seguros, demo desativada e configuração de OpenAI/SMTP. Leia `DEPLOY.md` para variáveis, testes no domínio final, backup e limites da topologia de uma réplica.

A atribuição do operador é persistida também nas solicitações e preservada durante a limpeza de conversas, para que chamados, pedidos e agendamentos continuem operáveis depois do TTL do chat. Ver evidências atualizadas em `VALIDATION.md`.
