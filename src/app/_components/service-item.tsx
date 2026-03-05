"use client"

import { Booking, Service } from "@prisma/client"
import {
  addWeeks,
  endOfDay,
  getDay,
  isPast,
  isSameDay,
  isToday,
  set,
  startOfDay,
} from "date-fns"
import { ptBR } from "date-fns/locale"
import Image from "next/image"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { createBooking } from "../_actions/create-booking"
import { getBookings } from "../_actions/get-bookings"
import { getServiceImageUrl } from "../_lib/get-service-image-url"
import { cn } from "../_lib/utils"
import BookingSummary from "./booking-summary"
import { Button } from "./ui/button"
import { Calendar } from "./ui/calendar"
import { Card, CardContent } from "./ui/card"
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "./ui/sheet"

type ServiceItemModel = Pick<Service, "id" | "name" | "description" | "imageUrl"> & {
  price: Service["price"] | number | string
}

interface ServiceItemProps {
  service: ServiceItemModel
  barber: {
    id: string
    name: string
  }
}

const TIME_LIST = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
]

interface GetTimeListProps {
  bookings: Booking[]
  selectedDay: Date
}

interface TimeSlot {
  time: string
  available: boolean
  unavailableMessage?: string
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

  const holidays = getBrazilNationalHolidays(date.getFullYear())
  return holidays.some((holiday) => isSameDay(holiday, date))
}

const getTimeList = ({ bookings, selectedDay }: GetTimeListProps): TimeSlot[] => {
  if (isSundayOrBrazilHoliday(selectedDay)) {
    return []
  }

  return TIME_LIST.map((time) => {
    const hour = Number(time.split(":")[0])
    const minutes = Number(time.split(":")[1])

    const timeIsOnThePast = isPast(
      set(selectedDay, {
        hours: hour,
        minutes,
        seconds: 0,
        milliseconds: 0,
      }),
    )
    if (timeIsOnThePast && isToday(selectedDay)) {
      return {
        time,
        available: false,
        unavailableMessage: "Este horario ja passou.",
      }
    }

    const hasBookingOnCurrentTime = bookings.some((booking) => {
      const bookingDate = new Date(booking.date)
      return (
        bookingDate.getHours() === hour &&
        bookingDate.getMinutes() === minutes
      )
    })

    if (hasBookingOnCurrentTime) {
      return {
        time,
        available: false,
        unavailableMessage: "Este horario ja esta agendado. Escolha outro.",
      }
    }

    return {
      time,
      available: true,
    }
  })
}

const ServiceItem = ({ service, barber }: ServiceItemProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [bookingSheetIsOpen, setBookingSheetIsOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState<Date | undefined>()
  const [selectedTime, setSelectedTime] = useState<string | undefined>()
  const [dayBookings, setDayBookings] = useState<Booking[]>([])
  const serviceImageUrl = getServiceImageUrl(service.name, service.imageUrl)
  const maxBookingDate = endOfDay(addWeeks(new Date(), 4))

  useEffect(() => {
    const fetchBookings = async () => {
      if (!selectedDay) {
        setDayBookings([])
        return
      }

      const bookings = await getBookings({
        date: selectedDay,
        barberId: barber.id,
      })

      setDayBookings(bookings)
    }

    fetchBookings()
  }, [barber.id, selectedDay, service.id])

  const selectedDate = useMemo(() => {
    if (!selectedDay || !selectedTime) {
      return undefined
    }

    return set(selectedDay, {
      hours: Number(selectedTime.split(":")[0]),
      minutes: Number(selectedTime.split(":")[1]),
      seconds: 0,
      milliseconds: 0,
    })
  }, [selectedDay, selectedTime])

  const timeList = useMemo(() => {
    if (!selectedDay) {
      return []
    }

    return getTimeList({
      bookings: dayBookings,
      selectedDay,
    })
  }, [dayBookings, selectedDay])

  useEffect(() => {
    if (!selectedTime) {
      return
    }

    const selectedTimeIsAvailable = timeList.some(
      (slot) => slot.time === selectedTime && slot.available,
    )

    if (!selectedTimeIsAvailable) {
      setSelectedTime(undefined)
    }
  }, [selectedTime, timeList])

  const getLoginRedirectPath = () => {
    const query = searchParams.toString()
    return query ? `${pathname}?${query}` : pathname
  }

  const isAuthenticated = async () => {
    try {
      const response = await fetch("/api/me", { cache: "no-store" })
      if (!response.ok) return false
      const data = (await response.json()) as { authenticated?: boolean }
      return Boolean(data.authenticated)
    } catch {
      return false
    }
  }

  const handleBookingClick = async () => {
    const authenticated = await isAuthenticated()
    if (!authenticated) {
      const next = encodeURIComponent(getLoginRedirectPath())
      router.push(`/login?next=${next}`)
      return
    }

    setBookingSheetIsOpen(true)
  }

  const handleCreateBooking = async () => {
    if (!selectedDate) {
      toast.error("Selecione data e horario")
      return
    }

    try {
      await createBooking({
        serviceId: service.id,
        barberId: barber.id,
        date: selectedDate,
      })

      toast.success("Reserva criada com sucesso", {
        action: {
          label: "Ver agendamentos",
          onClick: () => router.push("/bookings"),
        },
      })

      setBookingSheetIsOpen(false)
      setSelectedDay(undefined)
      setSelectedTime(undefined)
    } catch (error) {
      console.error(error)
      const authenticated = await isAuthenticated()
      if (!authenticated) {
        const next = encodeURIComponent(getLoginRedirectPath())
        router.push(`/login?next=${next}`)
        return
      }

      const message =
        error instanceof Error ? error.message : "Erro ao criar reserva"
      toast.error(message)
    }
  }

  return (
    <>
      <Card className="group aspect-square h-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70 transition-all duration-200 hover:border-violet-500/40 sm:aspect-auto">
        <CardContent className="flex h-full flex-col p-0">
          <div className="grid grid-cols-[44px_1fr] items-center gap-2 p-2.5 sm:grid-cols-[110px_1fr] sm:gap-4 sm:p-5">
            <div className="relative h-11 w-11 shrink-0 sm:h-[110px] sm:w-[110px]">
              <Image
                alt={service.name}
                src={serviceImageUrl}
                fill
                className="rounded-xl object-cover transition-transform duration-200 group-hover:scale-[1.02]"
              />
            </div>

            <div className="min-w-0 space-y-1.5 sm:space-y-2">
              <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-zinc-100 sm:line-clamp-1 sm:text-base">
                {service.name}
              </h3>
              <p className="hidden line-clamp-2 text-xs leading-relaxed text-zinc-400 sm:block sm:text-sm">
                {service.description}
              </p>
            </div>
          </div>

          <div className="mt-auto border-t border-zinc-800 bg-zinc-950/40 p-2.5 sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-2 sm:px-4 sm:py-3">
                <p className="text-[9px] uppercase tracking-[0.14em] text-zinc-400 sm:text-[10px]">
                  Valor
                </p>
                <p className="text-sm font-bold text-violet-300 sm:text-base">
                  {Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(Number(service.price))}
                </p>
              </div>

              <Button
                variant="default"
                size="default"
                onClick={handleBookingClick}
                className="h-8 w-full rounded-xl bg-violet-500 text-sm font-semibold text-white hover:bg-violet-400 sm:h-10 sm:w-auto sm:min-w-[132px]"
              >
                Reservar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Sheet open={bookingSheetIsOpen} onOpenChange={setBookingSheetIsOpen}>
        <SheetContent className="w-[90%] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Fazer reserva</SheetTitle>
          </SheetHeader>

          <div className="py-6">
            <Calendar
              mode="single"
              selected={selectedDay}
              onSelect={setSelectedDay}
              disabled={(date) =>
                date < startOfDay(new Date()) ||
                date > maxBookingDate ||
                isSundayOrBrazilHoliday(date)
              }
              locale={ptBR}
              className="mx-auto"
            />

            {selectedDay && (
              <>
                {timeList.length > 0 ? (
                  <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {timeList.map((slot) => (
                      <Button
                        key={slot.time}
                        variant={selectedTime === slot.time ? "default" : "outline"}
                        onClick={() => {
                          if (!slot.available) {
                            toast.error(slot.unavailableMessage ?? "Horario indisponivel.")
                            return
                          }

                          setSelectedTime(slot.time)
                        }}
                        className={cn(
                          "w-full",
                          !slot.available &&
                            "border-zinc-800 bg-zinc-900 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-500",
                        )}
                      >
                        {slot.time}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-center text-sm text-zinc-400">
                    Sem horarios disponiveis para esta data.
                  </div>
                )}
              </>
            )}

            {selectedDate && (
              <div className="mt-6">
                <BookingSummary
                  service={service}
                  selectedDate={selectedDate}
                  barberName={barber.name}
                />
              </div>
            )}
          </div>

          <SheetFooter>
            <Button className="h-10 rounded-xl" onClick={handleCreateBooking} disabled={!selectedDate}>
              Confirmar reserva
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}

export default ServiceItem

