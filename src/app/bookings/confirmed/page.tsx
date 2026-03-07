import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import Header from "@/app/_components/header"
import { getPublicBookingFromSession } from "@/app/_lib/public-booking-session"
import ConfirmedBookingActions from "./_components/confirmed-booking-actions"

interface ConfirmedBookingPageProps {
  searchParams?: {
    token?: string
  }
}

const ConfirmedBookingPage = async ({ searchParams }: ConfirmedBookingPageProps) => {
  const token = searchParams?.token?.trim()
  if (token) {
    redirect(`/bookings/session?token=${encodeURIComponent(token)}&next=/bookings/confirmed`)
  }

  const booking = await getPublicBookingFromSession()
  if (!booking) {
    notFound()
  }

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5">
          <h1 className="text-xl font-bold md:text-2xl">Agendamento confirmado</h1>
          <p className="mt-2 text-sm text-zinc-300">
            {booking.customerName}, seu horario foi reservado com sucesso.
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            {booking.service.name} com {booking.barber?.name ?? "barbeiro"} em{" "}
            {format(booking.date, "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}.
          </p>
        </section>

        <section className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5">
          <p className="text-sm text-zinc-300">
            Use esta sessao temporaria para cancelar agora ou solicitar cancelamento ao barbeiro.
          </p>

          <ConfirmedBookingActions canCancel={booking.status === "SCHEDULED"} />

          <div className="mt-3">
            <Link
              href="/bookings"
              className="text-xs text-zinc-400 underline underline-offset-4 transition-colors hover:text-zinc-300"
            >
              Ou gerencie este agendamento na area de agendamentos.
            </Link>
          </div>
        </section>
      </main>
    </>
  )
}

export default ConfirmedBookingPage
