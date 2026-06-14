ALTER TABLE "public"."accounts"
ADD COLUMN IF NOT EXISTS "notes" text;
