-- 2026-07-17 14:30:00 -03:00
-- Modulo inicial de Produtos e Propostas.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProposalStatus') THEN
    CREATE TYPE "ProposalStatus" AS ENUM (
      'DRAFT',
      'READY',
      'SENT',
      'ACCEPTED',
      'REJECTED',
      'EXPIRED',
      'SUPERSEDED',
      'CANCELED'
    );
  END IF;
END $$;

ALTER TABLE "tenants"
  ADD COLUMN IF NOT EXISTS "next_proposal_number" INTEGER NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS "products" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "created_by_user_id" UUID,
  "sku" TEXT,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "unit" TEXT NOT NULL DEFAULT 'UN',
  "base_price" DECIMAL(12, 2) NOT NULL DEFAULT 0,
  "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "products_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "products_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "products_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "proposals" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "account_id" UUID NOT NULL,
  "opportunity_id" UUID NOT NULL,
  "contact_id" UUID,
  "owner_user_id" UUID,
  "number" INTEGER NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "status" "ProposalStatus" NOT NULL DEFAULT 'DRAFT',
  "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "valid_until" TIMESTAMP(3),
  "currency" TEXT NOT NULL DEFAULT 'BRL',
  "subtotal" DECIMAL(12, 2) NOT NULL DEFAULT 0,
  "discount" DECIMAL(12, 2) NOT NULL DEFAULT 0,
  "freight" DECIMAL(12, 2) NOT NULL DEFAULT 0,
  "additions" DECIMAL(12, 2) NOT NULL DEFAULT 0,
  "total" DECIMAL(12, 2) NOT NULL DEFAULT 0,
  "introduction" TEXT,
  "payment_terms" TEXT,
  "commercial_terms" TEXT,
  "notes" TEXT,
  "published_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "proposals_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "proposals_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "proposals_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "proposals_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "proposals_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "proposals_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "proposal_items" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "proposal_id" UUID NOT NULL,
  "product_id" UUID,
  "position" INTEGER NOT NULL,
  "snapshot_sku" TEXT,
  "snapshot_name" TEXT NOT NULL,
  "snapshot_description" TEXT,
  "snapshot_unit" TEXT NOT NULL DEFAULT 'UN',
  "quantity" DECIMAL(12, 3) NOT NULL DEFAULT 1,
  "unit_price" DECIMAL(12, 2) NOT NULL DEFAULT 0,
  "discount" DECIMAL(12, 2) NOT NULL DEFAULT 0,
  "line_total" DECIMAL(12, 2) NOT NULL DEFAULT 0,
  CONSTRAINT "proposal_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "proposal_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "proposal_items_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "proposal_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "products_tenant_id_sku_key" ON "products"("tenant_id", "sku");
CREATE INDEX IF NOT EXISTS "products_tenant_status_name_idx" ON "products"("tenant_id", "status", "name");
CREATE UNIQUE INDEX IF NOT EXISTS "proposals_tenant_number_version_key" ON "proposals"("tenant_id", "number", "version");
CREATE INDEX IF NOT EXISTS "proposals_tenant_account_idx" ON "proposals"("tenant_id", "account_id");
CREATE INDEX IF NOT EXISTS "proposals_tenant_opportunity_idx" ON "proposals"("tenant_id", "opportunity_id");
CREATE INDEX IF NOT EXISTS "proposals_tenant_status_idx" ON "proposals"("tenant_id", "status");
CREATE INDEX IF NOT EXISTS "proposal_items_tenant_proposal_idx" ON "proposal_items"("tenant_id", "proposal_id");
