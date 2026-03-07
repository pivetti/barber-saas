import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import AdminHeader from "../../../_components/admin-header"
import { updateBarber } from "../../../_actions/barbers"
import { Button } from "@/app/_components/ui/button"
import { Input } from "@/app/_components/ui/input"
import { canEditBarber, canManageBarbers } from "@/app/_lib/admin-permissions"
import { db } from "@/app/_lib/prisma"
import { requireAdmin } from "@/app/_lib/require-admin"

interface EditBarberPageProps {
  params: {
    id: string
  }
}

const EditBarberPage = async ({ params }: EditBarberPageProps) => {
  const admin = await requireAdmin()

  if (!canManageBarbers(admin.role)) {
    redirect("/admin/dashboard")
  }

  const barber = await db.barber.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      imageUrl: true,
      role: true,
    },
  })

  if (!barber) {
    notFound()
  }

  if (!canEditBarber(admin, barber.role)) {
    redirect("/admin/barbers")
  }

  return (
    <>
      <AdminHeader adminName={admin.name} adminRole={admin.role} />

      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <section className="rounded-3xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900/95 to-zinc-950/85 p-5 shadow-[0_20px_45px_rgba(0,0,0,0.35)] sm:p-6">
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-300/80">
              Edição
            </p>
            <h1 className="text-2xl font-bold leading-tight text-zinc-100 md:text-3xl">Editar barbeiro</h1>
            <p className="text-sm leading-relaxed text-zinc-400">
              Atualize dados de acesso e perfil de {barber.name}.
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-zinc-800/80 bg-zinc-950/55 p-4 sm:p-5">
          <form action={updateBarber} className="grid gap-3 md:grid-cols-2">
            <input type="hidden" name="barberId" value={barber.id} />
            <Input
              name="name"
              defaultValue={barber.name}
              placeholder="Nome"
              required
              className="border-zinc-700 bg-zinc-900 text-zinc-100"
            />
            <Input
              name="email"
              type="email"
              defaultValue={barber.email ?? ""}
              placeholder="E-mail"
              required
              className="border-zinc-700 bg-zinc-900 text-zinc-100"
            />
            <Input
              name="phone"
              defaultValue={barber.phone ?? ""}
              placeholder="Telefone"
              className="border-zinc-700 bg-zinc-900 text-zinc-100"
            />
            <Input
              name="password"
              type="password"
              placeholder="Nova senha (opcional)"
              className="border-zinc-700 bg-zinc-900 text-zinc-100"
            />
            <Input
              name="imageUrl"
              defaultValue={barber.imageUrl}
              placeholder="URL da imagem"
              className="border-zinc-700 bg-zinc-900 text-zinc-100 md:col-span-2"
            />

            <div className="mt-2 flex flex-wrap gap-2 md:col-span-2">
              <Button type="submit" className="rounded-xl border border-violet-500/35 bg-violet-500/10 text-violet-100 hover:bg-violet-500/20">
                Salvar alterações
              </Button>
              <Link
                href="/admin/barbers"
                className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-sm font-semibold text-zinc-100 transition-colors hover:bg-zinc-800"
              >
                Voltar
              </Link>
            </div>
          </form>
        </section>
      </main>
    </>
  )
}

export default EditBarberPage
