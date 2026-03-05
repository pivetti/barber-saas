"use server"

import { endOfDay, startOfDay } from "date-fns"
import { db } from "../_lib/prisma"

interface GetBookingsProps {
  barberId?: string
  date: Date
}

export const getBookings = ({ date, barberId }: GetBookingsProps) => {
  return db.booking.findMany({
    where: {
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
