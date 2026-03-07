import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import { notFound } from "next/navigation"
import Header from "@/app/_components/header"
import { db } from "@/app/_lib/prisma"
import ConfirmedBookingActions from "./_components/confirmed-booking-actions"

interface ConfirmedBookingPageProps {
  searchParams?: {
    token?: string
  }
}

const ConfirmedBookingPage = async ({ searchParams }: ConfirmedBookingPageProps) => {
  const token = searchParams?.token?.trim()
  if (!token) {
    notFound()
  }

  const booking = await db.booking.findUnique({
    where: { cancellationToken: token },
    include: {
      service: true,
      barber: true,
    },
  })

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
            {booking.customerName}, seu horário foi reservado com sucesso.
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            {booking.service.name} com {booking.barber?.name ?? "barbeiro"} em{" "}
            {format(booking.date, "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}.
          </p>
        </section>

        <section className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5">
          <p className="text-sm font-semibold text-zinc-100">Seu token de cancelamento:</p>
          <p className="mt-2 break-all rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-sm text-violet-200">
            {booking.cancellationToken}
          </p>
          <p className="mt-2 text-xs text-zinc-400">
            Guarde este token. Com ele você pode cancelar diretamente ou solicitar cancelamento ao barbeiro.
          </p>

          <ConfirmedBookingActions
            token={booking.cancellationToken}
            canCancel={booking.status === "SCHEDULED"}
          />

          <div className="mt-3">
            <Link
              href={`/bookings?token=${encodeURIComponent(booking.cancellationToken)}`}
              className="text-xs text-zinc-400 underline underline-offset-4 transition-colors hover:text-zinc-300"
            >
              Ou gerencie este agendamento informando o token.
            </Link>
          </div>
        </section>
      </main>
    </>
  )
}

export default ConfirmedBookingPage
