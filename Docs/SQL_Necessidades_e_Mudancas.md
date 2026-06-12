# SQL - Necessidades e Mudancas do xCRM

Criado em: 2026-06-12 17:13:16 -03:00  
Ultima modificacao: 2026-06-12 20:36:47 -03:00  
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
- Empresas/prospects e contatos.
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
