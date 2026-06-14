UPDATE "public"."interactions"
SET "summary" = 'Dados Atualizados',
    "body" = CASE
      WHEN "body" = 'Dados básicos da Empresa/Prospect foram atualizados.'
        THEN 'Dados Básicos da Empresa/Prospect foram atualizados.'
      ELSE "body"
    END
WHERE "summary" = 'Cadastro atualizado';

UPDATE "public"."interactions"
SET "summary" = 'Prospect Criado',
    "body" = CASE
      WHEN "body" LIKE 'Cadastro inicial criado com contato principal:%'
        THEN replace(
          replace("body", 'Cadastro inicial', 'Cadastro Inicial'),
          'contato principal',
          'Contato Principal'
        )
      WHEN "body" = 'Cadastro inicial criado sem contato principal.'
        THEN 'Cadastro Inicial criado sem Contato Principal.'
      ELSE "body"
    END
WHERE "summary" = 'Prospect criado';

UPDATE "public"."pipelines"
SET "name" = 'Funil Comercial Padrão',
    "updated_at" = now()
WHERE "name" = 'Funil comercial padrão';
