"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/app/_lib/require-admin"
import { db } from "@/app/_lib/prisma"

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
const validSlotIntervals = new Set([10, 15, 20, 30])

const normalizeTime = (value: string) => value.trim().slice(0, 5)

const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

const parseDateFromInput = (value: string) => {
  const date = new Date(`${value}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    throw new Error("Data invalida")
  }

  return date
}

const parseTimeRange = (start: string, end: string) => {
  const startTime = normalizeTime(start)
  const endTime = normalizeTime(end)

  if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
    throw new Error("Horario invalido")
  }

  if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
    throw new Error("Horario inicial deve ser menor que o horario final")
  }

  return {
    startTime,
    endTime,
  }
}

const revalidateSchedulePages = () => {
  revalidatePath("/admin/schedule")
  revalidatePath("/")
}

export const updateSlotInterval = async (formData: FormData) => {
  const admin = await requireAdmin()
  const slotIntervalMinutes = Number(formData.get("slotIntervalMinutes"))

  if (!validSlotIntervals.has(slotIntervalMinutes)) {
    throw new Error("Intervalo invalido")
  }

  await db.scheduleSettings.upsert({
    where: {
      barberId: admin.id,
    },
    create: {
      barberId: admin.id,
      slotIntervalMinutes,
    },
    update: {
      slotIntervalMinutes,
    },
  })

  revalidateSchedulePages()
}

export const addWorkingHour = async (formData: FormData) => {
  const admin = await requireAdmin()

  const dayOfWeek = Number(formData.get("dayOfWeek"))
  const { startTime, endTime } = parseTimeRange(
    String(formData.get("startTime") ?? ""),
    String(formData.get("endTime") ?? ""),
  )

  if (Number.isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
    throw new Error("Dia da semana invalido")
  }

  await db.workingHour.upsert({
    where: {
      barberId_dayOfWeek_startTime_endTime: {
        barberId: admin.id,
        dayOfWeek,
        startTime,
        endTime,
      },
    },
    create: {
      barberId: admin.id,
      dayOfWeek,
      startTime,
      endTime,
    },
    update: {
      startTime,
      endTime,
    },
  })

  revalidateSchedulePages()
}

export const deleteWorkingHour = async (formData: FormData) => {
  const admin = await requireAdmin()
  const workingHourId = String(formData.get("workingHourId") ?? "")

  if (!workingHourId) {
    return
  }

  await db.workingHour.deleteMany({
    where: {
      id: workingHourId,
      barberId: admin.id,
    },
  })

  revalidateSchedulePages()
}

export const createBlockedTime = async (formData: FormData) => {
  const admin = await requireAdmin()

  const dateInput = String(formData.get("date") ?? "").trim()
  const reason = String(formData.get("reason") ?? "").trim()
  const date = parseDateFromInput(dateInput)
  const { startTime, endTime } = parseTimeRange(
    String(formData.get("startTime") ?? ""),
    String(formData.get("endTime") ?? ""),
  )

  await db.blockedTime.create({
    data: {
      barberId: admin.id,
      date,
      startTime,
      endTime,
      reason: reason || null,
    },
  })

  revalidateSchedulePages()
}

export const deleteBlockedTime = async (formData: FormData) => {
  const admin = await requireAdmin()
  const blockedTimeId = String(formData.get("blockedTimeId") ?? "")

  if (!blockedTimeId) {
    return
  }

  await db.blockedTime.deleteMany({
    where: {
      id: blockedTimeId,
      barberId: admin.id,
    },
  })

  revalidateSchedulePages()
}
