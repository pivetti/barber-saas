"use client"

import { Booking, Service } from "@prisma/client"
import { isPast, isToday, set, startOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import Image from "next/image"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { createBooking } from "../_actions/create-booking"
import { getBookings } from "../_actions/get-bookings"
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
  "12:00",
  "12:30",
  "13:00",
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

const getTimeList = ({ bookings, selectedDay }: GetTimeListProps) => {
  return TIME_LIST.filter((time) => {
    const hour = Number(time.split(":")[0])
    const minutes = Number(time.split(":")[1])

    const timeIsOnThePast = isPast(set(new Date(), { hours: hour, minutes }))
    if (timeIsOnThePast && isToday(selectedDay)) {
      return false
    }

    const hasBookingOnCurrentTime = bookings.some((booking) => {
      const bookingDate = new Date(booking.date)
      return (
        bookingDate.getHours() === hour &&
        bookingDate.getMinutes() === minutes
      )
    })

    if (hasBookingOnCurrentTime) {
      return false
    }

    return true
  })
}

const ServiceItem = ({ service }: ServiceItemProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [bookingSheetIsOpen, setBookingSheetIsOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState<Date | undefined>()
  const [selectedTime, setSelectedTime] = useState<string | undefined>()
  const [dayBookings, setDayBookings] = useState<Booking[]>([])

  useEffect(() => {
    const fetchBookings = async () => {
      if (!selectedDay) {
        setDayBookings([])
        return
      }

      const bookings = await getBookings({
        date: selectedDay,
        serviceId: service.id,
      })

      setDayBookings(bookings)
    }

    fetchBookings()
  }, [selectedDay, service.id])

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

      toast.error("Erro ao criar reserva")
    }
  }

  return (
    <>
      <Card className="group h-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70 transition-all duration-200 hover:border-violet-500/40">
        <CardContent className="flex h-full flex-col p-0">
          <div className="grid grid-cols-[96px_1fr] gap-4 p-5 sm:grid-cols-[110px_1fr]">
            <div className="relative h-24 w-24 shrink-0 sm:h-[110px] sm:w-[110px]">
              <Image
                alt={service.name}
                src={service.imageUrl}
                fill
                className="rounded-xl object-cover transition-transform duration-200 group-hover:scale-[1.02]"
              />
            </div>

            <div className="min-w-0 space-y-2">
              <h3 className="line-clamp-1 text-base font-semibold text-zinc-100">
                {service.name}
              </h3>
              <p className="line-clamp-2 text-sm leading-relaxed text-zinc-400">
                {service.description}
              </p>
            </div>
          </div>

          <div className="mt-auto border-t border-zinc-800 bg-zinc-950/40 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-400">
                  Valor
                </p>
                <p className="text-lg font-bold text-violet-300 sm:text-base">
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
                className="h-10 w-full rounded-xl bg-violet-500 font-semibold text-white hover:bg-violet-400 sm:w-auto sm:min-w-[132px]"
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
              disabled={{ before: startOfDay(new Date()) }}
              locale={ptBR}
              className="mx-auto"
            />

            {selectedDay && (
              <div className="mt-5 flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden">
                {timeList.map((time) => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? "default" : "outline"}
                    onClick={() => setSelectedTime(time)}
                    className="min-w-[72px]"
                  >
                    {time}
                  </Button>
                ))}
              </div>
            )}

            {selectedDate && (
              <div className="mt-6">
                <BookingSummary service={service} selectedDate={selectedDate} />
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
