"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireAdmin } from "@/app/_lib/require-admin"
import { db } from "@/app/_lib/prisma"

const editableBookingFields = ["client", "service", "time", "date"] as const
type EditableBookingField = (typeof editableBookingFields)[number]

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

const isEditableBookingField = (field: string): field is EditableBookingField => {
  return editableBookingFields.includes(field as EditableBookingField)
}

export const cancelAdminBooking = async (formData: FormData) => {
  const admin = await requireAdmin()
  const bookingId = String(formData.get("bookingId") ?? "")
  const returnTo = String(formData.get("returnTo") ?? "")

  if (!bookingId) {
    return
  }

  const booking = await getBookingByIdForAdmin(bookingId, admin.id)
  if (!booking) {
    return
  }

  await db.booking.update({
    where: { id: bookingId },
    data: {
      status: "CANCELED",
      cancellationRequested: false,
      cancellationRequestedAt: null,
    },
  })

  revalidateAdminBookingPaths(bookingId)

  if (returnTo) {
    redirect(returnTo)
  }
}

export const concludeAdminBooking = async (formData: FormData) => {
  const admin = await requireAdmin()
  const bookingId = String(formData.get("bookingId") ?? "")
  const returnTo = String(formData.get("returnTo") ?? "")

  if (!bookingId) {
    return
  }

  const booking = await getBookingByIdForAdmin(bookingId, admin.id)
  if (!booking) {
    return
  }

  await db.booking.update({
    where: { id: bookingId },
    data: {
      status: "DONE",
      cancellationRequested: false,
      cancellationRequestedAt: null,
    },
  })

  revalidateAdminBookingPaths(bookingId)

  if (returnTo) {
    redirect(returnTo)
  }
}

export const deleteAdminBooking = async (formData: FormData) => {
  const admin = await requireAdmin()
  const bookingId = String(formData.get("bookingId") ?? "")
  const returnTo = String(formData.get("returnTo") ?? "")

  if (!bookingId) {
    return
  }

  const booking = await getBookingByIdForAdmin(bookingId, admin.id)
  if (!booking) {
    return
  }

  await db.booking.delete({
    where: { id: bookingId },
  })

  revalidateAdminBookingPaths(bookingId)

  if (returnTo) {
    redirect(returnTo)
  }
}

export const updateAdminBookingField = async (formData: FormData) => {
  const admin = await requireAdmin()
  const bookingId = String(formData.get("bookingId") ?? "")
  const field = String(formData.get("field") ?? "")

  if (!bookingId || !isEditableBookingField(field)) {
    return
  }

  const booking = await db.booking.findFirst({
    where: {
      id: bookingId,
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

  if (field === "client") {
    const customerName = String(formData.get("customerName") ?? "").trim()
    const customerPhone = String(formData.get("customerPhone") ?? "")
      .replace(/\D/g, "")
      .trim()

    if (!customerName || customerPhone.length < 10) {
      return
    }

    await db.booking.update({
      where: { id: bookingId },
      data: {
        customerName,
        customerPhone,
      },
    })
  }

  if (field === "service") {
    const serviceId = String(formData.get("serviceId") ?? "")
    if (!serviceId) {
      return
    }

    const service = await db.service.findUnique({
      where: {
        id: serviceId,
      },
      select: {
        id: true,
      },
    })

    if (!service) {
      return
    }

    await db.booking.update({
      where: { id: bookingId },
      data: {
        serviceId: service.id,
      },
    })
  }

  if (field === "time") {
    const time = String(formData.get("time") ?? "")
    const timeMatch = time.match(/^([01]\d|2[0-3]):([0-5]\d)$/)

    if (!timeMatch) {
      return
    }

    const nextDate = new Date(booking.date)
    nextDate.setHours(Number(timeMatch[1]), Number(timeMatch[2]), 0, 0)

    await db.booking.update({
      where: { id: bookingId },
      data: {
        date: nextDate,
      },
    })
  }

  if (field === "date") {
    const date = String(formData.get("date") ?? "")
    const dateMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})$/)

    if (!dateMatch) {
      return
    }

    const nextDate = new Date(
      Number(dateMatch[1]),
      Number(dateMatch[2]) - 1,
      Number(dateMatch[3]),
      booking.date.getHours(),
      booking.date.getMinutes(),
      0,
      0,
    )

    if (Number.isNaN(nextDate.getTime())) {
      return
    }

    await db.booking.update({
      where: { id: bookingId },
      data: {
        date: nextDate,
      },
    })
  }

  revalidateAdminBookingPaths(bookingId)
  redirect(`/admin/bookings/${bookingId}`)
}
