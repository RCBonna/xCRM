import type { User as SupabaseUser } from "@supabase/supabase-js";

import { prisma } from "@/lib/prisma";

export const PLATFORM_SUPPORT_PHONE = "(47) 99922-8490";
export const PLATFORM_SUPPORT_EMAIL = "ScientiamConsultoria@outlook.com";

export async function getPlatformAdmin(authUser: SupabaseUser) {
  return prisma.platformAdmin.findFirst({
    where: {
      authUserId: authUser.id,
      status: "ACTIVE",
    },
  });
}

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

async function notifyPlatformAdminsAboutSuspendedLogin(appUser: NonNullable<Awaited<ReturnType<typeof getAppUser>>>) {
  const platformAdmins = await prisma.platformAdmin.findMany({
    where: {
      status: "ACTIVE",
    },
    select: {
      id: true,
    },
  });

  if (platformAdmins.length === 0) {
    return;
  }

  await prisma.notification.createMany({
    data: platformAdmins.map((platformAdmin) => ({
      tenantId: appUser.tenantId,
      recipientPlatformAdminId: platformAdmin.id,
      actorUserId: appUser.id,
      type: "TENANT_SUSPENDED_LOGIN",
      title: "Login em Tenant Suspenso",
      body: `${appUser.name} (${appUser.email}) acessou o tenant suspenso ${appUser.tenant.name}.`,
      metadata: {
        tenantId: appUser.tenantId,
        tenantName: appUser.tenant.name,
        userId: appUser.id,
        userName: appUser.name,
        userEmail: appUser.email,
        userRole: appUser.role,
      },
    })),
  });
}

export function getTenantSuspendedRedirectPath() {
  return "/tenant-suspended";
}

export function isTenantSuspended(appUser: NonNullable<Awaited<ReturnType<typeof getAppUser>>>) {
  return appUser.tenant.status === "SUSPENDED";
}

export async function getDefaultRedirectPath(
  authUser: SupabaseUser,
  options: { recordSuspendedAccess?: boolean } = {},
) {
  const platformAdmin = await getPlatformAdmin(authUser);

  if (platformAdmin) {
    return "/platform";
  }

  const appUser = await getAppUser(authUser);

  if (!appUser) {
    return "/onboarding";
  }

  if (isTenantSuspended(appUser)) {
    if (options.recordSuspendedAccess) {
      await notifyPlatformAdminsAboutSuspendedLogin(appUser);
    }

    return getTenantSuspendedRedirectPath();
  }

  return "/dashboard";
}

export function redirectPathForTenantStatus(
  appUser: NonNullable<Awaited<ReturnType<typeof getAppUser>>>,
) {
  return isTenantSuspended(appUser) ? getTenantSuspendedRedirectPath() : null;
}
