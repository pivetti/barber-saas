import { Prisma } from "@prisma/client"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Image from "next/image"
import BookingItem from "./_components/booking-item"
import Header from "./_components/header"
import Search from "./_components/search"
import ServiceItem from "./_components/service-item"
import { getUserFromToken } from "./_lib/auth"
import { db } from "./_lib/prisma"

interface HomeProps {
  searchParams?: {
    title?: string
    service?: string
  }
}

type BookingWithService = Prisma.BookingGetPayload<{
  include: {
    service: true
  }
}>

const Home = async ({ searchParams }: HomeProps) => {
  const user = await getUserFromToken()
  const query = searchParams?.title?.trim() || searchParams?.service?.trim()

  const services = await db.service.findMany({
    where: query
      ? {
          OR: [
            {
              name: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              description: {
                contains: query,
                mode: "insensitive",
              },
            },
          ],
        }
      : undefined,
    orderBy: {
      name: "asc",
    },
  })

  const serializedServices = services.map((service) => ({
    ...service,
    price: service.price.toString(),
  }))

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
            Olá, {user?.name ?? "seja bem-vindo"}!
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

        <section className="mt-6">
          <Search />
        </section>

        <section className="mt-6 w-full">
          <Image
            alt="Agende seu horario"
            src="/banner-02.png"
            width={1600}
            height={520}
            sizes="(max-width: 768px) 100vw, 1152px"
            className="h-auto w-full rounded-xl"
          />
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

        <section className="mt-10 space-y-4">
          <h3 className="text-xs font-bold uppercase text-zinc-400">
            Serviços
          </h3>

          <div className="mx-auto w-full max-w-6xl">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {serializedServices.map((service) => (
                <ServiceItem key={service.id} service={service} />
              ))}
            </div>
          </div>

          {serializedServices.length === 0 && (
            <p className="text-sm text-zinc-400">
              Nenhum serviço encontrado.
            </p>
          )}
        </section>
      </main>
    </div>
  )
}

export default Home
