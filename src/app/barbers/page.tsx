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
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-xl font-bold md:text-2xl">Escolha o barbeiro</h1>
              <p className="text-sm text-zinc-400">Primeiro selecione o profissional para continuar.</p>
            </div>

            <span className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm font-medium text-zinc-200">
              {barbers.length} disponiveis
            </span>
          </div>
        </section>

        <section className="mt-8">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
            {barbers.map((barber) => (
              <article
                key={barber.id}
                className="grid aspect-square h-full grid-rows-[62%_38%] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70 sm:flex sm:aspect-auto sm:flex-col"
              >
                <div className="relative min-h-0 sm:h-56 sm:flex-none">
                  <Image
                    alt={barber.name}
                    src={barber.imageUrl}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="flex h-full min-h-0 flex-col justify-between gap-2 px-2.5 pb-2.5 pt-1.5 sm:p-5">
                  <h2 className="line-clamp-1 text-[15px] font-semibold text-zinc-100 sm:text-lg">
                    {barber.name}
                  </h2>
                  <Link
                    href={`/services?barberId=${barber.id}`}
                    className="inline-flex h-8 w-full items-center justify-center rounded-xl bg-violet-500 px-3 text-sm font-semibold text-white transition-colors hover:bg-violet-400 sm:h-10 sm:px-4"
                  >
                    Selecionar
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
