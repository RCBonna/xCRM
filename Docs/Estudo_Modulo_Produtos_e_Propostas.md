# Estudo do Módulo de Produtos e Propostas do xCRM

Criado em: 2026-07-16 21:04:38 -03:00  
Última modificação: 2026-07-16 21:04:38 -03:00  
Status: Estudo para decisão de produto; nenhuma funcionalidade foi implementada

Issue de acompanhamento: `#101 - P2: Validar e implementar módulo de Produtos e Propostas`

## 1. Resumo Executivo

Recomendação: **implementar, de forma incremental, um módulo de Propostas
vinculado às Oportunidades**, com um Catálogo de Produtos e Serviços opcional.

Não é recomendável implementar apenas um cadastro de produtos com preço e um
botão para enviar PDF. Essa solução parece simples, mas deixa sem resposta os
problemas que mais causam retrabalho comercial:

- qual versão foi enviada;
- quais preços, quantidades, descontos, frete e condições estavam vigentes;
- quem enviou, para quem, quando e por qual canal;
- se a proposta venceu, foi substituída, aceita ou recusada;
- qual valor deve aparecer na Oportunidade e no Pipeline.

O módulo recomendado é uma extensão natural do xCRM. O sistema já possui
Empresa/Prospect, Contato, Oportunidade, Valor Estimado, Atividade do tipo
`PROPOSAL`, Histórico com canais `EMAIL` e `WHATSAPP` e metadados de Anexos.
Faltam Catálogo, Proposta, Itens, Versões e Entregas.

A ordem recomendada é:

1. Proposta versionada, itens e PDF, com download e compartilhamento manual.
2. Envio transacional por e-mail, com eventos de entrega e falha.
3. Link seguro para visualização e aceite simples, se o uso justificar.
4. Integração oficial com WhatsApp Business Platform somente após validar
   volume, consentimento e modelo de operação por tenant.

O xCRM não deve virar ERP, sistema fiscal, estoque ou CPQ avançado neste corte.

## 2. Pergunta de Produto Reavaliada

A pergunta inicial é: “devemos cadastrar produtos com valores para enviar uma
proposta em PDF por e-mail e WhatsApp?”

A pergunta mais adequada é:

> O xCRM deve reduzir o tempo e os erros entre uma Oportunidade qualificada e
> uma Proposta comercial rastreável, sem assumir responsabilidades de ERP?

A resposta é **sim**, desde que o módulo preserve três limites:

- o Catálogo acelera a criação, mas não obriga toda linha a vir de um produto;
- uma Proposta enviada é um documento imutável; alterações geram nova versão;
- preço comercial, imposto, frete e desconto permanecem valores explícitos da
  Proposta, sem criar cálculo fiscal automático.

## 3. Evidências no xCRM Atual

### 3.1. Capacidades reutilizáveis

| Capacidade atual | Uso no módulo proposto |
| --- | --- |
| `Account` | Empresa/Prospect destinatária |
| `Contact` | Pessoa que recebe a Proposta |
| `Opportunity` | Negociação que origina a Proposta |
| `amountEstimated` | Estimativa do Pipeline, comparável ao total proposto |
| `ActivityType.PROPOSAL` | Follow-up e pendência relacionada à Proposta |
| `InteractionChannel.EMAIL/WHATSAPP` | Registro da comunicação no Histórico |
| `Attachment` | Metadados do PDF gerado |
| Escopo por responsável/equipe | Controle de visibilidade da Proposta |
| `tenantId` | Isolamento obrigatório de Catálogo, Propostas e envios |

### 3.2. Lacunas

- Não existe Catálogo de Produtos ou Serviços.
- Não existem itens vinculados à Oportunidade.
- Não existe entidade Proposta nem numeração por tenant.
- Não há versão imutável do preço enviado.
- Não há geração ou armazenamento de PDF.
- Não há provedor de e-mail transacional configurado.
- Não há integração oficial com WhatsApp Business Platform.
- Não há rastreamento de envio, entrega, falha, abertura ou aceite.
- `Attachment` guarda metadados, mas a estratégia de Storage ainda precisa ser
  definida e protegida.

## 4. Opções Avaliadas

| Opção | Benefício | Complexidade | Risco | Avaliação |
| --- | --- | --- | --- | --- |
| Manter propostas fora do xCRM | Baixo investimento | Baixa | Histórico fragmentado e valores divergentes | Útil apenas enquanto o volume for muito baixo |
| Catálogo + PDF sem entidade Proposta | Criação rápida | Média | Não controla versão, aceite nem substituição | Não recomendado |
| Propostas vinculadas à Oportunidade | Rastreabilidade e valor comercial claros | Média/Alta | Exige novo domínio e Storage | **Recomendado** |
| CPQ/ERP completo | Regras avançadas, impostos, estoque e cobrança | Muito alta | Desvia o foco do CRM | Não recomendado agora |

## 5. Prós

- Reduz digitação repetida e erros de preço, descrição e soma.
- Mantém a Proposta no mesmo contexto da Empresa, Contato e Oportunidade.
- Registra o valor efetivamente proposto sem confundi-lo com faturamento.
- Evita arquivos soltos e nomes como `proposta_final_v3_agora_sim.pdf`.
- Permite reutilizar produtos e serviços frequentes sem impedir itens especiais.
- Melhora follow-up: vencimento e ausência de resposta podem gerar Atividades.
- Cria base para indicadores futuros, como tempo até envio, taxa de aceite,
  desconto médio e conversão por produto.
- Torna e-mail e WhatsApp canais auditáveis no Histórico comercial.
- Reforça a percepção de valor do xCRM sem exigir um módulo financeiro completo.

## 6. Contras e Riscos

- Preço de catálogo pode dar falsa sensação de preço final quando há negociação,
  impostos, frete, volume ou condição específica por cliente.
- Uma atualização no Catálogo pode alterar indevidamente propostas antigas se os
  itens não guardarem uma fotografia dos dados enviados.
- PDF, Storage, e-mail e WhatsApp adicionam fornecedores, credenciais, custos,
  webhooks, filas, retentativas e observabilidade.
- Envio duplicado pode ocorrer se não houver idempotência e estado de execução.
- Abertura de e-mail não é prova confiável de leitura; bloqueios de rastreamento
  e privacidade reduzem a qualidade dessa métrica.
- WhatsApp automatizado exige consentimento, governança de modelos e operação de
  número comercial por tenant.
- Propostas podem conter dados pessoais e condições comerciais sensíveis.
- Aceite por clique não deve ser vendido como assinatura eletrônica avançada ou
  qualificada sem controles e análise jurídica correspondentes.
- Se o escopo incluir estoque, tributação, nota fiscal, comissão e cobrança, o
  projeto deixa de ser um módulo de CRM e passa a ser ERP/CPQ.

## 7. Decisões de Domínio Recomendadas

### 7.1. Catálogo

O Catálogo deve aceitar Produtos e Serviços, sempre por tenant:

- código/SKU opcional;
- nome;
- descrição comercial;
- unidade de medida;
- preço-base em BRL;
- Status Ativo/Inativo;
- observação interna opcional.

O preço-base é uma sugestão editável na Proposta, não uma regra fiscal. Deve ser
permitido criar um item avulso sem cadastrá-lo no Catálogo.

Tabelas de preço por cliente, região, faixa de quantidade ou data devem ficar
fora do primeiro corte. Elas só devem ser implementadas quando casos reais
provarem a necessidade.

### 7.2. Proposta

Uma Proposta deve pertencer a exatamente uma Oportunidade e, por consequência,
a uma Empresa/Prospect. Campos mínimos:

- número sequencial dentro do tenant;
- versão;
- Oportunidade, Empresa/Prospect, Contato e responsável;
- Status: Rascunho, Pronta, Enviada, Aceita, Recusada, Vencida, Substituída e
  Cancelada;
- data de emissão e validade;
- moeda, inicialmente BRL;
- subtotal, desconto, frete, outros acréscimos e total;
- introdução, condições comerciais, forma de pagamento e observações;
- caminho do PDF, hash do arquivo e data de geração.

### 7.3. Itens como fotografia

Cada item deve guardar o `productId` opcional e também uma fotografia de:

- SKU, nome, descrição e unidade;
- quantidade;
- preço unitário;
- desconto do item;
- total da linha.

Uma mudança posterior no Catálogo nunca altera uma Proposta já enviada. Ao
editar uma Proposta enviada, o sistema cria uma nova versão copiando os itens.

### 7.4. Relação com o Valor Estimado

O xCRM não deve sobrescrever silenciosamente `Opportunity.amountEstimated`.

Ao publicar uma Proposta, pode oferecer a ação explícita:

> Atualizar o Valor Estimado da Oportunidade para R$ X?

Se houver várias Propostas para a mesma Oportunidade, o Dashboard deve continuar
usando o Valor Estimado confirmado pelo usuário, e não somar todas as versões.

## 8. Experiência Recomendada

### 8.1. Entrada

Dentro de uma Oportunidade, incluir a seção `Propostas` com:

- Proposta vigente e seu Status;
- total, validade e destinatário;
- histórico de versões;
- ações `Criar Proposta`, `Gerar PDF`, `Compartilhar` e `Criar Nova Versão`.

Não é recomendável criar a Proposta diretamente no cadastro genérico da
Empresa/Prospect, porque preço e negociação pertencem à Oportunidade.

### 8.2. Editor

Fluxo proposto:

1. Selecionar Contato destinatário.
2. Adicionar item do Catálogo ou item avulso.
3. Ajustar quantidade, preço e desconto.
4. Informar frete, validade e condições.
5. Conferir uma prévia igual ao PDF final.
6. Salvar Rascunho ou Publicar.
7. Escolher o canal de compartilhamento.

O total deve ser calculado no servidor e novamente validado ao publicar. O
navegador pode mostrar a prévia, mas não é a fonte de verdade financeira.

### 8.3. Permissões

| Perfil | Permissão recomendada |
| --- | --- |
| Proprietário/Administrador | Gerenciar Catálogo, modelos, integrações e todas as Propostas |
| Líder | Ver Propostas da equipe, criar/enviar e aprovar descontos quando configurado |
| Vendedor | Criar e enviar Propostas das próprias Oportunidades |
| Assistente | Criar Rascunhos no próprio escopo; envio conforme permissão do tenant |

Alçadas de desconto são uma evolução posterior. No primeiro corte, registrar
quem alterou preço e desconto já fornece auditoria útil.

## 9. PDF e Armazenamento

### 9.1. Conteúdo mínimo

- marca e dados do tenant;
- número e versão da Proposta;
- Empresa/Prospect, Contato e vendedor;
- data de emissão e validade;
- itens, quantidades, preços e totais;
- condições comerciais e observações;
- identificação de que o documento é uma Proposta, não nota fiscal;
- página e rodapé quando houver múltiplas páginas.

### 9.2. Estratégia técnica

- Gerar o PDF no servidor a partir da fotografia da Proposta.
- Armazenar em bucket privado no Supabase Storage.
- Registrar metadados em `attachments` e relacionar o arquivo à Proposta.
- Manter o arquivo publicado imutável e calcular hash SHA-256.
- Limitar o PDF a 5 MB no xCRM, mesmo quando o provedor aceitar mais.
- Não usar bucket público para condições comerciais.

O Supabase permite URLs assinadas com validade limitada, mas sua documentação
informa que essas URLs permanecem válidas até expirar. Para permitir revogação
imediata, a evolução ideal é um link externo controlado pelo xCRM, com token,
expiração e revogação em banco, que entrega o PDF após validar o acesso.

## 10. Envio por E-mail

### 10.1. Recomendação

Usar provedor transacional por uma interface interna, sem acoplar o domínio de
Propostas diretamente a um fornecedor. O primeiro provedor pode ser Resend ou
equivalente.

No início, o remetente pode ser um subdomínio verificado do xCRM, com nome
visível da organização e `Reply-To` do vendedor. Em uma fase posterior, tenants
podem verificar seus próprios domínios.

### 10.2. Requisitos

- SPF, DKIM e DMARC configurados;
- TLS e remetente identificável;
- texto simples além de HTML;
- chave de idempotência por tentativa de envio;
- PDF pequeno anexado e link seguro no corpo;
- webhooks para enviado, entregue, rejeitado e falha;
- `externalId` e evento no Histórico;
- retentativa controlada, sem duplicar mensagens;
- resposta direcionada ao vendedor responsável.

As diretrizes atuais do Gmail exigem autenticação do domínio para remetentes e
requisitos adicionais para grandes volumes. Mesmo com volume baixo, configurar
SPF, DKIM e DMARC desde o início reduz risco de spam e de falsificação.

## 11. Envio por WhatsApp

### 11.1. Primeiro corte recomendado

Oferecer `Abrir no WhatsApp` com mensagem previamente preenchida e link seguro
para a Proposta. O vendedor confirma o destinatário e executa o envio no próprio
WhatsApp. Esse fluxo:

- entrega valor rapidamente;
- não exige credenciais da API;
- mantém decisão humana antes do envio;
- não fornece confirmação confiável de entrega ao xCRM.

O usuário também pode baixar o PDF e anexá-lo manualmente.

### 11.2. Integração oficial posterior

Somente implementar envio automático após definir:

- se cada tenant usará seu próprio número e conta WhatsApp Business;
- processo de onboarding e armazenamento seguro das credenciais;
- evidência de opt-in e opt-out por Contato;
- modelos aprovados para mensagens iniciadas pela empresa;
- tratamento da janela de atendimento de 24 horas;
- custos por mensagem e limites do provedor;
- webhooks de envio, entrega, leitura e falha;
- fila e retentativa;
- suporte operacional quando número, modelo ou conta forem bloqueados.

Não é recomendável compartilhar um único número do xCRM entre organizações. O
remetente deve representar o tenant que está negociando com o cliente.

Documentos PDF são suportados por integrações oficiais do WhatsApp; provedores
como Twilio documentam limite de até 16 MB para documentos. O limite interno de
5 MB sugerido para o xCRM preserva velocidade e compatibilidade.

## 12. LGPD, Segurança e Auditoria

Esta seção é orientação de produto e engenharia, não parecer jurídico.

- Tratar o tenant como controlador e o xCRM/provedores conforme os papéis
  contratuais aplicáveis.
- Documentar finalidade, base legal e retenção de contatos, propostas e eventos.
- Registrar opt-in e opt-out do WhatsApp com origem e data.
- Minimizar dados pessoais no PDF e evitar dados sensíveis.
- Usar Storage privado e segredos somente no servidor.
- Aplicar `tenantId` e visibilidade da Oportunidade em todas as consultas.
- Manter log de geração, publicação, envio, falha, download e mudança de Status.
- Definir retenção para PDFs vencidos/cancelados e logs de provedores.
- Celebrar e revisar termos de tratamento de dados com provedores externos.
- Permitir revogar links externos e bloquear novos downloads.
- Não registrar corpo completo ou credenciais em logs técnicos.

A ANPD recomenda medidas administrativas e técnicas, controle de acesso,
política de segurança, cuidado com e-mail e gestão dos fornecedores que tratam
dados pessoais.

## 13. Modelo de Dados Candidato

Nenhuma migration faz parte deste estudo. Um desenho provável inclui:

```text
Product
  tenantId, sku, name, description, unit, basePrice, status

Proposal
  tenantId, opportunityId, accountId, contactId, ownerUserId
  number, version, status, issuedAt, validUntil, currency
  subtotal, discount, freight, additions, total
  introduction, paymentTerms, commercialTerms, notes
  pdfStoragePath, pdfSha256, publishedAt

ProposalItem
  tenantId, proposalId, productId?
  skuSnapshot, nameSnapshot, descriptionSnapshot, unitSnapshot
  quantity, unitPrice, discount, lineTotal, position

ProposalDelivery
  tenantId, proposalId, channel, recipient
  provider, providerMessageId, status, errorCode
  requestedByUserId, requestedAt, sentAt, deliveredAt, failedAt

ProposalShareToken
  tenantId, proposalId, tokenHash, expiresAt, revokedAt
  createdByUserId, createdAt, lastAccessedAt
```

Todos os valores monetários devem usar `Decimal`, nunca ponto flutuante. Totais
devem ser recalculados no servidor. Restrições e índices devem garantir número e
versão únicos por tenant.

## 14. Plano Incremental Recomendado

### Fase 0 - Descoberta com propostas reais

Complexidade relativa: Pequena.

- Reunir de 5 a 10 propostas reais usadas pela organização.
- Identificar unidades, descontos, frete, impostos manuais e condições.
- Confirmar se o preço varia por cliente, volume, região ou prazo.
- Escolher um único modelo visual inicial.
- Definir quem pode publicar e enviar.

Saída: regras fechadas do MVP e modelo de PDF aprovado.

Esta fase está registrada na issue `#101` e depende de aprovação antes de
qualquer implementação.

### Fase 1 - Núcleo de Propostas

Complexidade relativa: Média/Alta.

- Catálogo simples de Produtos e Serviços.
- Itens avulsos.
- Proposta ligada à Oportunidade.
- Rascunho, publicação, versão e Status manual.
- PDF imutável, Storage privado e download.
- Registro no Histórico e criação opcional de follow-up.
- Ação explícita para atualizar Valor Estimado.

Saída: processo completo sem depender de integração externa.

### Fase 2 - E-mail transacional

Complexidade relativa: Média.

- Configuração do domínio remetente.
- Envio com PDF e link seguro.
- idempotência, webhooks, falhas e retentativas.
- eventos no Histórico.

Saída: envio rastreável por e-mail dentro do xCRM.

### Fase 3 - Compartilhamento e aceite

Complexidade relativa: Média.

- Página externa responsiva da Proposta.
- token revogável e expiração.
- registro de visualização/download com aviso de limite probatório.
- aceite simples com nome, data, IP e versão, se validado juridicamente.

Saída: experiência melhor para o comprador e menos troca de anexos.

### Fase 4 - WhatsApp Business Platform

Complexidade relativa: Alta.

- integração por tenant;
- opt-in/opt-out;
- modelos aprovados e janela de atendimento;
- PDF ou link seguro;
- webhooks, filas, custos e suporte operacional.

Saída: envio oficial e rastreável pelo WhatsApp.

### Fora do escopo inicial

- estoque e disponibilidade;
- custo e margem contábil;
- cálculo automático de ICMS, IPI, ST ou outros tributos;
- emissão de NF-e;
- cobrança, boleto, PIX ou conciliação;
- comissão;
- múltiplas moedas;
- assinatura eletrônica avançada/qualificada;
- regras complexas de preço e aprovação.

## 15. Critérios para Aprovar o Investimento

Antes da Fase 1, confirmar pelo menos três destes sinais:

- propostas são produzidas com frequência semanal;
- vendedores redigitam os mesmos produtos ou serviços;
- existem erros recorrentes de versão, preço ou destinatário;
- o valor da Oportunidade fica desatualizado após a negociação;
- o gestor não consegue saber o que foi enviado;
- follow-ups de Proposta são esquecidos;
- clientes pedem reenvio porque o arquivo se perde na conversa.

Indicadores do piloto:

- tempo mediano entre criação da Oportunidade e envio;
- tempo para montar uma Proposta;
- quantidade de revisões por Proposta;
- percentual de Propostas com follow-up agendado;
- falhas de envio;
- Propostas aceitas, recusadas e vencidas;
- conversão e valor por produto, somente depois de dados suficientes.

## 16. Recomendação Final

**Avançar com o módulo, mas começar pelo núcleo de Propostas e não pelo canal de
envio.**

A melhor decisão para o xCRM é:

- Proposta como filha da Oportunidade;
- Catálogo opcional com preço-base editável;
- item avulso permitido;
- versão enviada imutável;
- PDF privado e rastreável;
- envio por e-mail antes da automação do WhatsApp;
- WhatsApp manual no MVP e API oficial após validação;
- sem estoque, fiscal, faturamento ou CPQ avançado.

Prioridade sugerida: **P2**, promovida a P1 apenas se a montagem e o controle de
Propostas forem hoje um dos três maiores gargalos da equipe comercial.

## 17. Questões para a Descoberta da Fase 0

1. O preço-base é o mesmo para todos os clientes?
2. A organização vende produtos, serviços ou ambos?
3. Quais unidades aparecem: litro, galão, quilo, unidade, hora ou pacote?
4. Frete e impostos são informados separadamente ou embutidos no preço?
5. Existem tabelas por região, cliente, volume ou prazo de pagamento?
6. O vendedor pode conceder qualquer desconto?
7. A Proposta precisa de assinatura ou o aceite por e-mail/WhatsApp basta?
8. Existe um modelo de PDF já utilizado e aprovado?
9. Cada tenant terá domínio de e-mail e número de WhatsApp próprios?
10. A Proposta aceita deve mover automaticamente a Oportunidade para `Ganhas` ou
    apenas sugerir essa ação?

## 18. Fontes Pesquisadas

Consulta realizada em 2026-07-16. Foram priorizadas fontes oficiais e
documentações dos provedores citados.

- [Gmail - Diretrizes para remetentes de e-mail](https://support.google.com/mail/answer/81126?hl=pt-BR)
- [Resend - Envio de e-mail e idempotência](https://resend.com/docs/api-reference/emails/send-email)
- [Resend - Anexos e limites](https://resend.com/docs/dashboard/emails/attachments)
- [Twilio - WhatsApp Business Platform](https://www.twilio.com/docs/whatsapp/api)
- [Twilio - Modelos, aprovação e janela de atendimento](https://www.twilio.com/docs/whatsapp/tutorial/message-template-approvals-statuses)
- [Twilio - Envio de PDF pelo WhatsApp](https://help.twilio.com/articles/360017961894)
- [Supabase - Buckets públicos e privados](https://supabase.com/docs/guides/storage/buckets/fundamentals)
- [Supabase - Downloads e URLs assinadas](https://supabase.com/docs/guides/storage/serving/downloads)
- [ANPD - Guia de Segurança da Informação para Agentes de Pequeno Porte](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-vf.pdf)
- [ANPD - Perguntas frequentes sobre adequação à LGPD](https://www.gov.br/anpd/pt-br/acesso-a-informacao/perguntas-frequentes/perguntas-frequentes)
- [Planalto - Lei nº 14.063/2020](https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2020/lei/l14063.htm)
- [Planalto - Medida Provisória nº 2.200-2/2001](https://planalto.gov.br/ccivil_03/mpv/antigas_2001/2200-2.htm)
- [HubSpot - Criação e envio de Propostas](https://knowledge.hubspot.com/quotes/create-and-send-quotes)
- [HubSpot - Gestão, versões e download de Propostas](https://knowledge.hubspot.com/quotes/manage-quotes)
