"use server"

import { getUserFromToken } from "../_lib/auth"
import { db } from "../_lib/prisma"

export const getConcludedBookings = async () => {
  const user = await getUserFromToken()
  if (!user) {
    return []
  }

  return db.booking.findMany({
    where: {
      userId: user.id,
      OR: [
        {
          status: "DONE",
        },
        {
          date: {
            lt: new Date(),
          },
        },
      ],
    },
    include: {
      service: true,
      barber: true,
    },
    orderBy: {
      date: "desc",
    },
  })
}
