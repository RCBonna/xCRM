import type { User as SupabaseUser } from "@supabase/supabase-js";

import { prisma } from "@/lib/prisma";

export async function getAppUser(authUser: SupabaseUser) {
  return prisma.user.findFirst({
    where: {
      authUserId: authUser.id,
      status: "ACTIVE",
    },
    include: {
      tenant: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function getDefaultRedirectPath(authUser: SupabaseUser) {
  const appUser = await getAppUser(authUser);

  return appUser ? "/dashboard" : "/onboarding";
}
