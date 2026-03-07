"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import {
  customerNameSchema,
  dateInputSchema,
  idSchema,
  phoneSchema,
  timeInputSchema,
} from "../_lib/input-validation"
import { db } from "../_lib/prisma"
import {
  clearPublicBookingSession,
  createPublicBookingSession,
  getPublicBookingFromSession,
} from "../_lib/public-booking-session"
import { RateLimitExceededError, checkRateLimit } from "../_lib/rate-limit"
import { getRequestIp } from "../_lib/request-ip"

const CANCELLATION_TOKEN_REGEX = /^ct_[a-f0-9]{32}$/i
const INVALID_TOKEN_DELAY_MS = 250
const GENERIC_MESSAGE = "Nao foi possivel processar sua solicitacao agora"

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const normalizeToken = (token: string) => token.trim()
const normalizePhone = (phone: string) => phone.replace(/\D/g, "")

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

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate
}

interface CancellationRequestWithoutTokenInput {
  customerName: string
  customerPhone: string
  barberId: string
  date: string
  time: string
}

const cancellationRequestWithoutTokenSchema = z.object({
  customerName: customerNameSchema,
  customerPhone: phoneSchema,
  barberId: idSchema,
  date: dateInputSchema,
  time: timeInputSchema,
})

const applyPublicRateLimit = async () => {
  const ipAddress = await getRequestIp()
  const result = await checkRateLimit(ipAddress, "manage-booking-by-token")

  if (!result.allowed) {
    throw new RateLimitExceededError("manage-booking-by-token", result.retryAfter ?? 60)
  }
}

const mapPublicBooking = (booking: NonNullable<Awaited<ReturnType<typeof getPublicBookingFromSession>>>) => ({
  id: booking.id,
  status: booking.status,
  customerName: booking.customerName,
  customerPhone: booking.customerPhone,
  date: booking.date,
  cancellationRequested: booking.cancellationRequested,
  serviceName: booking.service.name,
  barberName: booking.barber?.name ?? null,
})

const revalidateBookingPaths = () => {
  revalidatePath("/bookings")
  revalidatePath("/bookings/confirmed")
  revalidatePath("/admin/bookings")
  revalidatePath("/admin/dashboard")
}

export const startPublicBookingSessionWithToken = async (token: string) => {
  try {
    await applyPublicRateLimit()
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return { ok: false as const, message: GENERIC_MESSAGE, retryAfter: error.retryAfter }
    }

    throw error
  }

  const normalizedToken = normalizeToken(token)
  if (!CANCELLATION_TOKEN_REGEX.test(normalizedToken)) {
    await clearPublicBookingSession()
    await delay(INVALID_TOKEN_DELAY_MS)
    return { ok: false as const, message: GENERIC_MESSAGE }
  }

  const booking = await db.booking.findUnique({
    where: { cancellationToken: normalizedToken },
    select: { id: true },
  })

  if (!booking) {
    await clearPublicBookingSession()
    await delay(INVALID_TOKEN_DELAY_MS)
    return { ok: false as const, message: GENERIC_MESSAGE }
  }

  await createPublicBookingSession(booking.id)
  return { ok: true as const }
}

export const getManagedPublicBooking = async () => {
  try {
    await applyPublicRateLimit()
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return null
    }

    throw error
  }

  const booking = await getPublicBookingFromSession()
  if (!booking) {
    return null
  }

  return mapPublicBooking(booking)
}

export const cancelManagedBooking = async () => {
  try {
    await applyPublicRateLimit()
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return { ok: false, message: GENERIC_MESSAGE, retryAfter: error.retryAfter }
    }

    throw error
  }

  const booking = await getPublicBookingFromSession()
  if (!booking) {
    return { ok: false, message: GENERIC_MESSAGE }
  }

  if (booking.status === "CANCELED") {
    return { ok: false, message: "Este agendamento ja foi cancelado" }
  }

  if (booking.status === "DONE" || booking.date < new Date()) {
    return { ok: false, message: "Nao e possivel cancelar um agendamento encerrado" }
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

export const requestManagedCancellation = async () => {
  try {
    await applyPublicRateLimit()
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return { ok: false, message: GENERIC_MESSAGE, retryAfter: error.retryAfter }
    }

    throw error
  }

  const booking = await getPublicBookingFromSession()
  if (!booking) {
    return { ok: false, message: GENERIC_MESSAGE }
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
  return { ok: true, message: "Solicitacao de cancelamento enviada ao barbeiro" }
}

const findCandidateBookings = async (input: CancellationRequestWithoutTokenInput) => {
  const parsedInput = cancellationRequestWithoutTokenSchema.safeParse(input)
  if (!parsedInput.success) {
    return { ok: false as const, message: "Preencha todos os campos corretamente" }
  }

  const normalizedName = parsedInput.data.customerName
  const normalizedPhone = normalizePhone(parsedInput.data.customerPhone)
  const parsedDateTime = parseDateTimeFromForm(parsedInput.data.date, parsedInput.data.time)
  if (!parsedDateTime) {
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
      barberId: parsedInput.data.barberId,
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

export const requestCancellationWithoutToken = async (
  input: CancellationRequestWithoutTokenInput,
) => {
  try {
    await applyPublicRateLimit()
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return { ok: false, message: GENERIC_MESSAGE, retryAfter: error.retryAfter }
    }

    throw error
  }

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
      message: "Encontramos mais de um agendamento. Confirme qual voce deseja cancelar.",
      candidates: result.bookings.map((booking) => ({
        id: booking.id,
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
  return { ok: true, message: "Solicitacao de cancelamento enviada ao barbeiro" }
}

export const confirmCancellationWithoutToken = async (
  bookingId: string,
  input: CancellationRequestWithoutTokenInput,
) => {
  try {
    await applyPublicRateLimit()
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return { ok: false, message: GENERIC_MESSAGE, retryAfter: error.retryAfter }
    }

    throw error
  }

  if (!bookingId) {
    return { ok: false, message: "Agendamento invalido" }
  }

  const result = await findCandidateBookings(input)
  if (!result.ok) {
    return result
  }

  const booking = result.bookings.find((item) => item.id === bookingId)
  if (!booking) {
    return { ok: false, message: "Nao foi possivel confirmar este agendamento" }
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
  return { ok: true, message: "Solicitacao de cancelamento enviada ao barbeiro" }
}

// Compat wrappers (legacy callers)
export const getPublicBookingByToken = async (token: string) => {
  const session = await startPublicBookingSessionWithToken(token)
  if (!session.ok) {
    return null
  }

  return getManagedPublicBooking()
}

export const cancelBookingByToken = async (token?: string) => {
  if (token) {
    const session = await startPublicBookingSessionWithToken(token)
    if (!session.ok) {
      return session
    }
  }

  return cancelManagedBooking()
}

export const requestCancellationByToken = async (token?: string) => {
  if (token) {
    const session = await startPublicBookingSessionWithToken(token)
    if (!session.ok) {
      return session
    }
  }

  return requestManagedCancellation()
}
