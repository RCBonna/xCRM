# AGENTS.md

## Instrucoes do projeto xCRM

- Para projetos que usam DB SQL, sempre documentar as necessidades e mudancas em um arquivo unico, mantendo no inicio data/hora de criacao, data/hora de modificacao, linhas ou blocos de comandos documentados.
- O app esta em desenvolvimento, entao esta autorizado aplicar migrations no DB SQL quando necessario.
- Em todos os projetos, manter gravado um resumo feito por dia das mudancas.
- Manter as Issues do Git atualizadas com o que for feito no app.
- Quando reportado um erro, gerar uma issue para documentar e, depois de testado, fechar.
- Quando terminarmos ajustes ou implementacoes, verificar no GitHub se tem issue e atualizar.
- Nao e necessario avisar sobre a pasta NFC-e, pois e uma pasta somente de testes de importacao de cupom.
- A cada mudanca no app, atualizar tambem a documentacao tecnica e o manual do usuario quando a mudanca afetar arquitetura, configuracao, fluxo, tela, regra de negocio, permissao, IA, importacao, banco de dados ou comportamento visivel.

## Documentos obrigatorios

- Diario diario: `Docs/Diário_do_Projeto.md`
- SQL, migrations e decisoes de banco: `Docs/SQL_Necessidades_e_Mudancas.md`
- Plano principal do CRM: `Docs/Plano_Implementacao_CRM.md`
- Documentacao tecnica: `Docs/Documentacao_Tecnica.md`
- Manual do usuario: `Docs/Manual_do_Usuario.md`
