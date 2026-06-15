# Documentacao Tecnica do xCRM

Criado em: 2026-06-12 20:13:05 -03:00  
Ultima modificacao: 2026-06-15 11:43:34 -03:00
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

## Estrutura inicial

- `src/app`: rotas e telas do App Router.
- `src/components`: componentes reutilizaveis de interface.
- `src/lib`: clientes e utilitarios de infraestrutura.
- `src/app/auth/actions.ts`: Server Actions de login, cadastro, logout e onboarding.
- `src/app/accounts/actions.ts`: Server Actions para cadastro, edição, contatos, oportunidades, criação de ações e conclusão de ações de Empresa/Prospect.
- `src/app/accounts`: tela autenticada de empresas/prospects.
- `src/app/accounts/[id]`: detalhe e edição básica de uma Empresa/Prospect.
- `src/lib/brazilian-states.ts`: lista local de UFs brasileiras e helper de validacao.
- `src/app/login`: tela de login e criacao de acesso.
- `src/components/login-access-tabs.tsx`: abas de acesso para entrar ou criar acesso.
- `src/components/login-info-panel.tsx`: painel de mensagens e textos rotativos da tela de acesso.
- `src/components/account-history-panel.tsx`: painel expansivel do historico de Empresa/Prospect.
- `src/components/account-contacts-panel.tsx`: painel expansivel de contatos no detalhe da Empresa/Prospect.
- `src/components/datetime-local-defaults.tsx`: comportamento global para inicializar campos `datetime-local` vazios com data atual às 09:00.
- `src/components/dirty-submit-button.tsx`: botão cliente que habilita `Salvar Alterações` apenas quando o formulário tem mudança real.
- `src/app/onboarding`: criacao do primeiro tenant e usuario owner.
- `src/app/dashboard`: painel autenticado inicial.
- `src/components/version-banner.tsx`: banner global de versao WIP.
- `src/lib/app-version.ts`: valor unico da versao exibida no topo.
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

- `DATABASE_URL`: URL pooler Supabase, mantida para compatibilidade e usos futuros.
- `DIRECT_URL`: URL direta Supabase usada pelo Prisma no runtime local e para migrations/operacoes administrativas.
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

O script `npm run dev` usa `cross-env NODE_OPTIONS=--use-system-ca next dev` para evitar erro local de certificado ao chamar Supabase Auth no Windows/Node.

O cliente Prisma em `src/lib/prisma.ts` prioriza `DIRECT_URL` quando ela esta configurada. Esse padrao evita falhas observadas no pooler durante o fluxo de login/onboarding no ambiente local.

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
10. A visibilidade inicial por perfil em `/accounts` permite que owner/admin/manager vejam a base do tenant; demais perfis veem apenas registros com `ownerUserId` igual ao proprio usuario.
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
23. No detalhe da Empresa/Prospect, `completeAccountActivityAction` conclui atividades pendentes, define `status` como `COMPLETED`, preenche `completedAt` e registra uma `interaction` com resumo `Ação Concluída`.
24. A tela separa visualmente atividades `PENDING` em `Próximas Ações` e atividades `COMPLETED` em `Ações Concluídas`.
25. `contacts.isPrimary` define o Contato Principal da Empresa/Prospect.
26. A migration `20260613210800_add_primary_contact_flag.sql` faz backfill marcando o primeiro contato de cada Empresa/Prospect como principal.
27. Um índice único parcial em `contacts` limita a um Contato Principal por Empresa/Prospect.
28. No detalhe da Empresa/Prospect, `createAccountContactAction` cria novos contatos e registra `Contato Criado` no histórico.
29. No detalhe da Empresa/Prospect, `updateAccountContactAction` atualiza dados do contato e registra `Contato Atualizado` no histórico.
30. No detalhe da Empresa/Prospect, `setPrimaryAccountContactAction` troca o Contato Principal e registra `Contato Principal Alterado` no histórico.
31. No detalhe da Empresa/Prospect, `deleteAccountContactAction` exclui contatos não principais, desvincula atividades/interações anteriores do contato removido e registra `Contato Excluído` no histórico da conta.
32. O painel `Ações Concluídas` usa um Client Component expansível para exibir apenas a ação concluída mais recente por padrão.
33. No bloco `Contatos`, o indicador `Principal` ocupa a mesma faixa de ações onde contatos secundários exibem `Tornar Principal` e `Excluir`.
34. O painel `Contato Principal` usa layout compacto, agrupando Função/Cargo, e-mail e telefone em uma linha responsiva abaixo do nome.
35. No detalhe da Empresa/Prospect, o bloco `Oportunidades` lista oportunidades existentes e permite criar uma nova oportunidade sem abrir uma tela separada.
36. `createAccountOpportunityAction` cria oportunidades vinculadas à Empresa/Prospect, com contato opcional, etapa do funil padrão, valor estimado e previsão de fechamento.
37. `moveAccountOpportunityStageAction` move a oportunidade entre etapas do mesmo funil, atualiza o status para `OPEN`, `WON` ou `LOST` conforme a etapa e grava uma linha em `stage_movements`.
38. A criação e movimentação de oportunidades também gravam `interactions` com os resumos `Oportunidade Criada` e `Oportunidade Movida`.
39. O bloco `Contatos` usa um Client Component expansível para manter o primeiro contato visível e recolher contatos extras por padrão.
40. Os campos `date` e `datetime-local` usam estilo global para destacar de forma discreta o indicador nativo de calendário com a cor primária do tema.
41. `DateTimeLocalDefaults` é carregado no layout raiz e inicializa campos `datetime-local` vazios com a data atual às `09:00` quando o usuário foca/clica no campo.
42. `DirtySubmitButton` compara o estado inicial do formulário com o estado atual via `FormData` e mantém `Salvar Alterações` desabilitado quando não há alteração.

Validacoes atuais:

- Nome da Empresa/Prospect obrigatorio.
- UF opcional, selecionada em lista fechada com as 27 siglas brasileiras e validada no servidor.
- Site capturado como texto opcional para evitar validacao prematura de protocolo na entrada inicial.
- Telefone do contato principal limitado a 15 caracteres no cliente e no servidor.
- Telefone dos contatos do detalhe limitado a 15 caracteres no cliente e no servidor.
- Observacao comercial persistida em `accounts.notes`.
- Bloqueio de empresa/prospect com mesmo nome no mesmo tenant, usando comparacao case-insensitive.
- Criação e edição de contato exigem nome com pelo menos 2 caracteres.
- Exclusão de contato exige que exista mais de um contato e que o contato removido não seja o Contato Principal.
- Criação de próxima ação exige descrição.
- Conclusão de ação exige atividade pendente pertencente à mesma Empresa/Prospect e ao mesmo tenant.
- Criação de oportunidade exige título e etapa válida do funil padrão do mesmo tenant.
- Contato vinculado à oportunidade, quando informado, precisa pertencer à mesma Empresa/Prospect.
- Movimentação de oportunidade exige etapa válida dentro do mesmo funil da oportunidade.
- Toda consulta de empresas/prospects aplica `tenantId` na camada de aplicacao.
- Perfis operacionais tambem recebem filtro por `ownerUserId`.

Decisoes de cadastro:

- O campo visual `Fornecedor/Atividade/Marca` continua persistindo em `accounts.mainSupplier` nesta etapa para evitar migration apenas por nomenclatura.
- Campo de observacao comercial foi implementado no detalhe da Empresa/Prospect, nao no cadastro rapido inicial.
- Endereco do prospect nao e necessario para o fluxo atual do MVP, embora o schema ja possua campo `address` para uso futuro.

Arquivos principais:

- `src/lib/supabase/server.ts`
- `src/lib/supabase/browser.ts`
- `src/lib/auth.ts`
- `src/app/auth/actions.ts`
- `src/app/login/page.tsx`
- `src/app/onboarding/page.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/accounts/page.tsx`
- `src/app/accounts/[id]/page.tsx`
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

## Versao WIP no topo

Enquanto o projeto estiver em desenvolvimento, toda tela deve exibir no topo:

```text
Versao: AAAA-MM-DD hh:mm:ss
```

Implementacao atual:

- Valor: `2026-06-15 11:43:34`
- Arquivo fonte: `src/lib/app-version.ts`
- Componente global: `src/components/version-banner.tsx`
- Renderizacao: `src/app/layout.tsx`

Regra:

- A cada mudanca em qualquer arquivo do sistema, atualizar `APP_VERSION`.
- Futuramente esta informacao pode ser substituida por build/commit do Git.
