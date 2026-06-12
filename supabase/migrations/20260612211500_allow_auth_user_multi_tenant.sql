-- Allow one Supabase Auth identity to participate in more than one tenant.
-- The tenant isolation helper already supports multiple rows per auth user.

DROP INDEX IF EXISTS "public"."users_auth_user_id_key";

CREATE INDEX IF NOT EXISTS "users_auth_user_id_idx"
ON "public"."users"("auth_user_id");
