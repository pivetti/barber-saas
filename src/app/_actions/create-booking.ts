"use server"

import { randomBytes } from "crypto"
import { addWeeks, endOfDay, getDay, isSameDay, startOfDay } from "date-fns"
import { revalidatePath } from "next/cache"
import { format } from "date-fns"
import { getBarberAvailableTimesForDate } from "../_lib/barber-schedule"
import { db } from "../_lib/prisma"

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
  if (getDay(date) === 0) {
    return true
  }

  return getBrazilNationalHolidays(date.getFullYear()).some((holiday) =>
    isSameDay(holiday, date),
  )
}

export const createBooking = async (params: CreateBookingParams) => {
  const customerName = params.customerName.trim()
  const customerPhone = params.customerPhone.replace(/\D/g, "")

  if (customerName.length < 2) {
    throw new Error("Informe um nome valido")
  }

  if (customerPhone.length < 10) {
    throw new Error("Informe um telefone valido com DDD")
  }

  if (!params.barberId) {
    throw new Error("Selecione um barbeiro")
  }

  const todayStart = startOfDay(new Date())
  const maxBookingDate = endOfDay(addWeeks(new Date(), 4))

  if (params.date < todayStart) {
    throw new Error("Não e possível agendar em datas passadas")
  }

  if (params.date > maxBookingDate) {
    throw new Error("Você so pode agendar ate 4 semanas a partir de hoje")
  }

  if (isSundayOrBrazilHoliday(params.date)) {
    throw new Error("Não e possível agendar aos domingos e feriados nacionais")
  }

  const availableTimes = await getBarberAvailableTimesForDate({
    barberId: params.barberId,
    date: params.date,
  })

  const selectedTime = format(params.date, "HH:mm")
  if (!availableTimes.includes(selectedTime)) {
    throw new Error("Este horário esta indisponivel. Escolha outro.")
  }

  const conflictingBooking = await db.booking.findFirst({
    where: {
      barberId: params.barberId,
      date: params.date,
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
      serviceId: params.serviceId,
      barberId: params.barberId,
      date: params.date,
      customerName,
      customerPhone,
      cancellationToken: `ct_${randomBytes(16).toString("hex")}`,
    },
    select: {
      id: true,
      cancellationToken: true,
    },
  })

  revalidatePath("/")
  revalidatePath("/bookings")
  revalidatePath("/admin/bookings")
  revalidatePath("/admin/dashboard")

  return booking
}
