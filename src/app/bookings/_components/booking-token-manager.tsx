"use client"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import {
  cancelBookingByToken,
  getPublicBookingByToken,
  requestCancellationByToken,
} from "@/app/_actions/manage-booking-by-token"
import { Button } from "@/app/_components/ui/button"
import { Input } from "@/app/_components/ui/input"

interface BookingTokenManagerProps {
  initialToken?: string
}

interface PublicBooking {
  id: string
  status: string
  customerName: string
  customerPhone: string
  date: Date
  cancellationRequested: boolean
  serviceName: string
  barberName: string | null
}

const getStatusLabel = (status: string) => {
  if (status === "SCHEDULED") return "Agendado"
  if (status === "DONE") return "Concluido"
  if (status === "CANCELED") return "Cancelado"
  return status
}

const BookingTokenManager = ({ initialToken = "" }: BookingTokenManagerProps) => {
  const [token, setToken] = useState(initialToken)
  const [booking, setBooking] = useState<PublicBooking | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSearch = () => {
    startTransition(async () => {
      const result = await getPublicBookingByToken(token)
      if (!result) {
        setBooking(null)
        toast.error("Token invalido")
        return
      }

      setBooking(result)
    })
  }

  const handleCancel = () => {
    startTransition(async () => {
      const result = await cancelBookingByToken(token)
      if (!result.ok) {
        toast.error(result.message)
        return
      }

      toast.success(result.message)
      const updatedBooking = await getPublicBookingByToken(token)
      setBooking(updatedBooking)
    })
  }

  const handleRequestCancellation = () => {
    startTransition(async () => {
      const result = await requestCancellationByToken(token)
      if (!result.ok) {
        toast.error(result.message)
        return
      }

      toast.success(result.message)
      const updatedBooking = await getPublicBookingByToken(token)
      setBooking(updatedBooking)
    })
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5">
        <h1 className="text-xl font-bold md:text-2xl">Gerenciar agendamento</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Cole o token de cancelamento para cancelar ou solicitar cancelamento.
        </p>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="Token de cancelamento"
            value={token}
            onChange={(event) => setToken(event.target.value)}
          />
          <Button onClick={handleSearch} disabled={isPending || token.trim().length === 0}>
            Buscar
          </Button>
        </div>
      </section>

      {booking && (
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5">
          <div className="space-y-2">
            <p className="text-sm text-zinc-300">
              Cliente: <span className="font-semibold text-zinc-100">{booking.customerName}</span>
            </p>
            <p className="text-sm text-zinc-300">
              Telefone: <span className="font-semibold text-zinc-100">{booking.customerPhone}</span>
            </p>
            <p className="text-sm text-zinc-300">
              Servico: <span className="font-semibold text-zinc-100">{booking.serviceName}</span>
            </p>
            <p className="text-sm text-zinc-300">
              Barbeiro:{" "}
              <span className="font-semibold text-zinc-100">{booking.barberName ?? "-"}</span>
            </p>
            <p className="text-sm text-zinc-300">
              Data:{" "}
              <span className="font-semibold text-zinc-100">
                {format(new Date(booking.date), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}
              </span>
            </p>
            <p className="text-sm text-zinc-300">
              Status: <span className="font-semibold text-zinc-100">{getStatusLabel(booking.status)}</span>
            </p>
            {booking.cancellationRequested && booking.status === "SCHEDULED" && (
              <p className="text-sm font-semibold text-amber-300">
                Solicitacao de cancelamento enviada ao barbeiro.
              </p>
            )}
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isPending || booking.status !== "SCHEDULED"}
            >
              Cancelar agora com token
            </Button>
            <Button
              variant="outline"
              onClick={handleRequestCancellation}
              disabled={isPending || booking.status !== "SCHEDULED" || booking.cancellationRequested}
            >
              Solicitar cancelamento ao barbeiro
            </Button>
            <Link
              href="https://wa.me/5500000000000"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-700 px-4 text-sm font-medium text-zinc-100 transition-colors hover:border-violet-500/40 hover:bg-violet-500/10"
            >
              Falar no WhatsApp
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}

export default BookingTokenManager
