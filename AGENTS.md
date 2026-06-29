# AGENTS.md

## Instrucoes do projeto xCRM

- Antes de iniciar qualquer desenvolvimento, alteracao de arquivos, instalacao, build, teste ou operacao Git, avisar o usuario para pausar/parar o OneDrive e confirmar que a sincronizacao esta interrompida. Esta verificacao faz parte da lista inicial obrigatoria de validacao para evitar arquivos em uso, placeholders de nuvem, `.git` incompleto e conflitos de sincronizacao.
- Para projetos que usam DB SQL, sempre documentar as necessidades e mudancas em um arquivo unico, mantendo no inicio data/hora de criacao, data/hora de modificacao, linhas ou blocos de comandos documentados.
- O app esta em desenvolvimento, entao esta autorizado aplicar migrations no DB SQL quando necessario.
- Em todos os projetos, manter gravado um resumo feito por dia das mudancas.
- Manter as Issues do Git atualizadas com o que for feito no app.
- Quando reportado um erro, gerar uma issue para documentar e, depois de testado, fechar.
- Quando terminarmos ajustes ou implementacoes, verificar no GitHub se tem issue e atualizar.
- Nao e necessario avisar sobre a pasta NFC-e, pois e uma pasta somente de testes de importacao de cupom.
- A cada mudanca no app, atualizar tambem a documentacao tecnica e o manual do usuario quando a mudanca afetar arquitetura, configuracao, fluxo, tela, regra de negocio, permissao, IA, importacao, banco de dados ou comportamento visivel.
- Como o projeto esta em WIP, manter no topo da tela a informacao `Versao: AAAA-MM-DD hh:mm:ss`. Todas as vezes que qualquer arquivo do sistema for alterado, atualizar esta informacao para a data/hora da mudanca. Futuramente isso pode ser substituido por build/commit do Git.
- Rotulos visiveis de campos, paineis, botoes e secoes com nomes compostos devem usar capitalizacao em estilo titulo, por exemplo `Contato Principal`, `Base Comercial`, `Data e Hora` e `Observacao Comercial`; manter conectivos e preposicoes curtas em minusculo quando fizer sentido em Portugues-BR, como `de`, `da`, `do`, `das`, `dos`, `a`, `as`, `o`, `os`, `e`, `em`, `no`, `na`, `nos` e `nas`.

## Documentos obrigatorios

- Diario diario: `Docs/Diário_do_Projeto.md`
- SQL, migrations e decisoes de banco: `Docs/SQL_Necessidades_e_Mudancas.md`
- Plano principal do CRM: `Docs/Plano_Implementacao_CRM.md`
- Documentacao tecnica: `Docs/Documentacao_Tecnica.md`
- Manual do usuario: `Docs/Manual_do_Usuario.md`
