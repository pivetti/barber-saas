import { endOfDay, startOfDay } from "date-fns"
import AdminHeader from "../_components/admin-header"
import { db } from "@/app/_lib/prisma"
import { requireAdmin } from "@/app/_lib/require-admin"

const statusLabelMap: Record<string, string> = {
  SCHEDULED: "Agendado",
  DONE: "Concluido",
  CANCELED: "Cancelado",
}

const getStatusLabel = (status: string) => statusLabelMap[status] ?? status

const DashboardPage = async () => {
  const admin = await requireAdmin()

  const todayBookings = await db.booking.findMany({
    where: {
      barberId: admin.id,
      date: {
        gte: startOfDay(new Date()),
        lte: endOfDay(new Date()),
      },
      status: {
        not: "CANCELED",
      },
    },
    include: {
      user: true,
      service: true,
    },
    orderBy: {
      date: "asc",
    },
  })

  const upcomingBookings = await db.booking.findMany({
    where: {
      barberId: admin.id,
      date: {
        gt: endOfDay(new Date()),
      },
      status: "SCHEDULED",
    },
    include: {
      user: true,
      service: true,
    },
    orderBy: {
      date: "asc",
    },
    take: 10,
  })

  return (
    <>
      <AdminHeader adminName={admin.name} />
      <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <h1 className="text-xl font-bold">Agendamentos de hoje</h1>
          {todayBookings.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-400">Nenhum agendamento para hoje.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {todayBookings.map((booking) => (
                <li key={booking.id} className="rounded-lg border border-zinc-800 p-3 text-sm">
                  {booking.user.name} - {booking.service.name} -{" "}
                  {booking.date.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  - {getStatusLabel(booking.status)}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <h2 className="text-lg font-semibold">Proximos agendamentos</h2>
          {upcomingBookings.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-400">Nenhum agendamento futuro encontrado.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {upcomingBookings.map((booking) => (
                <li key={booking.id} className="rounded-lg border border-zinc-800 p-3 text-sm">
                  {booking.user.name} - {booking.service.name} -{" "}
                  {booking.date.toLocaleString("pt-BR")} - {getStatusLabel(booking.status)}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  )
}

export default DashboardPage
