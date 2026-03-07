"use server"

import { revalidatePath } from "next/cache"
import { db } from "../_lib/prisma"

const normalizeToken = (token: string) => token.trim()
const normalizePhone = (phone: string) => phone.replace(/\D/g, "")

const findBookingByToken = async (token: string) => {
  if (!token) {
    return null
  }

  return db.booking.findUnique({
    where: { cancellationToken: token },
    include: {
      service: true,
      barber: true,
    },
  })
}

const parseDateTimeFromForm = (date: string, time: string) => {
  const dateMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  const timeMatch = time.match(/^([01]\d|2[0-3]):([0-5]\d)$/)

  if (!dateMatch || !timeMatch) {
    return null
  }

  const parsedDate = new Date(
    Number(dateMatch[1]),
    Number(dateMatch[2]) - 1,
    Number(dateMatch[3]),
    Number(timeMatch[1]),
    Number(timeMatch[2]),
    0,
    0,
  )

  if (Number.isNaN(parsedDate.getTime())) {
    return null
  }

  return parsedDate
}

interface CancellationRequestWithoutTokenInput {
  customerName: string
  customerPhone: string
  barberId: string
  date: string
  time: string
}

const findCandidateBookings = async (input: CancellationRequestWithoutTokenInput) => {
  const normalizedName = input.customerName.trim()
  const normalizedPhone = normalizePhone(input.customerPhone)
  const parsedDateTime = parseDateTimeFromForm(input.date, input.time)

  if (
    normalizedName.length < 2 ||
    normalizedPhone.length < 10 ||
    !input.barberId ||
    !parsedDateTime
  ) {
    return { ok: false as const, message: "Preencha todos os campos corretamente" }
  }

  const minuteStart = new Date(parsedDateTime)
  const minuteEnd = new Date(parsedDateTime)
  minuteEnd.setMinutes(minuteEnd.getMinutes() + 1)

  const bookings = await db.booking.findMany({
    where: {
      customerName: {
        equals: normalizedName,
        mode: "insensitive",
      },
      customerPhone: normalizedPhone,
      barberId: input.barberId,
      date: {
        gte: minuteStart,
        lt: minuteEnd,
      },
      status: "SCHEDULED",
    },
    include: {
      service: true,
      barber: true,
    },
    orderBy: {
      date: "asc",
    },
  })

  return {
    ok: true as const,
    bookings,
  }
}

const revalidateBookingPaths = () => {
  revalidatePath("/bookings")
  revalidatePath("/admin/bookings")
  revalidatePath("/admin/dashboard")
}

export const getPublicBookingByToken = async (token: string) => {
  const booking = await findBookingByToken(normalizeToken(token))
  if (!booking) {
    return null
  }

  return {
    id: booking.id,
    status: booking.status,
    customerName: booking.customerName,
    customerPhone: booking.customerPhone,
    date: booking.date,
    cancellationRequested: booking.cancellationRequested,
    serviceName: booking.service.name,
    barberName: booking.barber?.name ?? null,
  }
}

export const cancelBookingByToken = async (token: string) => {
  const booking = await findBookingByToken(normalizeToken(token))
  if (!booking) {
    return { ok: false, message: "Token inválido" }
  }

  if (booking.status === "CANCELED") {
    return { ok: false, message: "Este agendamento ja foi cancelado" }
  }

  if (booking.status === "DONE" || booking.date < new Date()) {
    return { ok: false, message: "Não e possível cancelar um agendamento encerrado" }
  }

  await db.booking.update({
    where: { id: booking.id },
    data: {
      status: "CANCELED",
      cancellationRequested: false,
      cancellationRequestedAt: null,
    },
  })

  revalidateBookingPaths()

  return { ok: true, message: "Agendamento cancelado com sucesso" }
}

export const requestCancellationByToken = async (token: string) => {
  const booking = await findBookingByToken(normalizeToken(token))
  if (!booking) {
    return { ok: false, message: "Token inválido" }
  }

  if (booking.status === "CANCELED") {
    return { ok: false, message: "Este agendamento ja foi cancelado" }
  }

  if (booking.status === "DONE" || booking.date < new Date()) {
    return { ok: false, message: "Este agendamento ja foi encerrado" }
  }

  if (booking.cancellationRequested) {
    return { ok: false, message: "Cancelamento ja solicitado para este agendamento" }
  }

  await db.booking.update({
    where: { id: booking.id },
    data: {
      cancellationRequested: true,
      cancellationRequestedAt: new Date(),
    },
  })

  revalidateBookingPaths()

  return { ok: true, message: "Solicitação de cancelamento enviada ao barbeiro" }
}

export const requestCancellationWithoutToken = async (
  input: CancellationRequestWithoutTokenInput,
) => {
  const result = await findCandidateBookings(input)
  if (!result.ok) {
    return result
  }

  if (result.bookings.length === 0) {
    return { ok: false, message: "Nenhum agendamento encontrado com os dados informados" }
  }

  if (result.bookings.length > 1) {
    return {
      ok: true,
      requiresConfirmation: true as const,
      message: "Encontramos mais de um agendamento. Confirme qual você deseja cancelar.",
      candidates: result.bookings.map((booking) => ({
        id: booking.id,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        serviceName: booking.service.name,
        barberName: booking.barber?.name ?? null,
        date: booking.date,
      })),
    }
  }

  const booking = result.bookings[0]

  if (booking.cancellationRequested) {
    return { ok: false, message: "Cancelamento ja solicitado para este agendamento" }
  }

  await db.booking.update({
    where: { id: booking.id },
    data: {
      cancellationRequested: true,
      cancellationRequestedAt: new Date(),
    },
  })

  revalidateBookingPaths()

  return { ok: true, message: "Solicitação de cancelamento enviada ao barbeiro" }
}

export const confirmCancellationWithoutToken = async (
  bookingId: string,
  input: CancellationRequestWithoutTokenInput,
) => {
  if (!bookingId) {
    return { ok: false, message: "Agendamento inválido" }
  }

  const result = await findCandidateBookings(input)
  if (!result.ok) {
    return result
  }

  const booking = result.bookings.find((item) => item.id === bookingId)
  if (!booking) {
    return { ok: false, message: "Não foi possível confirmar este agendamento" }
  }

  if (booking.cancellationRequested) {
    return { ok: false, message: "Cancelamento ja solicitado para este agendamento" }
  }

  await db.booking.update({
    where: { id: booking.id },
    data: {
      cancellationRequested: true,
      cancellationRequestedAt: new Date(),
    },
  })

  revalidateBookingPaths()

  return { ok: true, message: "Solicitação de cancelamento enviada ao barbeiro" }
}
