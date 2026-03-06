"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/app/_lib/require-admin"
import { db } from "@/app/_lib/prisma"

const parsePrice = (value: string) => {
  const normalized = value.replace(",", ".").trim()
  const price = Number(normalized)

  if (Number.isNaN(price) || price <= 0) {
    throw new Error("Preco invalido")
  }

  return price
}

export const createAdminService = async (formData: FormData) => {
  await requireAdmin()

  const name = String(formData.get("name") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()
  const imageUrl = String(formData.get("imageUrl") ?? "").trim()
  const priceRaw = String(formData.get("price") ?? "").trim()

  if (!name || !description || !imageUrl || !priceRaw) {
    throw new Error("Todos os campos sao obrigatorios")
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
  await requireAdmin()

  const serviceId = String(formData.get("serviceId") ?? "")
  const name = String(formData.get("name") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()
  const imageUrl = String(formData.get("imageUrl") ?? "").trim()
  const priceRaw = String(formData.get("price") ?? "").trim()

  if (!serviceId || !name || !description || !imageUrl || !priceRaw) {
    throw new Error("Todos os campos sao obrigatorios")
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
  await requireAdmin()

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
