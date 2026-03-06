import AdminHeader from "../_components/admin-header"
import { createAdminService, deleteAdminService, updateAdminService } from "../_actions/services"
import { Button } from "@/app/_components/ui/button"
import { Input } from "@/app/_components/ui/input"
import { db } from "@/app/_lib/prisma"
import { requireAdmin } from "@/app/_lib/require-admin"

const ServicesAdminPage = async () => {
  const admin = await requireAdmin()
  const services = await db.service.findMany({
    orderBy: {
      name: "asc",
    },
  })

  return (
    <>
      <AdminHeader adminName={admin.name} />
      <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <h1 className="text-xl font-bold">Servicos</h1>
          <p className="mt-1 text-sm text-zinc-400">Crie, edite e exclua servicos.</p>
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <h2 className="text-lg font-semibold">Novo servico</h2>
          <form action={createAdminService} className="mt-4 grid gap-3 md:grid-cols-2">
            <Input name="name" placeholder="Nome" required />
            <Input name="price" placeholder="Preco (ex: 59.90)" required />
            <Input
              name="description"
              placeholder="Descricao"
              required
              className="md:col-span-2"
            />
            <Input name="imageUrl" placeholder="URL da imagem" required className="md:col-span-2" />
            <Button type="submit" className="md:col-span-2 md:w-fit">
              Criar servico
            </Button>
          </form>
        </section>

        <section className="space-y-3">
          {services.map((service) => (
            <form
              key={service.id}
              action={updateAdminService}
              className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"
            >
              <input type="hidden" name="serviceId" value={service.id} />
              <div className="grid gap-3 md:grid-cols-2">
                <Input name="name" defaultValue={service.name} required />
                <Input name="price" defaultValue={String(service.price)} required />
                <Input
                  name="description"
                  defaultValue={service.description}
                  required
                  className="md:col-span-2"
                />
                <Input
                  name="imageUrl"
                  defaultValue={service.imageUrl}
                  required
                  className="md:col-span-2"
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="submit">Salvar</Button>
                <button
                  type="submit"
                  formAction={deleteAdminService}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-500"
                >
                  Excluir
                </button>
              </div>
            </form>
          ))}

          {services.length === 0 && (
            <p className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-sm text-zinc-400">
              Nenhum servico cadastrado.
            </p>
          )}
        </section>
      </main>
    </>
  )
}

export default ServicesAdminPage
