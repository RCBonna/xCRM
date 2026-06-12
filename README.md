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

## Dados sensiveis

Arquivos de prospeccao, planilhas com contatos, bases de clientes e outros dados reais nao devem ser versionados neste repositorio publico.
