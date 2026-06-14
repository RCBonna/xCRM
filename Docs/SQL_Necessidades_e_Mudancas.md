# SQL - Necessidades e Mudancas do xCRM

Criado em: 2026-06-12 17:13:16 -03:00  
Ultima modificacao: 2026-06-13 21:05:25 -03:00
Status: Documento unico para registrar necessidades, decisoes, migrations e comandos SQL do projeto

## Regras deste documento

- Toda necessidade ou mudanca relacionada a banco SQL deve ser registrada aqui.
- Cada bloco deve manter data/hora, objetivo, status e comandos relacionados.
- Como o app esta em desenvolvimento, migrations podem ser aplicadas no banco quando necessario.
- Comandos SQL devem ficar em blocos versionados, mesmo quando ainda forem apenas proposta.

## 2026-06-12 17:13:16 -03:00 - Necessidade inicial de modelo SQL multi tenant

Status: Proposta inicial, ainda sem migration aplicada

Objetivo:

- Definir as primeiras entidades SQL para um CRM SaaS multiempresa.
- Garantir que todas as tabelas operacionais tenham `tenant_id`.
- Preparar o modelo para vendedores, gestores, funil, contatos, oportunidades, atividades, historico, importacoes e IA.

Tabelas previstas:

- `tenants`
- `users`
- `teams`
- `team_members`
- `accounts`
- `contacts`
- `pipelines`
- `pipeline_stages`
- `opportunities`
- `stage_movements`
- `activities`
- `interactions`
- `attachments`
- `ai_jobs`
- `imports`
- `import_rows`

Requisitos de seguranca:

- Toda query operacional deve ser filtrada por `tenant_id`.
- Vendedores devem acessar apenas registros atribuidos a eles, salvo permissao superior.
- Gestores devem acessar dados da equipe ou do tenant conforme papel.
- Admins e owners devem acessar todo o tenant.
- Nenhum usuario deve acessar dados de outro tenant.

Bloco SQL conceitual inicial:

```sql
-- Proposta inicial, ainda nao aplicada.
-- A migration definitiva deve ser criada para Supabase/PostgreSQL com Prisma.

create table tenants (
  id uuid primary key,
  name text not null,
  legal_name text,
  document text,
  status text not null default 'active',
  plan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table users (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  name text not null,
  email text not null,
  phone text,
  role text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table accounts (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  owner_user_id uuid references users(id),
  name text not null,
  legal_name text,
  document text,
  segment text,
  city text,
  state text,
  address text,
  website text,
  main_supplier text,
  source text,
  status text not null default 'prospect',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table contacts (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  account_id uuid not null references accounts(id),
  owner_user_id uuid references users(id),
  name text not null,
  title text,
  email text,
  phone text,
  whatsapp text,
  linkedin_url text,
  instagram_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Notas:

- O bloco acima ainda nao e a migration final.
- A migration final deve incluir indices, constraints, enums/checks e Row Level Security.
- Stack decidida: Supabase com PostgreSQL.
- ORM decidido: Prisma.

## 2026-06-12 17:46:16 -03:00 - Decisao de stack SQL

Status: Decisao registrada, sem migration aplicada

Objetivo:

- Fixar a base de banco de dados do MVP como Supabase com PostgreSQL.
- Fixar Prisma como ORM da aplicacao.
- Manter Row Level Security como requisito do desenho multi tenant.

Impacto:

- As migrations deverao ser versionadas pelo fluxo do Prisma.
- O schema Prisma devera refletir `tenant_id` em todas as tabelas operacionais.
- Politicas RLS do Supabase deverao ser criadas e documentadas junto das migrations SQL.
- A autenticacao sera Supabase Auth, entao a modelagem precisa considerar o vinculo entre usuarios da aplicacao e usuarios autenticados no Supabase.

## 2026-06-12 18:19:01 -03:00 - Schema Prisma inicial

Status: Schema criado, sem migration aplicada

Objetivo:

- Materializar a primeira versao do modelo multi tenant em `prisma/schema.prisma`.
- Preparar a base para gerar migrations PostgreSQL/Supabase.

Blocos modelados:

- Tenants e usuarios.
- Equipes e membros.
- Empresas/Prospects e contatos.
- Pipelines, etapas e oportunidades.
- Auditoria de movimentacao de etapa.
- Atividades e follow-ups.
- Interacoes para linha do tempo.
- Anexos.
- Jobs de IA.
- Importacoes e linhas importadas.

Comandos relacionados:

```bash
npx prisma init --datasource-provider postgresql
npm run prisma:validate
npm run prisma:generate
```

Notas:

- Ainda nao foi aplicada migration no banco porque o projeto Supabase real nao foi conectado nesta etapa.
- A proxima etapa de banco deve revisar indices, constraints e politicas RLS antes de aplicar a primeira migration.

## 2026-06-12 20:36:47 -03:00 - Primeira migration aplicada no Supabase

Status: Aplicada no banco remoto

Projeto Supabase:

- Nome: `xCRM`
- Ref: `qeadwfyedxhswqcxyeuq`
- Regiao: Sao Paulo (`sa-east-1`)

Migration:

- Arquivo: `supabase/migrations/20260612203250_init_xcrm_core.sql`
- Versao registrada: `20260612203250`
- Nome registrado: `init_xcrm_core`

Objetivo:

- Criar a estrutura SQL inicial do xCRM no Supabase/PostgreSQL.
- Ativar Row Level Security nas tabelas operacionais.
- Criar policies de isolamento por tenant para usuarios autenticados.
- Preparar o banco para autenticacao via Supabase Auth e acesso via Prisma.

Comandos executados:

```bash
supabase init
supabase projects create xCRM --org-id qvpdjiusyyvjjdqskedc --db-password [REDACTED] --region sa-east-1
supabase link --project-ref qeadwfyedxhswqcxyeuq --password [REDACTED]
npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script --output supabase/migrations/20260612203250_init_xcrm_core.sql
supabase db push --linked --password [REDACTED] --dry-run
supabase db push --linked --password [REDACTED] --yes
supabase migration list --linked
```

Observacoes tecnicas:

- A primeira tentativa de aplicar a migration falhou em uma policy RLS por uso incorreto de `ANY((SELECT private.current_tenant_ids()))`.
- O banco fez rollback completo da tentativa: as tabelas principais nao ficaram criadas.
- A policy foi corrigida para `ANY(private.current_tenant_ids())`.
- A migration corrigida foi aplicada com sucesso.
- O schema Prisma foi ajustado para usar `gen_random_uuid()` como default de UUID no banco.

Verificacao executada:

```sql
select count(*) as table_count
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'tenants',
    'users',
    'teams',
    'team_members',
    'accounts',
    'contacts',
    'pipelines',
    'pipeline_stages',
    'opportunities',
    'stage_movements',
    'activities',
    'interactions',
    'attachments',
    'ai_jobs',
    'imports',
    'import_rows'
  );

select relname, relrowsecurity
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and relname in (
    'tenants',
    'users',
    'accounts',
    'contacts',
    'opportunities',
    'activities',
    'interactions',
    'imports'
  )
order by relname;

select count(*) as policy_count
from pg_policies
where schemaname = 'public';
```

Resultado:

- 16 tabelas principais criadas.
- RLS ativo nas entidades verificadas.
- 62 policies RLS criadas.
- Migration local e remota sincronizadas.

Proxima necessidade SQL:

- Criar fluxo seguro de onboarding para primeiro tenant e primeiro usuario owner.
- Revisar se as permissoes de `authenticated` devem ser refinadas por role antes das telas administrativas.
- Criar seed controlado ou script administrativo para bootstrap inicial.

## 2026-06-12 20:50:44 -03:00 - Auth user multi tenant

Status: Aplicada no banco remoto

Migration:

- Arquivo: `supabase/migrations/20260612211500_allow_auth_user_multi_tenant.sql`

Objetivo:

- Permitir que uma mesma identidade do Supabase Auth possa participar de mais de um tenant no futuro.
- Alinhar a constraint de `users.auth_user_id` com a funcao RLS `private.current_tenant_ids()`, que ja retorna uma lista de tenants por usuario autenticado.

Comandos executados:

```bash
supabase db push --linked --password [REDACTED] --yes
npm run prisma:validate
```

SQL aplicado:

```sql
DROP INDEX IF EXISTS "public"."users_auth_user_id_key";

CREATE INDEX IF NOT EXISTS "users_auth_user_id_idx"
ON "public"."users"("auth_user_id");
```

Observacao:

- A tabela `users` continua com unicidade por tenant/e-mail.
- O onboarding atual cria uma linha `users` vinculada ao `auth.uid()` do Supabase para o tenant criado.

## 2026-06-13 09:27:54 -03:00 - Acentuação de rótulos em Português-BR

Status: Aplicada no banco remoto

Migration:

- Arquivo: `supabase/migrations/20260613122754_accent_portuguese_labels.sql`

Objetivo:

- Corrigir rótulos já gravados sem acento em dados criados pelo onboarding inicial.
- Manter nomes de funil, etapas e tarefa inicial coerentes com Português-BR visível na interface.

Comandos executados:

```bash
supabase db push --db-url [DIRECT_URL] --yes
supabase migration list --db-url [DIRECT_URL]
```

SQL:

```sql
UPDATE "public"."pipeline_stages"
SET "name" = 'Qualificação',
    "updated_at" = now()
WHERE "name" = 'Qualificacao';

UPDATE "public"."pipeline_stages"
SET "name" = 'Negociação',
    "updated_at" = now()
WHERE "name" = 'Negociacao';

UPDATE "public"."pipelines"
SET "name" = 'Funil comercial padrão',
    "updated_at" = now()
WHERE "name" = 'Funil comercial padrao';

UPDATE "public"."activities"
SET "title" = 'Revisar configurações iniciais do xCRM',
    "updated_at" = now()
WHERE "title" = 'Revisar configuracoes iniciais do xCRM';
```

Resultado verificado:

- Migration local/remota sincronizada: `20260613122754`.
- `public.pipelines`: `Funil comercial padrão`.
- `public.pipeline_stages`: `Qualificação` e `Negociação`.
- `public.activities`: `Revisar configurações iniciais do xCRM`.

## 2026-06-13 14:11:21 -03:00 - Observação Comercial em accounts

Status: Aplicada no banco remoto

Migration:

- Arquivo: `supabase/migrations/20260613141121_add_account_notes.sql`

Objetivo:

- Permitir que a tela de detalhe da Empresa/Prospect registre uma observação comercial livre.
- Manter observações do cadastro principal vinculadas diretamente a `accounts`, separadas das notas de contatos e do histórico em `interactions`.

Comandos executados:

```bash
npm run prisma:generate
npm run prisma:validate
supabase db push --db-url [DIRECT_URL] --yes
```

SQL aplicado:

```sql
ALTER TABLE "public"."accounts"
ADD COLUMN IF NOT EXISTS "notes" text;
```

Observações:

- A coluna é opcional e não exige backfill.
- O schema Prisma foi atualizado com `Account.notes`.
- A mudança não altera policies RLS existentes; a coluna segue o isolamento já aplicado à tabela `accounts`.

## 2026-06-13 20:25:32 -03:00 - Capitalização de rótulos visíveis gravados

Status: Aplicada no banco remoto

Migration:

- Arquivo: `supabase/migrations/20260613202532_title_case_visible_labels.sql`

Objetivo:

- Normalizar registros antigos já gravados com rótulos compostos em caixa baixa.
- Alinhar eventos de histórico (`interactions.summary`) com a regra visual de capitalização em estilo título.
- Substituir `Cadastro atualizado` por `Dados Atualizados`, deixando mais claro que se trata de evento de auditoria, não status cadastral.

Comandos executados:

```bash
supabase db push --db-url [DIRECT_URL] --yes
```

SQL aplicado:

```sql
UPDATE "public"."interactions"
SET "summary" = 'Dados Atualizados',
    "body" = CASE
      WHEN "body" = 'Dados básicos da Empresa/Prospect foram atualizados.'
        THEN 'Dados Básicos da Empresa/Prospect foram atualizados.'
      ELSE "body"
    END
WHERE "summary" = 'Cadastro atualizado';

UPDATE "public"."interactions"
SET "summary" = 'Prospect Criado',
    "body" = CASE
      WHEN "body" LIKE 'Cadastro inicial criado com contato principal:%'
        THEN replace(
          replace("body", 'Cadastro inicial', 'Cadastro Inicial'),
          'contato principal',
          'Contato Principal'
        )
      WHEN "body" = 'Cadastro inicial criado sem contato principal.'
        THEN 'Cadastro Inicial criado sem Contato Principal.'
      ELSE "body"
    END
WHERE "summary" = 'Prospect criado';

UPDATE "public"."pipelines"
SET "name" = 'Funil Comercial Padrão',
    "updated_at" = now()
WHERE "name" = 'Funil comercial padrão';
```

Observações:

- `interactions` não possui coluna `updated_at`; por isso a migration altera apenas `summary` e `body` nessa tabela.
- Não houve mudança estrutural de schema.

## 2026-06-13 21:05:25 -03:00 - Contato Principal explícito

Status: Aplicada no banco remoto

Migration:

- Arquivo: `supabase/migrations/20260613210800_add_primary_contact_flag.sql`

Objetivo:

- Permitir múltiplos contatos por Empresa/Prospect e marcar explicitamente qual é o Contato Principal.
- Preservar contatos já existentes marcando o primeiro contato criado de cada Empresa/Prospect como principal.
- Garantir no banco que uma Empresa/Prospect tenha no máximo um Contato Principal.

Comandos executados:

```bash
npm run prisma:validate
supabase db push --linked --yes
npm run prisma:generate
supabase migration list --linked
```

SQL aplicado:

```sql
alter table public.contacts
add column if not exists is_primary boolean not null default false;

with ranked_contacts as (
  select
    id,
    row_number() over (
      partition by tenant_id, account_id
      order by created_at asc, id asc
    ) as position
  from public.contacts
)
update public.contacts as contacts
set is_primary = ranked_contacts.position = 1
from ranked_contacts
where contacts.id = ranked_contacts.id;

create unique index if not exists contacts_one_primary_per_account
on public.contacts (tenant_id, account_id)
where is_primary;
```

Observações:

- O schema Prisma foi atualizado com `Contact.isPrimary`.
- A regra de unicidade do Contato Principal é parcial e fica documentada na migration SQL.
- A alteração não cria nova tabela; evolui o cadastro de contatos já existente.
