# Plano de Implementacao do xCRM

Criado em: 2026-06-12 17:13:16 -03:00  
Ultima modificacao: 2026-07-18 22:42:18 -03:00
Status: Proposta inicial para validacao e evolucao diaria

## 1. Objetivo

Construir um CRM SaaS multiempresa para equipes comerciais internas e externas, combinando a simplicidade de um CRM tradicional com recursos de CRM social e inteligencia artificial.

O xCRM deve permitir que cada empresa cliente do SaaS tenha seus proprios usuarios, vendedores, carteiras, empresas prospectadas, contatos, atividades, oportunidades, historico comercial e configuracoes, com isolamento seguro de dados entre empresas.

## 2. Fontes iniciais analisadas

### Arquivo `D:\OneDrive\Apps\xCRM.txt`

O texto-base define um CRM hibrido com:

- Separacao entre Empresa/Cliente e Contatos.
- Funil visual com movimentacao pratica entre estagios.
- Registro de data, hora e vendedor em cada mudanca de funil.
- Visao restrita por vendedor e visao geral para gestor.
- Agenda, tarefas e alertas.
- IA para voz, imagem/OCR e insights sociais.
- Historico unificado de e-mails, WhatsApp, Instagram e anotacoes.

### Arquivo `D:\OneDrive\Apps\xCRM\Prospecção Clientes. (1).xlsx`

A planilha contem abas `Dashboard`, `Resumo` e `Plano Master SC Unificado`.

Campos principais identificados na base:

- `EMPRESA`
- `CONTATO`
- `CIDADE`
- `E-mail`
- `FONE`
- `Endereço`
- `Presencial/Email/Telefone`
- `Principal Fornecedor`
- `Ação`
- `Próxima Visita`
- `Site do cliente`

Leitura inicial da planilha:

- O dashboard informa 359 registros.
- A leitura estrutural encontrou 379 linhas com algum conteudo, indicando que a importacao precisa ter etapa de limpeza e validacao.
- Ha muitos registros sem e-mail, telefone, canal, fornecedor e proxima visita, entao o CRM deve tratar cadastro incompleto como fluxo natural, nao como erro.
- A base ja sugere segmentos industriais, naval/yacht, cidades de Santa Catarina, fornecedores atuais e anotacoes comerciais relevantes.

## 3. Principios do produto

- Multiempresa desde o primeiro dia: nenhuma funcionalidade deve nascer sem `tenant_id`.
- Simples para o vendedor: registrar contato, proximo passo e mover funil deve exigir poucos cliques.
- Forte para o gestor: visao consolidada, distribuicao de leads, performance e pendencias.
- Historico como centro do CRM: tudo que aconteceu com um prospect deve aparecer em linha do tempo unica.
- IA como assistente fluido: capturar, resumir, sugerir e preencher, sem obrigar o vendedor a trabalhar de forma engessada.
- Importacao e saneamento de dados como recurso nativo: a planilha atual deve virar carga inicial e tambem referencia para importacoes futuras.

## 3.1. Importacao Temporaria Assistida

O fluxo de importacao de planilhas deve usar uma area temporaria antes de gravar dados definitivos.

Regras do primeiro corte:

- Somente Owner pode iniciar e operar importacoes.
- O caminho da pasta de origem fica em parametro local JSON.
- Uma empresa/tenant pode ter apenas uma carga temporaria ativa por vez.
- Nova carga so pode ser iniciada depois que o Owner descartar a carga atual.
- A planilha baguncada e transformada em linhas temporarias com dados brutos e dados organizados.
- A organizacao inicial deve tentar separar Empresa/Prospect, Contato Principal, Historico Realizado e Proxima Acao.
- O Owner revisa e corrige cada linha no ambiente temporario.
- O Owner pode importar uma linha por vez, sem obrigacao de concluir todas as linhas.
- A IA deve atuar como assistente de organizacao e sugestao, nunca como gravacao automatica nas tabelas definitivas.

## 4. Modelo SaaS multi tenant

### Conceito de tenant

Cada tenant representa uma empresa assinante do xCRM. Um tenant tem:

- Usuarios proprios.
- Vendedores e gestores.
- Funis configuraveis.
- Empresas, contatos, oportunidades e tarefas isoladas.
- Configuracoes de integracao e IA.
- Plano de assinatura, limites e preferencias.

### Niveis de permissao iniciais

- `owner`: responsavel pela empresa no SaaS, gerencia assinatura, usuarios e configuracoes.
- `admin`: administra dados, funis, usuarios e integracoes do tenant.
- `manager`: acompanha equipe, distribui leads e visualiza indicadores.
- `seller`: visualiza e atualiza sua propria carteira, tarefas e oportunidades.
- `assistant` ou `backoffice`: apoia cadastros, importacoes e enriquecimento de dados.

### Regra base de acesso

- Usuarios sempre pertencem a um tenant.
- Vendedores veem somente registros atribuidos a eles, salvo permissao explicita.
- Gestores veem registros da equipe ou do tenant conforme escopo.
- Owners/admins veem tudo dentro do tenant.
- Ninguem ve dados de outro tenant.

## 5. Arquitetura de banco de dados simplificada

Banco recomendado: PostgreSQL.

### Tabelas principais

#### `tenants`

Representa a empresa assinante do SaaS.

Campos sugeridos:

- `id`
- `name`
- `legal_name`
- `document`
- `status`
- `plan`
- `created_at`
- `updated_at`

#### `users`

Usuarios autenticados do sistema.

Campos sugeridos:

- `id`
- `tenant_id`
- `name`
- `email`
- `phone`
- `role`
- `status`
- `created_at`
- `updated_at`

#### `teams`

Agrupamento comercial opcional dentro de uma empresa.

Campos sugeridos:

- `id`
- `tenant_id`
- `name`
- `manager_user_id`
- `created_at`
- `updated_at`

#### `team_members`

Relacao entre usuarios e equipes.

Campos sugeridos:

- `id`
- `tenant_id`
- `team_id`
- `user_id`
- `created_at`

#### `accounts`

Empresas/clientes/prospects cadastrados no CRM.

Campos sugeridos:

- `id`
- `tenant_id`
- `owner_user_id`
- `name`
- `legal_name`
- `document`
- `segment`
- `city`
- `state`
- `address`
- `website`
- `main_supplier`
- `source`
- `status`
- `created_at`
- `updated_at`

#### `contacts`

Pessoas fisicas vinculadas a uma empresa.

Campos sugeridos:

- `id`
- `tenant_id`
- `account_id`
- `owner_user_id`
- `name`
- `title`
- `email`
- `phone`
- `whatsapp`
- `linkedin_url`
- `instagram_url`
- `notes`
- `created_at`
- `updated_at`

#### `pipelines`

Funis comerciais configuraveis por tenant.

Campos sugeridos:

- `id`
- `tenant_id`
- `name`
- `is_default`
- `created_at`
- `updated_at`

#### `pipeline_stages`

Etapas do Funil.

Campos sugeridos:

- `id`
- `tenant_id`
- `pipeline_id`
- `name`
- `position`
- `stage_type`
- `is_won`
- `is_lost`
- `created_at`
- `updated_at`

Etapas iniciais sugeridas:

- Visitantes
- Contatos
- Qualificacao
- Oportunidades
- Proposta
- Negociacao
- Clientes
- Perdidos

#### `opportunities`

Oportunidades comerciais associadas a empresas e contatos.

Campos sugeridos:

- `id`
- `tenant_id`
- `account_id`
- `contact_id`
- `owner_user_id`
- `pipeline_id`
- `stage_id`
- `title`
- `amount_estimated`
- `probability`
- `expected_close_date`
- `status`
- `created_at`
- `updated_at`

#### `stage_movements`

Auditoria de movimentacoes no funil.

Campos sugeridos:

- `id`
- `tenant_id`
- `opportunity_id`
- `from_stage_id`
- `to_stage_id`
- `changed_by_user_id`
- `changed_at`
- `note`

Regra obrigatoria:

- Toda mudanca de etapa deve registrar data, hora, vendedor/usuario e origem da acao.

#### `activities`

Tarefas, visitas, ligacoes, mensagens e follow-ups.

Campos sugeridos:

- `id`
- `tenant_id`
- `account_id`
- `contact_id`
- `opportunity_id`
- `owner_user_id`
- `type`
- `title`
- `description`
- `scheduled_at`
- `completed_at`
- `status`
- `priority`
- `created_at`
- `updated_at`

Tipos iniciais:

- Ligacao
- WhatsApp
- E-mail
- Visita presencial
- Reuniao
- Proposta
- Follow-up
- Tarefa interna

#### `interactions`

Linha do tempo de relacionamento.

Campos sugeridos:

- `id`
- `tenant_id`
- `account_id`
- `contact_id`
- `opportunity_id`
- `user_id`
- `channel`
- `direction`
- `summary`
- `body`
- `occurred_at`
- `external_id`
- `created_at`

Canais iniciais:

- Nota manual
- Telefone
- WhatsApp
- E-mail
- Instagram
- LinkedIn
- Visita
- IA/voz
- IA/imagem

#### `attachments`

Arquivos associados a contatos, empresas, atividades ou interacoes.

Campos sugeridos:

- `id`
- `tenant_id`
- `entity_type`
- `entity_id`
- `uploaded_by_user_id`
- `file_name`
- `mime_type`
- `storage_path`
- `created_at`

#### `ai_jobs`

Processamentos de IA assíncronos.

Campos sugeridos:

- `id`
- `tenant_id`
- `requested_by_user_id`
- `job_type`
- `status`
- `input_entity_type`
- `input_entity_id`
- `output_json`
- `error_message`
- `created_at`
- `completed_at`

Tipos iniciais:

- `voice_transcription`
- `visit_summary`
- `business_card_ocr`
- `image_context_report`
- `prospect_enrichment`
- `social_insight`

#### `imports`

Controle de importacoes, incluindo a planilha inicial.

Campos sugeridos:

- `id`
- `tenant_id`
- `uploaded_by_user_id`
- `file_name`
- `source_type`
- `status`
- `total_rows`
- `valid_rows`
- `invalid_rows`
- `created_at`
- `completed_at`

#### `import_rows`

Linhas importadas com status e erros.

Campos sugeridos:

- `id`
- `tenant_id`
- `import_id`
- `row_number`
- `raw_json`
- `normalized_json`
- `status`
- `error_message`
- `created_at`

### Observacao sobre isolamento

Todas as tabelas operacionais devem ter `tenant_id`. O backend deve validar o tenant em todas as queries. Quando possivel, usar Row Level Security no PostgreSQL para reforcar o isolamento.

## 6. Modulos funcionais

### Modulo do Vendedor

Funcionalidades:

- Dashboard pessoal com tarefas de hoje, atrasadas e proximas visitas.
- Lista de carteira: empresas, contatos e oportunidades atribuidas.
- Cadastro rapido de empresa e contato.
- Cadastro fluido a partir de imagem, cartao de visita ou anotacao de voz.
- Funil visual com drag-and-drop ou clique para mover oportunidade.
- Registro obrigatorio de historico ao concluir atividade importante.
- Linha do tempo do cliente com notas, ligacoes, e-mails, WhatsApp, visitas e IA.
- Agenda de follow-up.
- Alertas de atividades atrasadas.
- Busca por empresa, contato, cidade, telefone, e-mail e fornecedor atual.
- Modo mobile otimizado para visita externa.

### Modulo do Gestor

Funcionalidades:

- Dashboard geral do tenant.
- Funil consolidado por etapa, vendedor, equipe, cidade e origem.
- Distribuicao e redistribuicao de leads.
- Visao de atividades atrasadas por vendedor.
- Indicadores de cobertura regional.
- Ranking de conversao e produtividade.
- Relatorios de pipeline, visitas, contatos e oportunidades.
- Controle de importacoes e saneamento da base.
- Configuracao dos estagios do funil.
- Permissoes de usuarios e equipes.

### Modulo de IA

Funcionalidades:

- Audio de visita: transcrever, resumir, identificar proximos passos e criar atividade futura.
- Cartao de visita: extrair nome, cargo, telefone, e-mail, empresa e site.
- Imagem de fachada/documento: extrair informacoes e sugerir atualizacao do cadastro.
- Novo prospect por texto livre: transformar anotacao solta em empresa, contato, atividade e oportunidade.
- Resumo de relacionamento: gerar briefing antes da visita.
- Relatorio por comando natural: exemplo, "me mostre prospects de Palhoca sem proxima visita".
- Sugestao de abordagem: com base no historico, segmento, fornecedor atual e dores registradas.
- Deteccao de dados incompletos: sugerir campos faltantes relevantes.

### Modulo de CRM Social

Funcionalidades:

- Registro de canais sociais e mensageria em uma unica linha do tempo.
- Links de perfis publicos por contato e empresa.
- Campos para Instagram, LinkedIn, website e outras fontes.
- Integracao futura com WhatsApp Business API, e-mail e Instagram quando houver contas oficiais.
- Classificacao de sentimento e interesse apenas quando houver dados suficientes e permissao.

### Modulo de Importacao

Funcionalidades:

- Importar planilhas `.xlsx` e `.csv`.
- Mapear colunas para Empresa, Contato, Cidade, E-mail, Fone, Endereco, Canal, Fornecedor, Acao, Proxima Visita e Site.
- Normalizar telefones, e-mails, cidades e fornecedores.
- Identificar duplicidades por empresa, telefone, e-mail e site.
- Apresentar pre-visualizacao antes da importacao final.
- Gravar cada importacao em `imports` e `import_rows`.
- Gerar tarefas a partir de `Próxima Visita` e anotacoes de `Ação`.

## 7. UX inicial prevista

A fase de UX/design sera detalhada depois, mas o produto deve partir destas telas:

- Login e selecao de empresa, quando usuario tiver acesso a mais de um tenant.
- Home do vendedor.
- Home do gestor.
- Funil Kanban.
- Lista de empresas/prospects.
- Ficha da empresa.
- Ficha do contato.
- Linha do tempo.
- Agenda/tarefas.
- Importacao de planilha.
- Caixa de entrada IA: audios, imagens e sugestoes pendentes de revisao.
- Configuracoes do tenant.

Diretriz de design:

- Visual limpo, denso o suficiente para operacao comercial, sem cara de landing page.
- Mobile-first para vendedor externo.
- Desktop eficiente para gestor.
- Poucos cliques para registrar contato e proximo passo.

### Temas de cores

Decisao recomendada:

- Definir agora a arquitetura de temas.
- Implementar suporte a multiplos temas desde o inicio do design system.
- Adiar a lapidacao visual das paletas finais para a fase de UX/design.

Temas previstos:

- `Sistema`: segue a preferencia do dispositivo/navegador.
- `Claro`: interface clara fixa.
- `Escuro`: interface escura fixa.
- `Azul`: tema de destaque azul, adequado para uso corporativo tradicional.
- `Verde`: tema de destaque verde, adequado para leitura de funil, progresso e operacao comercial.

Motivo:

- O suporte a temas afeta tokens de design, componentes, preferencias do usuario e persistencia no banco/local storage, entao e melhor prever a estrutura agora.
- As cores finais devem ser refinadas depois com telas reais, para evitar decidir uma paleta sem validar densidade, contraste, tabelas, kanban, dashboards e mobile.
- A implementacao deve usar variaveis/tokens, nao classes espalhadas por tela, para permitir trocar tema sem reescrever componentes.

Regras iniciais:

- `Sistema`, `Claro` e `Escuro` devem entrar no MVP.
- `Azul` e `Verde` podem entrar como temas opcionais se o custo for baixo depois que os tokens estiverem prontos.
- Todos os temas precisam respeitar contraste, legibilidade e estados de foco/erro/sucesso.
- A preferencia local de tema deve ser salva por usuário e tenant, sem vazar entre organizações ou ser confundida com configuração visual corporativa.
- O Login deve usar o tema `Sistema` enquanto não houver contexto autenticado de usuário e tenant.
- A Administração da Plataforma deve usar o tema `Sistema` enquanto não houver um seletor próprio para esse contexto.

## 8. Stack tecnologica sugerida

### Web

- Next.js com TypeScript.
- React Server Components onde fizer sentido.
- Tailwind CSS para UI.
- shadcn/ui ou componentes equivalentes para base visual consistente.
- TanStack Query para estado remoto, se a arquitetura nao for 100% server actions.
- Zod para validacao.

### Mobile

Decisao para o MVP:

- PWA responsiva.

Motivo:

- A PWA acelera a entrega, reduz custo de desenvolvimento, permite uso em desktop e mobile com a mesma base de codigo e facilita a validacao do produto.
- App nativo sera reavaliado em fase posterior se houver necessidade de recursos avancados do dispositivo, publicacao em lojas, notificacoes mais robustas, uso offline intensivo ou melhor experiencia mobile.

### Backend

Opcoes simples e modernas:

- Next.js API/Server Actions para MVP.
- NestJS ou Fastify se o backend crescer como servico independente.

Recomendacao inicial:

- Next.js full-stack enquanto o dominio ainda esta em descoberta.
- Separar camadas de dominio, repositorios e servicos para facilitar migracao futura.

### Banco de dados

- Supabase com PostgreSQL.
- Prisma como ORM.
- Row Level Security no Supabase/PostgreSQL.
- Migrations versionadas.

Justificativa do Prisma:

- O Prisma sera utilizado como camada de acesso ao banco de dados por oferecer boa produtividade, tipagem forte com TypeScript, integracao madura com Next.js e facilidade de manutencao.
- A escolha favorece clareza, padronizacao e desenvolvimento assistido por IA, sendo adequada para um projeto CRUD/administrativo em fase inicial.

### Autenticacao

- Supabase Auth.

Motivo:

- A aplicacao utilizara Supabase Auth por sua integracao nativa com o banco PostgreSQL do Supabase, suporte a autenticacao por e-mail/senha e provedores sociais, controle de sessao, compatibilidade com politicas de seguranca via Row Level Security e menor complexidade arquitetural no inicio do projeto.

Alternativas avaliadas:

- Clerk: excelente para autenticacao pronta e interfaces modernas, mas adiciona dependencia externa e possivel custo adicional.
- Auth.js: solucao open-source flexivel, porem exige maior configuracao e manutencao.

### Arquivos e midia

- Supabase Storage, S3 ou compatível S3.
- Separacao por tenant no caminho do arquivo.
- Metadados sempre gravados na tabela `attachments`.

### IA

- IA assistiva simples e contextual no MVP.
- OpenAI para interpretacao de linguagem natural, resumo, busca inteligente, sugestao de categorias, OCR/visao e extracao estruturada conforme a fase.
- Processamento assíncrono via fila.
- Prompt templates versionados.
- Saidas estruturadas em JSON, sempre revisadas antes de alterar dados criticos.

Escopo inicial de IA no MVP:

- Cadastro assistido por linguagem natural.
- Busca textual inteligente.
- Sugestao de categoria e localizacao.
- Resumo simples dos registros.
- Respostas baseadas apenas nos dados autorizados do usuario.

Limitacoes do MVP:

- A IA nao executara acoes criticas sem confirmacao do usuario.
- A IA nao fara alteracoes automaticas em massa.
- A IA nao atuara como agente autonomo no MVP.
- A IA nao substituira regras de negocio do sistema.
- Toda acao sugerida pela IA devera ser revisavel pelo usuario.

Justificativa:

- Esse nivel de IA entrega valor perceptivel ao usuario sem aumentar excessivamente a complexidade tecnica, o custo de desenvolvimento ou o risco operacional do MVP.

### Filas e jobs

- Inngest, Trigger.dev, BullMQ ou fila gerenciada.
- Usar jobs para OCR, transcricao, importacoes grandes e relatorios.

### Observabilidade

- Logs estruturados.
- Auditoria de acoes comerciais sensiveis.
- Sentry para erros.
- Metricas basicas de jobs e integracoes.

## 9. Fases de implementacao

### Fase 0 - Preparacao do projeto

Objetivo:

- Registrar stack final e preparar o projeto base.
- Inicializar repositório Git, se ainda nao existir.
- Configurar GitHub e Issues.
- Criar convencoes de docs, diario e SQL.
- Preparar ambiente local.

Entregaveis:

- Projeto base criado.
- Pasta `Docs` mantida.
- `Diário_do_Projeto.md` atualizado diariamente.
- Arquivo unico de SQL criado e mantido.
- Issue inicial de planejamento criada no GitHub quando houver repositorio.

### Fase 1 - Fundacao multi tenant

Objetivo:

- Criar tenants, usuarios, papeis e isolamento de dados.

Entregaveis:

- Autenticacao.
- CRUD de usuarios.
- Vinculo usuario-tenant.
- Permissoes basicas.
- Testes de isolamento.

### Fase 2 - CRM base

Objetivo:

- Criar empresas, contatos, oportunidades, funis e atividades.

Entregaveis:

- Cadastro de empresas.
- Cadastro de contatos.
- Funil inicial.
- Movimentacao de etapa com auditoria.
- Agenda de follow-up.
- Linha do tempo manual.

### Fase 3 - Importacao da planilha

Objetivo:

- Transformar a planilha inicial em dados estruturados.

Entregaveis:

- Importador `.xlsx`.
- Mapeamento de colunas.
- Tela de pre-validacao.
- Normalizacao de dados.
- Relatorio de linhas validas, invalidas e duplicadas.
- Criacao de empresas, contatos, interacoes e atividades.

### Fase 4 - Modulo do vendedor

Objetivo:

- Otimizar rotina de campo e contato.

Entregaveis:

- Home do vendedor.
- Tarefas de hoje e atrasadas.
- Registro rapido de visita/ligacao.
- Ficha simples da empresa.
- Funil pessoal.
- PWA responsiva.

### Fase 5 - Modulo do gestor

Objetivo:

- Acompanhar carteira, funil e produtividade.

Entregaveis:

- Dashboard geral.
- Distribuicao de leads.
- Indicadores por vendedor/cidade/etapa.
- Relatorios basicos.
- Exportacao de dados.

### Fase 6 - IA fluida

Objetivo:

- Reduzir digitação e aumentar qualidade do historico.

Entregaveis:

- Audio para transcricao e resumo.
- Imagem/cartao de visita para OCR.
- Criacao de prospect por texto livre.
- Sugestao de proximo passo.
- Revisao humana antes de gravar dados extraidos.

### Fase 7 - CRM Social e integracoes

Objetivo:

- Consolidar canais e melhorar contexto comercial.

Entregaveis:

- Campos sociais.
- Linha do tempo por canal.
- Integracao com e-mail/WhatsApp quando contas oficiais estiverem disponiveis.
- Insights sociais com limites de privacidade e fonte.

## 10. MVP recomendado

O MVP deve validar o fluxo comercial completo antes de aprofundar automacoes.

Inclui:

- Login.
- Multiempresa.
- Usuarios com papeis.
- Empresas.
- Contatos.
- Oportunidades.
- Funil visual.
- Atividades/follow-ups.
- Linha do tempo manual.
- Importacao da planilha inicial.
- Dashboard simples do gestor.
- Home simples do vendedor.

Fica para depois do MVP:

- WhatsApp Business API.
- Instagram integrado.
- App nativo.
- Relatorios avancados.
- Automacoes comerciais complexas.

IA minima no MVP, se desejado:

- OCR de cartao de visita.
- Resumo de anotacao livre.
- Criacao assistida de prospect.

## 11. Decisoes registradas e pendencias

### Decisoes registradas em 2026-06-12

- Stack final: Supabase com PostgreSQL.
- ORM: Prisma.
- Autenticacao: Supabase Auth.
- Primeiro alvo mobile: PWA.
- Nivel inicial de IA no MVP: IA assistiva simples e contextual.
- Arquitetura de temas: prever `Sistema`, `Claro`, `Escuro`, `Azul` e `Verde`, com `Sistema`, `Claro` e `Escuro` como prioridade do MVP.

### Modelo comercial do SaaS

O modelo comercial deve considerar planos, limites por usuarios, limites de IA e armazenamento.

Diretriz inicial:

- Plano inicial ou teste: limite reduzido de usuarios, empresas cadastradas, armazenamento e chamadas de IA.
- Plano equipe: mais usuarios, importacoes maiores, funis configuraveis e relatorios de gestor.
- Plano profissional: limites maiores de IA, armazenamento, integracoes e automacoes.
- Plano empresarial: limites customizados, suporte prioritario, politicas avancadas e possiveis recursos dedicados.

Limites a parametrizar por tenant:

- Quantidade de usuarios ativos.
- Quantidade de vendedores.
- Quantidade de empresas/prospects.
- Quantidade de contatos.
- Volume de armazenamento.
- Quantidade de importacoes por periodo.
- Quantidade de requisicoes de IA por periodo.
- Recursos habilitados por plano.

### Administração da plataforma

O SaaS passa a prever um perfil global `Platform Admin`, separado dos usuários do tenant. Esse perfil gerencia clientes xCRM, pode suspender ou reativar tenants e acompanha mensagens internas da plataforma.

Diretriz inicial:

- Tenant suspenso mantém dados preservados, mas bloqueia o acesso operacional.
- Owner de tenant suspenso recebe orientação para contato com SAC da plataforma.
- Usuários operacionais de tenant suspenso devem procurar a gerência da própria empresa.
- Notificações da plataforma começam com eventos de suspensão e login em tenant suspenso, mas a estrutura deve ser reaproveitada futuramente para avisos a vendedores, líderes e owners.

Pendencias:

- Definir nomes comerciais dos planos.
- Definir limites numericos de usuarios, IA e armazenamento.
- Definir politica de excedentes.
- Definir política comercial e operacional para suspensão, reativação e comunicação com clientes.
- Definir estrutura de GitHub Issues quando o repositorio for inicializado.

### Produtos e Propostas

A issue `#101` foi promovida para P1 em 2026-07-17 e iniciou o módulo comercial de Propostas vinculado às Oportunidades.

Primeiro corte implementado:

- Catálogo simples de Produtos/Serviços por tenant.
- Cadastro restrito a Owner/Admin.
- Proposta criada a partir de uma Oportunidade.
- Itens de catálogo ou itens avulsos.
- Snapshot dos itens para preservar preço, unidade e descrição enviados.
- Numeração sequencial por tenant.
- Status inicial `Rascunho` e publicação para `Pronta`.
- PDF inicial gerado sob demanda.
- Registro no Histórico Comercial ao criar e publicar.

Fases futuras:

- Versionamento avançado com substituição controlada de Propostas.
- Storage privado do PDF publicado.
- Envio por e-mail transacional.
- Registro de aceite/recusa pelo cliente.
- Integração com WhatsApp Business Platform somente após validar opt-in, operação por tenant e responsabilidade de envio.

### Continuidade Operacional do Banco

A issue `#55` foi iniciada em 2026-07-18 para reduzir o risco acumulado pelo crescimento do schema.

Primeiro corte:

- Inventário canônico das 16 migrations SQL.
- Verificação automatizada por `npm run db:migrations:verify`.
- Seed neutro e versionado para o Supabase CLI.
- Roteiro em `Docs/Roteiro_Recriacao_Banco.md`.

Antes do encerramento, ainda é obrigatório consolidar o histórico reconhecido pelo Supabase CLI e validar a reconstrução completa em projeto descartável.

### Convites e SMTP

A issue `#36` recebeu estudo técnico em `Docs/Estudo_SMTP_Convites.md`.

Direção recomendada para avaliação:

- Supabase Auth para identidade e ciclo de senha.
- Resend como Custom SMTP inicial.
- Estado de convite persistido por tenant.
- Reenvio, cancelamento e auditoria no xCRM.
- API do provedor reservada para futuros e-mails comerciais, mantendo Auth separado de campanhas.

### Confiança ao Concluir Atividades

A issue `#75` foi iniciada em 2026-07-19 para padronizar a conclusão de atividades nas superfícies operacionais.

Primeiro corte implementado:

- Conclusão imediata, sem modal de confirmação para uma ação frequente.
- Feedback contextual com identificação da atividade.
- Ação `Desfazer` disponível por 5 minutos.
- Validação de tenant, escopo, status e prazo no servidor.
- Histórico de conclusão e reabertura.
- Comportamento compartilhado entre Dashboard Anterior, Agenda e Empresa/Prospect.

### Acessibilidade do Menu Superior

A issue `#77` implementa gerenciamento explícito de foco no menu compartilhado:

- foco inicial no tema ativo ao abrir;
- retorno ao botão disparador ao fechar com `Esc`;
- rótulo acessível coerente com o estado aberto ou fechado;
- preservação do foco do usuário ao fechar por clique externo.

### Legibilidade Mobile do Dashboard

A issue `#78` consolida o padrão responsivo após o redesenho da #99:

- metadados operacionais usam pelo menos 14px no mobile;
- elementos estritamente auxiliares podem permanecer em 12px;
- o cartão de identidade aumenta e-mail/papel no mobile e preserva a densidade no desktop;
- a validação cobre 320px, 390px, 1037px e 1440px sem overflow horizontal.

## 12. Proximos passos sugeridos

1. Inicializar repositorio Git/GitHub, se ainda nao existir.
2. Criar issues epicas: Fundacao SaaS, CRM Base, Importacao, Vendedor, Gestor, IA.
3. Detalhar UX e design das telas principais.
4. Criar diagrama ERD inicial.
5. Definir primeira migration SQL para Supabase/PostgreSQL com Prisma.
6. Implementar fundacao multi tenant.
