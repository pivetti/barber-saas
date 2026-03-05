"use client"

import { Prisma } from "@prisma/client"
import Image from "next/image"
import { useState } from "react"
import { format, isFuture } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet"
import { DialogClose } from "@radix-ui/react-dialog"
import { toast } from "sonner"
import { deleteBooking } from "../_actions/delete-booking"
import { getServiceImageUrl } from "../_lib/get-service-image-url"
import BookingSummary from "./booking-summary"

type BookingWithService = Prisma.BookingGetPayload<{
  include: {
    service: true
    barber: true
  }
}>

interface BookingItemProps {
  booking: BookingWithService
}

const BookingItem = ({ booking }: BookingItemProps) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const bookingDate = new Date(booking.date)
  const isConfirmed = isFuture(bookingDate)
  const displayServiceName =
    booking.service.name.toLowerCase() === "corte de cabelo"
      ? "Cabelo"
      : booking.service.name
  const serviceImageUrl = getServiceImageUrl(
    booking.service.name,
    booking.service.imageUrl,
  )

  const handleCancelBooking = async () => {
    try {
      await deleteBooking(booking.id)
      setIsSheetOpen(false)
      toast.success("Reserva cancelada com sucesso")
    } catch (error) {
      console.error(error)
      toast.error("Erro ao cancelar reserva")
    }
  }

  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <SheetTrigger className="w-full">
        <Card className="w-full">
          <CardContent className="flex justify-between p-0">
            <div className="flex flex-1 flex-col gap-1.5 p-3 pr-2 sm:gap-2 sm:p-5 sm:pr-4">
              <Badge className="w-fit text-[11px] sm:text-xs" variant={isConfirmed ? "default" : "secondary"}>
                {isConfirmed ? "Confirmado" : "Finalizado"}
              </Badge>
              <h3 className="text-left text-sm font-semibold sm:text-base">
                {displayServiceName}
              </h3>
              {booking.barber?.name && (
                <p className="self-start text-left text-[11px] leading-tight text-zinc-300 sm:text-xs">
                  Barbeiro: {booking.barber.name}
                </p>
              )}
              <p className="self-start text-left text-[11px] leading-tight text-zinc-400 sm:text-xs">
                {format(bookingDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>

            <div className="flex min-w-[64px] flex-col items-center justify-center border-l border-zinc-800 px-2 py-3 sm:px-5">
              <p className="text-xs capitalize sm:text-sm">{format(bookingDate, "MMMM", { locale: ptBR })}</p>
              <p className="text-xl sm:text-2xl">{format(bookingDate, "dd", { locale: ptBR })}</p>
              <p className="text-xs sm:text-sm">{format(bookingDate, "HH:mm", { locale: ptBR })}</p>
            </div>
          </CardContent>
        </Card>
      </SheetTrigger>

      <SheetContent className="w-[85%]">
        <SheetHeader>
          <SheetTitle className="text-left">Informações da reserva</SheetTitle>
        </SheetHeader>

        <div className="relative mt-6 h-[180px] w-full overflow-hidden rounded-xl">
          <Image alt={displayServiceName} src={serviceImageUrl} fill className="object-cover" />
        </div>

        <div className="mt-6">
          <Badge className="w-fit" variant={isConfirmed ? "default" : "secondary"}>
            {isConfirmed ? "Confirmado" : "Finalizado"}
          </Badge>

          <div className="mb-3 mt-6">
            <BookingSummary
              service={{ ...booking.service, name: displayServiceName }}
              selectedDate={bookingDate}
              barberName={booking.barber?.name}
            />
          </div>
        </div>

        <SheetFooter className="mt-6">
          <div className="flex items-center gap-3">
            <SheetClose asChild>
              <Button variant="outline" className="w-full">
                Voltar
              </Button>
            </SheetClose>

            {isConfirmed && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    Cancelar reserva
                  </Button>
                </DialogTrigger>

                <DialogContent className="w-[90%]">
                  <DialogHeader>
                    <DialogTitle>Deseja cancelar sua reserva?</DialogTitle>
                    <DialogDescription>
                      Essa ação e irreversível.
                    </DialogDescription>
                  </DialogHeader>

                  <DialogFooter className="flex flex-row gap-3">
                    <DialogClose asChild>
                      <Button variant="secondary" className="w-full">
                        Voltar
                      </Button>
                    </DialogClose>

                    <DialogClose asChild>
                      <Button variant="destructive" onClick={handleCancelBooking} className="w-full">
                        Confirmar
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export default BookingItem
