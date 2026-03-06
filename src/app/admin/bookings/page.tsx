import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Ban, CheckCircle2, Scissors, Trash2 } from "lucide-react"
import AdminHeader from "../_components/admin-header"
import { cancelAdminBooking, concludeAdminBooking, deleteAdminBooking } from "../_actions/bookings"
import { Button } from "@/app/_components/ui/button"
import { db } from "@/app/_lib/prisma"
import { requireAdmin } from "@/app/_lib/require-admin"
import { cn } from "@/app/_lib/utils"

const statusLabelMap: Record<string, string> = {
  SCHEDULED: "Agendado",
  DONE: "Concluido",
  CANCELED: "Cancelado",
}

const getStatusLabel = (status: string) => statusLabelMap[status] ?? status

const getStatusClassName = (status: string) => {
  if (status === "DONE") {
    return "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
  }

  if (status === "CANCELED") {
    return "border-red-500/40 bg-red-500/15 text-red-300"
  }

  return "border-violet-500/40 bg-violet-500/15 text-violet-200"
}

const getBarberInitial = (name: string | null | undefined) => {
  if (!name) {
    return "-"
  }

  return name.trim().charAt(0).toUpperCase()
}

const BookingsAdminPage = async () => {
  const admin = await requireAdmin()

  const bookings = await db.booking.findMany({
    where: {
      barberId: admin.id,
    },
    include: {
      user: true,
      service: true,
      barber: true,
    },
    orderBy: {
      date: "desc",
    },
  })

  return (
    <>
      <AdminHeader adminName={admin.name} />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <h1 className="text-xl font-bold">Agendamentos</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Atualize status, cancele ou exclua agendamentos.
          </p>
        </section>

        <div className="mt-6 space-y-3">
          <div className="hidden grid-cols-[1.7fr_1.1fr_1.2fr_0.9fr_1.1fr_1.1fr_2fr] gap-3 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 lg:grid">
            <span>Cliente</span>
            <span>Servico</span>
            <span>Barbeiro</span>
            <span>Hora</span>
            <span>Data</span>
            <span>Status</span>
            <span>Acoes</span>
          </div>

          {bookings.map((booking) => (
            <article
              key={booking.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-950/40 px-3 py-5 transition-colors hover:border-zinc-700 hover:bg-zinc-900/50"
            >
              <div className="grid gap-5 lg:grid-cols-[1.7fr_1.1fr_1.2fr_0.9fr_1.1fr_1.1fr_2fr] lg:items-center">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 lg:hidden">
                    Cliente
                  </p>
                  <p className="truncate text-sm font-semibold text-zinc-100 sm:text-base">{booking.user.name}</p>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 lg:hidden">
                    Servico
                  </p>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-zinc-200 sm:text-xs">
                    <Scissors className="h-3.5 w-3.5" />
                    {booking.service.name}
                  </span>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 lg:hidden">
                    Barbeiro
                  </p>
                  <div className="inline-flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-xs font-semibold text-zinc-200">
                      {getBarberInitial(booking.barber?.name)}
                    </span>
                    <span className="text-sm text-zinc-200">{booking.barber?.name ?? "-"}</span>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 lg:hidden">
                    Hora
                  </p>
                  <span className="inline-flex w-fit items-center rounded-full border border-violet-500/40 bg-violet-500/20 px-3.5 py-1.5 text-lg font-bold leading-none text-violet-100 sm:text-xl">
                    {format(booking.date, "HH:mm", { locale: ptBR })}
                  </span>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 lg:hidden">
                    Data
                  </p>
                  <span className="text-xs text-zinc-400 sm:text-sm">
                    {format(booking.date, "dd MMM yyyy", { locale: ptBR })}
                  </span>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 lg:hidden">
                    Status
                  </p>
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
                      getStatusClassName(booking.status),
                    )}
                  >
                    {getStatusLabel(booking.status)}
                  </span>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 lg:hidden">
                    Acoes
                  </p>
                  <div className="flex flex-wrap items-center gap-2 lg:justify-start">
                    <form action={concludeAdminBooking}>
                      <input type="hidden" name="bookingId" value={booking.id} />
                      <Button type="submit" size="sm" variant="default" className="h-9">
                        <CheckCircle2 className="mr-1.5 h-4 w-4" />
                        Concluir
                      </Button>
                    </form>

                    <form action={cancelAdminBooking}>
                      <input type="hidden" name="bookingId" value={booking.id} />
                      <Button type="submit" size="sm" variant="outline" className="h-9">
                        <Ban className="mr-1.5 h-4 w-4" />
                        Cancelar
                      </Button>
                    </form>

                    <form action={deleteAdminBooking}>
                      <input type="hidden" name="bookingId" value={booking.id} />
                      <Button type="submit" size="sm" variant="destructive" className="h-9 px-3">
                        <Trash2 className="mr-1.5 h-4 w-4" />
                        Excluir
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            </article>
          ))}

          {bookings.length === 0 && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 px-4 py-10 text-center text-zinc-400">
              Nenhum agendamento encontrado.
            </div>
          )}
        </div>
      </main>
    </>
  )
}

export default BookingsAdminPage
