# Documentacao Tecnica do xCRM

Criado em: 2026-06-12 20:13:05 -03:00  
Ultima modificacao: 2026-06-12 20:36:47 -03:00  
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

- `DATABASE_URL`: URL pooler Supabase para uso da aplicacao.
- `DIRECT_URL`: URL direta Supabase para migrations e operacoes administrativas.
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

## Banco de dados

O schema inicial esta em `prisma/schema.prisma`.

Entidades iniciais:

- Tenants.
- Usuarios.
- Equipes.
- Empresas/prospects.
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

- Implementar autenticacao com Supabase Auth.
- Criar tenant ativo na sessao.
- Criar script/fluxo seguro para primeiro tenant e primeiro usuario owner.
- Criar ERD inicial.

## Issues tecnicas relacionadas

- `#1` Fundacao SaaS multi tenant.
- `#10` Supabase Auth e onboarding do primeiro tenant.
