import Link from "next/link"
import Header from "../_components/header"
import ServiceItem from "../_components/service-item"
import { db } from "../_lib/prisma"

interface ServicesPageProps {
  searchParams?: {
    barberId?: string
  }
}

const ServicesPage = async ({ searchParams }: ServicesPageProps) => {
  const barberId = searchParams?.barberId

  if (!barberId) {
    return (
      <>
        <Header />
        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
          <h1 className="text-xl font-bold md:text-2xl">Servicos</h1>
          <p className="mt-3 text-sm text-zinc-400">Selecione um barbeiro antes de escolher o servico.</p>
          <Link
            href="/barbers"
            className="mt-6 inline-flex h-10 items-center justify-center rounded-xl bg-violet-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-violet-400"
          >
            Escolher barbeiro
          </Link>
        </main>
      </>
    )
  }

  const selectedBarber = await db.barber.findUnique({
    where: { id: barberId },
  })

  if (!selectedBarber) {
    return (
      <>
        <Header />
        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
          <h1 className="text-xl font-bold md:text-2xl">Barbeiro nao encontrado</h1>
          <Link
            href="/barbers"
            className="mt-6 inline-flex h-10 items-center justify-center rounded-xl bg-violet-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-violet-400"
          >
            Voltar para barbeiros
          </Link>
        </main>
      </>
    )
  }

  const services = await db.service.findMany({
    orderBy: {
      name: "asc",
    },
  })

  const serializedServices = services.map((service) => ({
    ...service,
    price: service.price.toString(),
  }))

  return (
    <>
      <Header />

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-xl font-bold md:text-2xl">Servicos</h1>
              <p className="text-sm text-zinc-400">
                Barbeiro selecionado:{" "}
                <span className="font-semibold text-zinc-100">
                  {selectedBarber.name}
                </span>
              </p>
            </div>

            <Link
              href="/barbers"
              className="inline-flex h-9 items-center justify-center rounded-lg border border-violet-500/35 bg-violet-500/10 px-3 text-sm font-medium text-violet-100 transition-colors hover:bg-violet-500/20"
            >
              Trocar barbeiro
            </Link>
          </div>
        </section>

        <section className="mt-8 space-y-4">
          <div className="mx-auto w-full max-w-6xl">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {serializedServices.map((service) => (
                <ServiceItem
                  key={service.id}
                  service={service}
                  barber={{ id: selectedBarber.id, name: selectedBarber.name }}
                />
              ))}
            </div>
          </div>

          {serializedServices.length === 0 && (
            <p className="text-sm text-zinc-400">Nenhum servico encontrado.</p>
          )}
        </section>
      </main>
    </>
  )
}

export default ServicesPage
