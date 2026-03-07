"use client"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import { FormEvent, useState, useTransition } from "react"
import { toast } from "sonner"
import {
  cancelBookingByToken,
  confirmCancellationWithoutToken,
  getPublicBookingByToken,
  requestCancellationByToken,
  requestCancellationWithoutToken,
} from "@/app/_actions/manage-booking-by-token"
import { Button } from "@/app/_components/ui/button"
import { Input } from "@/app/_components/ui/input"

interface BookingTokenManagerProps {
  initialToken?: string
  barbers: Array<{
    id: string
    name: string
  }>
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

interface CancellationCandidate {
  id: string
  customerName: string
  customerPhone: string
  serviceName: string
  barberName: string | null
  date: Date
}

interface CancellationRequestForm {
  customerName: string
  customerPhone: string
  barberId: string
  date: string
  time: string
}

const emptyCancellationRequestForm: CancellationRequestForm = {
  customerName: "",
  customerPhone: "",
  barberId: "",
  date: "",
  time: "",
}

const getStatusLabel = (status: string) => {
  if (status === "SCHEDULED") return "Agendado"
  if (status === "DONE") return "Concluído"
  if (status === "CANCELED") return "Cancelado"
  return status
}

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11)

  if (digits.length <= 10) {
    return digits.replace(
      /^(\d{0,2})(\d{0,4})(\d{0,4}).*/,
      (_, ddd, firstPart, secondPart) => {
        if (!ddd) return ""
        if (!firstPart) return `(${ddd}`
        if (!secondPart) return `(${ddd}) ${firstPart}`
        return `(${ddd}) ${firstPart}-${secondPart}`
      },
    )
  }

  return digits.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3")
}

const BookingTokenManager = ({ initialToken = "", barbers }: BookingTokenManagerProps) => {
  const [token, setToken] = useState(initialToken)
  const [booking, setBooking] = useState<PublicBooking | null>(null)
  const [cancellationForm, setCancellationForm] = useState<CancellationRequestForm>(
    emptyCancellationRequestForm,
  )
  const [candidates, setCandidates] = useState<CancellationCandidate[]>([])
  const [isPending, startTransition] = useTransition()

  const handleSearch = () => {
    startTransition(async () => {
      const result = await getPublicBookingByToken(token)
      if (!result) {
        setBooking(null)
        toast.error("Token inválido")
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

  const handleRequestWithoutToken = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    startTransition(async () => {
      const result = await requestCancellationWithoutToken(cancellationForm)

      if (!result.ok) {
        toast.error(result.message)
        setCandidates([])
        return
      }

      if ("requiresConfirmation" in result && result.requiresConfirmation) {
        setCandidates(result.candidates)
        toast.message(result.message)
        return
      }

      setCandidates([])
      toast.success(result.message)
    })
  }

  const handleConfirmCandidate = (bookingId: string) => {
    startTransition(async () => {
      const result = await confirmCancellationWithoutToken(bookingId, cancellationForm)
      if (!result.ok) {
        toast.error(result.message)
        return
      }

      toast.success(result.message)
      setCandidates([])
    })
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5">
        <h1 className="text-xl font-bold md:text-2xl">Gerenciar agendamento</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Cancelamento rápido com token ou solicitação de cancelamento quando você perdeu o token.
        </p>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5">
        <h2 className="text-base font-semibold text-zinc-100">Buscar por token</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Cole o token de cancelamento para cancelar agora ou solicitar cancelamento ao barbeiro.
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

        {booking && (
          <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <div className="space-y-2">
              <p className="text-sm text-zinc-300">
                Cliente: <span className="font-semibold text-zinc-100">{booking.customerName}</span>
              </p>
              <p className="text-sm text-zinc-300">
                Telefone: <span className="font-semibold text-zinc-100">{booking.customerPhone}</span>
              </p>
              <p className="text-sm text-zinc-300">
                Serviço: <span className="font-semibold text-zinc-100">{booking.serviceName}</span>
              </p>
              <p className="text-sm text-zinc-300">
                Barbeiro: <span className="font-semibold text-zinc-100">{booking.barberName ?? "-"}</span>
              </p>
              <p className="text-sm text-zinc-300">
                Data: <span className="font-semibold text-zinc-100">{format(new Date(booking.date), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}</span>
              </p>
              <p className="text-sm text-zinc-300">
                Status: <span className="font-semibold text-zinc-100">{getStatusLabel(booking.status)}</span>
              </p>
              {booking.cancellationRequested && booking.status === "SCHEDULED" && (
                <p className="text-sm font-semibold text-amber-300">
                  Solicitação de cancelamento enviada ao barbeiro.
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
                Falar com o barbeiro
              </Link>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5">
        <h2 className="text-base font-semibold text-zinc-100">Solicitar cancelamento sem token</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Se você perdeu o token, informe os dados do agendamento para enviar a solicitação ao barbeiro.
        </p>

        <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={handleRequestWithoutToken}>
          <Input
            placeholder="Nome"
            value={cancellationForm.customerName}
            onChange={(event) =>
              setCancellationForm((previous) => ({
                ...previous,
                customerName: event.target.value,
              }))
            }
            required
          />
          <Input
            type="tel"
            placeholder="(00) 00000-0000"
            inputMode="tel"
            value={cancellationForm.customerPhone}
            onChange={(event) =>
              setCancellationForm((previous) => ({
                ...previous,
                customerPhone: formatPhone(event.target.value),
              }))
            }
            required
          />

          <select
            value={cancellationForm.barberId}
            onChange={(event) =>
              setCancellationForm((previous) => ({
                ...previous,
                barberId: event.target.value,
              }))
            }
            className="h-10 rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none transition-colors focus:border-violet-500/40"
            required
          >
            <option value="">Selecione o barbeiro</option>
            {barbers.map((barber) => (
              <option key={barber.id} value={barber.id}>
                {barber.name}
              </option>
            ))}
          </select>

          <Input
            type="date"
            value={cancellationForm.date}
            onChange={(event) =>
              setCancellationForm((previous) => ({
                ...previous,
                date: event.target.value,
              }))
            }
            required
          />

          <Input
            type="time"
            value={cancellationForm.time}
            onChange={(event) =>
              setCancellationForm((previous) => ({
                ...previous,
                time: event.target.value,
              }))
            }
            required
          />

          <Button type="submit" disabled={isPending} className="md:col-span-2 md:w-fit">
            Solicitar cancelamento
          </Button>
        </form>

        {candidates.length > 0 && (
          <div className="mt-5 space-y-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
            <p className="text-sm font-semibold text-amber-200">
              Encontramos mais de um agendamento. Confirme qual você deseja cancelar:
            </p>

            {candidates.map((candidate) => (
              <div
                key={candidate.id}
                className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1 text-sm text-zinc-300">
                  <p>
                    <span className="font-semibold text-zinc-100">{candidate.serviceName}</span> com{" "}
                    <span className="font-semibold text-zinc-100">{candidate.barberName ?? "-"}</span>
                  </p>
                  <p>{format(new Date(candidate.date), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}</p>
                </div>

                <Button
                  variant="outline"
                  disabled={isPending}
                  onClick={() => handleConfirmCandidate(candidate.id)}
                >
                  Confirmar solicitação
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default BookingTokenManager
