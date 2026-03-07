import Link from "next/link"
import AdminHeader from "../_components/admin-header"
import { changeBarberRole, toggleBarberStatus } from "../_actions/barbers"
import { Button } from "@/app/_components/ui/button"
import {
  canChangeBarberRole,
  canManageBarbers,
  canToggleBarberStatus,
} from "@/app/_lib/admin-permissions"
import { db } from "@/app/_lib/prisma"
import { requireAdmin } from "@/app/_lib/require-admin"
import { redirect } from "next/navigation"

const roleLabelMap = {
  OWNER: "Owner",
  ADMIN: "Admin",
  BARBER: "Barber",
} as const

const BarbersAdminPage = async () => {
  const admin = await requireAdmin()

  if (!canManageBarbers(admin.role)) {
    redirect("/admin/dashboard")
  }

  const barbers = await db.barber.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
    },
  })

  return (
    <>
      <AdminHeader adminName={admin.name} adminRole={admin.role} />

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <section className="rounded-3xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900/95 to-zinc-950/85 p-5 shadow-[0_20px_45px_rgba(0,0,0,0.35)] sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-300/80">
                Gestão
              </p>
              <h1 className="text-2xl font-bold leading-tight text-zinc-100 md:text-3xl">Barbeiros</h1>
              <p className="max-w-2xl text-sm leading-relaxed text-zinc-400">
                Gerencie usuários barbeiros, permissões e status de acesso ao painel.
              </p>
            </div>

            <Link
              href="/admin/barbers/new"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-violet-500/35 bg-violet-500/10 px-4 text-sm font-semibold text-violet-100 transition-colors hover:bg-violet-500/20"
            >
              Novo barbeiro
            </Link>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-zinc-800/80 bg-zinc-950/55 p-4 sm:p-5">
          <div className="space-y-3">
            {barbers.map((barber) => {
              const canToggle = canToggleBarberStatus(admin, barber.role, barber.id)
              const canPromoteToAdmin = canChangeBarberRole(admin, barber.role, "ADMIN")
              const canDemoteToBarber = canChangeBarberRole(admin, barber.role, "BARBER")

              return (
                <article
                  key={barber.id}
                  className="rounded-2xl border border-zinc-800/90 bg-gradient-to-b from-zinc-900/90 to-zinc-950/80 p-4 shadow-[0_10px_24px_rgba(0,0,0,0.2)]"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-zinc-100">{barber.name}</p>
                      <p className="text-sm text-zinc-400">{barber.email ?? "Sem e-mail"}</p>
                      <p className="text-sm text-zinc-400">{barber.phone ?? "Sem telefone"}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-zinc-200">
                        {roleLabelMap[barber.role]}
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                          barber.isActive
                            ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-300"
                            : "border-zinc-700 bg-zinc-900 text-zinc-400"
                        }`}
                      >
                        {barber.isActive ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={`/admin/barbers/${barber.id}/edit`}
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-sm font-semibold text-zinc-100 transition-colors hover:bg-zinc-800"
                    >
                      Editar
                    </Link>

                    {canToggle && (
                      <form action={toggleBarberStatus}>
                        <input type="hidden" name="barberId" value={barber.id} />
                        <Button
                          type="submit"
                          variant="outline"
                          className="h-10 rounded-xl border-zinc-700 bg-zinc-900 px-4 text-zinc-100 hover:bg-zinc-800"
                        >
                          {barber.isActive ? "Inativar" : "Ativar"}
                        </Button>
                      </form>
                    )}

                    {canPromoteToAdmin && (
                      <form action={changeBarberRole}>
                        <input type="hidden" name="barberId" value={barber.id} />
                        <input type="hidden" name="role" value="ADMIN" />
                        <Button
                          type="submit"
                          variant="outline"
                          className="h-10 rounded-xl border-zinc-700 bg-zinc-900 px-4 text-zinc-100 hover:bg-zinc-800"
                        >
                          Tornar admin
                        </Button>
                      </form>
                    )}

                    {canDemoteToBarber && (
                      <form action={changeBarberRole}>
                        <input type="hidden" name="barberId" value={barber.id} />
                        <input type="hidden" name="role" value="BARBER" />
                        <Button
                          type="submit"
                          variant="outline"
                          className="h-10 rounded-xl border-zinc-700 bg-zinc-900 px-4 text-zinc-100 hover:bg-zinc-800"
                        >
                          Remover admin
                        </Button>
                      </form>
                    )}
                  </div>
                </article>
              )
            })}

            {barbers.length === 0 && (
              <p className="rounded-2xl border border-zinc-800 bg-zinc-900/55 p-4 text-sm text-zinc-400">
                Nenhum barbeiro cadastrado.
              </p>
            )}
          </div>
        </section>
      </main>
    </>
  )
}

export default BarbersAdminPage
