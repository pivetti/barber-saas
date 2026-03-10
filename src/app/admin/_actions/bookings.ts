"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { canManageBookings } from "@/app/_lib/admin-permissions"
import {
  adminReturnToSchema,
  customerNameSchema,
  dateInputSchema,
  idSchema,
  phoneSchema,
  sanitizeText,
  timeInputSchema,
} from "@/app/_lib/input-validation"
import { db } from "@/app/_lib/prisma"
import { requireAdmin } from "@/app/_lib/require-admin"

const editableBookingFields = ["client", "service", "time", "date"] as const
const editableBookingFieldSchema = z.enum(editableBookingFields)

const getBookingByIdForAdmin = async (bookingId: string, adminId: string) => {
  return db.booking.findFirst({
    where: {
      id: bookingId,
      barberId: adminId,
    },
    select: {
      id: true,
    },
  })
}

const revalidateAdminBookingPaths = (bookingId: string) => {
  revalidatePath("/admin/bookings")
  revalidatePath("/admin/dashboard")
  revalidatePath(`/admin/bookings/${bookingId}`)
  revalidatePath(`/admin/bookings/${bookingId}/edit`)
  revalidatePath("/bookings")
}

const parseActionBasePayload = (formData: FormData) => {
  return z
    .object({
      bookingId: idSchema,
      returnTo: adminReturnToSchema,
    })
    .safeParse({
      bookingId: String(formData.get("bookingId") ?? ""),
      returnTo: String(formData.get("returnTo") ?? ""),
    })
}

const parseDateFromInput = (value: string) => {
  const [year, month, day] = value.split("-").map(Number)
  const date = new Date(year, month - 1, day, 0, 0, 0, 0)
  return Number.isNaN(date.getTime()) ? null : date
}

export const cancelAdminBooking = async (formData: FormData) => {
  const admin = await requireAdmin()
  if (!canManageBookings(admin.role)) {
    throw new Error("Not authorized to manage bookings")
  }

  const parsed = parseActionBasePayload(formData)
  if (!parsed.success) {
    return
  }

  const booking = await getBookingByIdForAdmin(parsed.data.bookingId, admin.id)
  if (!booking) {
    return
  }

  const result = await db.booking.updateMany({
    where: {
      id: parsed.data.bookingId,
      barberId: admin.id,
    },
    data: {
      status: "CANCELED",
      cancellationRequested: false,
      cancellationRequestedAt: null,
    },
  })

  if (result.count !== 1) {
    return
  }

  revalidateAdminBookingPaths(parsed.data.bookingId)

  if (parsed.data.returnTo) {
    redirect(parsed.data.returnTo)
  }
}

export const concludeAdminBooking = async (formData: FormData) => {
  const admin = await requireAdmin()
  if (!canManageBookings(admin.role)) {
    throw new Error("Not authorized to manage bookings")
  }

  const parsed = parseActionBasePayload(formData)
  if (!parsed.success) {
    return
  }

  const booking = await getBookingByIdForAdmin(parsed.data.bookingId, admin.id)
  if (!booking) {
    return
  }

  const result = await db.booking.updateMany({
    where: {
      id: parsed.data.bookingId,
      barberId: admin.id,
    },
    data: {
      status: "DONE",
      cancellationRequested: false,
      cancellationRequestedAt: null,
    },
  })

  if (result.count !== 1) {
    return
  }

  revalidateAdminBookingPaths(parsed.data.bookingId)

  if (parsed.data.returnTo) {
    redirect(parsed.data.returnTo)
  }
}

export const deleteAdminBooking = async (formData: FormData) => {
  const admin = await requireAdmin()
  if (!canManageBookings(admin.role)) {
    throw new Error("Not authorized to manage bookings")
  }

  const parsed = parseActionBasePayload(formData)
  if (!parsed.success) {
    return
  }

  const booking = await getBookingByIdForAdmin(parsed.data.bookingId, admin.id)
  if (!booking) {
    return
  }

  const result = await db.booking.deleteMany({
    where: {
      id: parsed.data.bookingId,
      barberId: admin.id,
    },
  })

  if (result.count !== 1) {
    return
  }

  revalidateAdminBookingPaths(parsed.data.bookingId)

  if (parsed.data.returnTo) {
    redirect(parsed.data.returnTo)
  }
}

export const updateAdminBookingField = async (formData: FormData) => {
  const admin = await requireAdmin()
  if (!canManageBookings(admin.role)) {
    throw new Error("Not authorized to manage bookings")
  }

  const parsedHeader = z
    .object({
      bookingId: idSchema,
      field: editableBookingFieldSchema,
    })
    .safeParse({
      bookingId: String(formData.get("bookingId") ?? ""),
      field: sanitizeText(String(formData.get("field") ?? "")),
    })

  if (!parsedHeader.success) {
    return
  }

  const booking = await db.booking.findFirst({
    where: {
      id: parsedHeader.data.bookingId,
      barberId: admin.id,
    },
    select: {
      id: true,
      date: true,
    },
  })

  if (!booking) {
    return
  }

  if (parsedHeader.data.field === "client") {
    const parsedClient = z
      .object({
        customerName: customerNameSchema,
        customerPhone: phoneSchema,
      })
      .safeParse({
        customerName: String(formData.get("customerName") ?? ""),
        customerPhone: String(formData.get("customerPhone") ?? ""),
      })

    if (!parsedClient.success) {
      return
    }

    const result = await db.booking.updateMany({
      where: {
        id: parsedHeader.data.bookingId,
        barberId: admin.id,
      },
      data: {
        customerName: parsedClient.data.customerName,
        customerPhone: parsedClient.data.customerPhone,
      },
    })

    if (result.count !== 1) {
      return
    }
  }

  if (parsedHeader.data.field === "service") {
    const parsedServiceId = idSchema.safeParse(String(formData.get("serviceId") ?? ""))
    if (!parsedServiceId.success) {
      return
    }

    const service = await db.service.findUnique({
      where: {
        id: parsedServiceId.data,
      },
      select: {
        id: true,
      },
    })

    if (!service) {
      return
    }

    const result = await db.booking.updateMany({
      where: {
        id: parsedHeader.data.bookingId,
        barberId: admin.id,
      },
      data: {
        serviceId: service.id,
      },
    })

    if (result.count !== 1) {
      return
    }
  }

  if (parsedHeader.data.field === "time") {
    const parsedTime = timeInputSchema.safeParse(String(formData.get("time") ?? ""))
    if (!parsedTime.success) {
      return
    }

    const [hours, minutes] = parsedTime.data.split(":").map(Number)
    const nextDate = new Date(booking.date)
    nextDate.setHours(hours, minutes, 0, 0)

    const result = await db.booking.updateMany({
      where: {
        id: parsedHeader.data.bookingId,
        barberId: admin.id,
      },
      data: {
        date: nextDate,
      },
    })

    if (result.count !== 1) {
      return
    }
  }

  if (parsedHeader.data.field === "date") {
    const parsedDate = dateInputSchema.safeParse(String(formData.get("date") ?? ""))
    if (!parsedDate.success) {
      return
    }

    const nextDate = parseDateFromInput(parsedDate.data)
    if (!nextDate) {
      return
    }

    nextDate.setHours(booking.date.getHours(), booking.date.getMinutes(), 0, 0)

    const result = await db.booking.updateMany({
      where: {
        id: parsedHeader.data.bookingId,
        barberId: admin.id,
      },
      data: {
        date: nextDate,
      },
    })

    if (result.count !== 1) {
      return
    }
  }

  revalidateAdminBookingPaths(parsedHeader.data.bookingId)
  redirect(`/admin/bookings/${parsedHeader.data.bookingId}`)
}
