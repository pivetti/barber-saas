"use server"

import { revalidatePath } from "next/cache"
import { db } from "../_lib/prisma"

const normalizeToken = (token: string) => token.trim()

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
    return { ok: false, message: "Token invalido" }
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

export const requestCancellationByToken = async (token: string) => {
  const booking = await findBookingByToken(normalizeToken(token))
  if (!booking) {
    return { ok: false, message: "Token invalido" }
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
