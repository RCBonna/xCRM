# Diario do Projeto xCRM

Criado em: 2026-06-12 17:13:16 -03:00  
Ultima modificacao: 2026-06-12 17:46:16 -03:00

## 2026-06-12

### Resumo do dia

- Criada a pasta `Docs` para acompanhamento do projeto.
- Criado o plano inicial de implementacao do xCRM em `Docs/Plano_Implementacao_CRM.md`.
- Criado o arquivo unico para necessidades e mudancas SQL em `Docs/SQL_Necessidades_e_Mudancas.md`.
- Analisado o arquivo de orientacao `D:\OneDrive\Apps\xCRM.txt`.
- Analisada a planilha `D:\OneDrive\Apps\xCRM\Prospecção Clientes. (1).xlsx`.
- Identificados campos principais para importacao inicial: empresa, contato, cidade, e-mail, telefone, endereco, canal, fornecedor principal, acao, proxima visita e site.
- Definida proposta inicial de CRM SaaS multiempresa, com vendedores, gestores, funil, atividades, linha do tempo e IA.
- Atualizadas as decisoes de arquitetura: Supabase com PostgreSQL, Prisma, Supabase Auth, PWA como primeiro alvo mobile e IA assistiva simples/contextual no MVP.
- Registrada diretriz inicial para modelo comercial SaaS com planos, limites por usuarios, limites de IA e armazenamento.
- Preparada a estrutura inicial para publicacao em Git/GitHub com `README.md`, `.gitignore` e `AGENTS.md`.
- Definida protecao para nao versionar planilhas e bases reais de prospeccao no repositorio publico.

### Observacoes

- A pasta `D:\OneDrive\Apps\xCRM` ainda nao esta inicializada como repositorio Git.
- Por isso, ainda nao foi possivel criar ou atualizar Issues no GitHub.
- Quando o repositorio for criado/conectado ao GitHub, a primeira issue sugerida e uma epica de planejamento do MVP.
- A planilha informa 359 registros no dashboard, mas a leitura estrutural encontrou 379 linhas com algum conteudo; a importacao precisara de normalizacao e validacao.

### Proximas acoes

- Criar repositorio Git/GitHub.
- Abrir issues epicas no GitHub.
- Detalhar UX/design.
- Criar ERD inicial.
- Especificar primeira migration SQL para Supabase/PostgreSQL com Prisma.
