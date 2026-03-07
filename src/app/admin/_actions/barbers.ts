"use server"

import bcrypt from "bcrypt"
import { BarberRole, Prisma } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import {
  canChangeBarberRole,
  canEditBarber,
  canManageBarbers,
  canToggleBarberStatus,
} from "@/app/_lib/admin-permissions"
import {
  emailSchema,
  idSchema,
  nameSchema,
  optionalUrlSchema,
  passwordSchema,
  phoneSchema,
  sanitizeText,
} from "@/app/_lib/input-validation"
import { db } from "@/app/_lib/prisma"
import { requireAdmin } from "@/app/_lib/require-admin"

const BARBER_DEFAULT_IMAGE_URL = "/logo-jesi.png"
const optionalPhoneSchema = z
  .string()
  .transform((value) => value.trim())
  .refine((value) => value.length === 0 || value.length <= 20, "Invalid phone")
  .transform((value) => (value.length === 0 ? undefined : value))
  .pipe(phoneSchema.optional())

const createBarberSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: optionalPhoneSchema,
  password: passwordSchema,
  imageUrl: optionalUrlSchema,
  role: z.enum(["ADMIN", "BARBER"]),
})

const updateBarberSchema = z.object({
  barberId: idSchema,
  name: nameSchema,
  email: emailSchema,
  phone: optionalPhoneSchema,
  password: z
    .string()
    .transform((value) => value.trim())
    .transform((value) => (value.length > 0 ? value : undefined))
    .pipe(passwordSchema.optional()),
  imageUrl: optionalUrlSchema,
})

const changeRoleSchema = z.object({
  barberId: idSchema,
  role: z.enum(["ADMIN", "BARBER"]),
})

const normalizePhone = (value: string) => {
  const digits = value.replace(/\D/g, "").trim()
  return digits.length > 0 ? digits : null
}

const revalidateBarberPages = () => {
  revalidatePath("/admin/barbers")
  revalidatePath("/admin/barbers/new")
}

const parseUniqueError = (error: unknown) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw new Error("Email ou telefone já cadastrado")
  }
}

export const createBarber = async (formData: FormData) => {
  const admin = await requireAdmin()

  if (!canManageBarbers(admin.role)) {
    throw new Error("Not authorized to manage barbers")
  }

  const parsed = createBarberSchema.safeParse({
    name: sanitizeText(String(formData.get("name") ?? "")),
    email: sanitizeText(String(formData.get("email") ?? "")),
    phone: String(formData.get("phone") ?? ""),
    password: String(formData.get("password") ?? ""),
    imageUrl: String(formData.get("imageUrl") ?? ""),
    role: String(formData.get("role") ?? "BARBER"),
  })

  if (!parsed.success) {
    throw new Error("Invalid barber data")
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12)

  try {
    await db.barber.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: normalizePhone(parsed.data.phone ?? ""),
        password: passwordHash,
        imageUrl: parsed.data.imageUrl ?? BARBER_DEFAULT_IMAGE_URL,
        role: parsed.data.role,
        isActive: true,
      },
    })
  } catch (error) {
    parseUniqueError(error)
    throw error
  }

  revalidateBarberPages()
  redirect("/admin/barbers")
}

export const updateBarber = async (formData: FormData) => {
  const admin = await requireAdmin()

  if (!canManageBarbers(admin.role)) {
    throw new Error("Not authorized to manage barbers")
  }

  const parsed = updateBarberSchema.safeParse({
    barberId: String(formData.get("barberId") ?? ""),
    name: sanitizeText(String(formData.get("name") ?? "")),
    email: sanitizeText(String(formData.get("email") ?? "")),
    phone: String(formData.get("phone") ?? ""),
    password: String(formData.get("password") ?? ""),
    imageUrl: String(formData.get("imageUrl") ?? ""),
  })

  if (!parsed.success) {
    throw new Error("Invalid barber data")
  }

  const target = await db.barber.findUnique({
    where: { id: parsed.data.barberId },
    select: {
      id: true,
      role: true,
    },
  })

  if (!target) {
    throw new Error("Barber not found")
  }

  if (!canEditBarber(admin, target.role)) {
    throw new Error("Not authorized to edit this barber")
  }

  const data: Prisma.BarberUpdateInput = {
    name: parsed.data.name,
    email: parsed.data.email,
    phone: normalizePhone(parsed.data.phone ?? ""),
    imageUrl: parsed.data.imageUrl ?? BARBER_DEFAULT_IMAGE_URL,
  }

  if (parsed.data.password) {
    data.password = await bcrypt.hash(parsed.data.password, 12)
    data.sessionVersion = {
      increment: 1,
    }
  }

  try {
    await db.barber.update({
      where: { id: target.id },
      data,
    })
  } catch (error) {
    parseUniqueError(error)
    throw error
  }

  revalidateBarberPages()
  revalidatePath(`/admin/barbers/${target.id}/edit`)
  redirect("/admin/barbers")
}

export const toggleBarberStatus = async (formData: FormData) => {
  const admin = await requireAdmin()

  if (!canManageBarbers(admin.role)) {
    throw new Error("Not authorized to manage barbers")
  }

  const parsedBarberId = idSchema.safeParse(String(formData.get("barberId") ?? ""))
  if (!parsedBarberId.success) {
    return
  }
  const barberId = parsedBarberId.data

  const target = await db.barber.findUnique({
    where: { id: barberId },
    select: {
      id: true,
      role: true,
      isActive: true,
    },
  })

  if (!target) {
    return
  }

  if (!canToggleBarberStatus(admin, target.role, target.id)) {
    throw new Error("Not authorized to toggle this barber")
  }

  await db.barber.update({
    where: { id: target.id },
    data: {
      isActive: !target.isActive,
    },
  })

  revalidateBarberPages()
}

export const changeBarberRole = async (formData: FormData) => {
  const admin = await requireAdmin()

  if (!canManageBarbers(admin.role)) {
    throw new Error("Not authorized to manage barbers")
  }

  const parsed = changeRoleSchema.safeParse({
    barberId: String(formData.get("barberId") ?? ""),
    role: String(formData.get("role") ?? ""),
  })

  if (!parsed.success) {
    throw new Error("Invalid role update")
  }

  const target = await db.barber.findUnique({
    where: { id: parsed.data.barberId },
    select: {
      id: true,
      role: true,
    },
  })

  if (!target) {
    throw new Error("Barber not found")
  }

  const nextRole = parsed.data.role as BarberRole

  if (admin.id === target.id) {
    throw new Error("Cannot change your own role")
  }

  if (!canChangeBarberRole(admin, target.role, nextRole)) {
    throw new Error("Not authorized to change this role")
  }

  await db.barber.update({
    where: { id: target.id },
    data: {
      role: nextRole,
    },
  })

  revalidateBarberPages()
}
