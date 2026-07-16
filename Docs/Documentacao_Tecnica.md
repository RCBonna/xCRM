# Documentacao Tecnica do xCRM

Criado em: 2026-06-12 20:13:05 -03:00  
Ultima modificacao: 2026-07-16 18:14:55 -03:00
Status: Documento vivo de arquitetura, implementacao e operacao tecnica

## Regra de manutencao

Este documento deve ser atualizado a cada mudanca tecnica relevante no app.

Atualizar quando houver mudancas em:

- Arquitetura.
- Stack e dependencias.
- Estrutura de pastas.
- Autenticacao e autorizacao.
- Multi tenant e permissoes.
- Banco de dados, Prisma, Supabase e migrations.
- Row Level Security.
- Integracoes.
- IA.
- Importacao de dados.
- Configuracao de ambiente.
- Scripts, build, deploy e operacao.

## Stack atual

- Next.js com App Router.
- TypeScript.
- Tailwind CSS.
- Supabase com PostgreSQL.
- Supabase Auth.
- Prisma.
- PWA como primeiro alvo mobile.
- IA assistiva simples e contextual no MVP.

## Design System e Interacao

- `src/app/globals.css` define feedback global para `button` e links com classe arredondada.
- `src/app/globals.css` define tokens globais de campos (`--field` e `--field-autofill`) para manter inputs coerentes com cada tema.
- `src/app/globals.css` define tokens `--primary-action-*` para diferenciar a intensidade dos botoes primarios por tema.
- Hover: borda e sombra ficam mais claras para indicar que o elemento e clicavel.
- Active: o elemento recebe deslocamento discreto para baixo e escala leve, simulando clique/pressao.
- Focus visivel: teclado recebe outline com cor de foco do tema.
- Disabled: botoes desabilitados nao aplicam deslocamento nem sombra de clique.
- Inputs, selects e textareas usam fundo de campo por tema, hover/focus padronizados e sobrescrita de `:-webkit-autofill`.
- No tema claro os campos usam fundo claro; no tema escuro usam fundo escuro para evitar contraste excessivo com os paineis.
- No tema claro, botoes `bg-primary` permanecem preenchidos; no tema escuro, usam fundo primario suave com borda e texto claros.
- A regra respeita `prefers-reduced-motion`, removendo transicoes e transformacoes quando o usuario prefere menos movimento.

## Estrutura inicial

- `src/app`: rotas e telas do App Router.
- `src/components`: componentes reutilizaveis de interface.
- `src/lib`: clientes e utilitarios de infraestrutura.
- `src/app/auth/actions.ts`: Server Actions de login, cadastro, logout e onboarding.
- `src/app/dashboard/actions.ts`: Server Actions do Dashboard, incluindo conclusao de atividades pendentes gerais do tenant.
- `src/app/accounts/actions.ts`: Server Actions para cadastro, edição, contatos, oportunidades, criação, edição, conclusão e exclusão de ações de Empresa/Prospect.
- `src/app/settings/company`: tela de Configurações da Empresa restrita a Owner/Admin.
- `src/app/settings/company/actions.ts`: Server Action para atualização dos dados institucionais do tenant.
- `src/app/settings/team`: tela de Equipes e Usuários restrita a Owner/Admin.
- `src/app/settings/team/actions.ts`: Server Actions para criar/editar/inativar equipes, pré-cadastrar/editar/inativar usuários, alterar líder e vincular/remover usuários de equipes.
- `src/components/app-settings-menu.tsx`: menu superior no cabeçalho, com seleção de tema para todos os perfis e acesso a Configurações da Empresa, Cadastro Prospects/Clientes e Equipes e Usuários para Owner/Admin.
- `src/components/team-users-tab.tsx`: Client Component da aba Cadastro de Usuários, com seleção na lista e formulário único para criar ou editar usuário.
- `src/components/team-teams-tab.tsx`: Client Component da aba Cadastro de Equipes, com seleção na lista e formulário único para criar ou editar equipe.
- `src/components/team-leaders-tab.tsx`: Client Component da aba Líder da Equipe, com seleção de Equipe ativa e formulário único para alterar `managerUserId`.
- `src/components/team-audit-log-panel.tsx`: Client Component para exibir/recolher o Log de Equipes e Usuários, iniciando recolhido.
- `src/lib/visibility.ts`: regras de visibilidade de carteira por perfil e equipe.
- `src/components/action-date-time-input.tsx`: controle de Data e Hora para Ações, com minutos restritos a `00`, `15`, `30` e `45`.
- `src/app/accounts`: tela autenticada de empresas/prospects.
- `src/app/accounts/[id]`: detalhe e edição básica de uma Empresa/Prospect.
- `src/app/imports`: tela Owner-only de carga temporaria de planilhas, revisao por linha e importacao individual para tabelas definitivas.
- `src/app/imports/actions.ts`: Server Actions para iniciar carga, salvar/aprovar/rejeitar/importar linha e descartar carga.
- `src/lib/imports/settings.ts`: leitura de parametros de importacao a partir de `config/import-settings.json`.
- `src/lib/imports/spreadsheet.ts`: leitura de conteudo enviado pelo navegador, usando `read-excel-file` para `.xlsx` e parser local simples para `.csv`; nao depende de caminho local do servidor.
- `src/lib/imports/normalizer.ts`: normalizacao heuristica inicial para separar Empresa, Contato, Historico e Proxima Acao.
- `config/import-settings.json`: parametro local da pasta de importacao e extensoes permitidas.
- `src/lib/brazilian-states.ts`: lista local de UFs brasileiras e helper de validacao.
- `src/app/login`: tela de login e criacao de acesso.
- `src/components/login-access-tabs.tsx`: abas de acesso para entrar ou criar acesso.
- `src/components/login-info-panel.tsx`: painel de mensagens e textos rotativos da tela de acesso.
- `src/components/pending-submit-button.tsx`: botao de submit com `useFormStatus`, exibindo `Processando...` e icone girando durante Server Actions.
- `src/components/dashboard-pending-activities-panel.tsx`: painel expansivel do Dashboard para exibir/recolher e concluir atividades pendentes do tenant.
- `src/components/accounts-tabs.tsx`: navegação por abas de `/accounts`, detecção de formulário alterado e ações do cadastro.
- `src/components/platform-tenant-delete-form.tsx`: fluxo cliente da exclusao completa de organizacao, com confirmacao textual, dois modais e painel de processamento visual.
- `src/components/account-history-panel.tsx`: painel expansivel do historico de Empresa/Prospect.
- `src/components/account-section-panel.tsx`: painel cliente reutilizavel de expandir/recolher usado em Contatos, Oportunidades e Proximas Acoes no detalhe da Empresa/Prospect.
- `src/components/account-add-panel.tsx`: painel cliente reutilizavel para manter formularios de criacao recolhidos atras de botoes `Adicionar ...`.
- `src/components/account-contacts-panel.tsx`: painel expansivel de contatos no detalhe da Empresa/Prospect, mantendo o botao `Adicionar Contato` fora do conteudo recolhivel.
- `src/components/tenant-brand.tsx`: bloco de marca dos cabeçalhos autenticados, com logo inteiro da Scientiam à esquerda e linhas compactas de Organização do Tenant, título da tela e subtítulo à direita.
- `src/components/account-customer-data-panel.tsx`: painel recolhível de Dados do Cliente, com CEP, endereço e busca via ViaCEP.
- `src/components/datetime-local-defaults.tsx`: comportamento global para inicializar campos `datetime-local` vazios com data atual às 09:00 e normalizar horários para intervalos de 15 minutos.
- `src/components/dirty-submit-button.tsx`: botão cliente que habilita `Salvar Alterações` apenas quando o formulário tem mudança real.
- `src/components/cnpj-input.tsx`: Client Component para CNPJ alfanumérico com máscara visual, uppercase e 2 últimos caracteres numéricos.
- `src/components/import-status-filter.tsx`: Client Component do filtro de status da fila de importacao, com menu controlado, fechamento apos selecao e estado de processamento durante navegacao.
- `src/components/uppercase-input.tsx`: Client Component para entradas que devem ser digitadas e salvas em maiúsculas.
- `src/app/onboarding`: criacao do primeiro tenant e usuario owner.
- `src/app/dashboard`: painel autenticado inicial.
- `src/components/version-banner.tsx`: banner global de versao WIP.
- `src/lib/app-version.ts`: valor unico da versao exibida no topo.
- `PRODUCT.md`: registro de produto usado pelo Impeccable, definindo o xCRM como SaaS CRM operacional multiempresa com direcao clara, confiavel e operacional.
- `DESIGN.md`: design system visual do xCRM no formato Impeccable/Stitch, com tokens, regras de uso, componentes e anti-padroes.
- `.impeccable/design.json`: sidecar do Impeccable com metadados de cor, tipografia, sombras, movimento e componentes renderizaveis no painel live.
- `.impeccable/live/config.json`: configuracao local do Impeccable live mode para injetar o helper em `src/app/layout.tsx` quando uma sessao live for iniciada.
- `src/components/currency-input.tsx`: Client Component para entrada monetaria em formato `R$` no padrao pt-BR.
- `prisma/schema.prisma`: modelo de dados multi tenant.
- `prisma/truncate_all_tables.SQL-Truncated`: script local e ignorado pelo Git para truncate total das tabelas publicas do app, criado para uso manual/controlado e nao executado automaticamente.
- `prisma/create_platform_admin.SQL-Administrador`: script local e ignorado pelo Git para criar/atualizar um `Platform Admin` com Nome, e-mail e senha, vinculando Supabase Auth a `public.platform_admins`.
- `Docs`: documentacao viva do projeto.

## Configuracao local

1. Instalar dependencias:

```bash
npm install
```

2. Criar `.env` a partir de `.env.example`.

3. Configurar variaveis do Supabase.

Projeto Supabase remoto atual:

- Nome: `xCRM`
- Ref: `qeadwfyedxhswqcxyeuq`
- Regiao: Sao Paulo (`sa-east-1`)

Variaveis esperadas:

- `DATABASE_URL`: URL do pooler transacional Supabase, porta `6543`, com `pgbouncer=true`.
- `DIRECT_URL`: URL do pooler de sessao Supabase, porta `5432`, sem `pgbouncer=true`, usada pelo Prisma no runtime local e para migrations/operacoes administrativas.
- `NEXT_PUBLIC_SUPABASE_URL`: URL publica do projeto Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: chave publica/publishable do Supabase.

4. Gerar Prisma Client:

```bash
npm run prisma:generate
```

5. Validar schema Prisma:

```bash
npm run prisma:validate
```

6. Rodar o app:

```bash
npm run dev
```

O script `npm run dev` usa `cross-env NODE_OPTIONS=--use-system-ca next dev --webpack` para evitar erro local de certificado ao chamar Supabase Auth no Windows/Node e para desativar Turbopack no ambiente local enquanto houver instabilidade de cache/build dentro da pasta sincronizada pelo OneDrive.

`next.config.ts` configura `allowedDevOrigins: ["127.0.0.1"]` para permitir que os recursos de desenvolvimento do Next sejam carregados quando o app local for acessado por `http://127.0.0.1:3000`. Sem essa origem liberada, componentes cliente podem nao hidratar no dev server e botoes com `onClick`, como a confirmacao de exclusao de organizacao, podem nao responder.

O cliente Prisma em `src/lib/prisma.ts` prioriza `DIRECT_URL` quando ela esta configurada. Esse padrao evita falhas observadas no pooler durante o fluxo de login/onboarding no ambiente local.

Em 2026-06-29, o `.env` local foi corrigido para remover a combinacao invalida de porta `5432` com `pgbouncer=true`. O padrao local atual e `DATABASE_URL` no pooler transacional `:6543` e `DIRECT_URL` no pooler de sessao `:5432`.

## Deploy Vercel

O deploy na Vercel precisa das mesmas variaveis de ambiente usadas pelo runtime
do app. Configurar em `Project Settings > Environment Variables`:

- `DATABASE_URL`: URL pooler do Supabase. E a variavel preferencial para o Prisma em Vercel/producao.
- `DIRECT_URL`: URL direta do banco Supabase, mantida como fallback e para operacoes administrativas/migrations.
- `POSTGRES_PRISMA_URL`: URL gerada pela integracao Supabase/Vercel para Prisma. Quando existir em Vercel/producao, o runtime usa esta variavel antes de `DATABASE_URL`.
- `NEXT_PUBLIC_SUPABASE_URL`: URL publica do projeto Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: chave publica/publishable do Supabase.

As variaveis precisam estar habilitadas para o ambiente que sera implantado:

- `Production`, para deploys da branch principal.
- `Preview`, para deploys de branches/PRs.
- `Development`, se a Vercel CLI for usada localmente.

Erro conhecido quando `DIRECT_URL` e `DATABASE_URL` nao estao configuradas:

```text
Error: Failed to collect configuration for /accounts/[id]
[Cause]: Error: POSTGRES_PRISMA_URL, DIRECT_URL or DATABASE_URL is not configured.
Error: Failed to collect page data for /accounts/[id]
```

A causa e que `src/lib/prisma.ts` cria o cliente Prisma a partir dessas
variaveis ao importar rotas protegidas. Sem a URL de banco no ambiente Vercel,
o build nao consegue concluir. Em Vercel/producao, o cliente Prisma prefere
`POSTGRES_PRISMA_URL`, depois `DATABASE_URL`; em desenvolvimento local, prefere
`DIRECT_URL`.

Em 2026-06-15, a pasta local foi vinculada ao projeto Vercel
`roberto-c-bonanomis-projects/x-crm` pela Vercel CLI. As variaveis
`DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL` e
`NEXT_PUBLIC_SUPABASE_ANON_KEY` foram reaplicadas no ambiente `Production` a
partir do `.env` local. As mesmas variaveis tambem foram enviadas para
`Preview` na branch `main`.

Ainda em 2026-06-15, os logs de runtime da Vercel mostraram que a `DATABASE_URL`
do pooler retornava `(ENOTFOUND) tenant/user postgres.qeadwfyedxhswqcxyeuq not
found`. Como a integracao Supabase/Vercel ja mantem `POSTGRES_PRISMA_URL`, o
cliente Prisma passou a priorizar esta variavel no ambiente Vercel antes de
usar `DATABASE_URL`.

Na reincidencia do erro em runtime, foi confirmado que `POSTGRES_PRISMA_URL` nao
estava configurada localmente e que `DATABASE_URL` ainda apontava para o pooler
invalido. Como medida operacional durante o WIP, as variaveis
`POSTGRES_PRISMA_URL` e `DATABASE_URL` foram reconfiguradas na Vercel
`Production` para usar a mesma conexao direta validada em `DIRECT_URL`. Esta
decisao deve ser revista quando a URL correta do pooler Supabase for recuperada
ou recriada.

Outro erro observado no runtime Vercel foi `PrismaClientKnownRequestError P1011`
com `self-signed certificate in certificate chain`. A causa foi a conexao direta
Supabase usando SSL sem compatibilidade libpq. O cliente Prisma normaliza URLs
diretas do Supabase (`db.*.supabase.co`) para incluir `sslmode=require` e
`uselibpqcompat=true`, que foi o formato validado com `pg`.

Como o adapter Prisma continuou tratando `sslmode=require` como verificacao
estrita no runtime Vercel, a implementacao passou a configurar o `pg` por
`PoolConfig`: para hosts Supabase (`*.supabase.co` e `*.supabase.com`), remove
parametros SSL da URL e usa `ssl.rejectUnauthorized=false`. Esta configuracao
deve ser revisada quando o projeto voltar para uma URL pooler valida com cadeia
TLS aceita pelo runtime.

## Banco de dados

O schema inicial esta em `prisma/schema.prisma`.

Entidades iniciais:

- Tenants.
- Usuarios.
- Equipes.
- Empresas/Prospects.
- Contatos.
- Pipelines e etapas.
- Oportunidades.
- Movimentacoes de etapa.
- Atividades.
- Interacoes.
- Anexos.
- Jobs de IA.
- Importacoes.

Migration inicial aplicada:

- `supabase/migrations/20260612203250_init_xcrm_core.sql`
- `supabase/migrations/20260612211500_allow_auth_user_multi_tenant.sql`
- `supabase/migrations/20260613122754_accent_portuguese_labels.sql`
- `supabase/migrations/20260613141121_add_account_notes.sql`
- `supabase/migrations/20260613202532_title_case_visible_labels.sql`
- `supabase/migrations/20260613210800_add_primary_contact_flag.sql`

Resultado remoto:

- 16 tabelas principais criadas.
- Row Level Security ativado nas entidades multi tenant.
- 62 policies RLS criadas.
- Helper privado `private.current_tenant_ids()` criado para isolamento por tenant.

Observacoes:

- O acesso direto via Prisma usa credenciais de banco e deve continuar aplicando filtros de tenant na camada de aplicacao.
- O acesso via Supabase API para usuarios autenticados fica limitado por RLS.
- `anon` nao recebeu permissao nas tabelas do CRM.

## Temas

O app ja possui base de tokens CSS para temas:

- Sistema.
- Claro.
- Escuro.
- Azul.
- Verde.

Prioridade do MVP:

- Sistema.
- Claro.
- Escuro.

## Validacoes atuais

Comandos ja usados na fundacao:

```bash
npm run prisma:validate
npm run prisma:generate
npm run lint
npm run build
```

Validacoes apos aplicar a migration:

```bash
npm run prisma:validate
npm run lint
npm run build
supabase migration list --linked
supabase db lint --linked --schema public --level warning --fail-on error
```

## Pendencias tecnicas imediatas

- Testar manualmente cadastro, login e onboarding com um usuario real pela interface.
- Evoluir protecao por papel e selecao de tenant quando houver multiplas empresas.
- Criar ERD inicial.

## Issues tecnicas relacionadas

- `#1` Fundacao SaaS multi tenant.
- `#10` Supabase Auth e onboarding do primeiro tenant.
- `#11` Recuperacao de senha e politica de senha forte.
- `#12` Bug `fetch failed` ao criar acesso.
- `#13` Bug `DriverAdapterError` apos login usando conexao pooler.

## Autenticacao e onboarding

Fluxo implementado:

1. Usuario acessa `/login`.
2. Usuario entra com e-mail/senha ou cria um novo acesso via Supabase Auth.
3. A rota raiz (`/`) redireciona conforme estado:
   - sem sessao: `/login`
   - com sessao e sem usuario de app: `/onboarding`
   - com sessao e usuario de app: `/dashboard`
4. O onboarding cria:
   - tenant
   - usuario owner vinculado ao `auth.uid()`
   - funil comercial padrao
   - etapas iniciais
   - primeira tarefa interna
5. A tela de onboarding mostra a sessao atual com nome e/ou e-mail do usuario autenticado antes da criacao do tenant.
6. O dashboard mostra nome, e-mail e perfil do usuario logado no cabecalho para usuarios que ja concluiram o onboarding.
7. Os controles do cabecalho autenticado usam altura fixa comum para manter alinhados usuario, tema e sair.
8. A tela `/login` usa abas para separar `Entrar` e `Criar Acesso`, mantendo apenas um formulario visivel por vez.
9. A aba ativa usa destaque visual na borda inferior.
10. O painel superior da area de acesso mostra mensagens de erro/aviso quando presentes; sem mensagens, alterna textos institucionais do xCRM a cada 30 segundos no cliente.
11. Os formulários das abas de acesso usam altura mínima comum para manter os botões `Entrar` e `Criar Acesso` alinhados no rodapé, preservando respiro entre o último campo e o botão.
12. `signUpAction` verifica e-mail ativo na tabela `users` antes de chamar Supabase Auth e trata retorno com identidade vazia como e-mail ja existente.
13. `signInAction` e `signUpAction` traduzem erros relevantes do Supabase Auth para Português-BR, incluindo e-mail não confirmado, limite de envio de e-mails, e-mail inválido e credenciais inválidas.
14. O Dashboard exibe a secao expansivel `Atividades Pendentes` no final da tela, listando tarefas pendentes do tenant atual, inclusive atividades gerais criadas no onboarding sem Empresa/Prospect vinculada.
15. `completeDashboardActivityAction` permite concluir atividades pendentes do tenant atual diretamente pelo Dashboard, atualizando `activities.status = COMPLETED` e `completed_at`.
16. A atividade inicial criada por `createTenantAction` recebe `scheduledAt` com a data/hora da criacao.
17. Os cards de metricas do Dashboard agrupam icone e titulo no topo, centralizam o valor e centralizam a descricao no rodape.
18. Os cards do `Funil Padrão` mostram o numero/posicao ao lado esquerdo do nome da etapa, como `1 Visitantes`.

## CRM Base

Fluxo inicial implementado:

1. Usuario autenticado acessa `/accounts`.
2. A rota valida sessao Supabase Auth e usuario de app via `getAppUser`.
3. `createAccountAction` cria uma empresa/prospect em `accounts` vinculada ao `tenantId` e ao usuario logado.
4. Se informado, o contato principal e criado em `contacts` no mesmo tenant e vinculado a empresa/prospect com `isPrimary` ativo, incluindo Função/Cargo opcional.
5. A tela lista ate 50 empresas/prospects do tenant conforme busca e filtro aplicados, incluindo o contato principal quando existir.
6. O dashboard possui atalho para `/accounts`.
7. O cabecalho da tela mostra a sessao atual com nome, e-mail e perfil do usuario.
8. A consulta aceita busca textual em empresa, cidade, UF, site, fornecedor principal, origem e dados do primeiro contato.
9. A consulta aceita filtro por status: prospect, cliente, perdido e arquivado.
9.1. A rota aceita `tab=base|new`; valores ausentes ou inválidos iniciam em `Base Comercial`.
9.2. `AccountsTabsNavigation` preserva busca, Status, Funil e período nos links das abas e confirma o descarte quando a serialização atual do formulário difere do retrato inicial. O campo técnico `returnTo` não participa da comparação.
9.3. `createAccountAction` valida o retorno local informado pelo formulário, força `tab=new` e preserva somente os parâmetros permitidos após erro ou sucesso.
10. A visibilidade em `/accounts` usa `getAccountVisibilityWhere`: Owner/Admin veem a base do tenant, Líder vê a própria carteira e membros das equipes que lidera, e demais perfis veem apenas registros com `ownerUserId` igual ao proprio usuario.
11. Ao cadastrar empresa/prospect, `createAccountAction` grava uma `interaction` automatica com canal `MANUAL_NOTE`, direcao `INTERNAL`, usuario logado e entidade criada.
12. O formulario permite informar uma proxima acao opcional; quando preenchida, a action cria uma `activity` pendente do tipo `FOLLOW_UP`, vinculada a empresa/prospect e ao contato principal quando existir.
13. A base comercial mostra o ultimo historico e a proxima atividade pendente de cada empresa/prospect.
14. A rota `/accounts/[id]` mostra detalhe, contato principal, historico, proximas acoes, acoes concluidas e formulario de edicao basica.
15. `updateAccountAction` valida tenant/perfil, evita duplicidade de nome no tenant, atualiza dados basicos e registra uma `interaction` de atualizacao.
16. No detalhe da Empresa/Prospect, as secoes inferiores usam a mesma proporcao de colunas da grade superior para manter alinhamento vertical entre os paineis.
17. O link de retorno para `/accounts` usa destaque visual discreto com animacao curta em CSS e respeita `prefers-reduced-motion`.
18. O painel `Historico` no detalhe usa um Client Component para exibir apenas a ultima interacao por padrao e expandir os demais registros sob demanda.
19. A lista de Empresas/Prospects exibe o ultimo evento como `Ultimo Historico: ...` para diferenciar auditoria/historico de status cadastral.
20. Rotulos compostos visiveis seguem capitalizacao em estilo titulo, mantendo conectivos/preposicoes curtas em minusculo quando fizer sentido em Portugues-BR.
20.1. Ações textuais `Limpar` usam o ícone Lucide `BrushCleaning`; o ícone `X` é reservado para cancelar, fechar ou remover.
20.2. Os controles de filtro da Base Comercial expõem `title` e `aria-label` como `Aplicar Filtros` e `Limpar Filtros`.
20.3. O controle `Limpar` da Base Comercial permanece visível sem filtros ativos e sempre direciona para a rota sem parâmetros de filtro.
21. Os itens do painel `Historico` usam espacamento compacto entre titulo, data/usuario e descricao.
22. No detalhe da Empresa/Prospect, `createAccountActivityAction` cria uma nova atividade pendente do tipo `FOLLOW_UP` e registra uma `interaction` com resumo `Ação Criada`.
23. No detalhe da Empresa/Prospect, `updateAccountActivityAction` edita descrição, Data e Hora de atividades pendentes da mesma Empresa/Prospect e tenant, e registra uma `interaction` com resumo `Ação Atualizada`.
24. No detalhe da Empresa/Prospect, `completeAccountActivityAction` conclui atividades pendentes, define `status` como `COMPLETED`, preenche `completedAt` e registra uma `interaction` com resumo `Ação Concluída`.
25. No detalhe da Empresa/Prospect, `deleteAccountActivityAction` exclui apenas atividades pendentes da mesma Empresa/Prospect e tenant, e registra uma `interaction` com resumo `Ação Excluída`.
26. A tela separa visualmente atividades `PENDING` em `Próximas Ações` e atividades `COMPLETED` em `Ações Concluídas`.
27. `contacts.isPrimary` define o Contato Principal da Empresa/Prospect.
28. A migration `20260613210800_add_primary_contact_flag.sql` faz backfill marcando o primeiro contato de cada Empresa/Prospect como principal.
29. Um índice único parcial em `contacts` limita a um Contato Principal por Empresa/Prospect.
30. No detalhe da Empresa/Prospect, `createAccountContactAction` cria novos contatos e registra `Contato Criado` no histórico.
31. No detalhe da Empresa/Prospect, `updateAccountContactAction` atualiza dados do contato e registra `Contato Atualizado` no histórico.
32. No detalhe da Empresa/Prospect, `setPrimaryAccountContactAction` troca o Contato Principal e registra `Contato Principal Alterado` no histórico.
33. No detalhe da Empresa/Prospect, `deleteAccountContactAction` exclui contatos não principais, desvincula atividades/interações anteriores do contato removido e registra `Contato Excluído` no histórico da conta.
34. O painel `Ações Concluídas` usa um Client Component expansível para exibir apenas a ação concluída mais recente por padrão.
35. No bloco `Contatos`, o indicador `Principal` ocupa a mesma faixa de ações onde contatos secundários exibem `Tornar Principal` e `Excluir`.
36. O painel `Contato Principal` usa layout compacto, agrupando Função/Cargo, e-mail e telefone em uma linha responsiva abaixo do nome.
37. No detalhe da Empresa/Prospect, o bloco `Oportunidades` lista oportunidades existentes e permite criar uma nova oportunidade sem abrir uma tela separada.
38. `createAccountOpportunityAction` cria oportunidades vinculadas à Empresa/Prospect, com contato opcional, etapa do funil padrão, valor estimado e previsão de fechamento.
39. `moveAccountOpportunityStageAction` move a oportunidade entre etapas do mesmo funil, atualiza o status para `OPEN`, `WON` ou `LOST` conforme a etapa e grava uma linha em `stage_movements`.
40. A criação e movimentação de oportunidades também gravam `interactions` com os resumos `Oportunidade Criada` e `Oportunidade Movida`.
41. A etapa da Oportunidade e o Status da Empresa/Prospect são conceitos separados, mas `createAccountOpportunityAction` e `moveAccountOpportunityStageAction` recalculam `accounts.status` após criar ou mover uma Oportunidade.
42. A sincronização mantém `accounts.status = CUSTOMER` quando existe Oportunidade `WON`; usa `PROSPECT` quando existe Oportunidade `OPEN` e nenhuma `WON`; usa `LOST` quando existem apenas Oportunidades `LOST`; e não sobrescreve `ARCHIVED`.
43. Alterações automáticas de `accounts.status` registram `interactions` com o resumo `Status Alterado`.
44. O campo `Valor Estimado` da `Nova Oportunidade` usa máscara monetária pt-BR ao sair do campo ou enviar o formulário, e a Server Action aceita valores como `R$ 1.000.000,00`, `1000000` e `1000000,50`.
45. O bloco `Contatos` usa um Client Component expansível para manter o primeiro contato visível e recolher contatos extras por padrão.
46. Os campos `date` e `datetime-local` usam estilo global para destacar de forma discreta o indicador nativo de calendário com a cor primária do tema.
47. `DateTimeLocalDefaults` é carregado no layout raiz e inicializa campos `datetime-local` vazios com a data atual às `09:00` quando o usuário foca/clica no campo.
48. Campos `datetime-local` operacionais usam `step` de 15 minutos e normalização cliente para manter minutos em `00`, `15`, `30` ou `45`.
49. Campos de Data e Hora de Ações usam `ActionDateTimeInput`, com data separada de Hora e Minuto, e Minuto restrito visualmente a `00`, `15`, `30` e `45`.
50. `/settings/company` permite que Owner/Admin atualize `tenants.name`, `tenants.legalName`, `tenants.document`, `tenants.segment` e `tenants.plan`.
51. `updateCompanySettingsAction` normaliza Nome da Empresa e Razão Social para maiúsculas, CNPJ para alfanumérico sem pontuação e registra `interaction` com resumo `Empresa Atualizada`.
52. `AppSettingsMenu` substitui o seletor de tema isolado no cabeçalho: tema fica disponível para todos, e Configurações da Empresa, Cadastro Prospects/Clientes e Equipes e Usuários aparecem apenas para Owner/Admin.
53. `/settings/team` usa `teams`, `team_members` e `users` para organizar Líderes e Vendedores no tenant em uma tela com resumo de Equipes e abas operacionais.
54. `createTeamUserAction` cria Líder/Vendedor/Assistente com status enviado pelo formulário; o padrão da interface é `ACTIVE`.
55. `teams.status` usa `RecordStatus` para permitir Equipes ativas e inativas; Equipes inativas não aparecem como destino de novos vínculos.
56. `inactivateTeamAction` bloqueia a inativação quando a Equipe tem Líder ativo ou Usuários ativos vinculados.
57. A aba `Cadastro de Usuários` usa um formulário único à esquerda e uma lista selecionável à direita; ao selecionar um Usuário, o formulário alterna para edição e envia `updateTeamUserAction`.
58. A aba `Cadastro de Equipes` usa um formulário único à esquerda e uma lista selecionável à direita; ao selecionar uma Equipe, o formulário alterna para edição e envia `updateTeamAction`.
59. A aba `Líder da Equipe` usa um formulário único à esquerda e lista somente Equipes ativas à direita; ao selecionar uma Equipe, o formulário envia `assignTeamManagerAction`.
60. O `Log de Equipes e Usuários` usa painel recolhível e inicia fechado para reduzir ruído visual na tela.
61. `DirtySubmitButton` compara o estado inicial do formulário com o estado atual via `FormData` e mantém `Salvar Alterações` desabilitado quando não há alteração.
62. Telas de detalhe devem usar uma faixa de Navegação e Mensagens abaixo do cabeçalho: ação de retorno à esquerda e feedback do sistema à direita, empilhando em telas pequenas.
63. O detalhe da Empresa/Prospect usa `accounts.name` como Nome Fantasia/Empresa, `accounts.legalName` como Razão Social, `accounts.document` como CNPJ, `accounts.postalCode` como CEP, `accounts.address` como Endereço, `accounts.addressNumber` como Número, `accounts.addressComplement` como Complemento e `accounts.district` como Bairro.
64. `CnpjInput` mostra o documento no padrão `AA.AAA.AAA/AAAA-00`, mas `updateAccountAction` normaliza para letras maiúsculas e números sem pontuação antes de persistir.
65. `AccountCustomerDataPanel` fica recolhido por padrão e consulta `https://viacep.com.br/ws/{CEP}/json/` para preencher Endereço, Bairro, Cidade e UF quando o CEP possui 8 dígitos.
66. A faixa superior do detalhe da Empresa/Prospect mostra o Contato Principal com Nome, Função/Cargo, E-mail e Telefone quando existir.
67. O botao `Gerenciar Contatos` usa ancora para `#contatos`; o painel cliente expande automaticamente ao receber o hash ou clique de ancora, exibindo todos os contatos cadastrados, inclusive o Contato Principal.
68. Os paineis `Contatos`, `Oportunidades` e `Próximas Ações` usam o mesmo comportamento de `Ver N ...` e `Recolher`; os formularios de criacao ficam recolhidos por padrao atras de `Adicionar Contato`, `Adicionar Oportunidade` e `Adicionar Ação`.
69. `PlatformAdmin` é um usuário administrativo global, fora do tenant operacional, vinculado ao Supabase Auth por `platform_admins.auth_user_id`.
70. `Notification` registra mensagens internas para usuários do tenant ou para `Platform Admin`; o primeiro uso é notificar login em tenant suspenso.
71. `RecordStatus.SUSPENDED` em `tenants.status` bloqueia as rotas operacionais e redireciona usuários para `/tenant-suspended`.
72. `/platform` permite ao `Platform Admin` listar tenants, suspender/reativar acesso e marcar notificações como lidas.
73. `/tenant-suspended` exibe mensagem distinta para Owner e usuários operacionais: Owner recebe canais do SAC, demais usuários devem procurar a gerência.
74. A lista de clientes em `/platform` exibe resumo total/ativos/suspensos, status por tenant, contadores de Usuários, Prospects e Contatos, e ação de suspensão ou reativação em bloco separado.
75. `/platform` possui a área restrita `Exclusão de Organização`, exibida somente para `Platform Admin`, para excluir completamente um tenant selecionado.
76. `deleteTenantAction` exige confirmação textual no formato `EXCLUIR Nome da Organização` e executa a exclusão dentro de uma transação Prisma.
77. A exclusão remove explicitamente dados por `tenantId` em entidades dependentes antes de remover `users` e `tenants`, cobrindo ações, histórico, anexos, IA, importações, oportunidades, contatos, empresas/prospects, equipes, funis, notificações e usuários.
78. Antes de excluir usuários, notificações globais que apontem para usuários do tenant como ator são desvinculadas com `actorUserId = null`.
79. A exclusão registra uma notificação global `TENANT_DELETED` para o `Platform Admin` executor, sem `tenantId`, com resumo dos dados removidos no `metadata`.
80. `PlatformTenantDeleteForm` controla a confirmacao no cliente: primeiro modal confere a organizacao, segundo modal reforca a exclusao permanente e, durante o submit, mostra painel de processamento com etapas visuais.
81. `PlatformTenantDeleteForm` usa `formId` deterministico baseado no `tenantId`, evitando ids gerados com caracteres especiais no vinculo entre o botao final do modal e o formulario.

Validacoes atuais:

- Nome da Empresa/Prospect obrigatorio.
- Nome Fantasia/Empresa é normalizado para maiúsculas no cliente e no servidor.
- Razão Social é opcional e normalizada para maiúsculas no cliente e no servidor.
- CNPJ opcional precisa ter 14 posições; as 12 primeiras aceitam letras ou números e as 2 últimas exigem números.
- Em Configurações da Empresa, Owner/Admin pode editar Nome da Empresa, Razão Social, CNPJ, Segmento e Plano do tenant.
- Configurações da Empresa exigem Nome da Empresa com pelo menos 2 caracteres e CNPJ com 14 posições quando preenchido.
- Em Equipes e Usuários, Owner/Admin pode criar/editar Equipe com Status, criar/editar Usuário com Status, alterar Líder e vincular/remover Usuário de Equipe.
- Platform Admin ativo é redirecionado para `/platform` após login.
- Atividades pendentes gerais do onboarding podem ser concluidas no Dashboard pelo Owner/Admin/usuario autenticado do mesmo tenant.
- Usuário ativo em tenant suspenso é redirecionado para `/tenant-suspended` e não acessa Dashboard, Base Comercial ou Configurações.
- Login em tenant suspenso cria notificação `TENANT_SUSPENDED_LOGIN` para cada Platform Admin ativo.
- Suspender tenant cria notificação `TENANT_SUSPENDED`; reativar cria `TENANT_REACTIVATED`.
- Excluir organização exige `Platform Admin`, tenant existente e confirmação textual exata; erro de confirmação impede a operação.
- Login e criacao de acesso exibem estado `Processando...` nos botoes enquanto a Server Action de autenticacao esta pendente.
- Cadastro de usuário exige Nome, E-mail válido, Perfil permitido (`MANAGER`, `SELLER` ou `ASSISTANT`) e Status (`ACTIVE` ou `INACTIVE`).
- Vinculação de equipe exige Equipe ativa e Usuário pertencentes ao mesmo tenant.
- Inativação de Equipe exige que não exista Líder ativo nem Usuários ativos vinculados.
- CEP opcional precisa ter 8 dígitos e persiste sem hífen em `accounts.postalCode`.
- Endereço, Número, Complemento e Bairro do Cliente são opcionais.
- UF opcional, selecionada em lista fechada com as 27 siglas brasileiras e validada no servidor.
- Site capturado como texto opcional para evitar validacao prematura de protocolo na entrada inicial.
- Telefone do contato principal limitado a 15 caracteres no cliente e no servidor.
- Telefone dos contatos do detalhe limitado a 15 caracteres no cliente e no servidor.
- Observacao comercial persistida em `accounts.notes`.
- Edicao de Acao Pendente exige descricao preenchida, atividade pendente pertencente a mesma Empresa/Prospect e ao mesmo tenant.
- Exclusao de Acao Pendente exige atividade pendente pertencente a mesma Empresa/Prospect e ao mesmo tenant.
- Bloqueio de empresa/prospect com mesmo nome no mesmo tenant, usando comparacao case-insensitive.
- Criação e edição de contato exigem nome com pelo menos 2 caracteres.
- Exclusão de contato exige que exista mais de um contato e que o contato removido não seja o Contato Principal.
- Criação de próxima ação exige descrição.
- Conclusão de ação exige atividade pendente pertencente à mesma Empresa/Prospect e ao mesmo tenant.
- Criação de oportunidade exige título e etapa válida do funil padrão do mesmo tenant.
- Contato vinculado à oportunidade, quando informado, precisa pertencer à mesma Empresa/Prospect.
- Movimentação de oportunidade exige etapa válida dentro do mesmo funil da oportunidade.
- Sincronização automática de Status da Empresa/Prospect não altera registros `ARCHIVED`.
- Toda consulta de empresas/prospects aplica `tenantId` na camada de aplicacao.
- Líder recebe filtro por `ownerUserId` próprio e por membros das equipes que lidera.
- Perfis operacionais tambem recebem filtro por `ownerUserId`.

Decisoes de cadastro:

- O campo visual `Fornecedor/Atividade/Marca` continua persistindo em `accounts.mainSupplier` nesta etapa para evitar migration apenas por nomenclatura.
- Campo de observacao comercial foi implementado no detalhe da Empresa/Prospect, nao no cadastro rapido inicial.
- Endereco do prospect nao e necessario para o fluxo atual do MVP, embora o schema ja possua campo `address` para uso futuro.
- A migration `20260615164630_add_customer_address_fields.sql` adiciona `postal_code`, `address_number`, `address_complement` e `district` em `public.accounts`.

Arquivos principais:

- `src/lib/supabase/server.ts`
- `src/lib/supabase/browser.ts`
- `src/lib/auth.ts`
- `src/app/auth/actions.ts`
- `src/app/login/page.tsx`
- `src/app/onboarding/page.tsx`
- `src/app/platform/page.tsx`
- `src/app/platform/actions.ts`
- `src/app/tenant-suspended/page.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/accounts/page.tsx`
- `src/app/accounts/[id]/page.tsx`
- `src/app/imports/page.tsx`
- `src/app/imports/actions.ts`
- `src/app/accounts/actions.ts`
- `src/components/global-pending-cursor.tsx`
- `src/components/account-history-panel.tsx`
- `src/lib/brazilian-states.ts`

Observacoes de seguranca:

- A criacao do tenant e feita em Server Action.
- O segredo do banco fica apenas no `.env` local/ambiente de servidor.
- O arquivo `.env` continua ignorado pelo Git.
- Usuarios anonimos nao recebem permissoes nas tabelas do CRM.
- Senhas exigem minimo de 8 caracteres no fluxo atual.
- Recuperacao de senha e politica forte foram registradas para implementacao posterior na issue `#11`.
- Chamadas de login/cadastro tratam falhas de conexao com mensagem amigavel, sem expor `fetch failed` cru ao usuario.
- Platform Admin não depende de vínculo com tenant comum e deve ser provisionado de forma controlada em `platform_admins`.
- Tenants suspensos preservam dados, mas bloqueiam a navegação operacional por checagem de status nas páginas principais.
- A exclusão completa de organização é irreversível e deve ser usada apenas quando a remoção de todos os dados do tenant for desejada.
- Importacao de planilhas e restrita ao perfil Owner.
- A tela `/imports` nao permite iniciar nova carga enquanto existir carga temporaria ativa no tenant.
- Linhas importadas para a base definitiva passam por Server Action e gravam sempre com `tenantId` e `ownerUserId` do Owner autenticado.
- A normalizacao por heuristica/IA assistida nunca grava diretamente nas tabelas definitivas; o Owner precisa revisar e importar a linha.
- Depois de alterar enums usados pelo Prisma Client, como `JobStatus`, executar `npm run prisma:generate` e reiniciar o dev server local para evitar runtime com client antigo em memoria.
- Arquivos `*.SQL-Truncated` sao ignorados pelo Git por serem scripts operacionais destrutivos.
- Arquivos `*.SQL-Administrador` sao ignorados pelo Git por poderem conter senha operacional preenchida.
- O leitor de planilhas detecta a linha de cabecalho por termos esperados como Empresa, Contato, Cidade, UF, E-mail e Fone, permitindo arquivos com linhas introdutorias antes da tabela.
- Rejeitar ou importar uma linha temporaria redireciona para a proxima linha ainda pendente/aprovada da mesma carga.
- Descartar carga temporaria exige confirmacao em modal antes de enviar a Server Action.
- O painel de revisao de `/imports` usa `key={selectedRow.id}` para remontar campos controlados/clientes ao selecionar outra linha.
- O CNPJ na revisao temporaria usa `CnpjInput`, mantendo a mascara visual `AA.AAA.AAA/AAAA-00`.
- A tela `/imports` organiza a revisao como bancada de triagem: faixa superior com origem e metricas, fila esquerda compacta, ficha principal por linha e dados originais recolhiveis.
- A barra de acoes da linha fica fixa no rodape do painel de revisao para manter salvar/aprovar/importar/rejeitar sempre acessiveis.
- A fila esquerda de `/imports` possui filtro por status via querystring `status`, acionado por um botao com icone de filtro e menu suspenso no topo do card da carga.
- Os links das linhas em `/imports` preservam `status` ao navegar entre registros filtrados.
- Filtros de importacao sem registros exibem estado vazio e nao retornam automaticamente para a lista completa.
- Empresas/Prospects criados pela importacao definitiva de linha temporaria recebem `accounts.source = Importado`.
- `/imports` possui acao em lote `importApprovedRowsAction`, que importa todas as linhas `APPROVED` da carga ativa e mantem a importacao individual como alternativa por linha.
- O Owner pode selecionar uma equipe ativa com líder definido antes da importacao em lote; nesse caso, `accounts.ownerUserId`, contatos e proximas acoes importadas ficam sob responsabilidade do líder.
- O encaminhamento em lote cria notificação `PROSPECTS_ASSIGNED_TO_TEAM` para o líder, contendo carga, equipe, totais e ate 20 prospects no `metadata`.
- Na importacao definitiva, cada historico importado com corpo preenchido tambem gera uma `activity` concluida do tipo `FOLLOW_UP`, preservando o registro na lista operacional/historica do prospect.
- Proximas acoes importadas usam `description` como titulo preferencial quando existir, com fallback para `title` e depois `Próxima Ação Importada`.
- As telas principais usam `UserIdentityCard` com contador de `notifications` não lidas para sinalizar pendências próximas ao nome do usuário.
- Linhas aprovadas com erro durante o lote passam para `JobStatus.FAILED`; esse status entra na contagem de inválidas e fica disponível no filtro `Falharam`.
- `GlobalPendingCursor` e renderizado no layout global e escuta cliques em links internos e submits de formularios para aplicar `data-app-pending="true"` no `html`.
- `globals.css` transforma `html[data-app-pending="true"] *` em cursor `progress`, dando feedback visual durante login, navegacao e Server Actions.
- O cursor global e removido quando `pathname`/`searchParams` mudam, em `pageshow` ou por fallback de 30 segundos.
- Quando `legalName` nao vem da planilha, a revisao temporaria usa `company.name` como fallback para Razão Social.
- A grade da ficha de revisao usa breakpoint `lg`, maior espacamento horizontal e inputs `w-full` para evitar estouro lateral de campos compactos.
- Linhas com status `IMPORTED` desabilitam as acoes de salvar, aprovar, importar e rejeitar na ficha temporaria.
- O Impeccable foi inicializado com registro de produto em `PRODUCT.md` e live mode configurado para Next.js App Router via `.impeccable/live/config.json`.
- A deteccao de CSP do Impeccable retornou `shape: null`, portanto nao houve necessidade de patch de Content Security Policy.
- O design system do Impeccable foi documentado em `DESIGN.md` com o north star `Painel de Controle Confiável`, preservando densidade operacional, tokens existentes e uso restrito de acento.
- O sidecar `.impeccable/design.json` acompanha o `DESIGN.md` e fornece componentes auto-contidos para o painel live do Impeccable.
- O Dashboard calcula uma recomendacao principal de operacao com base em dados reais do tenant: atividades pendentes primeiro, depois ausencia de Empresas/Prospects, ausencia de Contatos, importacao para Owner ou acompanhamento da Base Comercial.
- O CTA da recomendacao principal pode apontar para `#atividades-pendentes`, `/accounts` ou `/imports`, conforme o estado atual e permissoes do usuario.
- A secao de atividades pendentes possui o id `atividades-pendentes` para navegacao interna a partir do bloco de prioridade.
- Os cards de metricas do topo do Dashboard usam estrutura interna com cabecalho, divisoria sutil e valor em numeros tabulares para melhorar leitura operacional.
- A versao visual dos cards de metricas segue o mock aprovado no `$impeccable craft`: maior altura, icone de 48px, titulo `text-base`, divisor interno e valor/descricao alinhados a esquerda.
- O card `Atividades Pendentes` recebe destaque condicional quando `activityCount > 0`, usando borda primaria e icone com fundo primario.
- `PRODUCT.md` segue o formato atual do Impeccable e declara o xCRM como registro `product` para plataforma `web`, com posicionamento, principios operacionais e requisitos de acessibilidade.
- `DESIGN.md` documenta os cinco temas disponiveis (`Sistema`, `Claro`, `Escuro`, `Azul` e `Verde`) e os padroes atuais do Dashboard, incluindo painel de prioridade, cards de metricas e feedback de processamento.
- `.impeccable/design.json` usa `schemaVersion: 2` e espelha os tokens, metadados e componentes representativos do sistema visual para o painel live.
- O polish do Dashboard substitui linguagem tecnica de tenant/Auth/RLS por perfil e organizacao, usando rotulos localizados para os papeis.
- `Acessos Rápidos` expoe links operacionais conforme permissao para `/accounts`, `/imports`, `/settings/team` e `/settings/company`.
- Os cards de metricas usam grade autoajustavel e escala compacta abaixo de `xl`; o Funil usa colunas `auto-fit` para reduzir rolagem em mobile sem overflow.
- O cabecalho mobile mantem a identidade em largura total e agrupa Menu/Sair na linha seguinte; controles interativos essenciais usam alvo minimo de 44px.
- O painel de atividades oculta o controle de expansao no estado vazio, antecipa a proxima atividade quando recolhido e associa `aria-controls` ao conteudo.
- Mensagens do Dashboard usam `role` e `aria-live`; a conclusao informa o titulo da atividade concluida.
- O audit tecnico de `/dashboard` foi salvo em `.impeccable/audit/2026-07-09T22-14-24-03-00__dashboard.md`, com nota `16/20` e tres achados P2.
- Em 2026-07-12, o detector local do Impeccable foi executado sobre `src/app/dashboard/page.tsx`, `src/components/app-settings-menu.tsx`, `src/components/dashboard-pending-activities-panel.tsx` e `src/components/user-identity-card.tsx`, retornando `[]` sem achados deterministicos.
- A critica Impeccable da tela de detalhe de Empresa/Prospect foi salva em `.impeccable/critique/2026-07-12T11-49-57Z__src-app-accounts-id-page-tsx.md`.
- A tela `src/app/accounts/[id]/page.tsx` passou a exibir uma faixa de decisão comercial com Status, localização, próxima ação, Contato Principal, Ações Pendentes e Oportunidades.
- A edição de contatos removeu a duplicação visual entre resumo de `Contato Principal` e edição do primeiro contato; o contato principal agora aparece dentro do painel `Contatos`.
- O painel `Contatos` recolhe `Adicionar Contato` por padrão e usa contagem em `Ver N Contatos` quando há contatos extras.
- Botões de salvar da tela de detalhe usam rótulos por escopo, como `Salvar Dados Básicos`, `Salvar Contato` e `Salvar Ação`.
- Exclusões de contato e ação pendente passam por `ConfirmSubmitButton`, reaproveitando o padrão de confirmação já usado na importação.
- Paineis recolhíveis da tela de detalhe passaram a associar `aria-expanded` a `aria-controls`, e mensagens do CEP usam live region.
- A migration `prisma/20260712070221_enable_rls_platform_admin_notifications.sql` habilita RLS em `public.platform_admins` e `public.notifications`.
- Via PostgREST, `platform_admins` permite leitura apenas do proprio `Platform Admin` ativo vinculado ao `auth.uid()`.
- Via PostgREST, `notifications` permite leitura apenas do destinatario autenticado: usuario operacional ativo em `users.auth_user_id` ou `Platform Admin` ativo em `platform_admins.auth_user_id`.
- Nao ha policies de `insert`, `update` ou `delete` para `authenticated` nessas duas tabelas; mutacoes seguem concentradas nas Server Actions via Prisma.
- A aplicacao da migration foi validada no banco por consulta a `pg_class.relrowsecurity` e `pg_policies`.
- Em `/accounts`, cada item da lista `Base Comercial` e renderizado como link de linha inteira para `/accounts/[id]`, com estado de hover, foco visivel e `aria-label` indicando a acao de editar a Empresa/Prospect.
- `DashboardPendingActivitiesPanel` escuta o hash `#atividades-pendentes` e cliques em links para essa ancora; quando ha atividades pendentes, o painel expande automaticamente ao receber esse direcionamento.
- `src/app/agenda/page.tsx` e a pagina autenticada de Agenda de Atividades, com periodo controlado por URL, filtros de responsavel/status e visoes Dia, Semana, Lista e Mes.
- `src/components/agenda-calendar.tsx` renderiza a grade temporal, o trilho de `Sem Agendamento` e `Atrasadas`, avatares com tooltip de responsavel e o painel inline de edicao/conclusao.
- `src/app/agenda/actions.ts` valida e atualiza atividades somente apos conferir o escopo do responsavel; as mutacoes tambem registram interacao de historico quando houver Empresa/Prospect associado.
- `src/lib/visibility.ts` expoe `getVisibleWorkOwnerIds` e `getActivityVisibilityWhere`, reutilizados por Agenda, Dashboard e acoes de Empresa/Prospect. Owner/Admin recebem escopo total do tenant; Lider recebe o proprio usuario e os membros das equipes que lidera; demais perfis recebem apenas o proprio usuario.
- O Dashboard passou a contar/listar/concluir apenas atividades no escopo visivel, e seu CTA `Ver Atividades` aponta para `/agenda`.
- `AppSettingsMenu` sempre oferece `Agenda de Atividades`, inclusive para perfis sem permissao administrativa.
- A Importacao Temporaria recebe o arquivo por `input type="file"` em `/imports`. A Server Action valida extensao (`.xlsx` ou `.csv`), tamanho maximo de 10 MB e processa o `arrayBuffer` recebido, sem enumerar diretorios do servidor.
- `ImportBatch.sourcePath` armazena o `Caminho de Origem` opcional informado manualmente pelo Owner; navegadores nao expoem o caminho absoluto do arquivo selecionado, por isso esse valor nao pode ser preenchido automaticamente.
- A migration `prisma/20260712192500_add_import_source_path.sql` foi aplicada no Supabase remoto e a coluna `public.imports.source_path` foi validada.
- O resumo superior da carga e a fonte unica para arquivo, caminho informado e contagens. O painel lateral mantem apenas acoes de descarte, filtro, encaminhamento e importacao.
- `Descartar Carga` fica no resumo superior e continua usando `ConfirmSubmitButton`; o painel lateral usa uma busca por `query` combinada ao filtro de status, com parametros preservados nos links das linhas e do filtro.
- No desktop, `Descartar Carga` ocupa uma celula propria na mesma grade do resumo, imediatamente antes de `Linhas`; em telas estreitas, a grade volta a empilhar os itens para preservar leitura e alvos de toque.
- A tela `/platform` usa `PlatformTenantManagement` como superficie mestre-detalhe: busca e filtro escolhem uma organização, e o detalhe concentra visão operacional, acesso, auditoria e zona de risco sem repetir a lista de tenants.
- `TenantStatusEvent` registra no banco toda suspensão ou reativação com status, motivo, data/hora e `PlatformAdmin` responsável. A migration `prisma/20260713111500_add_tenant_status_events.sql` foi aplicada e validada no Supabase remoto.
- `suspendTenantAction` exige motivo; suspensão e reativação criam o evento de auditoria na mesma transação que altera `Tenant.status`.
- Os diálogos de suspensão, reativação e exclusão usam o elemento HTML nativo `dialog`, que fornece modalidade, foco inicial, aprisionamento de foco, fechamento por `Esc` e devolução de foco ao invocador. A exclusão usa estado `Processando...` sem simular etapas de servidor.
- O detalhe operacional da organização mantém o selo de Status ao lado do nome e mostra Proprietário, e-mail e telefone imediatamente após os indicadores, usando o telefone já carregado do usuário `OWNER`.
- Os indicadores operacionais reservam altura mínima para o rótulo e usam grade de duas, três ou cinco colunas conforme a largura; assim, rótulos longos não deslocam os valores numéricos. Nome, e-mail e telefone do Proprietário usam ícones Lucide e truncamento com `title` para preservar a leitura em espaços estreitos.
- O rótulo visível do indicador de contas usa `Empresa/ Prospects`, com espaço após a barra para favorecer leitura e quebra de linha.
- `UserIdentityCard` centraliza a tradução dos papéis técnicos (`OWNER`, `ADMIN`, `MANAGER`, `SELLER` e `ASSISTANT`) para rótulos localizados em Português-BR, evitando que cabeçalhos exibam valores do enum.
- A tradução de papéis normaliza o valor com `toUpperCase()`, cobrindo tanto valores de enum quanto representações recebidas em minúsculas, como `owner`.
- `LoginInfoPanel` roda mensagens informativas a cada 8 segundos somente quando não há mensagem de erro/sucesso, o usuário não está interagindo e `prefers-reduced-motion` não está ativo. Os indicadores são botões acessíveis para seleção manual da mensagem.
- `normalizeSpreadsheetRow` extrai todos os e-mails válidos da célula de e-mail e gera uma entrada por endereço no array `contacts`. A extração aceita separadores comuns e preserva nomes no padrão `Nome <email>`; duplicidades na mesma célula e conteúdo sem endereço válido entram como avisos de revisão.
- `ImportReviewContacts` é o componente cliente da revisão de importação. Ele serializa a lista editável em `contactsJson`, permitindo adicionar/remover contatos e definir um único Principal sem perder registros ao enviar a Server Action.
- `getReviewRowFromForm` valida, deduplica e normaliza `contactsJson`; `importReviewedRow` evita criar um segundo contato principal para a mesma Empresa/Prospect e promove o contato duplicado marcado como principal quando necessário.
- `reprocessImportRowContactsAction` atende linhas `REVIEWING` de cargas temporárias existentes: relê `rawJson`, aplica o normalizador atual apenas aos contatos e preserva os demais dados revisados. O botão usa confirmação porque substitui somente a lista de contatos editada manualmente.
- `/platform` usa a mesma marca bitmap Scientiam dos cabeçalhos autenticados, preservando a distinção textual de `Platform Admin` por não pertencer a um tenant.

## Dashboard Principal Quantificado

- A issue `#99` redesenha `/dashboard` como painel operacional adaptativo e preserva a implementação anterior em `/dashboard-anterior`.
- `AppSettingsMenu` oferece `Dashboard Principal` e `Dashboard Anterior` para todos os perfis autenticados; a Agenda permanece no mesmo grupo de navegação.
- O novo Dashboard reutiliza `getVisibleWorkOwnerIds`, `getAccountVisibilityWhere` e `getActivityVisibilityWhere`. Owner/Admin recebem o tenant, Líder recebe o próprio usuário e membros das equipes lideradas, e Vendedor/Assistente recebem somente o próprio usuário.
- A visibilidade de Oportunidades usa `ownerUserId`; quando uma Oportunidade legada não possui responsável, o Dashboard usa o responsável da Empresa/Prospect como fallback de escopo.
- O estado atual do Pipeline considera Oportunidades `OPEN` agrupadas por `stageId`, com `_count` e `_sum.amountEstimated`. Prospects sem Oportunidade aberta são contados separadamente e não entram nas Etapas.
- O seletor por URL aceita `period=7`, `30` ou `90`, com 30 dias como padrão. O período afeta novos Prospects, Oportunidades criadas, Atividades concluídas e movimentos para Etapas `isWon` ou `isLost`.
- Ganhos e perdas são derivados de `StageMovement.changedAt`, deduplicados por Oportunidade. Os valores continuam usando `amountEstimated`, pois o schema não possui receita efetivamente realizada.
- `Atenção Agora` prioriza Atividades `PENDING` vencidas, depois Oportunidades abertas sem `expectedCloseDate` e sem `amountEstimated`.
- O Dashboard não executa mutações. A lista de atrasos abre a Agenda ou a Empresa/Prospect; a conclusão inline continua disponível somente no Dashboard Anterior e revalida as duas rotas.
- `.dashboard-pipeline-strip` usa grade responsiva sem rolagem horizontal: uma coluna na menor largura, duas a partir de `30rem`, três a partir de `48rem`, quatro a partir de `64rem` e a sequência completa a partir de `96rem`.
- As setas de progressão aparecem somente quando todas as Etapas cabem na mesma linha. O resumo `Fora do Pipeline` usa uma coluna compacta de `9.5rem` no desktop e largura máxima de `11rem` quando empilhado.
- Todos os segmentos usam a sequência título, quantidade, valor e texto auxiliar. Para `Ganhas` e `Perdidas`, o texto auxiliar identifica o período selecionado; o quadro `Fora do Pipeline` remove o ícone e encurta a descrição para preservar altura equivalente.
- `src/app/dashboard/loading.tsx` é o fallback de rota durante consultas e usa esqueleto estático, sem animação ou alteração dimensional dos blocos.
- `src/app/dashboard/error.tsx` é o limite de erro cliente da rota; registra o erro no console, executa `reset()` em nova tentativa e oferece acesso ao Dashboard Anterior.
- Segmentos com quantidade maior que zero geram links para `/accounts?pipeline=<filtro>#base-comercial`; segmentos zerados não expõem affordance de clique. Ganhos e perdas também enviam `period`.
- `/accounts` valida o parâmetro `pipeline`: `stage:<uuid>` filtra Oportunidades abertas na Etapa, `won` e `lost` consultam movimentações no período e `outside` seleciona Prospects sem Oportunidade aberta.
- A Base Comercial continua listando uma linha por Empresa/Prospect. Por isso, o total de linhas pode ser menor que a quantidade do segmento quando uma empresa possui mais de uma Oportunidade correspondente.
- `getOpportunityVisibilityWhere` centraliza o escopo de Oportunidades e é reutilizado pelo Dashboard e pelos filtros da Base Comercial.
- O plano de produto, regras das métricas, estados e referências visuais aprovadas estão em `Docs/plano_dash.md` e `Docs/assets`.
- Nenhuma migration foi necessária para o redesenho.
- A validação técnica executou ESLint, `prisma validate`, build Next.js e detectores Impeccable de layout/tipografia sem achados; `/dashboard` e `/dashboard-anterior` preservam o redirecionamento anônimo para `/login`.

## Versao WIP no topo

Enquanto o projeto estiver em desenvolvimento, toda tela deve exibir no topo:

```text
Versao: AAAA-MM-DD hh:mm:ss
```

Implementacao atual:

- Valor: `2026-07-16 18:03:35`
- Arquivo fonte: `src/lib/app-version.ts`
- Componente global: `src/components/version-banner.tsx`
- Renderizacao: `src/app/layout.tsx`

Regra:

- A cada mudanca em qualquer arquivo do sistema, atualizar `APP_VERSION`.
- Futuramente esta informacao pode ser substituida por build/commit do Git.
