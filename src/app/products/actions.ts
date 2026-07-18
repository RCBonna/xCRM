"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAppUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function encodeMessage(message: string) {
  return encodeURIComponent(message);
}

function normalizeOptionalText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

function parseMoney(value: FormDataEntryValue | null) {
  const text = String(value ?? "")
    .trim()
    .replace(/[^\d,.-]/g, "");

  if (!text) {
    return "0.00";
  }

  const normalized = text.includes(",")
    ? text.replace(/\./g, "").replace(",", ".")
    : text.split(".").length > 2
      ? text.replace(/\./g, "")
      : text;
  const amount = Number(normalized);

  return Number.isFinite(amount) && amount >= 0 ? amount.toFixed(2) : "0.00";
}

function getProductsRedirect(formData: FormData, fallback = "/products") {
  const returnTo = String(formData.get("returnTo") ?? "").trim();

  if (!returnTo) {
    return fallback;
  }

  try {
    const returnUrl = new URL(returnTo, "http://xcrm.local");

    if (
      returnUrl.pathname === "/products" ||
      /^\/products\/[0-9a-f-]{36}$/i.test(returnUrl.pathname)
    ) {
      return `${returnUrl.pathname}${returnUrl.search}`;
    }
  } catch {
    // Mantem fallback seguro quando o retorno informado nao e valido.
  }

  return fallback;
}

function getCreateProductErrorPath(formData: FormData, message: string) {
  const params = new URLSearchParams({
    tab: "new",
    error: message,
  });

  for (const field of ["sku", "name", "unit", "basePrice", "description"]) {
    const value = String(formData.get(field) ?? "").trim();

    if (value) {
      params.set(field, field === "description" ? value.slice(0, 1500) : value);
    }
  }

  return `/products?${params.toString()}`;
}

function validateProductFields({
  sku,
  name,
  unit,
  onError,
}: {
  sku: string | null | undefined;
  name: string;
  unit: string;
  onError: (message: string) => string;
}) {
  if (name.length < 2) {
    redirect(onError("Informe o nome do Produto."));
  }

  if (name.length > 90) {
    redirect(onError("Nome do Produto deve ter no máximo 90 caracteres."));
  }

  if (sku && sku.length > 20) {
    redirect(onError("SKU deve ter no máximo 20 caracteres."));
  }

  if (unit.length > 6) {
    redirect(onError("Unidade deve ter no máximo 6 caracteres."));
  }
}

async function getCatalogUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const appUser = await getAppUser(user);

  if (!appUser) {
    redirect("/onboarding");
  }

  if (!["OWNER", "ADMIN"].includes(appUser.role)) {
    redirect("/dashboard?error=Sem%20permissao%20para%20catalogo.");
  }

  return appUser;
}

export async function createProductAction(formData: FormData) {
  const appUser = await getCatalogUser();
  const sku = normalizeOptionalText(formData.get("sku"))?.toLocaleUpperCase("pt-BR");
  const name = String(formData.get("name") ?? "")
    .trim()
    .toLocaleUpperCase("pt-BR");
  const description = normalizeOptionalText(formData.get("description"));
  const unit =
    normalizeOptionalText(formData.get("unit"))?.toLocaleUpperCase("pt-BR") ??
    "UN";
  const basePrice = parseMoney(formData.get("basePrice"));

  validateProductFields({
    sku,
    name,
    unit,
    onError: (message) => getCreateProductErrorPath(formData, message),
  });

  if (sku) {
    const existingProduct = await prisma.product.findFirst({
      where: {
        tenantId: appUser.tenantId,
        sku,
      },
      select: {
        id: true,
      },
    });

    if (existingProduct) {
      redirect(getCreateProductErrorPath(formData, "Este SKU já existe."));
    }
  }

  await prisma.product.create({
    data: {
      tenantId: appUser.tenantId,
      createdByUserId: appUser.id,
      sku,
      name,
      description,
      unit,
      basePrice,
    },
  });

  revalidatePath("/products");
  redirect(`/products?message=${encodeMessage("Produto cadastrado.")}`);
}

export async function updateProductAction(formData: FormData) {
  const appUser = await getCatalogUser();
  const productId = String(formData.get("productId") ?? "").trim();
  const sku = normalizeOptionalText(formData.get("sku"))?.toLocaleUpperCase("pt-BR");
  const name = String(formData.get("name") ?? "")
    .trim()
    .toLocaleUpperCase("pt-BR");
  const description = normalizeOptionalText(formData.get("description"));
  const unit =
    normalizeOptionalText(formData.get("unit"))?.toLocaleUpperCase("pt-BR") ??
    "UN";
  const basePrice = parseMoney(formData.get("basePrice"));
  const errorPath = productId ? `/products/${productId}` : "/products";

  if (!productId) {
    redirect("/products?error=Registro%20nao%20informado.");
  }

  validateProductFields({
    sku,
    name,
    unit,
    onError: (message) => `${errorPath}?error=${encodeMessage(message)}`,
  });

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      tenantId: appUser.tenantId,
    },
    select: {
      id: true,
    },
  });

  if (!product) {
    redirect(`/products?error=${encodeMessage("Produto não encontrado.")}`);
  }

  if (sku) {
    const existingProduct = await prisma.product.findFirst({
      where: {
        tenantId: appUser.tenantId,
        id: {
          not: product.id,
        },
        sku,
      },
      select: {
        id: true,
      },
    });

    if (existingProduct) {
      redirect(`${errorPath}?error=${encodeMessage("Este SKU já existe.")}`);
    }
  }

  await prisma.product.update({
    where: {
      id: product.id,
    },
    data: {
      sku,
      name,
      description,
      unit,
      basePrice,
    },
  });

  revalidatePath("/products");
  revalidatePath(`/products/${product.id}`);
  redirect(`/products?tab=catalog&message=${encodeMessage("Produto atualizado.")}`);
}

export async function setProductStatusAction(formData: FormData) {
  const appUser = await getCatalogUser();
  const productId = String(formData.get("productId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const returnPath = getProductsRedirect(formData);

  if (!productId || !["ACTIVE", "INACTIVE"].includes(status)) {
    redirect("/products?error=Registro%20nao%20informado.");
  }

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      tenantId: appUser.tenantId,
    },
    select: {
      id: true,
    },
  });

  if (!product) {
    redirect(`/products?error=${encodeMessage("Produto não encontrado.")}`);
  }

  await prisma.product.update({
    where: {
      id: product.id,
    },
    data: {
      status: status === "ACTIVE" ? "ACTIVE" : "INACTIVE",
    },
  });

  revalidatePath("/products");
  revalidatePath(`/products/${product.id}`);
  redirect(
    `${returnPath}${
      returnPath.includes("?") ? "&" : "?"
    }message=${encodeMessage("Status do Produto atualizado.")}`,
  );
}
