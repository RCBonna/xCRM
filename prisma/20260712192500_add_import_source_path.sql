-- Criada em: 2026-07-12 19:25:00 -03:00
-- Registra o caminho de origem informado manualmente pelo Owner no upload.

ALTER TABLE public.imports
  ADD COLUMN IF NOT EXISTS source_path text;
