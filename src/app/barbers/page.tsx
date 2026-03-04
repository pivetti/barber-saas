import Image from "next/image"
import Link from "next/link"
import Header from "../_components/header"
import { db } from "../_lib/prisma"

const BarbersPage = async () => {
  const barbers = await db.barber.findMany({
    orderBy: {
      name: "asc",
    },
  })

  return (
    <>
      <Header />

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <section className="space-y-1">
          <h1 className="text-xl font-bold md:text-2xl">Escolha o barbeiro</h1>
          <p className="text-sm text-zinc-400">Primeiro selecione o profissional para continuar.</p>
        </section>

        <section className="mt-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {barbers.map((barber) => (
              <article
                key={barber.id}
                className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70"
              >
                <div className="relative h-56 w-full">
                  <Image
                    alt={barber.name}
                    src={barber.imageUrl}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="space-y-3 p-5">
                  <h2 className="text-lg font-semibold text-zinc-100">{barber.name}</h2>

                  <Link
                    href={`/services?barberId=${barber.id}`}
                    className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-violet-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-violet-400"
                  >
                    Escolher servico
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {barbers.length === 0 && (
            <p className="text-sm text-zinc-400">Nenhum barbeiro encontrado.</p>
          )}
        </section>
      </main>
    </>
  )
}

export default BarbersPage
