import { addDays, endOfDay, format, isSameDay, isToday, parseISO, startOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import AdminHeader from "../_components/admin-header"
import { db } from "@/app/_lib/prisma"
import { requireAdmin } from "@/app/_lib/require-admin"
import { cn } from "@/app/_lib/utils"

interface DashboardPageProps {
  searchParams?: {
    date?: string
  }
}

const statusLabelMap: Record<string, string> = {
  SCHEDULED: "Agendado",
  DONE: "Concluido",
  CANCELED: "Cancelado",
}

const getStatusLabel = (status: string, cancellationRequested: boolean) => {
  if (cancellationRequested && status === "SCHEDULED") {
    return "Cancelamento solicitado"
  }

  return statusLabelMap[status] ?? status
}

const getStatusClassName = (status: string, cancellationRequested: boolean) => {
  if (cancellationRequested && status === "SCHEDULED") {
    return "border-amber-500/40 bg-amber-500/15 text-amber-300"
  }

  if (status === "DONE") {
    return "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
  }

  if (status === "CANCELED") {
    return "border-red-500/40 bg-red-500/15 text-red-300"
  }

  return "border-violet-500/40 bg-violet-500/15 text-violet-200"
}

const getSelectedDate = (dateParam?: string) => {
  if (!dateParam) {
    return startOfDay(new Date())
  }

  const parsedDate = parseISO(dateParam)
  if (Number.isNaN(parsedDate.getTime())) {
    return startOfDay(new Date())
  }

  return startOfDay(parsedDate)
}

const DashboardPage = async ({ searchParams }: DashboardPageProps) => {
  const admin = await requireAdmin()
  const selectedDate = getSelectedDate(searchParams?.date)
  const previousDate = addDays(selectedDate, -1)
  const nextDate = addDays(selectedDate, 1)
  const today = startOfDay(new Date())

  const bookings = await db.booking.findMany({
    where: {
      barberId: admin.id,
      date: {
        gte: startOfDay(selectedDate),
        lte: endOfDay(selectedDate),
      },
    },
    include: {
      service: true,
    },
    orderBy: {
      date: "asc",
    },
  })

  const selectedDateLabel = isToday(selectedDate)
    ? `Hoje - ${format(selectedDate, "dd MMM", { locale: ptBR })}`
    : format(selectedDate, "dd MMM", { locale: ptBR })

  return (
    <>
      <AdminHeader adminName={admin.name} />

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <section className="rounded-3xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900/95 to-zinc-950/85 p-5 shadow-[0_20px_45px_rgba(0,0,0,0.35)] sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-300/80">
                Painel
              </p>
              <h1 className="text-2xl font-bold leading-tight text-zinc-100 md:text-3xl">
                Agenda diaria
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-zinc-400">
                Visualize e acompanhe os agendamentos por dia com mais clareza.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-nowrap items-center justify-center gap-2 overflow-x-auto rounded-2xl border border-zinc-800/90 bg-zinc-950/70 p-2.5 sm:gap-3">
            <Link
              href={`/admin/dashboard?date=${format(previousDate, "yyyy-MM-dd")}`}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-sm font-semibold text-zinc-200 transition-all hover:border-violet-500/40 hover:bg-zinc-800 hover:text-zinc-100"
              aria-label="Dia anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>

            <div className="inline-flex h-10 shrink-0 items-center rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm font-semibold text-zinc-100 sm:px-4">
              <span className={cn("capitalize", !isToday(selectedDate) && "text-zinc-200")}>
                {selectedDateLabel}
              </span>
            </div>

            {!isSameDay(selectedDate, today) && (
              <Link
                href="/admin/dashboard"
                className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-violet-500/35 bg-violet-500/10 px-4 text-sm font-semibold text-violet-100 transition-all hover:bg-violet-500/20"
              >
                Hoje
              </Link>
            )}

            <Link
              href={`/admin/dashboard?date=${format(nextDate, "yyyy-MM-dd")}`}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-sm font-semibold text-zinc-200 transition-all hover:border-violet-500/40 hover:bg-zinc-800 hover:text-zinc-100"
              aria-label="Proximo dia"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-zinc-800/80 bg-zinc-950/55 p-3 sm:p-4">
          {bookings.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/55 px-4 py-12 text-center">
              <p className="text-sm font-medium text-zinc-300">Nenhum agendamento para esta data.</p>
              <p className="mt-1 text-xs text-zinc-500">Use os botoes acima para navegar entre os dias.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {bookings.map((booking) => (
              <article
                key={booking.id}
                className="rounded-2xl border border-zinc-800/90 bg-gradient-to-b from-zinc-900/90 to-zinc-950/80 px-3 py-3 shadow-[0_10px_24px_rgba(0,0,0,0.25)] transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-500/30 hover:shadow-[0_14px_30px_rgba(0,0,0,0.32)]"
              >
                <div className="flex h-full flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="shrink-0 text-2xl font-bold leading-none text-violet-200">
                      {format(booking.date, "HH:mm")}
                    </p>

                    <span
                      title={getStatusLabel(booking.status, booking.cancellationRequested)}
                      className={cn(
                        "inline-flex shrink-0 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]",
                        "max-w-[150px] items-center justify-center text-center leading-tight",
                        getStatusClassName(booking.status, booking.cancellationRequested),
                        booking.cancellationRequested && booking.status === "SCHEDULED"
                          ? "text-[9px] whitespace-normal"
                          : "whitespace-nowrap",
                      )}
                    >
                      {getStatusLabel(booking.status, booking.cancellationRequested)}
                    </span>
                  </div>

                  <div className="flex items-end justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-zinc-100 md:text-base">
                        {booking.customerName}
                      </p>
                      <p className="truncate text-xs font-medium text-zinc-300 md:text-sm">
                        {booking.service.name}
                      </p>
                    </div>

                    <Link
                      href={`/admin/bookings/${booking.id}`}
                      className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg border border-violet-500/35 bg-violet-500/10 px-4 text-xs font-semibold text-violet-100 transition-colors hover:bg-violet-500/20"
                    >
                      Editar
                    </Link>
                  </div>
                </div>
              </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  )
}

export default DashboardPage
