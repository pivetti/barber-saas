"use server"

import { revalidatePath } from "next/cache"
import { canManageServices } from "@/app/_lib/admin-permissions"
import { requireAdmin } from "@/app/_lib/require-admin"
import { db } from "@/app/_lib/prisma"

const DEFAULT_SERVICE_IMAGE_URL = "/logo-jesi.png"

const parsePrice = (value: string) => {
  const normalized = value.replace(",", ".").trim()
  const price = Number(normalized)

  if (Number.isNaN(price) || price <= 0) {
    throw new Error("Preco inválido")
  }

  return price
}

export const createAdminService = async (formData: FormData) => {
  const admin = await requireAdmin()

  if (!canManageServices(admin.role)) {
    throw new Error("Not authorized to manage services")
  }

  const name = String(formData.get("name") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()
  const imageUrlRaw = String(formData.get("imageUrl") ?? "").trim()
  const priceRaw = String(formData.get("price") ?? "").trim()
  const imageUrl = imageUrlRaw || DEFAULT_SERVICE_IMAGE_URL

  if (!name || !priceRaw) {
    throw new Error("Nome e preco sao obrigatorios")
  }

  const price = parsePrice(priceRaw)

  await db.service.create({
    data: {
      name,
      description,
      imageUrl,
      price,
    },
  })

  revalidatePath("/admin/services")
  revalidatePath("/services")
}

export const updateAdminService = async (formData: FormData) => {
  const admin = await requireAdmin()

  if (!canManageServices(admin.role)) {
    throw new Error("Not authorized to manage services")
  }

  const serviceId = String(formData.get("serviceId") ?? "")
  const name = String(formData.get("name") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()
  const imageUrlRaw = String(formData.get("imageUrl") ?? "").trim()
  const priceRaw = String(formData.get("price") ?? "").trim()
  const imageUrl = imageUrlRaw || DEFAULT_SERVICE_IMAGE_URL

  if (!serviceId || !name || !priceRaw) {
    throw new Error("Nome e preco sao obrigatorios")
  }

  const price = parsePrice(priceRaw)

  await db.service.update({
    where: {
      id: serviceId,
    },
    data: {
      name,
      description,
      imageUrl,
      price,
    },
  })

  revalidatePath("/admin/services")
  revalidatePath("/services")
}

export const deleteAdminService = async (formData: FormData) => {
  const admin = await requireAdmin()

  if (!canManageServices(admin.role)) {
    throw new Error("Not authorized to manage services")
  }

  const serviceId = String(formData.get("serviceId") ?? "")
  if (!serviceId) {
    return
  }

  await db.service.delete({
    where: { id: serviceId },
  })

  revalidatePath("/admin/services")
  revalidatePath("/services")
}
