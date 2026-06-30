# Manual do Usuario do xCRM

Criado em: 2026-06-12 20:13:05 -03:00  
Ultima modificacao: 2026-06-30 20:18:27 -03:00
Status: Manual vivo, atualizado conforme as telas e fluxos forem implementados

## Regra de manutencao

Este manual deve ser atualizado a cada mudanca que afete o uso do sistema.

Atualizar quando houver mudancas em:

- Telas.
- Menus.
- Botoes.
- Formularios.
- Campos.
- Permissoes.
- Fluxos de vendedor.
- Fluxos de gestor.
- Importacao de dados.
- IA assistiva.
- Relatorios.
- Temas e preferencias.

## O que e o xCRM

O xCRM e um sistema de CRM SaaS multiempresa para organizar empresas/prospects, contatos, oportunidades, tarefas, historico comercial e atividades da equipe de vendas.

## Perfis previstos

- Owner: responsavel principal pela empresa no sistema.
- Admin: administra usuarios, configuracoes e dados do tenant.
- Gestor: acompanha equipe, funil e distribuicao de leads.
- Vendedor: gerencia sua carteira, contatos, tarefas e oportunidades.
- Assistente/backoffice: apoia cadastro, importacoes e organizacao de dados.

## Tela inicial atual

A tela inicial do app apresenta uma visao operacional de fundacao com:

- Metricas iniciais da base de prospeccao.
- Funil previsto.
- Lista de proximas fundacoes tecnicas.
- Botao para acessar as Issues do GitHub.
- Seletor de temas.

Esta tela ainda nao representa o dashboard final do produto; ela serve como base inicial para validar layout, densidade visual e temas.

## Temas de cores

O usuario podera escolher entre:

- Sistema: segue a preferencia do dispositivo ou navegador.
- Claro: mantem a interface clara.
- Escuro: mantem a interface escura.
- Azul: tema corporativo azul.
- Verde: tema comercial/operacional verde.

No MVP, a prioridade e garantir:

- Sistema.
- Claro.
- Escuro.

## Feedback Visual dos Botoes

Os botoes e links com aparência de botao respondem visualmente ao mouse e ao clique:

- Ao passar o mouse, a borda e a sombra ficam mais evidentes.
- Ao clicar, o botao afunda levemente para indicar a pressao.
- No tema escuro, botoes principais usam azul mais contido, com borda e texto destacados.
- Quando um botao esta desabilitado, ele permanece sem resposta de clique.

## Campos de Entrada

Os campos de texto, selecao e areas de texto acompanham o tema escolhido:

- No tema claro, os campos permanecem claros para leitura rapida.
- No tema escuro, os campos usam fundo escuro com borda visivel, evitando blocos brancos fora do padrao visual.
- Campos preenchidos automaticamente pelo navegador seguem a mesma regra visual do tema.

## Login e Primeiro Acesso

O login inicial ja esta disponivel em `/login`.

Na tela de login, o usuario pode:

- Alternar entre as abas `Entrar` e `Criar Acesso`.
- Entrar com e-mail e senha na aba `Entrar`.
- Criar um novo acesso com nome, e-mail e senha na aba `Criar Acesso`.
- Mostrar ou ocultar o conteudo do campo de senha.

A aba selecionada recebe destaque visual com indicador na borda inferior.

Quando nao ha mensagem de erro ou aviso, o painel superior da area de acesso mostra textos rotativos sobre o xCRM. Os textos mudam automaticamente a cada 30 segundos. Quando existe erro ou aviso, o painel mostra a mensagem do sistema.

Depois de entrar com e-mail e senha validos, o sistema deve redirecionar automaticamente conforme o perfil e o estado da conta:

- `/dashboard`, quando o usuario pertence a um tenant ativo.
- `/onboarding`, quando o usuario autenticado ainda precisa criar a primeira empresa.
- `/platform`, quando o usuario e `Platform Admin`.
- `/tenant-suspended`, quando o tenant esta suspenso.

Se o usuario retornar para `/login` apos autenticar, o ambiente deve ser revisado antes de novos testes.

Os botoes principais das abas `Entrar` e `Criar Acesso` ficam alinhados no rodape da area do formulario.

A aba `Criar Acesso` mantem respiro visual entre o campo de senha e o botao principal.

Se o e-mail informado em `Criar Acesso` ja existir no app, o sistema orienta o usuario a entrar com sua senha.

Se o e-mail ainda nao estiver confirmado no Supabase Auth, o sistema informa que e necessario verificar a caixa de entrada e spam antes de entrar.

Se o servico de autenticacao atingir limite de envio de e-mails, o sistema orienta aguardar alguns minutos antes de tentar novamente.

Regra atual de senha:

- Minimo de 8 caracteres.
- Neste momento de desenvolvimento, o sistema ainda nao exige senha forte.
- Recuperacao de senha por e-mail sera implementada posteriormente.

Se o servico de autenticacao nao puder ser acessado, o sistema exibira uma mensagem amigavel pedindo para tentar novamente.

Depois de criar o acesso:

- Se o projeto exigir confirmacao de e-mail, o usuario deve confirmar o e-mail antes de entrar.
- Se a sessao ja estiver ativa, o usuario sera levado para o onboarding.
- Depois do login, se o usuario ainda nao tiver empresa vinculada, o sistema deve abrir o onboarding da empresa.

## Onboarding da empresa

O onboarding esta disponivel em `/onboarding` para usuarios autenticados que ainda nao tem empresa vinculada.

No topo do formulario, a tela mostra discretamente a sessao atual com o nome e/ou e-mail do usuario autenticado.

Nesta tela, o usuario informa:

- Nome da Empresa.
- Nome do Usuario Owner.

Ao confirmar, o sistema cria:

- A empresa/tenant.
- O usuario owner.
- O Funil Comercial Padrao.
- As etapas iniciais do funil.
- Uma primeira tarefa interna.

Depois disso, o usuario vai para `/dashboard`.

## Dashboard Inicial

O dashboard inicial esta disponivel em `/dashboard`.

Ele mostra:

- Nome da Empresa atual.
- Nome, e-mail e perfil do usuario logado.
- Metricas reais do tenant.
- Etapas do Funil Padrao.
- Proximas Acoes sugeridas.
- Botao de Sair.
- Seletor de temas.

No cabecalho do dashboard, o bloco do usuario logado, o seletor de temas e o botao de sair usam a mesma altura visual.

O dashboard concentra o acesso a cadastros e configurações no menu superior.

O menu superior concentra Configurações e Preferências. Todos
os perfis podem alterar o tema por esse menu. Para usuarios Owner/Admin, o menu
tambem mostra `Configurações da Empresa`, `Cadastro Prospects/Clientes` e
`Equipes e Usuários`.

## Configurações da Empresa

A tela `/settings/company` permite que Owner/Admin atualize os dados
institucionais do tenant:

- Nome da Empresa.
- Razão Social.
- CNPJ.
- Segmento.
- Plano.

Nome da Empresa e Razão Social são digitados e salvos em maiúsculas. O CNPJ usa
máscara visual e é salvo sem pontuação, mantendo apenas letras e números.

As alterações registram uma linha de auditoria como `Empresa Atualizada`.

## Equipes e Usuários

A tela `/settings/team` fica disponível no menu de engrenagem para Owner/Admin.

Ela permite:

- Ver o resumo das Equipes em largura total, com Líder, Usuários vinculados e status.
- Usar a aba `Cadastro de Usuários` para criar Usuários ativos ou inativos, selecionar um Usuário existente na lista e carregar seus dados no formulário para edição.
- Usar a aba `Cadastro de Equipes` para criar Equipes ativas ou inativas, selecionar uma Equipe existente na lista e carregar seus dados no formulário para edição.
- Usar a aba `Líder da Equipe` para selecionar uma Equipe ativa na lista e definir, trocar ou remover o Líder no formulário.
- Usar a aba `Usuários da Equipe` para vincular ou remover Usuários de uma Equipe ativa.

Perfis usados neste corte:

- Líder: acompanha a própria carteira e a carteira dos membros das equipes que lidera.
- Vendedor: acompanha a própria carteira, ações e oportunidades.

Importante:

- Neste primeiro corte, o botão `Pré-cadastrar Usuário` ainda não envia e-mail automaticamente.
- O campo `Status` define se o usuário fica `Ativo` ou `Inativo`.
- Ao selecionar um Usuário na lista, o botão do formulário muda de `Criar Usuário` para `Salvar Usuário`.
- Ao selecionar uma Equipe na lista, o botão do formulário muda de `Criar Equipe` para `Salvar Equipe`.
- Na aba `Líder da Equipe`, o botão `Salvar Líder` fica indisponível até que uma Equipe seja selecionada.
- O bloco `Log de Equipes e Usuários` inicia recolhido e pode ser aberto para consultar as alterações administrativas recentes registradas no sistema.
- O convite real por e-mail e o aceite pelo usuário serão ativados em um próximo corte do fluxo.
- Uma Equipe só pode ser tornada `Inativa` quando não possui Usuários ativos vinculados e não possui Líder ativo.
- Owner/Admin continuam vendo toda a base do tenant.
- Líder passa a ver a própria carteira e a carteira dos usuários vinculados às equipes que lidera.
- Vendedor continua vendo apenas a própria carteira.

## Empresas/Prospects

A tela `/accounts` permite cadastrar a Base Comercial inicial do tenant.

No cabecalho, a tela mostra discretamente o usuario logado, e-mail e perfil atual.

Campos disponiveis para empresa/prospect:

- Empresa/Prospect.
- Cidade.
- UF, escolhida em uma lista fechada de siglas brasileiras.
- Site, sem obrigatoriedade de informar `https://` no cadastro inicial.
- Fornecedor/Atividade/Marca.
- Origem.

Tambem e possivel informar um Contato Principal opcional com:

- Nome.
- E-mail.
- Telefone, limitado a 15 caracteres.

Tambem e possivel informar uma Proxima Acao opcional, com:

- Acao.
- Data e Hora.

Quando a Empresa/Prospect e cadastrada, o sistema grava automaticamente um Historico de criacao. Se um contato for informado, ele nasce como Contato Principal. Se a Proxima Acao for informada, ela fica registrada como atividade pendente.

A tela lista a Base Comercial disponivel para o usuario e mostra o Contato Principal quando existir.

Na base comercial, o usuario pode:

- Buscar por empresa/prospect, cidade, UF, site, fornecedor principal, origem ou contato.
- Filtrar por status: todos, prospects, clientes, perdidos e arquivados.
- Limpar filtros para voltar a lista geral.
- Ver o Ultimo Historico registrado.
- Ver a Proxima Acao pendente quando houver.
- Abrir o detalhe de uma Empresa/Prospect pelo nome do registro.

Na tela de detalhe da Empresa/Prospect, o usuario pode:

- Voltar para a lista pela faixa de navegação abaixo do cabeçalho, usando `Voltar para Empresas/Prospects`.
- Ver mensagens de sucesso, aviso ou erro na mesma faixa, alinhadas à direita em telas maiores.
- Ver Dados Basicos.
- Editar Nome Fantasia/Empresa, Dados do Cliente, cidade, UF, site, Fornecedor/Atividade/Marca, origem e Observacao Comercial.
- Preencher Razão Social em maiúsculas.
- Preencher CNPJ alfanumérico com máscara visual no padrão `AA.AAA.AAA/AAAA-00`; o sistema salva internamente apenas letras maiúsculas e números.
- Abrir ou recolher o bloco `Dados do Cliente`, que fica recolhido por padrão para preservar foco do vendedor.
- Preencher CEP, Endereço, Número, Complemento e Bairro.
- Buscar endereço pelo CEP usando o botão `Buscar`; quando encontrado, o sistema preenche Endereço, Bairro, Cidade e UF.
- Ver Contato Principal.
- Ver Contatos cadastrados.
- Abrir e recolher contatos adicionais quando houver mais de um contato cadastrado.
- Criar Novo Contato com Nome, Função/Cargo, E-mail e Telefone.
- Salvar Alterações de dados básicos ou de um contato existente apenas depois de modificar alguma informação.
- Tornar outro contato o Contato Principal.
- Excluir contatos que não estejam marcados como Contato Principal.
- Identificar o Contato Principal pela faixa de ações do próprio contato.
- Ver Oportunidades registradas para a Empresa/Prospect.
- Criar uma Nova Oportunidade com Título, Contato opcional, Etapa, Valor Estimado e Previsão de Fechamento.
- O campo Valor Estimado da Nova Oportunidade formata o valor em Real ao sair do campo ou enviar, por exemplo `1000000` vira `R$ 1.000.000,00`.
- Mover uma Oportunidade para outra Etapa do Funil.
- Ver o ultimo registro do Historico em formato compacto e expandir os demais registros quando necessario.
- Ver Proximas Acoes pendentes.
- Criar uma Nova Acao pendente com descricao e Data e Hora opcionais.
- Editar descricao, Data e Hora de uma Acao Pendente antes de concluir ou excluir.
- Os minutos em Data e Hora de Ações ficam restritos a `00`, `15`, `30` e `45`.
- Concluir uma Acao pendente para move-la para Acoes Concluidas.
- Excluir uma Acao Pendente criada por engano.
- Ver a última Ação Concluída em formato compacto e expandir as demais quando necessário.

## Etapas da Oportunidade e Status da Empresa/Prospect

A Etapa da Oportunidade indica onde uma venda específica está no Funil. O Status da Empresa/Prospect indica a situação geral do cadastro na Base Comercial.

No comportamento atual, mover uma Oportunidade altera o status da própria Oportunidade e pode alterar automaticamente o Status da Empresa/Prospect.

Etapas atuais do Funil:

- Visitantes: registro inicial ou primeiro sinal de interesse, ainda sem oportunidade comercial clara.
- Contatos: já existe contato identificado ou tentativa real de abordagem.
- Qualificação: etapa para validar necessidade, perfil, aderência e chance real de negócio.
- Oportunidades: existe dor, interesse ou chance comercial mais clara.
- Proposta: proposta, orçamento ou condição comercial em preparação ou enviada.
- Negociação: etapa de ajustes de preço, prazo, escopo, condição ou decisão final.
- Clientes: etapa de ganho; ao mover para esta etapa, a Oportunidade fica como Ganha.
- Perdidos: etapa de perda; ao mover para esta etapa, a Oportunidade fica como Perdida.

Impacto atual:

- Etapas de Visitantes até Negociação mantêm a Oportunidade como Aberta.
- A etapa Clientes muda a Oportunidade para Ganha.
- A etapa Perdidos muda a Oportunidade para Perdida.
- A movimentação da Oportunidade registra uma linha no Histórico da Empresa/Prospect.
- Se existir pelo menos uma Oportunidade Ganha, a Empresa/Prospect passa automaticamente para Cliente.
- Se não houver Oportunidade Ganha ou Aberta, mas houver Oportunidade Perdida, a Empresa/Prospect passa automaticamente para Perdido.
- Se ainda houver Oportunidade Aberta e nenhuma Oportunidade Ganha, a Empresa/Prospect fica como Prospect.
- Empresas/Prospects Arquivados não têm o Status alterado automaticamente por movimentação de Oportunidade.

Registro no Histórico:

- Toda alteração automática de Status registra uma linha no Histórico como `Status Alterado`.

Regras atuais de visibilidade:

- Owner/Admin veem toda a base comercial do tenant.
- Líder vê a própria carteira e a carteira dos usuários vinculados às equipes que lidera.
- Vendedor e demais perfis operacionais veem apenas registros sob sua responsabilidade.

## Platform Admin e Suspensão de Acesso

O `Platform Admin` é o perfil administrativo da plataforma xCRM. Ele não atua dentro da carteira comercial de uma empresa; sua função é acompanhar clientes xCRM e controlar o acesso do tenant quando necessário.

Na tela `/platform`, o `Platform Admin` pode:

- Ver os clientes xCRM cadastrados.
- Ver resumo de tenants totais, ativos e suspensos.
- Ver contadores de usuários, prospects e contatos por tenant.
- Suspender um tenant informando um motivo.
- Reativar um tenant suspenso.
- Ver mensagens da plataforma, incluindo tentativas de login em tenant suspenso.
- Marcar mensagens como lidas.

Quando um tenant está suspenso:

- O Owner consegue entrar, mas vê uma mensagem de bloqueio com os canais do SAC da plataforma.
- Os canais exibidos são `(47) 99922-8490` e `ScientiamConsultoria@outlook.com`.
- Usuários que não são Owner recebem orientação para procurar a gerência ou o responsável pela empresa.
- O acesso ao Dashboard, Base Comercial e Configurações fica bloqueado enquanto o tenant permanecer suspenso.
- Cada login em tenant suspenso gera uma mensagem para o `Platform Admin`.

## Importação Temporária de Dados

A tela `/imports` permite ao Owner carregar uma planilha da pasta parametrizada do sistema para um ambiente temporario antes de gravar dados na base definitiva.

Regras atuais:

- Somente Owner acessa a tela e executa importacao.
- O menu superior mostra `Importação de Dados` apenas para Owner.
- O caminho inicial da pasta de planilhas fica em `config/import-settings.json`.
- Enquanto existir uma carga temporaria ativa, o sistema nao permite iniciar outra.
- O Owner pode descartar a carga temporaria atual para liberar uma nova importacao.
- A planilha carregada vira linhas temporarias com dados originais e uma sugestao organizada.
- A pasta de origem aparece no topo da tela; os indicadores mostram a carga ativa, linhas temporarias, pendentes e concluidas/rejeitadas.
- Cada linha pode ser revisada, corrigida, salva, aprovada, rejeitada ou importada individualmente.
- Depois de revisar várias linhas, o Owner pode usar `Importar Aprovadas` para enviar todas as linhas aprovadas para a Base Comercial em uma única operação.
- Antes de importar as aprovadas, o Owner pode escolher uma equipe ativa; os prospects importados ficam sob responsabilidade do líder dessa equipe.
- Quando prospects são encaminhados para uma equipe, o líder recebe uma notificação interna e vê um badge vermelho de pendências próximo ao próprio nome no topo das telas principais.
- Ao selecionar uma linha na lista esquerda, o formulario de revisao da direita atualiza os campos da linha escolhida.
- O formulario de revisao usa blocos compactos para Empresa/Prospect, Contato Principal e Acoes/Observacoes.
- O campo CNPJ usa mascara no formato `AA.AAA.AAA/AAAA-00`.
- A revisao aparece como uma bancada de triagem: resumo da carga no topo, fila de linhas a esquerda e ficha de correcao a direita.
- A fila de linhas pode ser filtrada pelo icone de filtro no topo do card da carga: Todas, Em Revisão, Aprovadas, Importadas, Rejeitadas e Falharam.
- Ao selecionar uma linha dentro de um filtro, o sistema mantem o mesmo filtro ativo.
- Quando um filtro nao possui linhas, a lista mostra que nao ha linhas para aquele status.
- Durante a troca de filtro, o icone indica processamento ate a tela atualizar.
- Em acoes que podem demorar, como login, navegacao, selecao de linhas e envio de formularios, o ponteiro do mouse muda para processamento ate o app liberar a tela.
- Os dados originais da planilha ficam recolhidos em `Dados Originais da Planilha`.
- Os botoes `Salvar Revisão`, `Aprovar Linha`, `Importar Linha` e `Rejeitar Linha` ficam no rodape da ficha da linha, alinhados a esquerda.
- Em linhas ja importadas para a base definitiva, esses botoes ficam desabilitados.
- A ausencia de próxima ação não gera aviso superior; o Owner confere esse ponto diretamente no bloco `Ações e Observações`.
- Quando a Razão Social vier vazia da planilha, o campo inicia preenchido com o mesmo valor de Nome Fantasia/Empresa.
- Ao rejeitar ou importar uma linha, o sistema abre automaticamente a proxima linha pendente/aprovada.
- Ao escolher `Descartar Carga`, o sistema mostra uma confirmacao antes de descartar.
- Nao e necessario importar todas as linhas da carga.
- A importacao definitiva de uma linha pode criar Empresa/Prospect, Contato Principal, Historico Realizado e Proxima Acao.
- Empresas/Prospects criados pela importacao definitiva recebem `Origem` como `Importado`.
- A sugestao automatica apenas organiza os dados; a decisao final e sempre do Owner.

Observacoes de uso:

- A Observacao Comercial fica disponivel na tela de detalhe da Empresa/Prospect.
- Apenas um contato pode ficar marcado como Contato Principal por Empresa/Prospect.
- O Contato Principal não pode ser excluído antes de escolher outro contato como principal.
- O último contato restante de uma Empresa/Prospect não pode ser excluído.
- O texto `Ultimo Historico` mostra o ultimo evento de auditoria do cadastro, como `Dados Atualizados` ou `Prospect Criado`; ele nao representa um status como incompleto ou nao atualizado.
- A criacao, alteracao e troca de Contato Principal registram automaticamente uma linha no Historico.
- A criacao, edicao, conclusao e exclusao de acoes no detalhe registram automaticamente uma linha no Historico.
- A edicao de Acao Pendente registra `Ação Atualizada` no Historico.
- A exclusao de Acao Pendente remove a atividade da lista operacional e registra `Ação Excluída` no Historico.
- A criacao e a movimentacao de oportunidades no detalhe registram automaticamente uma linha no Historico.
- Nome Fantasia/Empresa e Razão Social são digitados e salvos em maiúsculas.
- O CNPJ aceita letras e números, força maiúsculas, exige 14 posições e mantém os 2 últimos caracteres como números.
- A busca por CEP usa o ViaCEP como apoio; se o serviço não responder ou o CEP não existir, o preenchimento manual continua disponível.
- Campos de Data e Data e Hora destacam discretamente o ícone de calendário.
- Campos de Data e Hora vazios iniciam com a data atual às `09:00` quando o usuário entra no campo.
- Campos de Data e Hora usam intervalos de 15 minutos, mantendo os minutos em `00`, `15`, `30` ou `45`.
- Endereco do prospect nao e obrigatorio neste momento do MVP.

## Versao exibida no topo

Durante o WIP, o sistema mostra no topo da tela uma versao no formato:

```text
Versao: AAAA-MM-DD hh:mm:ss
```

Essa informacao ajuda a confirmar qual pacote de mudancas esta sendo testado.

Versao atual:

- `2026-06-15 21:38:13`
- `2026-06-16 19:31:38`
- `2026-06-18 19:22:16`
- `2026-06-18 20:37:14`
- `2026-06-29 11:41:09`
- `2026-06-29 16:13:00`
- `2026-06-29 17:27:27`
- `2026-06-29 18:20:47`
- `2026-06-29 22:06:55`
- `2026-06-29 22:28:49`
- `2026-06-30 08:56:17`
- `2026-06-30 09:24:26`
- `2026-06-30 09:50:41`
- `2026-06-30 10:02:34`
- `2026-06-30 10:12:47`
- `2026-06-30 12:43:53`
- `2026-06-30 13:08:42`
- `2026-06-30 16:49:00`
- `2026-06-30 17:34:11`
- `2026-06-30 18:51:49`
- `2026-06-30 20:18:27`

## Fluxos ainda nao implementados

- Selecao de empresa/tenant quando o usuario participar de mais de uma empresa.
- Tela dedicada de funil/board.
- Central de notificações para o usuário operacional abrir e marcar mensagens como lidas.
- IA assistiva.
- Relatorios de gestor.

## Situacao atual do acesso

O login, o cadastro de acesso e o onboarding inicial ja existem.

Ainda falta validar manualmente o fluxo completo com um usuario real pela interface e depois evoluir permissao por papel, selecao de tenant e telas operacionais.
