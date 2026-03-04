"use server"

import { endOfDay, startOfDay } from "date-fns"
import { db } from "../_lib/prisma"

interface GetBookingsProps {
  serviceId: string
  barberId?: string
  date: Date
}

export const getBookings = ({ date, serviceId, barberId }: GetBookingsProps) => {
  return db.booking.findMany({
    where: {
      serviceId,
      barberId,
      status: {
        not: "CANCELED",
      },
      date: {
        lte: endOfDay(date),
        gte: startOfDay(date),
      },
    },
  })
}
