# Documentacao Tecnica do xCRM

Criado em: 2026-06-12 20:13:05 -03:00  
Ultima modificacao: 2026-06-30 13:08:42 -03:00
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
- Hover: borda e sombra ficam mais claras para indicar que o elemento e clicavel.
- Active: o elemento recebe deslocamento discreto para baixo e escala leve, simulando clique/pressao.
- Focus visivel: teclado recebe outline com cor de foco do tema.
- Disabled: botoes desabilitados nao aplicam deslocamento nem sombra de clique.
- Inputs, selects e textareas usam fundo de campo por tema, hover/focus padronizados e sobrescrita de `:-webkit-autofill`.
- No tema claro os campos usam fundo claro; no tema escuro usam fundo escuro para evitar contraste excessivo com os paineis.
- A regra respeita `prefers-reduced-motion`, removendo transicoes e transformacoes quando o usuario prefere menos movimento.

## Estrutura inicial

- `src/app`: rotas e telas do App Router.
- `src/components`: componentes reutilizaveis de interface.
- `src/lib`: clientes e utilitarios de infraestrutura.
- `src/app/auth/actions.ts`: Server Actions de login, cadastro, logout e onboarding.
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
- `src/lib/imports/spreadsheet.ts`: listagem da pasta parametrizada, leitura de `.xlsx` com `read-excel-file` e leitura de `.csv` com parser local simples.
- `src/lib/imports/normalizer.ts`: normalizacao heuristica inicial para separar Empresa, Contato, Historico e Proxima Acao.
- `config/import-settings.json`: parametro local da pasta de importacao e extensoes permitidas.
- `src/lib/brazilian-states.ts`: lista local de UFs brasileiras e helper de validacao.
- `src/app/login`: tela de login e criacao de acesso.
- `src/components/login-access-tabs.tsx`: abas de acesso para entrar ou criar acesso.
- `src/components/login-info-panel.tsx`: painel de mensagens e textos rotativos da tela de acesso.
- `src/components/account-history-panel.tsx`: painel expansivel do historico de Empresa/Prospect.
- `src/components/account-contacts-panel.tsx`: painel expansivel de contatos no detalhe da Empresa/Prospect.
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
- `src/components/currency-input.tsx`: Client Component para entrada monetaria em formato `R$` no padrao pt-BR.
- `prisma/schema.prisma`: modelo de dados multi tenant.
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

## CRM Base

Fluxo inicial implementado:

1. Usuario autenticado acessa `/accounts`.
2. A rota valida sessao Supabase Auth e usuario de app via `getAppUser`.
3. `createAccountAction` cria uma empresa/prospect em `accounts` vinculada ao `tenantId` e ao usuario logado.
4. Se informado, o contato principal e criado em `contacts` no mesmo tenant e vinculado a empresa/prospect com `isPrimary` ativo.
5. A tela lista ate 50 empresas/prospects do tenant conforme busca e filtro aplicados, incluindo o contato principal quando existir.
6. O dashboard possui atalho para `/accounts`.
7. O cabecalho da tela mostra a sessao atual com nome, e-mail e perfil do usuario.
8. A consulta aceita busca textual em empresa, cidade, UF, site, fornecedor principal, origem e dados do primeiro contato.
9. A consulta aceita filtro por status: prospect, cliente, perdido e arquivado.
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
66. `PlatformAdmin` é um usuário administrativo global, fora do tenant operacional, vinculado ao Supabase Auth por `platform_admins.auth_user_id`.
67. `Notification` registra mensagens internas para usuários do tenant ou para `Platform Admin`; o primeiro uso é notificar login em tenant suspenso.
68. `RecordStatus.SUSPENDED` em `tenants.status` bloqueia as rotas operacionais e redireciona usuários para `/tenant-suspended`.
69. `/platform` permite ao `Platform Admin` listar tenants, suspender/reativar acesso e marcar notificações como lidas.
70. `/tenant-suspended` exibe mensagem distinta para Owner e usuários operacionais: Owner recebe canais do SAC, demais usuários devem procurar a gerência.
71. A lista de clientes em `/platform` exibe resumo total/ativos/suspensos, status por tenant, contadores de Usuários, Prospects e Contatos, e ação de suspensão ou reativação em bloco separado.

Validacoes atuais:

- Nome da Empresa/Prospect obrigatorio.
- Nome Fantasia/Empresa é normalizado para maiúsculas no cliente e no servidor.
- Razão Social é opcional e normalizada para maiúsculas no cliente e no servidor.
- CNPJ opcional precisa ter 14 posições; as 12 primeiras aceitam letras ou números e as 2 últimas exigem números.
- Em Configurações da Empresa, Owner/Admin pode editar Nome da Empresa, Razão Social, CNPJ, Segmento e Plano do tenant.
- Configurações da Empresa exigem Nome da Empresa com pelo menos 2 caracteres e CNPJ com 14 posições quando preenchido.
- Em Equipes e Usuários, Owner/Admin pode criar/editar Equipe com Status, criar/editar Usuário com Status, alterar Líder e vincular/remover Usuário de Equipe.
- Platform Admin ativo é redirecionado para `/platform` após login.
- Usuário ativo em tenant suspenso é redirecionado para `/tenant-suspended` e não acessa Dashboard, Base Comercial ou Configurações.
- Login em tenant suspenso cria notificação `TENANT_SUSPENDED_LOGIN` para cada Platform Admin ativo.
- Suspender tenant cria notificação `TENANT_SUSPENDED`; reativar cria `TENANT_REACTIVATED`.
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
- Importacao de planilhas e restrita ao perfil Owner.
- A tela `/imports` nao permite iniciar nova carga enquanto existir carga temporaria ativa no tenant.
- Linhas importadas para a base definitiva passam por Server Action e gravam sempre com `tenantId` e `ownerUserId` do Owner autenticado.
- A normalizacao por heuristica/IA assistida nunca grava diretamente nas tabelas definitivas; o Owner precisa revisar e importar a linha.
- Depois de alterar enums usados pelo Prisma Client, como `JobStatus`, executar `npm run prisma:generate` e reiniciar o dev server local para evitar runtime com client antigo em memoria.
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
- Quando `legalName` nao vem da planilha, a revisao temporaria usa `company.name` como fallback para Razão Social.
- A grade da ficha de revisao usa breakpoint `lg`, maior espacamento horizontal e inputs `w-full` para evitar estouro lateral de campos compactos.
- Linhas com status `IMPORTED` desabilitam as acoes de salvar, aprovar, importar e rejeitar na ficha temporaria.

## Versao WIP no topo

Enquanto o projeto estiver em desenvolvimento, toda tela deve exibir no topo:

```text
Versao: AAAA-MM-DD hh:mm:ss
```

Implementacao atual:

- Valor: `2026-06-30 13:08:42`
- Arquivo fonte: `src/lib/app-version.ts`
- Componente global: `src/components/version-banner.tsx`
- Renderizacao: `src/app/layout.tsx`

Regra:

- A cada mudanca em qualquer arquivo do sistema, atualizar `APP_VERSION`.
- Futuramente esta informacao pode ser substituida por build/commit do Git.
