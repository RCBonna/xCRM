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

## Versao WIP

Durante o desenvolvimento, o app exibe no topo da tela uma versao no formato `AAAA-MM-DD hh:mm:ss`.

O valor atual fica em `src/lib/app-version.ts` e deve ser atualizado sempre que qualquer arquivo do sistema for alterado.

Observacao local: `npm run dev` inicia o Next com `NODE_OPTIONS=--use-system-ca` para evitar falhas de certificado em chamadas ao Supabase Auth no Windows/Node.

O runtime Prisma prioriza `DIRECT_URL` quando configurada. No Supabase local/remoto deste projeto, essa conexao direta e a rota validada para consultas do app durante o WIP.

## Dados sensiveis

Arquivos de prospeccao, planilhas com contatos, bases de clientes e outros dados reais nao devem ser versionados neste repositorio publico.
