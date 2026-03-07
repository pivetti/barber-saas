import AdminHeader from "../_components/admin-header"
import { createAdminService, deleteAdminService, updateAdminService } from "../_actions/services"
import { Button } from "@/app/_components/ui/button"
import { Input } from "@/app/_components/ui/input"
import { canManageServices } from "@/app/_lib/admin-permissions"
import { db } from "@/app/_lib/prisma"
import { requireAdmin } from "@/app/_lib/require-admin"
import { redirect } from "next/navigation"

const ServicesAdminPage = async () => {
  const admin = await requireAdmin()

  if (!canManageServices(admin.role)) {
    redirect("/admin/dashboard")
  }

  const services = await db.service.findMany({
    orderBy: {
      name: "asc",
    },
  })

  return (
    <>
      <AdminHeader adminName={admin.name} adminRole={admin.role} />

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <section className="rounded-3xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900/95 to-zinc-950/85 p-5 shadow-[0_20px_45px_rgba(0,0,0,0.35)] sm:p-6">
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-300/80">
              Serviços
            </p>
            <h1 className="text-2xl font-bold leading-tight text-zinc-100 md:text-3xl">
              Gestão de serviços
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-zinc-400">
              Crie, edite e exclua serviços mantendo o catalogo sempre atualizado para os agendamentos.
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-zinc-800/80 bg-zinc-950/55 p-4 sm:p-5">
          <div className="rounded-2xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900/90 to-zinc-950/80 p-4 sm:p-5">
            <h2 className="text-lg font-semibold text-zinc-100">Novo serviço</h2>
            <form action={createAdminService} className="mt-4 grid gap-3 md:grid-cols-2">
              <Input name="name" placeholder="Nome" required className="border-zinc-700 bg-zinc-900 text-zinc-100" />
              <Input
                name="price"
                placeholder="Preco (ex: 59.90)"
                required
                className="border-zinc-700 bg-zinc-900 text-zinc-100"
              />
              <Input
                name="description"
                placeholder="Descrição (opcional)"
                className="border-zinc-700 bg-zinc-900 text-zinc-100 md:col-span-2"
              />
              <Input
                name="imageUrl"
                placeholder="URL da imagem (opcional)"
                className="border-zinc-700 bg-zinc-900 text-zinc-100 md:col-span-2"
              />
              <Button
                type="submit"
                className="md:col-span-2 md:w-fit rounded-xl border border-violet-500/35 bg-violet-500/10 text-violet-100 hover:bg-violet-500/20"
              >
                Criar serviço
              </Button>
            </form>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-zinc-800/80 bg-zinc-950/55 p-4 sm:p-5">
          <div className="space-y-3">
            {services.map((service) => (
              <form
                key={service.id}
                action={updateAdminService}
                className="rounded-2xl border border-zinc-800/90 bg-gradient-to-b from-zinc-900/90 to-zinc-950/80 p-4 shadow-[0_10px_24px_rgba(0,0,0,0.2)]"
              >
                <input type="hidden" name="serviceId" value={service.id} />
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    name="name"
                    defaultValue={service.name}
                    required
                    className="border-zinc-700 bg-zinc-900 text-zinc-100"
                  />
                  <Input
                    name="price"
                    defaultValue={String(service.price)}
                    required
                    className="border-zinc-700 bg-zinc-900 text-zinc-100"
                  />
                  <Input
                    name="description"
                    defaultValue={service.description}
                    className="border-zinc-700 bg-zinc-900 text-zinc-100 md:col-span-2"
                  />
                  <Input
                    name="imageUrl"
                    defaultValue={service.imageUrl}
                    className="border-zinc-700 bg-zinc-900 text-zinc-100 md:col-span-2"
                  />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="submit"
                    className="rounded-xl border border-violet-500/35 bg-violet-500/10 text-violet-100 hover:bg-violet-500/20"
                  >
                    Salvar
                  </Button>
                  <button
                    type="submit"
                    formAction={deleteAdminService}
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-red-500/35 bg-red-500/10 px-4 text-sm font-semibold text-red-200 transition-colors hover:bg-red-500/20"
                  >
                    Excluir
                  </button>
                </div>
              </form>
            ))}

            {services.length === 0 && (
              <p className="rounded-2xl border border-zinc-800 bg-zinc-900/55 p-4 text-sm text-zinc-400">
                Nenhum serviço cadastrado.
              </p>
            )}
          </div>
        </section>
      </main>
    </>
  )
}

export default ServicesAdminPage
