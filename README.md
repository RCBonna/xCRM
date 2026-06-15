# xCRM

CRM SaaS multiempresa para equipes comerciais internas e externas.

## Visao geral

O projeto xCRM tem como objetivo combinar CRM tradicional, CRM social e recursos assistivos de inteligencia artificial em uma experiencia simples para vendedores e gestores.

Direcoes ja definidas:

- SaaS multi tenant, com isolamento por empresa.
- Supabase com PostgreSQL.
- Prisma como ORM.
- Supabase Auth.
- PWA como primeiro alvo mobile.
- IA assistiva simples e contextual no MVP.

## Documentacao

A documentacao viva do projeto fica em:

- `Docs/Plano_Implementacao_CRM.md`
- `Docs/Diário_do_Projeto.md`
- `Docs/SQL_Necessidades_e_Mudancas.md`
- `Docs/Documentacao_Tecnica.md`
- `Docs/Manual_do_Usuario.md`

## Desenvolvimento local

1. Instale as dependencias:

```bash
npm install
```

2. Crie o arquivo `.env` a partir do exemplo:

```bash
cp .env.example .env
```

3. Configure as credenciais do Supabase no `.env`.

4. Gere o cliente Prisma:

```bash
npm run prisma:generate
```

5. Inicie o app:

```bash
npm run dev
```

## Versão WIP

Durante o desenvolvimento, o app exibe no topo da tela uma versão no formato `AAAA-MM-DD hh:mm:ss`.

O valor atual fica em `src/lib/app-version.ts` e deve ser atualizado sempre que qualquer arquivo do sistema for alterado.

Observacao local: `npm run dev` inicia o Next com `NODE_OPTIONS=--use-system-ca` para evitar falhas de certificado em chamadas ao Supabase Auth no Windows/Node.

O runtime Prisma prioriza `DIRECT_URL` quando configurada. No Supabase local/remoto deste projeto, essa conexao direta e a rota validada para consultas do app durante o WIP.

## Deploy na Vercel

Antes do primeiro deploy, configure em `Project Settings > Environment Variables`
as variaveis usadas pelo Supabase e pelo Prisma:

- `DATABASE_URL`: URL pooler do Supabase. Use como principal no runtime Vercel.
- `DIRECT_URL`: URL direta do banco Supabase. Mantenha como fallback e para operacoes administrativas/migrations.
- `POSTGRES_PRISMA_URL`: URL gerada pela integração Supabase/Vercel para Prisma. Quando existir no ambiente Vercel, ela é a primeira opção do runtime.
- `NEXT_PUBLIC_SUPABASE_URL`: URL publica do projeto Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: chave publica/publishable do Supabase.

As variaveis devem estar disponiveis no ambiente alvo do deploy
(`Production`, `Preview` e/ou `Development`). Em Vercel/producao, o cliente
Prisma prefere `POSTGRES_PRISMA_URL`, depois `DATABASE_URL`, para usar o pooler.
Sem uma URL de banco configurada, o build da Vercel falha ao importar rotas
protegidas que usam Prisma, com erro semelhante a:

```text
Error: POSTGRES_PRISMA_URL, DIRECT_URL or DATABASE_URL is not configured.
```

## Dados sensiveis

Arquivos de prospeccao, planilhas com contatos, bases de clientes e outros dados reais nao devem ser versionados neste repositorio publico.
