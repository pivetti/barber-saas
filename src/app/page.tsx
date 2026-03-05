import { Prisma } from "@prisma/client"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { MapPinIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import BookingItem from "./_components/booking-item"
import Header from "./_components/header"
import { getUserFromToken } from "./_lib/auth"
import { db } from "./_lib/prisma"

type BookingWithService = Prisma.BookingGetPayload<{
  include: {
    service: true
    barber: true
  }
}>

const Home = async () => {
  const user = await getUserFromToken()

  let confirmedBookings: BookingWithService[] = []
  const barbers = await db.barber.findMany({
    orderBy: {
      name: "asc",
    },
  })

  if (user) {
    confirmedBookings = await db.booking.findMany({
      where: {
        userId: user.id,
        status: "SCHEDULED",
        date: {
          gte: new Date(),
        },
      },
      include: {
        service: true,
        barber: true,
      },
      orderBy: {
        date: "asc",
      },
      take: 5,
    })
  }

  return (
    <div>
      <Header />

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <section className="space-y-1">
          <h2 className="text-xl font-bold md:text-2xl">
            Ola, {user?.name ?? "seja bem-vindo"}!
          </h2>

          <p className="text-sm text-zinc-400">
            <span className="capitalize">
              {format(new Date(), "EEEE, dd", { locale: ptBR })}
            </span>
            <span>&nbsp;de&nbsp;</span>
            <span className="capitalize">
              {format(new Date(), "MMMM", { locale: ptBR })}
            </span>
          </p>
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60">
          <div className="relative h-52 w-full sm:h-64">
            <Image
              alt="Ambiente da barbearia"
              src="/banner-02.png"
              fill
              className="object-cover"
            />
          </div>

          <div className="space-y-4 p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <h2 className="text-xl font-bold text-zinc-100 sm:text-2xl">
                  Barbearia do Jesi
                </h2>
                <p className="flex items-start gap-2 text-sm text-zinc-300">
                  <MapPinIcon className="mt-0.5 h-4 w-4 text-violet-300" />
                  Rua Exemplo, 123 - Centro, Sao Paulo - SP
                </p>
              </div>

              <Link
                href="/barbers"
                className="inline-flex h-10 shrink-0 items-center rounded-xl border border-violet-500/40 bg-violet-500/10 px-5 text-sm font-semibold text-violet-100 transition-colors hover:bg-violet-500/20 sm:h-11 sm:px-6 sm:text-base"
              >
                Agendar
              </Link>
            </div>

            <div className="space-y-2 border-t border-zinc-800 pt-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-400">
                Sobre nos
              </h3>
              <p className="text-sm leading-6 text-zinc-300">
                Somos uma barbearia focada em atendimento proximo, tecnica e
                consistencia. Nosso objetivo e entregar cortes, barba e
                acabamento com qualidade para que voce saia daqui com visual
                alinhado e confianca renovada.
              </p>
            </div>
          </div>
        </section>

        {confirmedBookings.length > 0 && (
          <section className="mt-8">
            <h3 className="mb-4 text-xs font-bold uppercase text-zinc-400">
              Seus agendamentos
            </h3>

            <div className="flex gap-4 overflow-x-auto md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible">
              {confirmedBookings.map((booking) => (
                <BookingItem
                  key={booking.id}
                  booking={JSON.parse(JSON.stringify(booking))}
                />
              ))}
            </div>
          </section>
        )}

        <section className="mt-8">
          <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-zinc-400">
            Barbeiros
          </h3>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
            {barbers.map((barber) => (
              <article
                key={barber.id}
                className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70"
              >
                <div className="relative h-36 w-full sm:h-44">
                  <Image
                    alt={barber.name}
                    src={barber.imageUrl}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-3 sm:p-4">
                  <p className="text-sm font-semibold text-zinc-100 sm:text-base">
                    {barber.name}
                  </p>
                </div>
              </article>
            ))}
          </div>

          {barbers.length === 0 && (
            <p className="text-sm text-zinc-400">Nenhum barbeiro encontrado.</p>
          )}
        </section>
      </main>
    </div>
  )
}

export default Home
