import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type AppUserForVisibility = {
  id: string;
  role: string;
  tenantId: string;
};

export function canSeeWholeTenant(role: string) {
  return ["OWNER", "ADMIN"].includes(role);
}

export async function getVisibleWorkOwnerIds(appUser: AppUserForVisibility) {
  if (canSeeWholeTenant(appUser.role)) {
    return null;
  }

  if (appUser.role !== "MANAGER") {
    return [appUser.id];
  }

  const teamMembers = await prisma.teamMember.findMany({
    where: {
      tenantId: appUser.tenantId,
      team: {
        managerUserId: appUser.id,
      },
    },
    select: {
      userId: true,
    },
  });

  return Array.from(
    new Set([appUser.id, ...teamMembers.map((member) => member.userId)]),
  );
}

export async function getVisibleAccountOwnerIds(appUser: AppUserForVisibility) {
  return getVisibleWorkOwnerIds(appUser);
}

export async function getActivityVisibilityWhere(
  appUser: AppUserForVisibility,
): Promise<Prisma.ActivityWhereInput> {
  const ownerIds = await getVisibleWorkOwnerIds(appUser);

  if (!ownerIds) {
    return {};
  }

  return {
    ownerUserId: {
      in: ownerIds,
    },
  };
}

export async function getAccountVisibilityWhere(
  appUser: AppUserForVisibility,
): Promise<Prisma.AccountWhereInput> {
  const ownerIds = await getVisibleAccountOwnerIds(appUser);

  if (!ownerIds) {
    return {};
  }

  return {
    ownerUserId: {
      in: ownerIds,
    },
  };
}
