"use server"

import { getUserFromToken } from "../_lib/auth"
import { db } from "../_lib/prisma"

export const getConfirmedBookings = async () => {
  const user = await getUserFromToken()
  if (!user) {
    return []
  }

  return db.booking.findMany({
    where: {
      userId: user.id,
      status: "SCHEDULED",
      date: {
        gte: new Date(),
      },
    },
    include: {
      service: true,
      barber: true,
    },
    orderBy: {
      date: "asc",
    },
  })
}
