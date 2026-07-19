# Estudo de SMTP e Convites de Usuarios

Criado em: 2026-07-18 22:42:18 -03:00
Ultima modificacao: 2026-07-18 22:42:18 -03:00
Issue relacionada: `#36`
Status: Estudo para decisao; nenhuma integracao SMTP aplicada

## Decisao que Precisamos Tomar

O xCRM ja permite ao Owner cadastrar Lideres, Vendedores e Assistentes, mas cria apenas o registro interno em `public.users`. Falta enviar um convite real, permitir que a pessoa defina sua senha e vincular com seguranca o usuario do Supabase Auth ao usuario correto do tenant.

SMTP e apenas a infraestrutura de entrega. O fluxo robusto tambem precisa controlar estado, reenvio, expiracao, auditoria e falhas parciais.

## Arquitetura Recomendada

```text
Owner cria convite no xCRM
        |
        v
xCRM grava usuario + convite PENDING
        |
        v
Supabase Admin inviteUserByEmail
        |
        +--> Custom SMTP entrega o e-mail
        |
        v
xCRM grava auth_user_id + SENT
        |
        v
Convidado aceita, define senha e entra
        |
        v
xCRM valida tenant, papel e marca ACCEPTED
```

### Componentes

- Supabase Auth continua responsavel por identidade, token, senha, recuperacao e link de convite.
- Custom SMTP entrega os e-mails do Supabase Auth usando dominio verificado do xCRM.
- Uma tabela de convites no xCRM registra `PENDING`, `SENT`, `ACCEPTED`, `EXPIRED`, `FAILED` e `CANCELED`.
- A Server Action usa uma chave administrativa do Supabase apenas no servidor.
- O UUID retornado por `inviteUserByEmail` e gravado em `users.auth_user_id`; nao se tenta vincular apenas comparando e-mail no login.
- Falha de envio nao apaga o usuario interno: o convite fica `FAILED` e pode ser reenviado.
- Owner pode cancelar ou reenviar, com auditoria em `interactions`.

## Alternativas de Provedor

Precos consultados em 18/07/2026 e sujeitos a alteracao. Valores em dolar nao incluem impostos ou cambio.

| Alternativa | Custo do Servico | Esforco Estimado | Pontos Fortes | Pontos Fracos |
| --- | --- | --- | --- | --- |
| Resend + Supabase SMTP | Gratis ate 3.000 e-mails/mes, limite de 100/dia; Pro a partir de US$ 20/mes para 50.000 | Baixo: configuracao em horas; fluxo completo em 3 a 5 dias | Integracao direta com Supabase, UX simples, dominio customizado, logs, webhooks e API moderna | Plano gratis tem limite diario; logs SMTP sao menos detalhados que a API; exige DNS correto |
| Brevo SMTP | Gratis com 300 e-mails/dia; Starter a partir de US$ 9/mes | Baixo a medio: fluxo completo em 3 a 5 dias | Franquia diaria maior, SMTP transacional, logs e possibilidade futura de campanhas/SMS/WhatsApp | Produto mais amplo e mais complexo; mistura marketing e transacional exige governanca |
| Postmark SMTP | Developer gratuito com 100 e-mails/mes; plano pago com faixa inicial de 10.000/mes | Medio: fluxo completo em 4 a 6 dias | Forte foco em entrega transacional, message streams, bons logs e webhooks | Gratuito muito pequeno; custo inicial maior; SMTP e tratado pelo proprio fornecedor como caminho de migracao em relacao a API |
| Amazon SES | Aproximadamente US$ 0,10 por 1.000 e-mails, alem de dados e opcionais | Alto: fluxo completo em 5 a 8 dias, mais operacao | Menor custo em alto volume, escala e controle de infraestrutura | Sandbox inicial, liberacao de producao, IAM, regiao, reputacao, monitoramento e maior risco operacional |
| Google Workspace/Gmail SMTP | Incluido conforme plano Workspace existente | Baixo para prova; medio para operar | Familiar e sem novo fornecedor para teste pequeno | App password/2FA, quotas, conta administrativa acoplada, configuracao mais fragil e menor observabilidade; nao recomendado para SaaS |

## Analise das Alternativas

### Resend

E a alternativa mais simples para o estagio atual. O Supabase possui integracao conhecida com o Resend, e o mesmo provedor pode futuramente enviar Propostas pela API sem obrigar o xCRM a trocar de infraestrutura. Para Auth, usar SMTP mantem templates, expiracao e links sob responsabilidade do Supabase.

O plano gratuito e suficiente para desenvolvimento e primeiros tenants, desde que o limite de 100 e-mails por dia seja monitorado. Em producao, o custo de US$ 20/mes e previsivel e ainda pequeno frente ao custo de suporte causado por convites e recuperacoes que nao chegam.

### Brevo

E a melhor segunda opcao quando o limite diario gratuito pesa ou quando existe intencao proxima de centralizar comunicacoes de marketing e outros canais. Para o xCRM atual, essa amplitude adiciona decisoes e telas que ainda nao precisamos.

### Postmark

Tem excelente posicionamento para e-mail transacional e boa separacao por streams. Eu o escolheria se a prioridade absoluta fosse observabilidade e reputacao transacional desde o primeiro cliente pagante, aceitando custo inicial e integracao um pouco mais cuidadosa.

### Amazon SES

O preco por mensagem e excelente, mas essa vantagem aparece em volume. No WIP atual, o custo humano de IAM, sandbox, reputacao e operacao supera a economia financeira. E uma alternativa futura, nao o caminho simples pedido agora.

### SMTP Corporativo

Gmail, Outlook ou servidor do proprio cliente podem funcionar em teste, mas transformam uma credencial pessoal/corporativa em dependencia critica do SaaS. Mudanca de senha, 2FA, bloqueio de conta ou politica do tenant pode interromper todos os convites. Nao recomendo como arquitetura oficial.

## Recomendacao

Seguir com **Supabase Auth + Custom SMTP do Resend**, em duas etapas:

1. Configurar dominio transacional dedicado, por exemplo `auth.seudominio.com`, com SPF, DKIM e DMARC; desabilitar rastreamento de abertura e links para mensagens de autenticacao.
2. Implementar no xCRM o ciclo de vida persistente do convite, com reenvio e auditoria, usando `supabase.auth.admin.inviteUserByEmail` no servidor.

O contraponto importante e que configurar apenas o SMTP nao conclui a #36. Sem estado persistido, uma falha entre criar o usuario interno e enviar o convite deixa cadastros ambiguos. A tabela de convites e o reenvio controlado fazem parte do corte minimo robusto.

## Modelo de Dados Proposto

Tabela futura `user_invites`:

- `id`, `tenant_id`, `user_id`, `invited_by_user_id`.
- `email`, `role` e `status`.
- `auth_user_id` retornado pelo Supabase.
- `sent_at`, `accepted_at`, `expires_at`, `canceled_at`.
- `attempt_count`, `last_error`, `created_at`, `updated_at`.
- indice por `tenant_id/status` e unicidade para convite ativo por usuario.

Nao guardar token de convite, senha ou chave SMTP no banco do xCRM.

## Plano de Implementacao Sugerido

### Corte 1 - Infraestrutura e Dominio (0,5 a 1 dia)

- Criar conta no Resend.
- Configurar subdominio transacional.
- Publicar SPF, DKIM e DMARC no DNS.
- Configurar Custom SMTP no Supabase e ajustar limites.
- Personalizar templates de convite, confirmacao e recuperacao.
- Fazer testes de entrega em Gmail e Outlook.

### Corte 2 - Convite Persistente (2 a 3 dias)

- Criar migration `user_invites` e atualizar Prisma.
- Adicionar chave administrativa somente ao ambiente do servidor.
- Alterar o cadastro de usuario para criar convite e chamar Supabase Admin.
- Gravar `auth_user_id`, estado e auditoria.
- Exibir estados na tela de Equipes e Usuarios.
- Implementar reenviar e cancelar.

### Corte 3 - Aceite e Endurecimento (1 a 2 dias)

- Validar callback/redirecionamento e primeiro login.
- Marcar convite como aceito sem confiar apenas no e-mail informado pelo navegador.
- Tratar convite expirado, usuario Auth ja existente, limite SMTP e reenvio concorrente.
- Adicionar testes de permissao e isolamento entre tenants.
- Preparar webhook de entrega/bounce como evolucao, sem bloquear o primeiro corte.

Estimativa total: **3,5 a 6 dias de desenvolvimento e validacao**, alem do tempo de propagacao DNS.

## Seguranca e Operacao

- `SUPABASE_SERVICE_ROLE_KEY` ou chave secreta equivalente fica apenas no servidor e nunca usa prefixo `NEXT_PUBLIC_`.
- Owner/Admin so pode convidar para o proprio tenant.
- Papel permitido continua restrito a Lider, Vendedor e Assistente.
- Convite e idempotente: duplo clique nao deve gerar dois usuarios ou dois envios simultaneos.
- Reenvio deve ter intervalo minimo e contador de tentativas.
- Logs nao devem registrar token, senha ou segredo SMTP.
- E-mails transacionais devem usar subdominio separado de campanhas.
- Bounce e reclamacao devem inativar novos reenvios automaticos ate revisao.

## Fontes Oficiais Consultadas

- Supabase Auth, limites: https://supabase.com/docs/guides/auth/rate-limits
- Supabase Auth, configuracao SMTP: https://supabase.com/docs/guides/auth/auth-smtp
- Resend, integracao Supabase: https://resend.com/supabase
- Resend, SMTP: https://resend.com/docs/send-with-smtp
- Resend, precos: https://resend.com/docs/knowledge-base/what-is-resend-pricing
- Brevo, SMTP transacional: https://developers.brevo.com/docs/smtp-integration
- Brevo, planos: https://help.brevo.com/hc/en-us/articles/208589409-About-Brevo-s-pricing-plans
- Postmark, SMTP: https://postmarkapp.com/developer/user-guide/send-email-with-smtp
- Postmark, precos: https://postmarkapp.com/pricing
- Amazon SES, precos: https://aws.amazon.com/ses/pricing/
- Amazon SES, saida do sandbox: https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html

## Decisoes Pendentes do Usuario

- Confirmar Resend como provedor inicial.
- Definir o dominio/subdominio de envio e o endereco remetente.
- Definir se o convite deve expirar em 24, 48 ou 72 horas.
- Definir se usuario convidado entra como Ativo imediatamente ou se a interface mostra um estado separado `Convite Pendente` ate o primeiro acesso.
