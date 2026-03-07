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

      <main className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 sm:py-8">
        <section className="rounded-3xl border border-zinc-800/60 bg-[radial-gradient(circle_at_top,rgba(167,139,250,0.12),transparent_42%),linear-gradient(to_bottom,rgba(24,24,27,0.96),rgba(9,9,11,0.92))] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.34)] sm:p-6">
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-300/75">Servicos</p>
            <h1 className="text-2xl font-semibold leading-tight text-zinc-50 md:text-3xl">Gestao de servicos</h1>
            <p className="max-w-2xl text-sm leading-relaxed text-zinc-400/95">
              Crie, edite e exclua servicos mantendo o catalogo sempre atualizado para os agendamentos.
            </p>
          </div>
        </section>

        <section className="mt-5 rounded-3xl border border-zinc-800/65 bg-zinc-950/45 p-3.5 shadow-[0_16px_36px_rgba(0,0,0,0.24)] sm:mt-6 sm:p-5">
          <div className="rounded-2xl border border-zinc-800/70 bg-gradient-to-b from-zinc-900/80 to-zinc-950/75 p-4 shadow-[0_10px_22px_rgba(0,0,0,0.22)] sm:p-5">
            <h2 className="text-lg font-semibold text-zinc-100">Novo servico</h2>
            <form action={createAdminService} className="mt-4 grid gap-3 md:grid-cols-2">
              <Input name="name" placeholder="Nome" required className="border-zinc-700/80 bg-zinc-900/85 text-zinc-100" />
              <Input
                name="price"
                placeholder="Preco (ex: 59.90)"
                required
                className="border-zinc-700/80 bg-zinc-900/85 text-zinc-100"
              />
              <Input
                name="description"
                placeholder="Descricao (opcional)"
                className="border-zinc-700/80 bg-zinc-900/85 text-zinc-100 md:col-span-2"
              />
              <Input
                name="imageUrl"
                placeholder="URL da imagem (opcional)"
                className="border-zinc-700/80 bg-zinc-900/85 text-zinc-100 md:col-span-2"
              />
              <Button
                type="submit"
                className="md:col-span-2 md:w-fit rounded-xl border border-violet-500/35 bg-violet-500/15 text-violet-100 hover:bg-violet-500/25"
              >
                Criar servico
              </Button>
            </form>
          </div>
        </section>

        <section className="mt-5 rounded-3xl border border-zinc-800/65 bg-zinc-950/45 p-3.5 shadow-[0_16px_36px_rgba(0,0,0,0.24)] sm:mt-6 sm:p-5">
          <div className="space-y-3">
            {services.map((service) => (
              <form
                key={service.id}
                action={updateAdminService}
                className="rounded-2xl border border-zinc-800/70 bg-gradient-to-b from-zinc-900/80 to-zinc-950/75 p-4 shadow-[0_10px_22px_rgba(0,0,0,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-500/30 hover:shadow-[0_16px_30px_rgba(0,0,0,0.28)]"
              >
                <input type="hidden" name="serviceId" value={service.id} />
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    name="name"
                    defaultValue={service.name}
                    required
                    className="border-zinc-700/80 bg-zinc-900/85 text-zinc-100"
                  />
                  <Input
                    name="price"
                    defaultValue={String(service.price)}
                    required
                    className="border-zinc-700/80 bg-zinc-900/85 text-zinc-100"
                  />
                  <Input
                    name="description"
                    defaultValue={service.description}
                    className="border-zinc-700/80 bg-zinc-900/85 text-zinc-100 md:col-span-2"
                  />
                  <Input
                    name="imageUrl"
                    defaultValue={service.imageUrl}
                    className="border-zinc-700/80 bg-zinc-900/85 text-zinc-100 md:col-span-2"
                  />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="submit"
                    className="rounded-xl border border-violet-500/35 bg-violet-500/15 text-violet-100 hover:bg-violet-500/25"
                  >
                    Salvar
                  </Button>
                  <button
                    type="submit"
                    formAction={deleteAdminService}
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-red-500/35 bg-red-500/12 px-4 text-sm font-semibold text-red-200 transition-colors hover:bg-red-500/20"
                  >
                    Excluir
                  </button>
                </div>
              </form>
            ))}

            {services.length === 0 && (
              <p className="rounded-2xl border border-zinc-800 bg-zinc-900/55 p-4 text-sm text-zinc-400">
                Nenhum servico cadastrado.
              </p>
            )}
          </div>
        </section>
      </main>
    </>
  )
}

export default ServicesAdminPage
