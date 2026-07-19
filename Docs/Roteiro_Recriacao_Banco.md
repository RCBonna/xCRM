# Roteiro de Recriacao do Banco do xCRM

Criado em: 2026-07-18 22:42:18 -03:00
Ultima modificacao: 2026-07-18 22:42:18 -03:00
Issue: `#55`
Status: Fase 1 concluida; ainda nao aprovado para recriacao integral de producao

## Objetivo

Tornar reproduzivel a criacao de um ambiente Supabase/PostgreSQL vazio para o xCRM, sem depender da memoria de quem participou do desenvolvimento.

Este documento e propositalmente conservador: enquanto a execucao em um projeto Supabase vazio e isolado nao for validada, ele nao deve ser usado para substituir ou reinicializar o banco atual.

## Diagnostico Atual

- Existem 16 migrations SQL.
- Sete estao em `supabase/migrations` e sao reconhecidas pelo Supabase CLI.
- Nove estao diretamente em `prisma` e nao participam automaticamente de `supabase db reset`.
- `prisma.config.ts` aponta para `prisma/migrations`, pasta que ainda nao representa o historico real.
- `supabase/config.toml` habilita `supabase/seed.sql`; o arquivo foi criado nesta fase como seed neutro.
- Supabase Auth, `auth.users`, segredos e configuracoes SMTP nao sao recriados pelas migrations do schema `public`.
- O onboarding do app cria o primeiro tenant, Owner, funil padrao, oito etapas e atividade inicial.
- O Platform Admin depende de um usuario real no Supabase Auth e de um registro correspondente em `public.platform_admins`.

## Controles Criados na Fase 1

- `scripts/db/migration-manifest.json`: ordem canonica provisoria de todas as migrations.
- `scripts/db/verify-migration-manifest.mjs`: falha quando encontra arquivo ausente, vazio, duplicado, fora de ordem ou fora do manifesto.
- `npm run db:migrations:verify`: comando unico de verificacao.
- `supabase/seed.sql`: seed neutro e versionado, compatível com a configuracao atual do CLI.

O manifesto e um controle de inventario. Ele ainda nao executa migrations e nao autoriza reset do banco atual.

## Ordem Canonica Provisoria

| Ordem | Migration | Responsabilidade Principal |
| ---: | --- | --- |
| 1 | `supabase/migrations/20260612203250_init_xcrm_core.sql` | Schema base, enums, relacionamentos e RLS multi-tenant |
| 2 | `supabase/migrations/20260612211500_allow_auth_user_multi_tenant.sql` | Varios tenants por usuario do Auth |
| 3 | `supabase/migrations/20260613122754_accent_portuguese_labels.sql` | Ajustes de rotulos iniciais |
| 4 | `supabase/migrations/20260613141121_add_account_notes.sql` | Observacoes em Empresa/Prospect |
| 5 | `supabase/migrations/20260613202532_title_case_visible_labels.sql` | Padronizacao de rotulos |
| 6 | `supabase/migrations/20260613210800_add_primary_contact_flag.sql` | Contato principal unico |
| 7 | `supabase/migrations/20260615164630_add_customer_address_fields.sql` | Endereco detalhado |
| 8 | `prisma/20260615191000_add_tenant_segment.sql` | Segmento do tenant |
| 9 | `prisma/20260616193138_add_team_status.sql` | Status de equipe |
| 10 | `prisma/20260618192000_platform_admin_notifications.sql` | Platform Admin e notificacoes |
| 11 | `prisma/20260629115500_add_import_review_statuses.sql` | Estados de revisao da importacao |
| 12 | `prisma/20260712070221_enable_rls_platform_admin_notifications.sql` | RLS administrativo |
| 13 | `prisma/20260712192500_add_import_source_path.sql` | Metadado legado de origem da importacao |
| 14 | `prisma/20260713111500_add_tenant_status_events.sql` | Auditoria de suspensao/reativacao |
| 15 | `prisma/20260717143000_add_products_and_proposals.sql` | Produtos, Propostas e itens |
| 16 | `prisma/20260718180500_add_import_mapping_templates.sql` | Modelos de mapeamento da importacao |

## Pre-Requisitos de um Ambiente Novo

1. Projeto Supabase isolado, nunca o projeto de producao.
2. Supabase CLI autenticado e vinculado ao projeto correto.
3. Node.js e dependencias instaladas com `npm ci`.
4. `.env` criado a partir de `.env.example`.
5. `DATABASE_URL` configurada para o pool transacional do app.
6. `DIRECT_URL` configurada para sessao direta usada em operacoes de schema.
7. `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` do novo projeto.
8. Backup/exportacao verificada antes de qualquer operacao em ambiente com dados.

Segredos, senhas, chaves do Supabase e credenciais SMTP nunca devem ser gravados no Git.

## Verificacao Permitida Agora

```powershell
npm ci
npm run db:migrations:verify
npm run prisma:validate
npm run prisma:generate
npm run build
```

Resultado esperado do primeiro comando especifico:

```text
Manifesto valido: 16 migrations SQL em ordem cronologica.
Seed do Supabase localizado.
```

## Bootstrap Funcional Depois do Schema

### Primeiro Tenant e Owner

1. Criar o usuario pelo fluxo normal do Supabase Auth.
2. Entrar no xCRM.
3. Concluir `/onboarding`.
4. Confirmar a criacao do tenant, Owner, funil padrao, oito etapas e atividade inicial.

Esse e o caminho oficial porque mantem o `auth_user_id` real e executa as mesmas regras do produto.

### Primeiro Platform Admin

1. Criar ou convidar o usuario no Supabase Auth.
2. Copiar o UUID do usuario somente pelo painel administrativo seguro.
3. Inserir em `public.platform_admins` o UUID, nome e e-mail correspondentes.
4. Validar login e acesso exclusivo a `/platform`.

A Fase 2 deve transformar esse procedimento em comando controlado, idempotente e sem credenciais embutidas.

## Lacunas que Ainda Bloqueiam o Reset Completo

- Consolidar as nove migrations de `prisma/*.sql` no historico reconhecido pelo Supabase CLI, sem duplicar execucao em ambientes existentes.
- Validar a ordem completa em um projeto Supabase vazio e descartavel.
- Comparar o schema reconstruido com `prisma/schema.prisma`.
- Criar bootstrap idempotente do Platform Admin.
- Documentar backup e restauracao de dados, Storage e configuracoes de Auth.
- Registrar como preservar templates de e-mail, URLs de redirecionamento, limites e SMTP.
- Definir rollback operacional; as migrations atuais sao majoritariamente progressivas e nao possuem `down migration`.

## Plano de Validacao da Fase 2

1. Criar projeto Supabase descartavel.
2. Aplicar as 16 migrations pela ordem canonica.
3. Executar `npm run prisma:validate` e `npm run prisma:generate`.
4. Comparar tabelas, enums, indices, chaves estrangeiras e politicas RLS com o ambiente atual.
5. Executar onboarding real.
6. Criar Platform Admin pelo procedimento controlado.
7. Fazer smoke test de login, Dashboard, Base Comercial, Importacao, Produtos, Propostas, Equipes e Plataforma.
8. Destruir somente o projeto descartavel depois de registrar os resultados.

## Criterio Para Encerrar a Issue #55

A issue somente pode ser encerrada quando uma pessoa conseguir partir de um projeto Supabase vazio e chegar a um xCRM funcional usando apenas arquivos e instrucoes versionados, com evidencias do teste e sem acessar o banco atual para descobrir etapas ausentes.
