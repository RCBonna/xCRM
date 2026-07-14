-- Criada em: 2026-07-13 11:15:00 -03:00
-- Mantém a trilha auditável de suspensão e reativação de organizações.

CREATE TABLE IF NOT EXISTS public.tenant_status_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  status public."RecordStatus" NOT NULL,
  reason text,
  changed_by_platform_admin_id uuid NOT NULL REFERENCES public.platform_admins(id) ON DELETE RESTRICT,
  created_at timestamptz(6) NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tenant_status_events_tenant_created_idx
  ON public.tenant_status_events (tenant_id, created_at DESC);
