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
import BookingSummary from "./booking-summary"

type BookingWithService = Prisma.BookingGetPayload<{
  include: {
    service: true
  }
}>

interface BookingItemProps {
  booking: BookingWithService
}

const BookingItem = ({ booking }: BookingItemProps) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const bookingDate = new Date(booking.date)
  const isConfirmed = isFuture(bookingDate)

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
      <SheetTrigger className="w-full md:w-auto">
        <Card className="w-full md:w-[270px]">
          <CardContent className="flex justify-between p-0">
            <div className="flex flex-1 flex-col gap-2 p-5 pr-4">
              <Badge className="w-fit" variant={isConfirmed ? "default" : "secondary"}>
                {isConfirmed ? "Confirmado" : "Finalizado"}
              </Badge>
              <h3 className="font-semibold text-left">
                {booking.service.name}
              </h3>
              <p className="self-start text-left text-xs text-zinc-400">
                {format(bookingDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>

            <div className="flex flex-col items-center justify-center border-l-2 border-solid px-5">
              <p className="text-sm capitalize">{format(bookingDate, "MMMM", { locale: ptBR })}</p>
              <p className="text-2xl">{format(bookingDate, "dd", { locale: ptBR })}</p>
              <p className="text-sm">{format(bookingDate, "HH:mm", { locale: ptBR })}</p>
            </div>
          </CardContent>
        </Card>
      </SheetTrigger>

      <SheetContent className="w-[85%]">
        <SheetHeader>
          <SheetTitle className="text-left">Informações da reserva</SheetTitle>
        </SheetHeader>

        <div className="relative mt-6 h-[180px] w-full overflow-hidden rounded-xl">
          <Image alt={booking.service.name} src={booking.service.imageUrl} fill className="object-cover" />
        </div>

        <div className="mt-6">
          <Badge className="w-fit" variant={isConfirmed ? "default" : "secondary"}>
            {isConfirmed ? "Confirmado" : "Finalizado"}
          </Badge>

          <div className="mb-3 mt-6">
            <BookingSummary service={booking.service} selectedDate={bookingDate} />
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
