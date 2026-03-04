import Header from "../_components/header"
import ServiceItem from "../_components/service-item"
import { db } from "../_lib/prisma"

const ServicesPage = async () => {
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
        <section className="space-y-1">
          <h1 className="text-xl font-bold md:text-2xl">Servicos</h1>
          <p className="text-sm text-zinc-400">Escolha um servico para reservar.</p>
        </section>

        <section className="mt-8 space-y-4">
          <div className="mx-auto w-full max-w-6xl">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {serializedServices.map((service) => (
                <ServiceItem key={service.id} service={service} />
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
