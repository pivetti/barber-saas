"use server"

import { endOfDay, startOfDay } from "date-fns"
import { z } from "zod"
import { idSchema } from "../_lib/input-validation"
import { db } from "../_lib/prisma"
import { RateLimitExceededError, enforceRateLimit } from "../_lib/rate-limit"
import { getRequestIp } from "../_lib/request-ip"
import { getBarberAvailableTimesForDate } from "../_lib/barber-schedule"

interface GetBookingDayContextProps {
  barberId: string
  date: Date
}

export const getBookingDayContext = async ({ barberId, date }: GetBookingDayContextProps) => {
  try {
    const ipAddress = await getRequestIp()
    await enforceRateLimit(ipAddress, "get-booking-day-context")
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return {
        bookings: [],
        availableTimes: [],
      }
    }

    throw error
  }

  const parsed = z
    .object({
      barberId: idSchema,
      date: z.date(),
    })
    .safeParse({ barberId, date })

  if (!parsed.success) {
    return {
      bookings: [],
      availableTimes: [],
    }
  }

  const [bookings, availableTimes] = await Promise.all([
    db.booking.findMany({
      where: {
        barberId: parsed.data.barberId,
        status: {
          not: "CANCELED",
        },
        date: {
          lte: endOfDay(parsed.data.date),
          gte: startOfDay(parsed.data.date),
        },
      },
      select: {
        date: true,
      },
    }),
    getBarberAvailableTimesForDate({
      barberId: parsed.data.barberId,
      date: parsed.data.date,
    }),
  ])

  return {
    bookings,
    availableTimes,
  }
}
