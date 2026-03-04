import { Prisma } from "@prisma/client"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Image from "next/image"
import Link from "next/link"
import BookingItem from "./_components/booking-item"
import Header from "./_components/header"
import { getUserFromToken } from "./_lib/auth"
import { db } from "./_lib/prisma"

type BookingWithService = Prisma.BookingGetPayload<{
  include: {
    service: true
  }
}>

const Home = async () => {
  const user = await getUserFromToken()

  let confirmedBookings: BookingWithService[] = []

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

        <section className="mt-6 w-full">
          <Image
            alt="Agende seu horario"
            src="/banner-02.png"
            width={1600}
            height={520}
            sizes="(max-width: 768px) 100vw, 1152px"
            className="h-auto w-full rounded-xl md:h-[190px] md:object-cover"
          />
        </section>

        <section className="mt-4">
          <Link
            href="/services"
            className="inline-flex items-center rounded-xl border border-violet-500/40 bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-100 transition-colors hover:bg-violet-500/20"
          >
            Ver servicos
          </Link>
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
      </main>
    </div>
  )
}

export default Home
