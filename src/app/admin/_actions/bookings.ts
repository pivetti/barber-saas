"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/app/_lib/require-admin"
import { db } from "@/app/_lib/prisma"

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

export const cancelAdminBooking = async (formData: FormData) => {
  const admin = await requireAdmin()
  const bookingId = String(formData.get("bookingId") ?? "")

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
    },
  })

  revalidatePath("/admin/bookings")
  revalidatePath("/admin/dashboard")
  revalidatePath("/bookings")
}

export const concludeAdminBooking = async (formData: FormData) => {
  const admin = await requireAdmin()
  const bookingId = String(formData.get("bookingId") ?? "")

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
    },
  })

  revalidatePath("/admin/bookings")
  revalidatePath("/admin/dashboard")
  revalidatePath("/bookings")
}

export const deleteAdminBooking = async (formData: FormData) => {
  const admin = await requireAdmin()
  const bookingId = String(formData.get("bookingId") ?? "")

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

  revalidatePath("/admin/bookings")
  revalidatePath("/admin/dashboard")
  revalidatePath("/bookings")
}
