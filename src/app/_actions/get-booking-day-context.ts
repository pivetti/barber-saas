"use server"

import { endOfDay, startOfDay } from "date-fns"
import { db } from "../_lib/prisma"
import { getBarberAvailableTimesForDate } from "../_lib/barber-schedule"

interface GetBookingDayContextProps {
  barberId: string
  date: Date
}

export const getBookingDayContext = async ({ barberId, date }: GetBookingDayContextProps) => {
  const [bookings, availableTimes] = await Promise.all([
    db.booking.findMany({
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
    }),
    getBarberAvailableTimesForDate({
      barberId,
      date,
    }),
  ])

  return {
    bookings,
    availableTimes,
  }
}
