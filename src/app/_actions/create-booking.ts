"use server"

import { revalidatePath } from "next/cache"
import { getUserFromToken } from "../_lib/auth"
import { db } from "../_lib/prisma"

interface CreateBookingParams {
  serviceId: string
  date: Date
}

export const createBooking = async (params: CreateBookingParams) => {
  const user = await getUserFromToken()
  if (!user) {
    throw new Error("Usuario nao autenticado")
  }

  await db.booking.create({
    data: {
      ...params,
      userId: user.id,
    },
  })

  revalidatePath("/")
  revalidatePath("/bookings")
}
