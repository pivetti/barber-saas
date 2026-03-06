import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import AdminHeader from "../_components/admin-header"
import {
  addWorkingHour,
  createBlockedTime,
  deleteBlockedTime,
  deleteWorkingHour,
  updateSlotInterval,
} from "../_actions/schedule"
import { Button } from "@/app/_components/ui/button"
import { Input } from "@/app/_components/ui/input"
import { db } from "@/app/_lib/prisma"
import { requireAdmin } from "@/app/_lib/require-admin"

const weekDays = [
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terca-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sabado" },
  { value: 0, label: "Domingo" },
]

const slotIntervalOptions = [10, 15, 20, 30]

const ScheduleAdminPage = async () => {
  const admin = await requireAdmin()

  const [workingHours, blockedTimes, settings] = await Promise.all([
    db.workingHour.findMany({
      where: {
        barberId: admin.id,
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    }),
    db.blockedTime.findMany({
      where: {
        barberId: admin.id,
      },
      orderBy: [{ date: "desc" }, { startTime: "asc" }],
      take: 50,
    }),
    db.scheduleSettings.findUnique({
      where: {
        barberId: admin.id,
      },
    }),
  ])

  const workingHoursByDay = new Map<number, typeof workingHours>()

  for (const day of weekDays) {
    workingHoursByDay.set(
      day.value,
      workingHours.filter((workingHour) => workingHour.dayOfWeek === day.value),
    )
  }

  const slotIntervalMinutes = settings?.slotIntervalMinutes ?? 30

  return (
    <>
      <AdminHeader adminName={admin.name} />
      <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <h1 className="text-xl font-bold">Agenda profissional</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Defina horarios de trabalho semanais por intervalo e bloqueios especificos por data.
          </p>
        </section>

        <div className="space-y-6">
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <h2 className="text-lg font-semibold">Bloqueios de horario</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Crie bloqueios por data com hora inicial e final. Exemplo: 22/03, 10:00 ate 11:00.
            </p>

            <form action={createBlockedTime} className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="text-sm">
                Data
                <Input type="date" name="date" required className="mt-1" />
              </label>
              <label className="text-sm">
                Hora inicial
                <Input type="time" name="startTime" required className="mt-1" />
              </label>
              <label className="text-sm">
                Hora final
                <Input type="time" name="endTime" required className="mt-1" />
              </label>
              <label className="text-sm md:col-span-2">
                Motivo (opcional)
                <Input name="reason" placeholder="Ex: Almoco, compromisso externo" className="mt-1" />
              </label>
              <Button type="submit" className="md:w-fit md:col-span-2">
                Adicionar bloqueio
              </Button>
            </form>

            <div className="mt-4 space-y-2">
              {blockedTimes.map((blockedTime) => (
                <form
                  key={blockedTime.id}
                  action={deleteBlockedTime}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-800 p-3 text-sm"
                >
                  <input type="hidden" name="blockedTimeId" value={blockedTime.id} />
                  <span>
                    {format(blockedTime.date, "dd/MM/yyyy", { locale: ptBR })} - {blockedTime.startTime} ate{" "}
                    {blockedTime.endTime}
                    {blockedTime.reason ? ` - ${blockedTime.reason}` : ""}
                  </span>
                  <Button type="submit" variant="outline">
                    Remover
                  </Button>
                </form>
              ))}

              {blockedTimes.length === 0 && (
                <p className="text-sm text-zinc-400">Nenhum bloqueio cadastrado.</p>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <h2 className="text-lg font-semibold">Intervalo entre horarios</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Este intervalo define a geracao automatica dos slots de agendamento.
            </p>
            <form action={updateSlotInterval} className="mt-4 flex flex-wrap items-end gap-2">
              <label className="text-sm">
                Intervalo
                <select
                  name="slotIntervalMinutes"
                  defaultValue={String(slotIntervalMinutes)}
                  className="mt-1 block h-10 rounded-xl border border-zinc-700 bg-zinc-950 px-3"
                >
                  {slotIntervalOptions.map((option) => (
                    <option key={option} value={option}>
                      {option} minutos
                    </option>
                  ))}
                </select>
              </label>
              <Button type="submit">Salvar configuracao</Button>
            </form>
          </section>
        </div>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <h2 className="text-lg font-semibold">Horario de trabalho semanal</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Adicione um ou mais intervalos por dia. Dias sem intervalos sao tratados como fechados.
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {weekDays.map((day) => {
              const intervals = workingHoursByDay.get(day.value) ?? []

              return (
                <article key={day.value} className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold">{day.label}</h3>
                    {intervals.length === 0 ? (
                      <span className="rounded-full border border-zinc-700 px-2 py-1 text-xs text-zinc-400">
                        Fechado
                      </span>
                    ) : (
                      <span className="rounded-full border border-emerald-700/70 bg-emerald-900/30 px-2 py-1 text-xs text-emerald-300">
                        {intervals.length} intervalo(s)
                      </span>
                    )}
                  </div>

                  <div className="mt-3 space-y-2">
                    {intervals.map((interval) => (
                      <form
                        key={interval.id}
                        action={deleteWorkingHour}
                        className="flex items-center justify-between rounded-lg border border-zinc-800 p-2 text-sm"
                      >
                        <input type="hidden" name="workingHourId" value={interval.id} />
                        <span>
                          {interval.startTime} - {interval.endTime}
                        </span>
                        <Button type="submit" size="sm" variant="outline">
                          Remover
                        </Button>
                      </form>
                    ))}

                    {intervals.length === 0 && (
                      <p className="rounded-lg border border-dashed border-zinc-800 p-3 text-xs text-zinc-500">
                        Nenhum intervalo cadastrado.
                      </p>
                    )}
                  </div>

                  <form action={addWorkingHour} className="mt-3 grid grid-cols-2 gap-2">
                    <input type="hidden" name="dayOfWeek" value={day.value} />
                    <label className="text-xs text-zinc-400">
                      Inicio
                      <Input type="time" name="startTime" required className="mt-1" />
                    </label>
                    <label className="text-xs text-zinc-400">
                      Fim
                      <Input type="time" name="endTime" required className="mt-1" />
                    </label>
                    <Button type="submit" className="col-span-2">
                      Adicionar intervalo
                    </Button>
                  </form>
                </article>
              )
            })}
          </div>
        </section>
      </main>
    </>
  )
}

export default ScheduleAdminPage
