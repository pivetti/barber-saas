"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { canManageServices } from "@/app/_lib/admin-permissions"
import {
  idSchema,
  optionalUrlSchema,
  sanitizeText,
  serviceDescriptionSchema,
} from "@/app/_lib/input-validation"
import { db } from "@/app/_lib/prisma"
import { requireAdmin } from "@/app/_lib/require-admin"

const DEFAULT_SERVICE_IMAGE_URL = "/logo-jesi.png"

const serviceNameSchema = z.string().transform(sanitizeText).pipe(z.string().min(2).max(80))
const priceInputSchema = z
  .string()
  .transform((value) => value.replace(",", ".").trim())
  .pipe(z.string().regex(/^\d+(\.\d{1,2})?$/).max(16))

const createServiceSchema = z.object({
  name: serviceNameSchema,
  description: serviceDescriptionSchema,
  imageUrl: optionalUrlSchema,
  price: priceInputSchema,
})

const updateServiceSchema = createServiceSchema.extend({
  serviceId: idSchema,
})

const parsePrice = (value: string) => {
  const price = Number(value)

  if (Number.isNaN(price) || price <= 0 || price > 100000) {
    throw new Error("Preco invalido")
  }

  return price
}

export const createAdminService = async (formData: FormData) => {
  const admin = await requireAdmin()

  if (!canManageServices(admin.role)) {
    throw new Error("Not authorized to manage services")
  }

  const parsed = createServiceSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    imageUrl: String(formData.get("imageUrl") ?? ""),
    price: String(formData.get("price") ?? ""),
  })

  if (!parsed.success) {
    throw new Error("Invalid service data")
  }

  const price = parsePrice(parsed.data.price)

  await db.service.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      imageUrl: parsed.data.imageUrl ?? DEFAULT_SERVICE_IMAGE_URL,
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

  const parsed = updateServiceSchema.safeParse({
    serviceId: String(formData.get("serviceId") ?? ""),
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    imageUrl: String(formData.get("imageUrl") ?? ""),
    price: String(formData.get("price") ?? ""),
  })

  if (!parsed.success) {
    throw new Error("Invalid service data")
  }

  const price = parsePrice(parsed.data.price)

  await db.service.update({
    where: {
      id: parsed.data.serviceId,
    },
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      imageUrl: parsed.data.imageUrl ?? DEFAULT_SERVICE_IMAGE_URL,
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

  const parsedServiceId = idSchema.safeParse(String(formData.get("serviceId") ?? ""))
  if (!parsedServiceId.success) {
    return
  }

  await db.service.delete({
    where: { id: parsedServiceId.data },
  })

  revalidatePath("/admin/services")
  revalidatePath("/services")
}
