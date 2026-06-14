# Diario do Projeto xCRM

Criado em: 2026-06-12 17:13:16 -03:00  
Ultima modificacao: 2026-06-14 18:59:34 -03:00

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
- Repositorio publico criado no GitHub: `https://github.com/RCBonna/xCRM`.
- Commit inicial publicado na branch `main`.
- Issues epicas criadas no GitHub:
  - `#1` Epico: Fundacao SaaS multi tenant
  - `#2` Epico: CRM Base
  - `#3` Epico: Importacao de planilha de prospeccao
  - `#4` Epico: Modulo do Vendedor
  - `#5` Epico: Modulo do Gestor
  - `#6` Epico: IA assistiva no MVP
- Avaliada a decisao sobre temas de cores.
- Registrada recomendacao para definir agora a arquitetura de temas com `Sistema`, `Claro`, `Escuro`, `Azul` e `Verde`, mantendo `Sistema`, `Claro` e `Escuro` como prioridade do MVP.
- Criada a issue `#7` Epico: UX, design system e temas.
- Iniciada a fundacao tecnica do MVP com Next.js, TypeScript, Tailwind, Prisma, Supabase client e estrutura PWA/web.
- Criado schema Prisma inicial multi tenant para tenants, usuarios, equipes, empresas, contatos, funil, oportunidades, atividades, interacoes, anexos, IA e importacoes.
- Criada tela inicial operacional para validar densidade visual, funil previsto, metricas da base e seletor de temas.
- Validado `npm run prisma:validate`, `npm run prisma:generate`, `npm run lint` e `npm run build`.
- Tentada validacao no navegador interno em `http://127.0.0.1:3000`, mas o navegador nao conseguiu anexar a aba local; o servidor respondeu HTTP 200.
- Criada a issue `#8` para acompanhar vulnerabilidades moderadas transitivas apontadas por `npm audit`.
- Registrada regra permanente: a cada mudanca, atualizar documentacao tecnica e manual do usuario quando houver impacto tecnico, funcional ou visivel.
- Criados os documentos vivos `Docs/Documentacao_Tecnica.md` e `Docs/Manual_do_Usuario.md`.
- Criada a issue `#9` para acompanhar a manutencao da documentacao tecnica e do manual do usuario.
- Criado o projeto Supabase remoto `xCRM`, ref `qeadwfyedxhswqcxyeuq`, na regiao Sao Paulo (`sa-east-1`).
- Linkado o repositorio local ao projeto Supabase remoto.
- Preenchido `.env` local com `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL` e chave publica do Supabase; o arquivo continua ignorado pelo Git.
- Ajustado o schema Prisma para usar `gen_random_uuid()` como default de UUID no banco.
- Gerada e aplicada a migration `20260612203250_init_xcrm_core.sql` no Supabase remoto.
- A migration criou 16 tabelas publicas e ativou RLS nas entidades multi tenant.
- Verificado no banco remoto: 16 tabelas criadas, 62 policies RLS e migration registrada no historico remoto.
- Validado `npm run prisma:validate`, `npm run lint` e `npm run build` depois da conexao Supabase/migration.
- Validado `supabase db lint --linked --schema public --level warning --fail-on error`, sem erros de schema.
- Criada a issue `#10` para implementar Supabase Auth e onboarding do primeiro tenant/owner.
- Implementado login/cadastro com Supabase Auth.
- Implementado onboarding do primeiro tenant: cria empresa, usuario owner, funil padrao, etapas iniciais e primeira tarefa interna.
- Criado dashboard autenticado com metricas reais do tenant, funil padrao e acao de sair.
- Alterada a rota raiz para redirecionar conforme sessao: sem login vai para `/login`, com login sem tenant vai para `/onboarding`, com tenant vai para `/dashboard`.
- Criada migration `20260612211500_allow_auth_user_multi_tenant.sql` para permitir que o mesmo usuario Supabase Auth participe de mais de um tenant.
- Validado `npm run prisma:generate`, `npm run prisma:validate`, `npm run lint` e `npm run build`.
- Validado HTTP local: `/login` respondeu 200 e `/dashboard` respondeu 307 sem sessao.
- Adicionado banner global no topo da tela com `Versao: 2026-06-12 21:01:27`.
- Registrada regra de WIP: toda mudanca em arquivo do sistema deve atualizar a versao exibida no topo.
- Campos de senha do login/cadastro agora permitem mostrar/ocultar conteudo.
- Senha minima ajustada para 8 caracteres no cliente e nas Server Actions.
- Criada a issue `#11` para recuperacao de senha por e-mail e politica futura de senha forte.
- Criada a issue `#12` para documentar o bug `fetch failed` ao criar acesso.
- Identificada causa local do erro: Node nao verificava a cadeia de certificado do Supabase Auth sem `NODE_OPTIONS=--use-system-ca`.
- Ajustado `npm run dev` para iniciar o Next com `cross-env NODE_OPTIONS=--use-system-ca`.
- Melhorado tratamento de erro de login/cadastro para exibir mensagem amigavel quando o servico de autenticacao nao puder ser acessado.
- Atualizada versao WIP para `2026-06-12 21:39:41`.
- Reiniciado servidor local e validado `/login` com resposta HTTP 200.
- Criada a issue `#13` para documentar o erro `Runtime DriverAdapterError` apos login.
- Reproduzido o problema: `DATABASE_URL` via pooler retornava `(ENOTFOUND) tenant/user postgres.qeadwfyedxhswqcxyeuq not found`, enquanto `DIRECT_URL` encontrava `public.users`.
- Ajustado o cliente Prisma para priorizar `DIRECT_URL` e usar `DATABASE_URL` apenas como fallback.
- Corrigido exemplo de `DIRECT_URL` no `.env.example` para o host direto `db.[PROJECT-REF].supabase.co`.
- Atualizada versao WIP para `2026-06-12 21:54:36`.

## 2026-06-13

### Resumo do dia

- Adicionada identificacao discreta do usuario autenticado na tela de onboarding.
- Identificado pelo print que usuarios com tenant criado ja sao redirecionados para o dashboard, nao permanecendo no onboarding.
- Adicionada identificacao discreta do usuario logado no topo do dashboard, com nome, e-mail e perfil.
- Alinhada a altura dos controles do cabecalho do dashboard: usuario logado, seletor de temas e botao sair.
- Convertida a tela de acesso para fluxo em abas: `Entrar` e `Criar Acesso`, substituindo os dois formulários empilhados.
- Revisados textos visíveis em Português-BR para incluir acentos em login, onboarding, dashboard, mensagens de autenticação e banner de versão.
- Criada migration `20260613122754_accent_portuguese_labels.sql` para acentuar nomes já gravados de funil, etapas e tarefa inicial.
- Reforcado destaque da aba selecionada na tela de acesso com indicador inferior e fundo ativo.
- Adicionado painel superior rotativo na tela de acesso quando nao ha mensagem de erro ou aviso, com textos sobre proposta, operacao e evolucao do xCRM.
- Quando ha erro ou aviso, o mesmo painel superior exibe a mensagem do sistema.
- Alinhados os botoes `Entrar` e `Criar Acesso` no rodape da area de formulario das duas abas.
- Ajustado espacamento interno da aba `Criar Acesso` para evitar que o botao fique colado ao campo de senha.
- Adicionada validacao de e-mail ja cadastrado no fluxo `Criar Acesso`, redirecionando para a aba `Entrar`.
- Iniciado CRM Base com a rota autenticada `/accounts`.
- Criado formulário para cadastrar empresa/prospect com cidade, UF, site, fornecedor principal, origem e contato principal opcional.
- Criada lista de empresas/prospects recentes por tenant, com contato principal quando existir.
- Adicionado atalho do dashboard para abrir empresas/prospects.
- Adicionada identificacao discreta do usuario logado no cabecalho de empresas/prospects.
- Ajustado campo `Site` no cadastro de empresa/prospect para nao bloquear entradas sem protocolo durante a captura inicial.
- Evoluida a lista de empresas/prospects para base comercial consultavel, com busca por empresa, cidade, UF, site, fornecedor, origem e contato principal.
- Adicionado filtro por status na base comercial: todos, prospects, clientes, perdidos e arquivados.
- Adicionada primeira regra de visibilidade por perfil em `/accounts`: owner/admin/manager veem a base do tenant; perfis operacionais veem registros sob sua responsabilidade.
- Criada a issue `#14` para documentar ajustes de UF e campos de contato em empresas/prospects.
- Trocado campo UF do cadastro de empresa/prospect para lista fechada com os 27 estados brasileiros.
- Adicionada validacao server-side para aceitar apenas siglas de UF validas.
- Ajustado layout de e-mail e telefone do contato principal para evitar sobreposicao em paineis estreitos.
- Limitado telefone do contato principal a 15 caracteres no cliente e no servidor.
- Cadastro de empresa/prospect agora grava automaticamente uma linha de historico em `interactions`.
- Cadastro de empresa/prospect agora permite criar uma proxima acao opcional em `activities`.
- Cards da base comercial exibem ultimo historico e proxima acao pendente quando existirem.
- Ajustada nomenclatura visivel de `Empresa/prospect` para `Empresa/Prospect`.
- Ajustada nomenclatura visivel de `Fornecedor principal` para `Fornecedor/Atividade/Marca`.
- Avaliado que um campo de observacao comercial sera util para informacoes livres nao cobertas pelo cadastro, mas ficou para etapa posterior.
- Mantida decisao de nao exigir endereco do prospect neste momento do MVP.
- Criada migration `20260613141121_add_account_notes.sql` para adicionar `accounts.notes`.
- Criada tela de detalhe `/accounts/[id]` com dados básicos, contato principal, histórico, próximas ações e ações concluídas.
- Adicionada edição básica de Empresa/Prospect com observação comercial.
- A lista de empresas/prospects agora permite abrir o detalhe pelo nome do registro.
- Atualizada versão WIP para `2026-06-13 14:11:21`.
- Alinhadas as caixas inferiores `Histórico` e `Ações Concluídas` com a mesma grade vertical da seção superior no detalhe da Empresa/Prospect.
- Adicionado destaque discreto no link de retorno `Empresas/Prospects`, com brilho curto da direita para a esquerda e suporte a redução de movimento.
- Atualizada versão WIP para `2026-06-13 19:51:16`.
- Padronizado o texto visível para `Empresas/Prospects` no dashboard, no título da base comercial e no link de retorno do detalhe.
- Ajustado o botão de edição para `Salvar Alterações`.
- Transformado o painel `Histórico` do detalhe em componente expansível: mostra apenas o registro mais recente por padrão e permite abrir os demais pela seta.
- Atualizada versão WIP para `2026-06-13 20:06:50`.
- Registrada em `AGENTS.md` a regra de capitalização em estilo título para rótulos visíveis compostos, preservando conectivos/preposições curtas em minúsculo quando fizer sentido.
- Ajustados rótulos compostos visíveis como `Contato Principal`, `Base Comercial`, `Próxima Ação`, `Data e Hora`, `Funil Padrão`, `Criar Acesso` e `Ver Todos`.
- A linha de histórico na lista de Empresas/Prospects passou a mostrar `Último Histórico: ...`, deixando claro que é um registro de auditoria, não um status cadastral.
- Criada e aplicada a migration `20260613202532_title_case_visible_labels.sql` para normalizar registros antigos de `interactions` e `pipelines`.
- Atualizada versão WIP para `2026-06-13 20:25:32`.
- Compactado o espaçamento interno dos registros no painel `Histórico`, aproximando título, data/usuário e descrição para melhorar a leitura.
- Atualizada versão WIP para `2026-06-13 20:42:24`.
- Atualizados o manual do usuário e a documentação técnica para refletir o indicador de sessão no onboarding e no dashboard.
- Transformado `Próximas Ações` em fluxo operacional no detalhe da Empresa/Prospect.
- Adicionada criação de nova ação pendente pelo detalhe, usando `activities` com status `PENDING`.
- Adicionada conclusão de ação pendente, atualizando status para `COMPLETED`, preenchendo data de conclusão e movendo visualmente para `Ações Concluídas`.
- A criação e a conclusão de ações agora gravam eventos no `Histórico` como `Ação Criada` e `Ação Concluída`.
- Atualizada versão WIP para `2026-06-13 20:53:16`.
- Criada e aplicada a migration `20260613210800_add_primary_contact_flag.sql` para adicionar `contacts.is_primary`.
- Contatos antigos passaram a marcar automaticamente o primeiro contato de cada Empresa/Prospect como principal.
- Adicionado índice único parcial para manter apenas um Contato Principal por Empresa/Prospect.
- A tela de detalhe agora possui bloco `Contatos`, com criação de novo contato, edição de nome, Função/Cargo, e-mail e telefone.
- Adicionada ação para tornar outro contato o `Contato Principal`.
- Criação, edição e alteração de Contato Principal agora gravam eventos no `Histórico` como `Contato Criado`, `Contato Atualizado` e `Contato Principal Alterado`.
- Atualizada versão WIP para `2026-06-13 21:05:25`.

## 2026-06-14

### Resumo do dia

- Adicionado painel expansível para `Ações Concluídas`, seguindo o mesmo padrão de `Histórico`: mostra apenas a ação mais recente por padrão e permite abrir/recolher as demais.
- Adicionada exclusão de contatos diretamente no bloco `Contatos` do detalhe da Empresa/Prospect.
- A exclusão de contato preserva a trilha de auditoria no `Histórico` com o evento `Contato Excluído`.
- A exclusão fica bloqueada quando o contato é o único da Empresa/Prospect ou quando ainda está marcado como `Contato Principal`.
- Atualizada versão WIP para `2026-06-14 13:07:50`.
- Removido o nome duplicado acima do input `Nome` no bloco `Contatos`, mantendo apenas o selo `Principal` quando aplicável.
- Confirmado que o texto acima de `Painel do xCRM` vem do nome do tenant (`public.tenants.name`) exibido via `appUser.tenant.name`.
- Atualizada versão WIP para `2026-06-14 13:22:15`.
- Movido o selo `Principal` para a faixa inferior de ações do contato, alinhado com o padrão dos botões `Tornar Principal` e `Excluir`.
- Atualizada versão WIP para `2026-06-14 13:31:27`.
- Compactado o painel `Contato Principal`, mantendo o nome em destaque e agrupando Função/Cargo, e-mail e telefone na mesma linha responsiva.
- Atualizada versão WIP para `2026-06-14 16:48:23`.
- Adicionado bloco `Oportunidades` no detalhe da Empresa/Prospect, sem criar uma tela nova neste primeiro corte.
- O usuário agora pode criar uma `Nova Oportunidade` vinculada à Empresa/Prospect, com contato opcional, etapa do funil, valor estimado e previsão de fechamento.
- A movimentação de etapa da oportunidade grava registro em `stage_movements` e linha de auditoria no `Histórico` como `Oportunidade Movida`.
- A criação da oportunidade grava linha no `Histórico` como `Oportunidade Criada`.
- Atualizada versão WIP para `2026-06-14 17:05:19`.
- Adicionado destaque discreto no indicador nativo de calendário do campo `Previsão de Fechamento`, usando a cor primária do tema.
- Transformado o bloco `Contatos` em painel expansível: mantém o primeiro contato visível e permite abrir/recolher os demais quando houver mais de um.
- Atualizada versão WIP para `2026-06-14 17:37:26`.
- Expandido o destaque discreto do indicador nativo de calendário para todos os campos `date` e `datetime-local` do app.
- Adicionado comportamento global para campos `datetime-local`: ao focar/clicar em um campo vazio, ele inicializa com a data atual às `09:00`.
- Atualizada versão WIP para `2026-06-14 17:50:28`.
- Investigado relato de usuário novo que não conseguiu entrar após cadastro.
- Confirmado que o serviço local estava no ar e `/login` respondia HTTP 200.
- Identificado no Supabase Auth que o usuário recém-criado estava sem confirmação de e-mail, portanto o login é bloqueado pelo Auth até a confirmação.
- Melhoradas mensagens de autenticação para diferenciar e-mail não confirmado, limite de envio de e-mails, e-mail inválido e credenciais inválidas.
- Atualizada versão WIP para `2026-06-14 18:09:23`.
- Criada a issue `#19` para corrigir UX de salvar sem alteração e melhorar a visibilidade do calendário.
- Adicionado componente `DirtySubmitButton` para desabilitar `Salvar Alterações` até existir mudança real no formulário.
- Aplicado `DirtySubmitButton` no formulário de dados básicos da Empresa/Prospect e nos formulários de edição de contatos.
- Reforçado o destaque global do indicador nativo de calendário em campos `date` e `datetime-local`.
- Atualizada versão WIP para `2026-06-14 18:59:34`.

### Observacoes

- A pasta `D:\OneDrive\Apps\xCRM` agora esta inicializada como repositorio Git.
- O repositorio GitHub esta publico.
- A planilha real de prospeccao esta ignorada pelo `.gitignore` e nao foi publicada.
- A planilha informa 359 registros no dashboard, mas a leitura estrutural encontrou 379 linhas com algum conteudo; a importacao precisara de normalizacao e validacao.

### Próximas Ações

- Detalhar UX/design.
- Definir tokens iniciais de design e preferencia de tema.
- Criar ERD inicial a partir do schema Prisma.
- Testar manualmente cadastro, login e onboarding com um usuario real.
- Evoluir uma tela de funil/board quando houver volume de oportunidades suficiente para justificar uma visão dedicada.
