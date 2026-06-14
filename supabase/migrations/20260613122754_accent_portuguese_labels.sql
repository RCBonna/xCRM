UPDATE "public"."pipeline_stages"
SET "name" = 'Qualificação',
    "updated_at" = now()
WHERE "name" = 'Qualificacao';

UPDATE "public"."pipeline_stages"
SET "name" = 'Negociação',
    "updated_at" = now()
WHERE "name" = 'Negociacao';

UPDATE "public"."pipelines"
SET "name" = 'Funil comercial padrão',
    "updated_at" = now()
WHERE "name" = 'Funil comercial padrao';

UPDATE "public"."activities"
SET "title" = 'Revisar configurações iniciais do xCRM',
    "updated_at" = now()
WHERE "title" = 'Revisar configuracoes iniciais do xCRM';
