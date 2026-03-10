const BRASILIA_UTC_OFFSET_MS = -3 * 60 * 60 * 1000

interface BrasiliaDateParts {
  year: number
  month: number
  day: number
  hours: number
  minutes: number
  seconds: number
}

const getShiftedUtcDate = (date: Date) => new Date(date.getTime() + BRASILIA_UTC_OFFSET_MS)

export const toBrasiliaWallClock = (date: Date) => getShiftedUtcDate(date)

export const getBrasiliaDateParts = (date: Date): BrasiliaDateParts => {
  const shiftedDate = getShiftedUtcDate(date)

  return {
    year: shiftedDate.getUTCFullYear(),
    month: shiftedDate.getUTCMonth() + 1,
    day: shiftedDate.getUTCDate(),
    hours: shiftedDate.getUTCHours(),
    minutes: shiftedDate.getUTCMinutes(),
    seconds: shiftedDate.getUTCSeconds(),
  }
}

export const createUtcDateFromBrasiliaParts = (
  year: number,
  month: number,
  day: number,
  hours = 0,
  minutes = 0,
  seconds = 0,
  milliseconds = 0,
) => {
  return new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds, milliseconds) - BRASILIA_UTC_OFFSET_MS)
}

export const getBrasiliaStartOfDay = (date: Date) => {
  const { year, month, day } = getBrasiliaDateParts(date)
  return createUtcDateFromBrasiliaParts(year, month, day, 0, 0, 0, 0)
}

export const getBrasiliaEndOfDay = (date: Date) => {
  const { year, month, day } = getBrasiliaDateParts(date)
  return createUtcDateFromBrasiliaParts(year, month, day, 23, 59, 59, 999)
}

export const getBrasiliaTodayStart = () => getBrasiliaStartOfDay(new Date())

export const getBrasiliaDayOfWeek = (date: Date) => getShiftedUtcDate(date).getUTCDay()

export const isSameBrasiliaDay = (left: Date, right: Date) => {
  const leftParts = getBrasiliaDateParts(left)
  const rightParts = getBrasiliaDateParts(right)

  return (
    leftParts.year === rightParts.year &&
    leftParts.month === rightParts.month &&
    leftParts.day === rightParts.day
  )
}
