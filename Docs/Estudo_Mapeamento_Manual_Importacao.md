# Estudo: Mapeamento Manual de Colunas na Importacao

Criado em: 2026-07-18 13:38:30 -03:00  
Ultima modificacao: 2026-07-18 13:38:30 -03:00

## Contexto

A issue `#94` propõe permitir que o Owner mapeie manualmente as colunas da planilha antes de criar a carga temporária. O fluxo atual já lê XLSX/CSV, identifica uma linha de cabeçalho provável, transforma cada linha em `RawSpreadsheetRow.values` e aplica aliases locais em `normalizeSpreadsheetRow`.

Esse mecanismo cobre planilhas comuns, mas falha quando o cliente usa nomes diferentes, colunas compostas, abreviações próprias ou layout parcialmente fora do padrão.

## Premissa Corrigida

A ideia de "selecionar campo e mover para uma grade de leitura" é boa como intenção, mas eu não recomendo começar por drag-and-drop como interação principal.

Motivo:

- Drag-and-drop exige mais precisão, pode ser ruim em telas pequenas e dificulta acessibilidade por teclado.
- O usuário Owner está em uma tarefa operacional, não em uma ferramenta visual de desenho.
- Uma grade com selects por campo é mais previsível, mais fácil de validar e mais simples de explicar.

Recomendação: usar uma grade de mapeamento guiada. A interface pode ter um botão `Usar Sugestão` por campo, seleção manual por dropdown e uma prévia de leitura. Em uma etapa posterior, um recurso de arrastar colunas pode ser adicionado como atalho, não como dependência do fluxo.

## Objetivo de UX

Permitir que o Owner responda rapidamente:

- O xCRM entendeu quais colunas existem?
- Quais campos obrigatórios ainda estão sem origem?
- Como a primeira linha será interpretada antes de criar a carga temporária?
- O que será ignorado por não ter campo correspondente no xCRM?

## Campos xCRM a Mapear

### Obrigatorio

- Empresa/Prospect: origem para `company.name`.

### Recomendados

- Razão Social: `company.legalName`.
- CNPJ: `company.document`.
- Cidade: `company.city`.
- UF: `company.state`.
- Site: `company.website`.
- Endereço: `company.address`.
- Fornecedor/Atividade/Marca: `company.mainSupplier`.
- Observação Comercial: `company.notes`.

### Contato Principal e Contatos

- Nome do Contato: `contacts[].name`.
- Função/Cargo: `contacts[].role`.
- E-mail: `contacts[].email`, mantendo a regra atual de extrair múltiplos e-mails da mesma célula.
- Telefone: `contacts[].phone`.

### Acompanhamento Comercial

- Histórico Realizado: `history[].body`.
- Canal/Origem do Histórico: pode complementar `history[].body` e/ou `company.notes`.
- Próxima Ação: `futureActions[].description`.
- Data da Próxima Ação: `futureActions[].scheduledAt`.

### Campos Futuramente Úteis

Esses campos podem aparecer na planilha, mas não precisam bloquear o MVP do mapeamento:

- CEP.
- Número.
- Complemento.
- Bairro.
- Segmento.
- Responsável.
- Equipe.
- Status inicial.
- Etapa inicial do funil.

## Fluxo Proposto

### 1. Selecionar Arquivo

O Owner escolhe o arquivo XLSX/CSV e, opcionalmente, informa `Caminho de Origem`.

Em vez de criar a carga temporária imediatamente, o sistema faz uma leitura preliminar do arquivo e mostra:

- Nome do arquivo.
- Tamanho.
- Quantidade estimada de linhas.
- Linha de cabeçalho detectada.
- Lista de colunas encontradas.

### 2. Revisar Cabeçalho

O sistema escolhe automaticamente a linha de cabeçalho usando a regra atual de pontuação por termos conhecidos. A tela deve permitir trocar a linha de cabeçalho quando a planilha tiver títulos, observações ou linhas vazias no começo.

Campos sugeridos:

- `Linha de Cabeçalho`: select ou stepper com número da linha.
- Prévia de 3 a 5 linhas abaixo da linha escolhida.

### 3. Mapear Campos

Usar uma grade com três colunas principais:

| Campo do xCRM | Coluna da Planilha | Status |
| --- | --- | --- |
| Empresa/Prospect | EMPRESA | Obrigatório OK |
| E-mail | E-mail | Sugerido |
| Telefone | FONE | Sugerido |
| Próxima Ação | sem mapeamento | Opcional |

Interações:

- Cada campo do xCRM tem um select com as colunas detectadas.
- A primeira opção deve ser `Não Importar`.
- Campos obrigatórios sem mapeamento aparecem com aviso.
- Sugestões por alias vêm preenchidas automaticamente.
- O usuário pode limpar tudo, restaurar sugestões ou salvar um modelo.

### 4. Prévia de Leitura

Após o mapeamento, a tela mostra uma prévia com 3 a 10 linhas usando os nomes finais do xCRM:

- Empresa/Prospect.
- Contatos detectados.
- Cidade/UF.
- Histórico.
- Próxima Ação.
- Avisos da normalização.

Essa prévia evita criar uma carga inteira errada. Se `Empresa/Prospect` estiver sem mapeamento, o botão de criar carga fica bloqueado.

### 5. Criar Carga Temporária

Quando o Owner confirma, a carga é criada já com `normalizedJson` gerado a partir do mapeamento aprovado. A revisão por linha continua igual ao fluxo atual.

## Arquitetura Candidata

### Biblioteca de Importação

Criar tipos e funções em `src/lib/imports/mapping.ts`:

- `ImportFieldKey`: enum/string union dos campos xCRM mapeáveis.
- `ImportColumnMapping`: `{ field: ImportFieldKey; sourceColumn: string | null }`.
- `suggestImportMapping(headers)`: aplica aliases atuais.
- `applyImportMapping(row, mapping)`: transforma `RawSpreadsheetRow` em valores esperados pelo normalizador.
- `validateImportMapping(mapping)`: exige `companyName`.

Refatorar `normalizeSpreadsheetRow` para aceitar opcionalmente um mapeamento:

```ts
normalizeSpreadsheetRow(row, mapping?)
```

Sem mapeamento, usa o comportamento atual por aliases. Com mapeamento, lê explicitamente as colunas escolhidas.

### Persistência

Há duas opções:

1. Sem banco no primeiro corte: o mapeamento é enviado junto com a criação da carga e aplicado naquele momento. Mais simples.
2. Com banco: adicionar `imports.column_mapping Json?` para auditoria e reuso futuro.

Recomendação: adicionar `imports.column_mapping Json?` já no primeiro corte. Como a carga temporária é uma decisão operacional, manter o mapeamento usado ajuda auditoria, suporte e diagnóstico.

### Server Actions

Adicionar uma etapa antes de `startImportBatchAction`:

- `previewImportFileAction`: recebe arquivo, valida tamanho/extensão, lê cabeçalhos e salva prévia temporária.
- `startImportBatchAction`: passa a receber `columnMappingJson` e aplica o mapeamento ao normalizar as linhas.

Atenção técnica: arquivos enviados pelo navegador não devem depender de caminho local. Se a prévia e a criação forem ações separadas, será preciso manter o conteúdo temporário em storage/session ou combinar tudo em um Client Component que segura o arquivo até a confirmação final.

Recomendação para MVP: usar um Client Component em `/imports` que segura o `File` no navegador, mostra a prévia e envia o mesmo arquivo apenas quando o mapeamento estiver aprovado. Isso evita storage temporário adicional no servidor.

## Layout Recomendado

### Tela Sem Carga Ativa

Manter o painel `Iniciar Carga Temporária`, mas dividir em etapas compactas:

1. `Arquivo`
2. `Mapeamento`
3. `Prévia`
4. `Criar Carga`

Não usar uma landing page nem cards decorativos. É uma bancada operacional.

### Mapeamento

Usar uma grade densa, com linhas repetíveis e estados claros:

- Coluna esquerda: Campo do xCRM.
- Coluna central: Select de Coluna da Planilha.
- Coluna direita: Estado (`Obrigatório`, `Sugerido`, `Opcional`, `Sem Mapeamento`).

Ações:

- `Restaurar Sugestões`
- `Limpar Mapeamento`
- `Criar Carga Temporária`

### Prévia

Mostrar uma tabela pequena, sem tentar substituir a revisão final:

- 3 a 10 linhas.
- Alertas por linha.
- Contagem de linhas com Empresa/Prospect detectado.
- Contagem de contatos/e-mails reconhecidos.

## Critérios de Aceite Recomendados

- O Owner consegue escolher arquivo de qualquer pasta do dispositivo.
- O sistema mostra cabeçalhos detectados antes de criar a carga temporária.
- O sistema sugere mapeamento inicial usando os aliases atuais.
- O Owner consegue trocar a coluna associada a cada campo xCRM.
- `Empresa/Prospect` é obrigatório para criar a carga.
- Campos opcionais podem ficar como `Não Importar`.
- A prévia mostra como as primeiras linhas serão normalizadas.
- O mapeamento aplicado é salvo em `imports.column_mapping`.
- A revisão, aprovação, rejeição, importação individual, importação em lote e descarte continuam funcionando como hoje.
- A extração de múltiplos e-mails da mesma célula continua preservada.

## Riscos e Cuidados

- Não transformar a importação em uma tela complexa demais. O usuário precisa sair com segurança, não com mais dúvidas.
- Evitar drag-and-drop como única forma de mapear.
- Validar arquivos grandes sem travar a interface.
- Não salvar arquivo temporário em local fixo do servidor.
- Não inferir campos críticos com excesso de confiança. Sugestão automática deve ser editável.
- Não bloquear importação por ausência de campos opcionais.

## Plano de Implementação

1. Criar tipos de mapeamento e extrair aliases atuais para `mapping.ts`.
2. Criar função para sugerir mapeamento a partir dos cabeçalhos.
3. Refatorar normalizador para aceitar mapeamento explícito.
4. Adicionar coluna `imports.column_mapping Json?` e documentar SQL.
5. Criar Client Component para etapa de prévia/mapeamento antes da carga.
6. Atualizar `startImportBatchAction` para receber e persistir o mapeamento.
7. Atualizar manual, documentação técnica e diário.
8. Validar com planilhas com cabeçalhos conhecidos, cabeçalhos desconhecidos e campos faltantes.

## Decisão Recomendada

Implementar a `#94` como uma etapa intermediária dentro da própria tela `/imports`, antes da criação da carga temporária.

Eu não recomendo criar uma página separada neste momento. O mapeamento é parte da importação, e separar a rota tende a espalhar o fluxo. A tela atual pode suportar a etapa desde que a carga ativa continue ocupando a tela principal somente depois da confirmação.
