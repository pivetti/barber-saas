"use server"

import { randomBytes } from "crypto"
import { addWeeks } from "date-fns"
import { revalidatePath } from "next/cache"
import { format } from "date-fns"
import { z } from "zod"
import {
  getBrasiliaDayOfWeek,
  getBrasiliaEndOfDay,
  getBrasiliaTodayStart,
  isSameBrasiliaDay,
  toBrasiliaWallClock,
} from "../_lib/brasilia-time"
import { getBarberAvailableTimesForDate } from "../_lib/barber-schedule"
import { customerNameSchema, idSchema, phoneSchema } from "../_lib/input-validation"
import { db } from "../_lib/prisma"
import { createPublicBookingSession } from "../_lib/public-booking-session"
import { enforceRateLimit } from "../_lib/rate-limit"
import { getRequestIp } from "../_lib/request-ip"

interface CreateBookingParams {
  serviceId: string
  barberId: string
  date: Date
  customerName: string
  customerPhone: string
}

const getEasterDate = (year: number) => {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1

  return new Date(year, month - 1, day)
}

const addDays = (date: Date, days: number) => {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + days)
  return nextDate
}

const getBrazilNationalHolidays = (year: number) => {
  const easter = getEasterDate(year)
  return [
    new Date(year, 0, 1), // Confraternizacao Universal
    new Date(year, 3, 21), // Tiradentes
    new Date(year, 4, 1), // Dia do Trabalhador
    new Date(year, 8, 7), // Independencia do Brasil
    new Date(year, 9, 12), // Nossa Senhora Aparecida
    new Date(year, 10, 2), // Finados
    new Date(year, 10, 15), // Proclamacao da Republica
    new Date(year, 11, 25), // Natal
    addDays(easter, -48), // Carnaval (segunda)
    addDays(easter, -47), // Carnaval (terca)
    addDays(easter, -2), // Sexta-feira Santa
    addDays(easter, 60), // Corpus Christi
  ]
}

const isSundayOrBrazilHoliday = (date: Date) => {
  if (getBrasiliaDayOfWeek(date) === 0) {
    return true
  }

  return getBrazilNationalHolidays(date.getFullYear()).some((holiday) =>
    isSameBrasiliaDay(holiday, date),
  )
}

export const createBooking = async (params: CreateBookingParams) => {
  const ipAddress = await getRequestIp()
  await enforceRateLimit(ipAddress, "create-booking")

  const parsed = z
    .object({
      serviceId: idSchema,
      barberId: idSchema,
      date: z.date(),
      customerName: customerNameSchema,
      customerPhone: phoneSchema,
    })
    .safeParse(params)

  if (!parsed.success) {
    throw new Error("Dados de agendamento invalidos")
  }

  const { serviceId, barberId, date, customerName, customerPhone } = parsed.data

  const todayStart = getBrasiliaTodayStart()
  const maxBookingDate = getBrasiliaEndOfDay(addWeeks(todayStart, 4))

  if (date < todayStart) {
    throw new Error("Não e possível agendar em datas passadas")
  }

  if (date > maxBookingDate) {
    throw new Error("Você so pode agendar ate 4 semanas a partir de hoje")
  }

  if (isSundayOrBrazilHoliday(date)) {
    throw new Error("Não e possível agendar aos domingos e feriados nacionais")
  }

  const [service, barber] = await Promise.all([
    db.service.findUnique({
      where: { id: serviceId },
      select: { id: true },
    }),
    db.barber.findUnique({
      where: { id: barberId },
      select: { id: true, isActive: true },
    }),
  ])

  if (!service) {
    throw new Error("Servico invalido")
  }

  if (!barber || !barber.isActive) {
    throw new Error("Barbeiro indisponivel")
  }

  const availableTimes = await getBarberAvailableTimesForDate({
    barberId,
    date,
  })

  const selectedTime = format(toBrasiliaWallClock(date), "HH:mm")
  if (!availableTimes.includes(selectedTime)) {
    throw new Error("Este horário esta indisponivel. Escolha outro.")
  }

  const conflictingBooking = await db.booking.findFirst({
    where: {
      barberId,
      date,
      status: {
        not: "CANCELED",
      },
    },
  })

  if (conflictingBooking) {
    throw new Error("Este horário ja esta agendado. Escolha outro.")
  }

  const booking = await db.booking.create({
    data: {
      serviceId,
      barberId,
      date,
      customerName,
      customerPhone,
      cancellationToken: `ct_${randomBytes(16).toString("hex")}`,
    },
    select: {
      id: true,
    },
  })

  await createPublicBookingSession(booking.id)

  revalidatePath("/")
  revalidatePath("/bookings")
  revalidatePath("/admin/bookings")
  revalidatePath("/admin/dashboard")

  return booking
}
