# Manual do Usuario do xCRM

Criado em: 2026-06-12 20:13:05 -03:00  
Ultima modificacao: 2026-06-12 21:02:34 -03:00  
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

## Login e primeiro acesso

O login inicial ja esta disponivel em `/login`.

Na tela de login, o usuario pode:

- Entrar com e-mail e senha.
- Criar um novo acesso com nome, e-mail e senha.
- Mostrar ou ocultar o conteudo do campo de senha.

Regra atual de senha:

- Minimo de 8 caracteres.
- Neste momento de desenvolvimento, o sistema ainda nao exige senha forte.
- Recuperacao de senha por e-mail sera implementada posteriormente.

Depois de criar o acesso:

- Se o projeto exigir confirmacao de e-mail, o usuario deve confirmar o e-mail antes de entrar.
- Se a sessao ja estiver ativa, o usuario sera levado para o onboarding.

## Onboarding da empresa

O onboarding esta disponivel em `/onboarding` para usuarios autenticados que ainda nao tem empresa vinculada.

Nesta tela, o usuario informa:

- Nome da empresa.
- Nome do usuario owner.

Ao confirmar, o sistema cria:

- A empresa/tenant.
- O usuario owner.
- O funil comercial padrao.
- As etapas iniciais do funil.
- Uma primeira tarefa interna.

Depois disso, o usuario vai para `/dashboard`.

## Dashboard inicial

O dashboard inicial esta disponivel em `/dashboard`.

Ele mostra:

- Nome da empresa atual.
- Perfil do usuario.
- Metricas reais do tenant.
- Etapas do funil padrao.
- Proximas acoes sugeridas.
- Botao de sair.
- Seletor de temas.

## Versao exibida no topo

Durante o WIP, o sistema mostra no topo da tela uma versao no formato:

```text
Versao: AAAA-MM-DD hh:mm:ss
```

Essa informacao ajuda a confirmar qual pacote de mudancas esta sendo testado.

Versao atual:

- `2026-06-12 21:01:27`

## Fluxos ainda nao implementados

- Selecao de empresa/tenant quando o usuario participar de mais de uma empresa.
- Cadastro de empresa/prospect.
- Cadastro de contato.
- Funil real.
- Agenda/tarefas.
- Importacao de planilha.
- IA assistiva.
- Relatorios de gestor.

## Situacao atual do acesso

O login, o cadastro de acesso e o onboarding inicial ja existem.

Ainda falta validar manualmente o fluxo completo com um usuario real pela interface e depois evoluir permissao por papel, selecao de tenant e telas operacionais.
