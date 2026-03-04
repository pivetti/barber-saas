"use server"

import { getDay, isSameDay } from "date-fns"
import { revalidatePath } from "next/cache"
import { getUserFromToken } from "../_lib/auth"
import { db } from "../_lib/prisma"

interface CreateBookingParams {
  serviceId: string
  barberId: string
  date: Date
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
  const user = await getUserFromToken()
  if (!user) {
    throw new Error("Usuario nao autenticado")
  }

  if (!params.barberId) {
    throw new Error("Selecione um barbeiro")
  }

  if (isSundayOrBrazilHoliday(params.date)) {
    throw new Error("Nao e possivel agendar aos domingos e feriados nacionais")
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
