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

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <section className="rounded-3xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900/95 to-zinc-950/85 p-5 shadow-[0_20px_45px_rgba(0,0,0,0.35)] sm:p-6">
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-300/80">
              Agenda
            </p>
            <h1 className="text-2xl font-bold leading-tight text-zinc-100 md:text-3xl">
              Agenda profissional
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-zinc-400">
              Configure bloqueios, intervalo entre horarios e jornada semanal com o mesmo padrao visual do painel.
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-zinc-800/80 bg-zinc-950/55 p-4 sm:p-5">
          <div className="rounded-2xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900/90 to-zinc-950/80 p-4 sm:p-5">
            <h2 className="text-lg font-semibold text-zinc-100">Bloqueios de horario</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Crie bloqueios por data com hora inicial e final. Exemplo: 22/03, 10:00 ate 11:00.
            </p>

            <form action={createBlockedTime} className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="text-sm text-zinc-300">
                Data
                <Input
                  type="date"
                  name="date"
                  required
                  className="mt-1 border-zinc-700 bg-zinc-900 text-zinc-100"
                />
              </label>
              <label className="text-sm text-zinc-300">
                Hora inicial
                <Input
                  type="time"
                  name="startTime"
                  required
                  className="mt-1 border-zinc-700 bg-zinc-900 text-zinc-100"
                />
              </label>
              <label className="text-sm text-zinc-300">
                Hora final
                <Input
                  type="time"
                  name="endTime"
                  required
                  className="mt-1 border-zinc-700 bg-zinc-900 text-zinc-100"
                />
              </label>
              <label className="text-sm text-zinc-300 md:col-span-2">
                Motivo (opcional)
                <Input
                  name="reason"
                  placeholder="Ex: Almoco, compromisso externo"
                  className="mt-1 border-zinc-700 bg-zinc-900 text-zinc-100"
                />
              </label>
              <Button
                type="submit"
                className="md:col-span-2 md:w-fit rounded-xl border border-violet-500/35 bg-violet-500/10 text-violet-100 hover:bg-violet-500/20"
              >
                Adicionar bloqueio
              </Button>
            </form>

            <div className="mt-4 space-y-2">
              {blockedTimes.map((blockedTime) => (
                <form
                  key={blockedTime.id}
                  action={deleteBlockedTime}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-sm text-zinc-200"
                >
                  <input type="hidden" name="blockedTimeId" value={blockedTime.id} />
                  <span>
                    {format(blockedTime.date, "dd/MM/yyyy", { locale: ptBR })} - {blockedTime.startTime} ate{" "}
                    {blockedTime.endTime}
                    {blockedTime.reason ? ` - ${blockedTime.reason}` : ""}
                  </span>
                  <Button type="submit" variant="outline" className="border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800">
                    Remover
                  </Button>
                </form>
              ))}

              {blockedTimes.length === 0 && (
                <p className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-sm text-zinc-400">
                  Nenhum bloqueio cadastrado.
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900/90 to-zinc-950/80 p-4 sm:p-5">
            <h2 className="text-lg font-semibold text-zinc-100">Intervalo entre horarios</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Este intervalo define a geracao automatica dos slots de agendamento.
            </p>
            <form action={updateSlotInterval} className="mt-4 flex flex-wrap items-end gap-2">
              <label className="text-sm text-zinc-300">
                Intervalo
                <select
                  name="slotIntervalMinutes"
                  defaultValue={String(slotIntervalMinutes)}
                  className="mt-1 block h-10 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-zinc-100"
                >
                  {slotIntervalOptions.map((option) => (
                    <option key={option} value={option}>
                      {option} minutos
                    </option>
                  ))}
                </select>
              </label>
              <Button type="submit" className="rounded-xl border border-violet-500/35 bg-violet-500/10 text-violet-100 hover:bg-violet-500/20">
                Salvar configuracao
              </Button>
            </form>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-zinc-800/80 bg-zinc-950/55 p-4 sm:p-5">
          <div className="rounded-2xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900/90 to-zinc-950/80 p-4 sm:p-5">
            <h2 className="text-lg font-semibold text-zinc-100">Horario de trabalho semanal</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Adicione um ou mais intervalos por dia. Dias sem intervalos sao tratados como fechados.
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {weekDays.map((day) => {
                const intervals = workingHoursByDay.get(day.value) ?? []

                return (
                  <article key={day.value} className="rounded-2xl border border-zinc-800/90 bg-zinc-950/55 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold text-zinc-100">{day.label}</h3>
                      {intervals.length === 0 ? (
                        <span className="rounded-full border border-zinc-700 px-2 py-1 text-xs text-zinc-400">
                          Fechado
                        </span>
                      ) : (
                        <span className="rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">
                          {intervals.length} intervalo(s)
                        </span>
                      )}
                    </div>

                    <div className="mt-3 space-y-2">
                      {intervals.map((interval) => (
                        <form
                          key={interval.id}
                          action={deleteWorkingHour}
                          className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/70 p-2 text-sm text-zinc-200"
                        >
                          <input type="hidden" name="workingHourId" value={interval.id} />
                          <span>
                            {interval.startTime} - {interval.endTime}
                          </span>
                          <Button type="submit" size="sm" variant="outline" className="border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800">
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
                        <Input
                          type="time"
                          name="startTime"
                          required
                          className="mt-1 border-zinc-700 bg-zinc-900 text-zinc-100"
                        />
                      </label>
                      <label className="text-xs text-zinc-400">
                        Fim
                        <Input
                          type="time"
                          name="endTime"
                          required
                          className="mt-1 border-zinc-700 bg-zinc-900 text-zinc-100"
                        />
                      </label>
                      <Button type="submit" className="col-span-2 rounded-xl border border-violet-500/35 bg-violet-500/10 text-violet-100 hover:bg-violet-500/20">
                        Adicionar intervalo
                      </Button>
                    </form>
                  </article>
                )
              })}
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

export default ScheduleAdminPage
