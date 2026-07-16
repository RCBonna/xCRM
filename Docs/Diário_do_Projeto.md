# Diario do Projeto xCRM

Criado em: 2026-06-12 17:13:16 -03:00  
Ultima modificacao: 2026-07-16 18:14:55 -03:00

## 2026-07-16

### Validação Funcional do Dashboard Principal

- Retomado o desenvolvimento da issue `#99` com os serviços locais e o Supabase hospedado.
- Adicionado `src/app/dashboard/loading.tsx` com esqueleto estático que preserva a estrutura do cabeçalho, indicadores, Pipeline e blocos operacionais durante as consultas.
- Adicionado `src/app/dashboard/error.tsx` com mensagem segura, tentativa de recuperação e acesso ao `Dashboard Anterior`, sem sugerir perda ou alteração de dados.
- Os quadros do Pipeline com quantidade maior que zero passaram a abrir a Base Comercial com o filtro correspondente e realce completo no hover/foco; quadros zerados permanecem informativos e não clicáveis.
- A Base Comercial passou a aceitar o filtro `pipeline` para Etapas abertas, ganhos, perdas e Prospects Fora do Pipeline, preservando o período de 7, 30 ou 90 dias quando aplicável.
- O filtro do Funil fica visível e editável na tela, com explicação de que o Dashboard conta Oportunidades enquanto a lista agrupa Empresas/Prospects.
- Extraída `getOpportunityVisibilityWhere` para manter Dashboard e Base Comercial alinhados ao escopo de Proprietário, Administrador, Líder e Vendedor/Assistente.
- `/accounts` passou a usar as abas `Base Comercial` e `Nova Empresa/Prospect`, iniciando sempre pela Base Comercial e mantendo o estado em `tab=base|new`.
- Busca, Status, Funil e período são preservados ao alternar abas; após cadastrar, o usuário permanece na aba de cadastro com o formulário limpo e mensagem de sucesso.
- A troca para a Base Comercial e o botão `Cancelar` solicitam confirmação apenas quando o formulário possui alterações não cadastradas.
- O cadastro passou a ocupar painel próprio com largura controlada, agrupamento responsivo e ações `Cancelar` e `Cadastrar Empresa/Prospect` separadas no rodapé.
- Criada a issue `#100` após a confirmação de descarte ser exibida com o cadastro vazio; eventos técnicos do campo `Data e Hora` estavam sendo interpretados como edição.
- A detecção passou a comparar o conteúdo atual com um retrato inicial serializado, ignorando `returnTo`; o aviso agora depende de alteração efetiva nos dados.
- Padronizado o ícone `BrushCleaning` nas ações visíveis `Limpar` da Base Comercial e das abas de Equipes, Líderes e Usuários; `X` permanece reservado para cancelar, fechar ou remover.
- Adicionados hints `Aplicar Filtros` e `Limpar Filtros` nos controles da Base Comercial, com os mesmos nomes acessíveis.
- Mantida a issue aberta para validação autenticada com dados reais, perfis, temas e larguras de tela.

## 2026-07-15

### Redesenho do Dashboard Principal

- Criada a issue `#99` para substituir métricas dispersas por um Dashboard adaptativo e quantificado.
- A revisão com Impeccable confirmou que `Etapas do Funil` mede configuração, não desempenho, e que Empresas/Prospects não podem ser tratados automaticamente como Oportunidades.
- Aprovada a direção visual com Funil horizontal, quantidade e Valor Estimado por etapa, Prospects sem Oportunidade aberta separados e bloco `Atenção Agora`.
- Preservado o Dashboard existente em `/dashboard-anterior`; o menu passou a oferecer `Dashboard Principal` e `Dashboard Anterior`.
- O novo `/dashboard` aplica visibilidade por perfil, usa períodos de 7, 30 e 90 dias e mostra Pipeline aberto, ganhos/perdas do período, atividades atrasadas e qualidade dos dados das Oportunidades.
- Refinada a faixa do Pipeline para exibir `Oportunidades` por extenso, manter `Últimos N Dias` em uma linha e compactar `Fora do Pipeline`.
- Removida a rolagem horizontal do Funil; em larguras menores, as Etapas agora quebram para novas linhas em uma grade responsiva de uma a quatro colunas.
- Uniformizada a anatomia dos blocos: `Ganhas` e `Perdidas` agora mostram título, quantidade, valor e período nessa ordem, sem alterar seus destaques; `Fora do Pipeline` foi compactado para acompanhar a altura das Etapas.
- Salvo o plano detalhado e as referências aprovadas em `Docs/plano_dash.md` e `Docs/assets`.
- Nenhuma migration foi necessária; os indicadores usam os modelos atuais de Empresa/Prospect, Oportunidade, Etapa, Movimentação e Atividade.
- Validados lint, schema Prisma, build de produção e detectores Impeccable de layout e tipografia; as duas rotas autenticadas responderam corretamente com redirecionamento para Login em sessão anônima.

## 2026-07-14

### Importação de Múltiplos Contatos

- Implementada a issue `#97`: a normalização da planilha passou a extrair cada e-mail válido presente na mesma célula e criar um contato por endereço.
- Contatos duplicados na mesma célula são ignorados e geram aviso na revisão; texto sem e-mail reconhecível também gera aviso para conferência.
- A primeira pessoa detectada permanece como Contato Principal; nomes associados a formatos como `Nome <email>` são preservados e os demais casos usam `Contato a Revisar` sem inferência insegura.
- A tela de revisão substituiu o formulário único por uma lista editável de contatos, com definição de Principal, inclusão, remoção e preservação de todos os registros ao salvar.
- A importação definitiva impede conflito de contato principal quando a Empresa/Prospect já possui um contato marcado como principal.
- Reaberta a issue `#97` após identificar que cargas temporárias criadas antes da mudança mantinham a normalização antiga. Adicionado `Reprocessar Contatos` por linha, com confirmação, para reconstruir a lista a partir dos Dados Originais sem alterar Empresa/Prospect, ações ou observações.

## 2026-07-13

### Gestão de Organizações da Plataforma

- Implementada a issue `#95`, reorganizando `/platform` como lista única de organizações com busca, filtro de status e painel de detalhes.
- A suspensão passou a exigir motivo obrigatório e confirmação em diálogo antes de bloquear o acesso da organização.
- A reativação também passou a usar confirmação e permite registrar contexto opcional.
- Criada a tabela `tenant_status_events` para registrar status, motivo, data/hora e Platform Admin responsável por suspensão ou reativação.
- A exclusão foi concentrada na `Zona de Risco` da organização selecionada, preservando confirmação textual e removendo o progresso visual temporizado que não refletia o servidor.
- Diálogos foram migrados para o elemento nativo `dialog`, com comportamento modal, fechamento por `Esc` e retorno de foco ao controle de origem.
- Aplicada e validada no Supabase a migration `prisma/20260713111500_add_tenant_status_events.sql`.
- Ajustada a apresentação de organizações para manter o selo de Status junto ao nome e exibir Proprietário, e-mail e telefone logo abaixo dos indicadores operacionais.
- A grade de indicadores passou a reservar altura uniforme para rótulos e usar colunas responsivas, preservando o alinhamento dos números; o bloco de Proprietário recebeu ícones de nome, e-mail e telefone.
- Ajustado o rótulo do indicador para `Empresa/ Prospects`, facilitando a leitura e a quebra de linha.
- Padronizada a apresentação de papéis no cartão de identidade: `OWNER` agora aparece como `Proprietário` em todos os cabeçalhos que reutilizam o componente.
- Incluída a marca Scientiam no cabeçalho da Administração da Plataforma, que era a única superfície autenticada sem o padrão visual de identidade.
- Corrigida a tradução de papéis recebidos em minúsculas, garantindo que `owner` e `OWNER` apareçam como `Proprietário`.
- Criada a issue `#96` e ajustado o painel informativo do login: a rotação passou de 30 para 8 segundos, pausa durante interação, respeita redução de movimento e permite escolher a mensagem pelos indicadores.

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
- Criada a issue `#20` para diagnosticar falha de deploy na Vercel por ausência de `DIRECT_URL` ou `DATABASE_URL`.
- Documentadas no README e na documentação técnica as variáveis obrigatórias para deploy Vercel: `DIRECT_URL`, `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Ajustado o cliente Prisma para preferir `DATABASE_URL` em Vercel/produção e manter `DIRECT_URL` como preferida no desenvolvimento local.
- Atualizada versão WIP para `2026-06-14 19:24:02`.

## 2026-06-15

### Resumo do dia

- Autenticada a Vercel CLI na conta `rcbonna`.
- Vinculada a pasta local ao projeto Vercel `roberto-c-bonanomis-projects/x-crm`.
- Configuradas na Vercel, a partir do `.env` local, as variáveis `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` no ambiente `Production`.
- Reaplicadas as mesmas variáveis para `Preview` na branch `main`.
- Adicionado `.vercel` ao `.gitignore` para manter o vínculo local fora do repositório.
- Validado `npm run build` localmente após a configuração.
- Atualizada versão WIP para `2026-06-15 09:25:17`.
- Criada a issue `#21` para investigar erro de runtime no domínio Vercel publicado.
- Coletados logs server-side da Vercel indicando `DriverAdapterError: (ENOTFOUND) tenant/user postgres.qeadwfyedxhswqcxyeuq not found` ao acessar `/` e `/login`.
- Confirmado por teste local com `pg` que `DATABASE_URL` falha com o mesmo erro, enquanto `DIRECT_URL` conecta.
- Ajustado o cliente Prisma para priorizar `POSTGRES_PRISMA_URL` em Vercel/produção antes de `DATABASE_URL`.
- Atualizada versão WIP para `2026-06-15 09:40:12`.
- Criada a issue `#22` para documentar a reincidência do erro de Server Components no domínio Vercel com sessão autenticada.
- Confirmado que o erro ocorre em runtime, apesar do build Vercel concluir com sucesso.
- Reconfiguradas as variáveis `POSTGRES_PRISMA_URL` e `DATABASE_URL` em Vercel `Production` para usar a conexão direta validada por `DIRECT_URL`, contornando temporariamente o pooler inválido.
- Reaplicadas as mesmas variáveis para `Preview` na branch `main`.
- Realizado novo deploy Production manual: `https://x-mejhhmy29-roberto-c-bonanomis-projects.vercel.app`, associado ao alias `https://x-crm-flax.vercel.app`.
- Validados `/` e `/login` com HTTP 200, sem novo log de erro no deployment corrigido, e screenshot Playwright da tela de login.
- Atualizada versão WIP para `2026-06-15 11:26:09`.
- Criada a issue `#23` para investigar erro persistente no Chrome e no fluxo pós-validação de e-mail no Edge.
- Analisado o export de logs `x-crm-log-export-2026-06-15T14-39-50.json`.
- Identificado novo erro de runtime: `PrismaClientKnownRequestError P1011`, com `self-signed certificate in certificate chain`, ao abrir conexão TLS com o Supabase.
- Confirmado por teste local com `pg` que `sslmode=require` falha, enquanto `sslmode=require&uselibpqcompat=true` conecta corretamente.
- Ajustado o cliente Prisma para normalizar URLs diretas do Supabase (`db.*.supabase.co`) adicionando `sslmode=require` e `uselibpqcompat=true`.
- Atualizada versão WIP para `2026-06-15 11:43:34`.
- Reproduzido o erro na aba real do Chrome usando o domínio `https://x-crm-flax.vercel.app/`, com digest `2161801053`.
- Confirmado nos logs Vercel que o adapter Prisma ainda tratava o SSL como `verify-full`, mantendo `P1011`.
- Ajustado o cliente Prisma para usar `pg.PoolConfig` com `ssl.rejectUnauthorized=false` quando a URL for direta do Supabase (`db.*.supabase.co`), removendo os parâmetros SSL da URL antes de criar o pool.
- Atualizada versão WIP para `2026-06-15 11:49:14`.
- Confirmado novo digest `4025481309` na aba real do Chrome após reload.
- Ampliada a configuração SSL explícita para qualquer host Supabase (`*.supabase.co` e `*.supabase.com`), incluindo URLs de pooler, removendo parâmetros SSL da URL antes de criar o pool.
- Atualizada versão WIP para `2026-06-15 11:54:00`.
- Criada a issue `#24` para melhorar a clareza do campo `Valor Estimado` em `Nova Oportunidade`.
- Adicionado componente `CurrencyInput` para formatar o valor em Real (`R$`) ao sair do campo ou enviar o formulário.
- Ajustada a Server Action de criação de Oportunidade para aceitar valores mascarados em Português-BR, como `R$ 1.000.000,00`, além de números simples.
- Atualizada versão WIP para `2026-06-15 12:43:36`.
- Criada a issue `#25` para limitar campos de `Data e Hora` a intervalos comerciais de 15 minutos.
- Adicionado `step` de 15 minutos nos campos `datetime-local` de criação de próxima ação.
- Atualizado `DateTimeLocalDefaults` para manter o padrão inicial `09:00` e normalizar horários digitados para os minutos `00`, `15`, `30` ou `45`.
- Atualizada versão WIP para `2026-06-15 12:55:30`.
- Criada a issue `#26` para documentar as etapas da Oportunidade e a diferença para o Status da Empresa/Prospect.
- Atualizado o Manual do Usuário com a explicação das etapas do Funil, impacto no status da Oportunidade e comportamento atual do cadastro da Empresa/Prospect.
- Atualizada a Documentação Técnica para registrar que a movimentação do Funil ainda não altera automaticamente `accounts.status`.
- Atualizada versão WIP para `2026-06-15 15:50:09`.
- Criada a issue `#27` para automatizar o Status da Empresa/Prospect pelo resultado das Oportunidades.
- Implementada sincronização automática do Status da Empresa/Prospect após criação ou movimentação de Oportunidade.
- A Empresa/Prospect passa para `Cliente` quando há Oportunidade ganha, volta para `Prospect` quando há Oportunidade aberta sem ganho e passa para `Perdido` quando restam apenas Oportunidades perdidas.
- Registros `Arquivados` não são alterados automaticamente por movimentação de Oportunidade.
- Alterações automáticas de Status gravam Histórico como `Status Alterado`.
- Atualizada versão WIP para `2026-06-15 15:56:06`.
- Criada a issue `#28` para padronizar a faixa de Navegação e Mensagens nas telas de detalhe.
- Movido o retorno `Voltar para Empresas/Prospects` para a faixa abaixo do cabeçalho no detalhe da Empresa/Prospect.
- Padronizada a faixa com navegação à esquerda e mensagens do sistema à direita, empilhando em telas menores.
- Atualizada versão WIP para `2026-06-15 16:29:39`.
- Criada a issue `#29` para iniciar os Dados do Cliente com CNPJ alfanumérico.
- Adicionado componente `CnpjInput` com máscara visual `AA.AAA.AAA/AAAA-00`, uppercase e restrição dos 2 últimos caracteres para números.
- Adicionado componente `UppercaseInput` e aplicado em Nome Fantasia/Empresa e Razão Social.
- Atualizada `updateAccountAction` para persistir Nome Fantasia/Empresa e Razão Social em maiúsculas, CNPJ sem pontuação e Endereço textual.
- Documentada a decisão de usar `accounts.name`, `accounts.legal_name` e `accounts.document` neste primeiro corte, sem migration.
- Atualizada versão WIP para `2026-06-15 16:43:51`.
- Criada e aplicada a migration `20260615164630_add_customer_address_fields.sql` para adicionar CEP, Número, Complemento e Bairro em `accounts`.
- Transformado `Dados do Cliente` em painel recolhível por padrão.
- Adicionada busca de endereço por CEP via ViaCEP, preenchendo Endereço, Bairro, Cidade e UF quando encontrado.
- Ajustadas as grades principais do detalhe para duas colunas iguais em desktop, alinhando Histórico e Ações Concluídas com os quadros superiores.
- Atualizada versão WIP para `2026-06-15 17:01:38`.
- Criada a issue `#31` para permitir excluir Ações Pendentes criadas por engano.
- Adicionada exclusão de Ações Pendentes no detalhe da Empresa/Prospect.
- A exclusão remove a atividade pendente e registra Histórico como `Ação Excluída`.
- Atualizada versão WIP para `2026-06-15 17:39:44`.
- Criada a issue `#32` para permitir editar Ações Pendentes antes de concluir ou excluir.
- Adicionada edição inline de descrição, Data e Hora em Ações Pendentes.
- A edição de Ação Pendente registra Histórico como `Ação Atualizada`.
- Atualizada versão WIP para `2026-06-15 18:05:16`.
- Criada a issue `#33` para corrigir o seletor de Data e Hora que ainda exibia minutos fora de `00`, `15`, `30` e `45`.
- Adicionado `ActionDateTimeInput` para Ações, separando Data, Hora e Minuto e restringindo visualmente os minutos permitidos.
- Aplicado o novo controle na criação de Próxima Ação da Base Comercial, na criação de Próxima Ação do detalhe e na edição de Ação Pendente.
- Atualizada versão WIP para `2026-06-15 18:33:16`.
- Fechada a issue `#32` após validação do usuário.
- Iniciada a issue `#34` para Configurações da Empresa pelo Owner.
- Adicionada tela `/settings/company` para Owner/Admin atualizar Nome da Empresa, Razão Social, CNPJ, Segmento e Plano.
- Criada e aplicada a migration `prisma/20260615191000_add_tenant_segment.sql` para adicionar `segment` em `tenants`.
- Alterações em Configurações da Empresa registram auditoria como `Empresa Atualizada`.
- Atualizada versão WIP para `2026-06-15 19:10:00`.
- Substituído o seletor de temas isolado por um menu de engrenagem no cabeçalho.
- O menu de Configurações mantém alteração de tema para todos os perfis e mostra Configurações da Empresa apenas para Owner/Admin.
- Removido o atalho `Abrir Configurações da Empresa` do painel `Próximas Ações` do Dashboard, centralizando essa navegação no menu de Configurações.
- Atualizada versão WIP para `2026-06-15 21:26:28`.
- Iniciada a issue `#36` para convites e hierarquia Owner, Líder e Vendedor.
- Adicionada tela `/settings/team` para Owner/Admin gerenciar Equipes e Usuários.
- Implementado primeiro corte de pré-cadastro de Líder/Vendedor sem envio automático de e-mail.
- Adicionada vinculação de usuários a equipes usando `team_members`.
- Ajustada visibilidade de carteira: Owner/Admin veem tenant, Líder vê própria carteira e membros das equipes que lidera, Vendedor vê própria carteira.
- Atualizada versão WIP para `2026-06-15 21:38:13`.
- Criada a issue `#38` para documentar o erro local em que `/settings/team` retornou 404.
- Adicionado o atalho `Cadastro Prospects/Clientes` no menu de Configurações, logo abaixo de `Configurações da Empresa`.
- Renomeado o botão do Dashboard de `Abrir Empresas/Prospects` para `Cadastro Prospects/Clientes`.
- Validado que `/settings/team` deixou de retornar 404 após reiniciar o dev server; sem sessão ativa, a rota redireciona corretamente para `/login`.
- Fechada a issue `#38` após validação local.
- Atualizada versão WIP para `2026-06-16 18:47:49`.
- Criada a issue `#39` para redesenhar `/settings/team` com resumo de Equipes e abas operacionais.
- Adicionada migration `prisma/20260616193138_add_team_status.sql` para incluir `status` em `teams`.
- Redesenhada a tela `Equipes e Usuários` com resumo em largura total e abas `Cadastro de Usuários`, `Cadastro de Equipes`, `Líder da Equipe` e `Usuários da Equipe`.
- Adicionadas ações para editar/inativar Usuários, editar/inativar Equipes, alterar Líder e remover vínculo de Usuário da Equipe.
- Implementada regra que bloqueia inativar Equipe quando existe Líder ativo ou Usuários ativos vinculados.
- Atualizada versão WIP para `2026-06-16 19:31:38`.
- Registrado na issue `#39` o ajuste da aba `Cadastro de Usuários` para seguir o padrão de seleção e edição usado na Base Comercial.
- Ajustada a aba `Cadastro de Usuários` com formulário único à esquerda e lista selecionável à direita.
- Adicionado campo `Status` no cadastro/edição de Usuário, com criação padrão como `Ativo`.
- Adicionado `Log de Equipes e Usuários` abaixo das abas, usando registros de auditoria em `Interaction`.
- Atualizada versão WIP para `2026-06-16 20:05:22`.
- Registrado na issue `#39` o ajuste da aba `Cadastro de Equipes` para seguir o mesmo padrão da aba de Usuários.
- Ajustada a aba `Cadastro de Equipes` com formulário único à esquerda, lista selecionável à direita e campo `Status`.
- `createTeamAction` e `updateTeamAction` passam a salvar o status enviado pelo formulário.
- Mantida a regra de bloqueio ao tentar salvar Equipe como `Inativa` quando existe Líder ativo ou Usuários ativos vinculados.
- Atualizada versão WIP para `2026-06-16 20:27:44`.
- Registrado na issue `#39` o ajuste para recolher o `Log de Equipes e Usuários` e melhorar o alinhamento visual da aba `Cadastro de Equipes`.
- Criado componente `TeamAuditLogPanel`, com exibir/recolher e estado inicial recolhido.
- Ajustada a lista de `Equipes Cadastradas` para uma grade mais estável, com colunas de Equipe, Líder, Ativos e Status.
- Atualizada versão WIP para `2026-06-18 16:30:49`.
- Registrado na issue `#39` o ajuste de UX da aba `Líder da Equipe`.
- Criado componente `TeamLeadersTab`, com formulário único à esquerda e lista de Equipes ativas à direita.
- A aba `Líder da Equipe` agora carrega a equipe selecionada no formulário, permite escolher `Sem líder` e mantém `Salvar Líder` desabilitado até haver seleção.
- Atualizada versão WIP para `2026-06-18 18:18:28`.
- Removido o botão `Cadastro Prospects/Clientes` do card `Próximas Ações` do Dashboard, mantendo esse acesso centralizado no menu superior.
- Alterado o botão do menu superior de engrenagem para ícone de menu/hambúrguer, pois ele concentra navegação, preferências e configurações.
- Atualizada versão WIP para `2026-06-18 18:31:46`.
- Criada a issue `#40` para implementar `Platform Admin`, suspensão de tenant e notificações da plataforma.
- Adicionado status `SUSPENDED` em `RecordStatus` para suspender o acesso operacional de um tenant sem excluir dados.
- Criadas as tabelas `platform_admins` e `notifications` para administração da plataforma e mensageria discreta.
- Adicionada rota `/platform` para `Platform Admin` listar clientes xCRM, suspender/reativar tenants e acompanhar mensagens.
- Adicionada rota `/tenant-suspended` para bloquear tenants suspensos; Owner recebe canais do SAC e demais usuários são orientados a procurar a gerência.
- O login em tenant suspenso registra notificação para todos os `Platform Admins` ativos, preparando a base para notificações futuras no dashboard.
- Atualizada versão WIP para `2026-06-18 19:22:16`.
- Ajustada a UX da tela `/platform`, reorganizando clientes xCRM com resumo de tenants, status em destaque, métricas em blocos e ação de suspensão/reativação separada.
- Atualizada versão WIP para `2026-06-18 20:37:14`.
- Criada a issue `#41` para documentar a falha de autenticação Postgres do Supabase no ambiente local.
- Validado que o Supabase Auth está acessível, com `/auth/v1/settings` retornando HTTP 200.
- Identificado que `DATABASE_URL` e `DIRECT_URL` falham no Postgres com `password authentication failed for user "postgres"`.
- Registrado em `Docs/SQL_Necessidades_e_Mudancas.md` que a correção depende de connection string/senha atualizada do painel Supabase e ajuste do `.env`.
- Atualizada versão WIP para `2026-06-28 11:30:18`.

## 2026-06-29

### Resumo do dia

- Confirmado com o usuario que a sincronizacao do OneDrive estava pausada antes das alteracoes.
- Investigado loop de login e erro fatal do Turbopack em `/login/page`.
- Ajustado `.env` local para separar `DATABASE_URL` no pooler transacional Supabase `:6543` com `pgbouncer=true` e `DIRECT_URL` no pooler de sessao `:5432` sem `pgbouncer=true`.
- Ajustado `npm run dev` para iniciar `next dev --webpack`, evitando o caminho instavel do Turbopack no ambiente local dentro do OneDrive.
- Validado que o pacote `next@16.2.9` esta instalado e que `npm run prisma:validate` continua valido.
- Validado que `npx eslint .` conclui sem erros.
- Atualizada e fechada a issue `#41` apos validar a conexao Postgres local.
- Criada e fechada a issue `#42` para documentar o loop de login local com panic do Turbopack.
- Atualizada versao WIP para `2026-06-29 11:41:09`.
- Iniciada a fundacao da importacao temporaria de planilhas baguncadas.
- Criado `config/import-settings.json` com a pasta parametrizada `C:\Users\rcbon\OneDrive\Apps\Importar\xCRM`.
- Adicionada dependencia `read-excel-file` para leitura de `.xlsx`; `.csv` usa parser local simples.
- Criada rota `/imports`, acessivel somente para Owner, com link `Importação de Dados` no menu superior.
- Implementada regra de uma carga temporaria ativa por tenant; nova carga fica bloqueada ate o Owner descartar a carga atual.
- Implementada leitura da planilha para `import_rows.raw_json` e normalizacao inicial em `normalized_json`, separando Empresa, Contato Principal, Historico Realizado e Proxima Acao.
- Implementada revisao temporaria linha por linha, com salvar, aprovar, rejeitar e importar uma linha individual para a base definitiva.
- Criada e aplicada a migration `prisma/20260629115500_add_import_review_statuses.sql` para ampliar `JobStatus` com estados de revisao/importacao.
- Validado `npm run prisma:generate`, `npm run prisma:validate`, `npx tsc --noEmit` e `npx eslint .`.
- Atualizada versao WIP para `2026-06-29 16:13:00`.
- Ajustada a regra do `AGENTS.md`: confirmacao do OneDrive pausado passa a ser exigida somente na primeira iteracao da manha e na primeira iteracao da tarde.
- Criada a issue `#43` para documentar erro `PrismaClientValidationError` ao acessar `/imports`.
- Identificado que o dev server em `localhost:3000` estava ativo desde antes da geracao/recarga do Prisma Client com os novos status de importacao.
- Reiniciado o dev server local e validado no Chrome autenticado que `/imports` carrega a tela `Importação Temporária`, mostra a pasta parametrizada e lista `Prospecção_Clientes.xlsx`.
- Fechada a issue `#43` apos validacao.
- Atualizada versao WIP para `2026-06-29 16:45:09`.
- Criada a issue `#44` para ajustes de UX e leitura da tela de importacao temporaria.
- Ajustada a leitura de planilhas para detectar a linha real de cabecalho quando existem linhas institucionais antes dos campos.
- A tela `/imports` passou a exibir a pasta de origem em uma faixa propria e substituiu o card `Arquivos` por indicadores menores de carga, linhas temporarias, pendentes e concluidas/rejeitadas.
- Reorganizada a barra de acoes da linha temporaria com botoes alinhados: salvar, aprovar, importar e rejeitar.
- A rejeicao/importacao de uma linha passa a redirecionar para a proxima linha pendente/aprovada.
- O descarte de carga temporaria passou a exigir confirmacao em modal antes de executar.
- Validado no arquivo `Prospecção_Clientes.xlsx` que o leitor detecta o cabecalho na linha 6, identifica 379 linhas de dados e inicia a primeira linha temporaria na linha 7.
- Validado `npm run prisma:validate`, `npx tsc --noEmit` e `npx eslint .`.
- Atualizada versao WIP para `2026-06-29 17:27:27`.
- Criada a issue `#45` para corrigir selecao de linha, remodelar o formulario de revisao e aplicar formato definido de CNPJ.
- Ajustado o painel de revisao para remontar ao trocar a linha selecionada na lista esquerda, garantindo que os campos da direita sejam atualizados.
- Remodelado o formulario de revisao em blocos compactos de Empresa/Prospect, Contato Principal e Acoes/Observacoes.
- Ajustadas larguras proporcionais para campos curtos como UF, CNPJ, telefone e Data e Hora.
- CNPJ da importacao temporaria passou a usar o componente `CnpjInput`, com mascara `AA.AAA.AAA/AAAA-00`.
- Barra de acoes da linha ficou compacta e alinhada a direita.
- Validado `npx tsc --noEmit` e `npx eslint .`.
- Atualizada versao WIP para `2026-06-29 18:20:47`.
- Criada a issue `#46` para redesenhar a UX da tela de revisao de importacao.
- A tela `/imports` foi remodelada como bancada de triagem: faixa unica de origem/metricas, fila esquerda compacta e ficha de revisao mais densa.
- Os dados originais da planilha passaram para uma area recolhivel, reduzindo altura e ruido visual.
- A barra de acoes da revisao passou a ficar fixa no rodape do painel da linha.
- Campos da ficha foram compactados com labels menores, inputs de altura reduzida e divisores por grupo funcional.
- Validado `npx tsc --noEmit` e `npx eslint .`.
- Atualizada versao WIP para `2026-06-29 22:06:55`.
- Criada e fechada a issue `#47` para alinhar a barra de acoes da revisao de importacao a esquerda.
- A barra de acoes da ficha de revisao em `/imports` passou de alinhamento a direita para alinhamento a esquerda.
- Atualizada versao WIP para `2026-06-29 22:28:49`.

## 2026-06-30

### Resumo do dia

- Confirmado com o usuario que a sincronizacao do OneDrive estava pausada na primeira iteracao da manha.
- Criada a issue `#48` para remover aviso redundante de proxima acao na revisao de importacao.
- Removido da exibicao superior da ficha de revisao o aviso `Nenhuma próxima ação futura foi identificada.`, pois a ausencia de proxima acao ja fica clara no bloco `Ações e Observações`.
- Atualizada versao WIP para `2026-06-30 08:56:17`.
- Criada a issue `#49` para ajustes de filtro, Razão Social e espacamento da revisao de importacao.
- Adicionado filtro minimalista por status na fila esquerda da tela `/imports`: Todas, Em Revisão, Aprovadas, Importadas e Rejeitadas.
- A selecao do painel de revisao passa a respeitar o filtro de status ativo.
- Quando a Razão Social nao vem da planilha, o sistema usa o Nome Fantasia/Empresa como valor inicial e tambem no salvamento da revisao.
- Os numeros dos indicadores superiores foram centralizados.
- A grade dos campos da ficha recebeu maior espacamento horizontal e breakpoint maior para evitar que campos curtos/telefone ultrapassem a lateral direita.
- Validado `npx tsc --noEmit` e `npx eslint .`.
- Atualizada versao WIP para `2026-06-30 09:24:26`.
- Criada a issue `#50` para trocar filtros de status por menu com icone, reforcar espacamento entre campos e bloquear acoes de linhas ja importadas.
- O filtro de status da fila esquerda passou a usar botao com icone de filtro e menu suspenso, fechando apos a escolha por navegacao.
- A ficha de revisao recebeu inputs com largura controlada e maior espacamento entre colunas, especialmente em UF/Endereco e E-mail/Telefone.
- Linhas com status `Importada` passam a deixar `Salvar Revisão`, `Aprovar Linha`, `Importar Linha` e `Rejeitar Linha` desabilitados, mantendo a linha apenas para consulta/correção visual sem novo envio.
- Atualizada versao WIP para `2026-06-30 09:50:41`.
- Criada a issue `#51` para reposicionar o filtro de status, recolher o menu apos a selecao e preservar o filtro ao navegar entre linhas.
- O filtro de status passou para o topo do card da carga, ao lado de `Descartar Carga`, usando componente cliente controlado para abrir e fechar.
- A selecao de uma linha na fila preserva a querystring `status`, evitando retorno automatico para `Todas` ao abrir outra linha filtrada.
- Atualizada versao WIP para `2026-06-30 10:02:34`.
- Criada a issue `#52` para corrigir filtro sem resultados e adicionar estado visual de processamento.
- A fila temporaria passou a respeitar filtros sem resultado, mostrando estado vazio em vez de voltar para `Todas`.
- O filtro de status agora exibe icone girando e cursor de processamento durante a navegacao.
- Atualizada versao WIP para `2026-06-30 10:12:47`.
- Confirmado com o usuario que a sincronizacao do OneDrive estava pausada na primeira iteracao da tarde.
- Criada a issue `#53` para melhorar feedback visual de hover e clique nos botoes.
- Adicionado padrao global em `src/app/globals.css` para botoes e links arredondados: hover com borda/sombra mais clara, focus visivel e clique com leve deslocamento/afundamento.
- O padrao respeita botoes desabilitados e `prefers-reduced-motion`.
- Atualizada versao WIP para `2026-06-30 12:43:53`.
- Criada a issue `#54` para ajustar a aparencia dos inputs nos temas claro e escuro.
- Adicionados tokens globais `--field` e `--field-autofill` por tema em `src/app/globals.css`.
- Inputs, selects e textareas passaram a usar fundo de campo do tema, cor de texto/caret consistente, hover/focus padronizados e tratamento de autofill do navegador.
- No tema escuro, campos preenchidos/autofill deixam de aparecer brancos; no tema claro, permanecem claros e integrados ao painel.
- Atualizada versao WIP para `2026-06-30 13:08:42`.
- Criada a issue `#56` para ajustar a intensidade dos botoes primarios no tema escuro.
- Adicionados tokens globais de acao primaria em `src/app/globals.css`, mantendo botoes preenchidos no tema claro e usando acao primaria suave no tema escuro.
- Botoes com `bg-primary` agora recebem fundo, borda, hover e texto a partir dos tokens `--primary-action-*`.
- Atualizada versao WIP para `2026-06-30 16:49:00`.
- Criada a issue `#57` para ajustar o rotulo `Nome Fantasia` e a origem de prospects importados.
- A tela `Configurações da Empresa` passou a exibir `Nome Fantasia` no campo principal do tenant.
- A importacao definitiva de nova Empresa/Prospect via carga temporaria passa a gravar `Origem` como `Importado`.
- Atualizada versao WIP para `2026-06-30 17:34:11`.
- Criada a issue `#58` para importar linhas aprovadas em lote e encaminhar prospects para equipe.
- A tela `/imports` recebeu bloco de encaminhamento para equipe ativa com líder definido, permitindo ao Owner importar todas as linhas aprovadas de uma vez.
- Quando uma equipe e selecionada, os prospects importados em lote passam a ficar sob responsabilidade do líder da equipe.
- O líder recebe notificação interna `PROSPECTS_ASSIGNED_TO_TEAM` com resumo da carga e dos prospects encaminhados.
- O cartão de identidade do usuário passou a exibir badge vermelho com contagem de notificações não lidas nas telas principais.
- Linhas aprovadas que falharem no lote passam para status `Falhou`, entram na contagem de inválidas e podem ser filtradas na fila temporária.
- Atualizada versao WIP para `2026-06-30 18:51:49`.
- Criada a issue `#59` para exibir cursor de processamento durante navegacoes e envios demorados.
- Adicionado componente global `GlobalPendingCursor` no layout para ativar cursor `progress` em links internos e submits de formularios.
- O cursor de processamento cobre fluxos como login, troca de tela, selecao de linhas/filtros na importacao e acoes que disparam Server Actions.
- O estado de processamento e limpo ao concluir a navegacao e possui fallback automatico para evitar cursor preso.
- Atualizada versao WIP para `2026-06-30 20:18:27`.

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

## 2026-07-01

### Resumo do dia

- Confirmado com o usuario que a sincronizacao do OneDrive estava pausada antes das alteracoes.
- Criada a issue `#60` para rotina administrativa de exclusao completa de organizacao.
- Adicionada em `/platform` a area `Exclusão de Organização`, visivel apenas para `Platform Admin`.
- A area lista organizacoes cadastradas, status e contadores de usuarios, Empresas/Prospects, acoes e importacoes.
- Implementada Server Action transacional `deleteTenantAction` para excluir completamente o tenant selecionado e dados vinculados.
- A exclusao exige confirmacao digitada no formato `EXCLUIR Nome da Organização` e modal final antes do envio.
- A rotina remove dados relacionados como historico, acoes, oportunidades, contatos, anexos, IA, importacoes, equipes, usuarios e notificacoes do tenant.
- Antes de remover os usuarios, notificacoes globais que apontem para usuario do tenant como ator sao desvinculadas para evitar bloqueio por chave estrangeira.
- A exclusao registra uma notificacao global `TENANT_DELETED` para o `Platform Admin` executor, com resumo dos dados removidos.
- Atualizada versao WIP para `2026-07-01 20:45:59`.

## 2026-07-02

### Resumo do dia

- Confirmado com o usuario que a sincronizacao do OneDrive estava pausada antes das alteracoes.
- Criada a issue `#61` para corrigir a confirmacao da exclusao de organizacao e adicionar feedback de processamento no login.
- Substituido o botao generico de confirmacao da area `Exclusão de Organização` por um componente cliente dedicado.
- O fluxo de exclusao agora exige confirmacao textual, abre um primeiro modal de conferencia da organizacao e um segundo modal de exclusao permanente.
- Ao confirmar a exclusao definitiva, a tela mostra uma janela de processamento abaixo do formulario com icone girando e etapas como eliminacao de acoes, historico, oportunidades, contatos, importacoes, equipes e usuarios.
- Adicionado componente `PendingSubmitButton` para mostrar `Processando...` com icone girando nos botoes `Entrar` e `Criar Acesso`.
- Atualizada versao WIP para `2026-07-02 08:46:00`.
- Criada a issue `#62` para corrigir o botao `Excluir Organização` sem acao na tela `/platform`.
- Identificado nos logs do dev server que o acesso por `127.0.0.1` bloqueava recursos de desenvolvimento do Next, impedindo a hidratacao de componentes cliente.
- Adicionado `allowedDevOrigins: ["127.0.0.1"]` em `next.config.ts` para permitir que o app local funcione tanto por `localhost` quanto por `127.0.0.1`.
- Ajustado `PlatformTenantDeleteForm` para usar `formId` deterministico baseado no `tenantId`.
- Atualizada versao WIP para `2026-07-02 09:00:48`.
- Criada a issue `#63` para script SQL local de truncate total das tabelas.
- Criado `prisma/truncate_all_tables.SQL-Truncated` com `TRUNCATE TABLE ... RESTART IDENTITY CASCADE` para todas as tabelas publicas do app.
- O script de truncate nao foi executado no banco; foi apenas salvo para uso manual/controlado.
- Adicionado `*.SQL-Truncated` e `prisma/truncate_all_tables.SQL-Truncated` ao `.gitignore`.
- Atualizada versao WIP para `2026-07-02 09:23:06`.
- Criada a issue `#64` para script SQL local de provisionamento de administrador da plataforma.
- Criado `prisma/create_platform_admin.SQL-Administrador`, com variaveis para Nome, e-mail e senha.
- O script cria ou atualiza o usuario em `auth.users`, garante identidade em `auth.identities` e cria/ativa o registro em `public.platform_admins`.
- O script de administrador nao foi executado no banco; foi apenas salvo para uso manual/controlado.
- Adicionado `*.SQL-Administrador` e `prisma/create_platform_admin.SQL-Administrador` ao `.gitignore`.
- Atualizada versao WIP para `2026-07-02 09:27:48`.
- Criada a issue `#66` para exibir e concluir atividades pendentes gerais no Dashboard.
- Identificado que a atividade pendente do onboarding era criada corretamente, mas nao havia tela para concluir atividades sem Empresa/Prospect vinculada.
- Adicionada a Server Action `completeDashboardActivityAction` em `src/app/dashboard/actions.ts`.
- O Dashboard passou a exibir a secao `Atividades Pendentes`, listando atividades do tenant atual, incluindo atividades gerais do onboarding.
- A lista permite concluir uma atividade pendente diretamente pelo Dashboard e exibe link para a Empresa/Prospect quando a atividade tiver vinculo.
- Atualizada versao WIP para `2026-07-02 18:01:02`.
- Criada a issue `#67` para ajustes visuais no Dashboard Owner.
- Criada a issue `#68` para futura evolucao do Dashboard Owner com quantidade de times, pessoas e atividades pendentes por equipe/representante.
- Movida a secao `Atividades Pendentes` para o final do Dashboard e transformada em painel com `Expandir`/`Recolher`.
- Reorganizados os quatro cards de metricas do topo, colocando icone e titulo juntos e a descricao centralizada no rodape do card.
- A atividade inicial criada no onboarding passa a gravar `scheduledAt` com a data/hora de criacao.
- Aplicado backfill em 1 atividade inicial pendente existente, preenchendo `scheduled_at` com `created_at`.
- Nos cards do `Funil Padrão`, a descricao da etapa passou a aparecer antes do numero, deixando o numero como indicador inferior.
- Atualizada versao WIP para `2026-07-02 18:14:31`.
- Criada a issue `#69` para ajustes finos nos cards do Dashboard Owner.
- Centralizado o valor nos quatro cards superiores do Dashboard.
- Nos cards do `Funil Padrão`, o numero da etapa passou a ficar ao lado esquerdo da descricao da etapa.
- Atualizada versao WIP para `2026-07-02 18:47:32`.
- Criada a issue `#70` para ajustar o numero da etapa ao lado do nome no `Funil Padrão`.
- Nos cards do `Funil Padrão`, o numero/posicao passou a ficar ao lado esquerdo do nome da etapa, por exemplo `1 Visitantes`.
- Atualizada versao WIP para `2026-07-02 18:50:59`.

## 2026-07-03

### Resumo do dia

- Confirmado com o usuario que a sincronizacao do OneDrive estava pausada antes das alteracoes.
- Inicializado o Impeccable no projeto.
- Criado `PRODUCT.md` com o registro do produto xCRM como SaaS operacional multiempresa para Owner, Admin, Gestor, Vendedor/Assistente e Platform Admin.
- Definida a direcao de UX como clara, confiavel e operacional, evitando composicao de landing page, excesso decorativo e affordances fora do padrao.
- Criada a configuracao `.impeccable/live/config.json` para live mode em Next.js App Router usando `src/app/layout.tsx`.
- Verificado que nao ha CSP local bloqueando o helper do Impeccable.
- Atualizada versao WIP para `2026-07-03 09:31:54`.
- Criado `DESIGN.md` com o design system visual do xCRM no formato esperado pelo Impeccable/Stitch.
- Criado `.impeccable/design.json` com metadados, regras, ramps de cor e componentes renderizaveis para o painel live do Impeccable.
- A linguagem visual foi registrada como `Painel de Controle Confiável`, com UX clara, operacional e sobria.
- Atualizada versao WIP para `2026-07-03 09:57:59`.
- Criado o epico GitHub `#71` para evoluir a UX do Dashboard Owner/Admin.
- Criadas as issues `#72`, `#73`, `#74`, `#75` e `#76` para acompanhar as prioridades levantadas na critica Impeccable.
- Iniciada a issue `#72` com uma area superior de prioridade operacional no Dashboard.
- O Dashboard agora escolhe a recomendacao principal conforme dados reais: atividades pendentes, base vazia, contatos ausentes, importacao para Owner ou acompanhamento da base comercial.
- A area de prioridade mostra CTA direto e um resumo compacto de Atividades Pendentes, Empresas/Prospects e Contatos Vinculados.
- A secao `Atividades Pendentes` ganhou ancora para o CTA superior levar o usuario ate o painel.
- Atualizada versao WIP para `2026-07-03 10:50:37`.
- Refinados os quatro cards de metricas do topo do Dashboard a partir do fluxo `$impeccable craft` e do print de referencia do usuario.
- Os cards ganharam cabecalho separado por linha sutil, icone em area de apoio, valor com numeros tabulares e descricao centralizada.
- O card `Atividades Pendentes` recebe destaque de borda e icone quando houver pendencias.
- Atualizada versao WIP para `2026-07-03 15:52:09`.
- Ajustados novamente os cards de metricas para ficarem mais proximos do mock aprovado: cards mais altos, icones maiores, titulo mais forte, divisor interno e valor/descricao alinhados a esquerda.
- Atualizada versao WIP para `2026-07-03 15:59:39`.

## 2026-07-09

### Resumo do dia

- Confirmado com o usuario que a sincronizacao do OneDrive estava pausada antes das alteracoes.
- Reinicializado o contexto Impeccable para atualizar os registros estrategico e visual do xCRM.
- Atualizado `PRODUCT.md` para o formato atual do Impeccable, com `Register: product`, `Platform: web`, posicionamento, principios e requisitos de acessibilidade.
- Atualizado `DESIGN.md` por varredura do codigo atual, preservando o north star `Painel de Controle Confiável` e documentando os temas Sistema, Claro, Escuro, Azul e Verde.
- Sincronizado o design system com o painel de prioridade, os cards altos de metricas, estados de processamento e o fluxo destrutivo de organizacoes.
- Regenerado `.impeccable/design.json` com novos metadados de tema, tipografia, sombra de hover e componentes `Metric Card` e `Priority Panel` atualizados.
- Atualizada versao WIP para `2026-07-09 21:15:15`.
- Executado `$impeccable polish /dashboard` com avaliacao visual autenticada em desktop e mobile.
- Removida a linguagem tecnica do cabecalho e adicionados rotulos em Portugues-BR para os perfis.
- Substituida a lista passiva `Proximas Acoes` por `Acessos Rapidos` reais e condicionados por permissao.
- Ajustados cabecalho, metricas e Funil para reduzir rolagem e evitar cortes entre 320px e 1440px.
- Melhorados estado vazio, previa recolhida, alvo de toque e associacao acessivel no painel de atividades.
- Adicionado fechamento do menu superior pela tecla `Esc` e ampliados alvos de toque internos.
- Atualizada versao WIP para `2026-07-09 22:09:19`.
- Alinhado o contador de notificacoes a escala tipografica documentada (`text-xs`) apos alerta do detector Impeccable.
- Atualizada versao WIP para `2026-07-09 22:10:44`.
- Executado `$impeccable audit /dashboard` depois do polish, com testes autenticados nos temas Sistema, Claro, Escuro, Azul e Verde.
- O audit recebeu nota `16/20 (Good)`, sem P0/P1 e com tres P2: retorno de foco do menu, textos de 12px no mobile e grade generica de hero metrics.
- Salvo o relatorio em `.impeccable/audit/2026-07-09T22-14-24-03-00__dashboard.md`.
- Atualizada versao WIP para `2026-07-09 22:14:24`.
- Fechadas as issues `#73` (atalhos admin) e `#74` (copy tecnica) apos validacao.
- Criadas as issues `#77` (retorno de foco do menu) e `#78` (legibilidade mobile), vinculadas ao epico `#71`.
- Atualizadas as issues `#72` e `#76` com o resultado do polish e do audit.
- Atualizada versao WIP para `2026-07-09 22:16:36`.

## 2026-07-12

### Resumo do dia

- Confirmado com o usuario que a sincronizacao do OneDrive estava pausada antes das alteracoes.
- Avaliado alerta de seguranca `RLS Disabled in Public` para `public.notifications` e `public.platform_admins`.
- Criada a migration `prisma/20260712070221_enable_rls_platform_admin_notifications.sql` para habilitar RLS nas duas tabelas.
- Adicionada policy de leitura do proprio `Platform Admin` ativo em `public.platform_admins`.
- Adicionada policy de leitura de `public.notifications` apenas pelo destinatario autenticado, seja usuario operacional ativo ou `Platform Admin` ativo.
- Mantidas mutacoes de notificacoes e administradores restritas ao backend/Prisma, sem policies de escrita para PostgREST.
- Criada a issue GitHub `#79` para documentar o alerta e a correcao.
- Aplicada a migration no banco via script Node com `pg` e `DIRECT_URL`, apos timeout do `npx prisma db execute`.
- Validado no catalogo PostgreSQL que `public.notifications` e `public.platform_admins` estao com RLS ativo e policies `SELECT` para `authenticated`.
- Atualizada versao WIP para `2026-07-12 07:07:19`.
- Carregado o contexto da skill Impeccable pelo caminho `C:\Users\rcbon\.agents\skills\impeccable\SKILL.md` e confirmado `Register: product` para app web.
- Executado o detector local do Impeccable sobre os arquivos de UI alterados do Dashboard/menu/identidade/atividades; resultado `[]`, sem achados deterministicos.
- Revisadas as alteracoes funcionais de importacao: historicos importados com corpo passam a gerar atividade concluida e proximas acoes usam descricao como titulo preferencial.
- Documentados os comportamentos de importacao em `Docs/Documentacao_Tecnica.md` e `Docs/Manual_do_Usuario.md`.
- Atualizada versao WIP para `2026-07-12 07:50:10`.
- Usado o snapshot `.impeccable/critique/2026-07-12T11-49-57Z__src-app-accounts-id-page-tsx.md` para aplicar correcoes na tela de detalhe de Empresa/Prospect.
- Criada faixa de decisão comercial no topo do detalhe com Status, próxima ação, Contato Principal, Ações Pendentes e Oportunidades.
- Removida a duplicação visual do Contato Principal, mantendo a edição dentro do painel `Contatos`.
- Recolhido o fluxo de novo contato atrás de `Adicionar Contato` e adicionada contagem em `Ver N Contatos`.
- Renomeados botões de salvamento por escopo: `Salvar Dados Básicos`, `Salvar Contato` e `Salvar Ação`.
- Adicionada confirmação para exclusão de contato e de ação pendente.
- Reforçados `aria-controls`, live region de CEP e alvos de toque em painéis recolhíveis da tela de detalhe.
- Atualizada versao WIP para `2026-07-12 09:15:43`.
- Acrescentados Função/Cargo, E-mail e Telefone do Contato Principal na faixa superior do detalhe de Empresa/Prospect.
- Criado `AccountSectionPanel` para padronizar `Ver N ...`/`Recolher` em Contatos, Oportunidades e Próximas Ações.
- O quadro `Contatos` agora mantém o Contato Principal dentro da área recolhível, lista todos os contatos ao expandir e deixa `Adicionar Contato` fora do recolhimento.
- O atalho `Gerenciar Contatos` passa a expandir automaticamente o quadro de Contatos e posicionar a tela nessa seção.
- Oportunidades e Próximas Ações passaram a seguir o mesmo padrão de expandir/recolher, mantendo os formulários de criação fora da área recolhível.
- Atualizada versao WIP para `2026-07-12 15:28:57`.
- Ajustado `Contatos` para não abrir automaticamente quando a página carrega com hash antigo; a expansão agora depende de clique em `Ver Contatos` ou `Gerenciar Contatos`.
- Criado `AccountAddPanel` para manter os formulários de `Adicionar Oportunidade` e `Adicionar Ação` recolhidos por padrão, abrindo apenas após clique explícito.
- Renomeados os CTAs de criação no detalhe para `Adicionar Oportunidade` e `Adicionar Ação`, com envio pelos botões `Salvar Oportunidade` e `Salvar Ação`.
- Atualizada versao WIP para `2026-07-12 15:53:06`.
- Adicionado icone `+` ao botao `Adicionar Contato`, alinhando o padrao visual com `Adicionar Oportunidade` e `Adicionar Ação`.
- Gerado asset leve `public/brand/scientiam-mark.jpg` a partir do logo anexado, com cerca de 4 KB.
- Criado `TenantBrand` e aplicado o logo compacto ao lado do nome da organização nos cabeçalhos autenticados do tenant.
- Atualizada versao WIP para `2026-07-12 16:19:34`.
- Refeito `TenantBrand` para remover o texto do tenant na primeira linha, exibir `xCRM` e posicionar título/subtítulo à direita do logo inteiro da Scientiam.
- Regenerado `public/brand/scientiam-mark.jpg` com a logo inteira em 192x192, mantendo o asset leve com cerca de 6,7 KB.
- Atualizada versao WIP para `2026-07-12 16:32:32`.
- Ajustado `TenantBrand` para restaurar a Organização do Tenant na primeira linha, com mais presença que antes, enquanto o título da tela permanece como destaque principal em escala ligeiramente menor no desktop.
- Atualizada versao WIP para `2026-07-12 16:48:07`.
- Compactadas as três linhas do `TenantBrand`, reduzindo margens verticais e entrelinha para aproximar a altura do bloco textual da altura do logo.
- Atualizada versao WIP para `2026-07-12 16:58:21`.
- Ajustada a lista da `Base Comercial` para que o card inteiro da Empresa/Prospect tenha realce no hover e seja clicável para abrir a tela de edição, não apenas o nome da empresa.
- Atualizada versao WIP para `2026-07-12 17:11:55`.
- Ajustado o CTA `Ver Atividades` do Dashboard para, além de navegar até `Atividades Pendentes`, expandir automaticamente o painel quando houver pendências.
- Atualizada versao WIP para `2026-07-12 17:35:02`.
- Criada a issue GitHub `#89` para implementar a Agenda de Atividades com visibilidade por equipe.
- Criada a rota `/agenda` com visoes Dia, Semana, Lista e Mes, iniciando pela Semana.
- A Agenda organiza atividades em grade de periodo e trilho operacional para `Sem Agendamento` e `Atrasadas`.
- Adicionados filtros de Data de Referencia, Responsavel e Status; atividades concluidas ficam ocultas por padrao.
- A edicao e a conclusao da atividade ocorrem na propria Agenda, dentro do escopo permitido para o perfil.
- Centralizada a visibilidade de atividades por responsavel: Owner/Admin veem o tenant, Lider ve a propria equipe e Vendedor/Assistente veem apenas as proprias atividades.
- Aplicada a mesma regra no Dashboard e nas acoes de Empresa/Prospect para evitar consulta ou mutacao fora do escopo permitido.
- Adicionado acesso `Agenda de Atividades` no menu e alterado o CTA `Ver Atividades` do Dashboard para abrir a nova pagina.
- Atualizada versao WIP para `2026-07-12 18:22:36`.
- Criada a issue GitHub `#90` para remover a dependencia de pasta fixa na Importacao Temporaria.
- Substituida a lista de arquivos do servidor por seletor nativo de arquivo no navegador.
- A Importacao agora recebe planilha XLSX ou CSV enviada pelo Owner, de qualquer disco ou pasta acessivel no dispositivo, com limite de 10 MB.
- Removidos `config/import-settings.json`, `src/lib/imports/settings.ts` e a logica de enumeracao/leitura por caminho absoluto no servidor.
- Atualizada versao WIP para `2026-07-12 19:19:50`.
- Criada a issue GitHub `#91` para alinhar o upload e eliminar repeticoes no resumo da carga.
- Alinhados o seletor de arquivo e o botao `Carregar Planilha` na mesma linha em telas medias e grandes.
- Adicionado o campo opcional `Caminho de Origem`, informado manualmente pelo Owner e salvo em `imports.source_path`; o navegador nao permite preencher o caminho absoluto automaticamente.
- Mantidos nome, caminho informado, linhas, pendentes, importadas e rejeitadas no resumo superior da carga.
- Removidos do painel lateral o nome do arquivo, a quantidade total de linhas e a contagem de pendencias duplicados.
- Criada a migration `prisma/20260712192500_add_import_source_path.sql` para o novo campo de banco.
- Aplicada a migration de `imports.source_path` no Supabase remoto e validada a existencia da coluna.
- Atualizada versao WIP para `2026-07-12 19:57:15`.
- Criada a issue GitHub `#92` para reposicionar o descarte e incluir busca de prospects na Importacao Temporaria.
- Movido `Descartar Carga` para o resumo superior, junto a identificacao e as metricas da carga.
- Substituido o espaco anterior do descarte no painel lateral por busca compacta de Empresa/Prospect, preservando o filtro de status.
- A busca considera Nome Fantasia/Empresa e Razao Social normalizados, sem diferenciar maiusculas, minusculas ou acentos.
- Atualizada versao WIP para `2026-07-12 20:03:23`.
- Criada a issue GitHub `#93` para alinhar `Descartar Carga` na faixa de resumo da Importacao Temporaria.
- Reposicionado `Descartar Carga` para uma celula compacta imediatamente antes da metrica `Linhas`, sem criar nova linha no resumo desktop.
- Atualizada versao WIP para `2026-07-12 20:09:52`.
- Incluído o campo opcional `Função/Cargo` no Contato Principal do cadastro de Nova Empresa/Prospect, com persistência em `contacts.title`.
- Mantido o botão `Limpar` visível na Base Comercial mesmo sem filtros aplicados, direcionando para a lista geral.
- Atualizada versao WIP para `2026-07-16 18:14:55`.
