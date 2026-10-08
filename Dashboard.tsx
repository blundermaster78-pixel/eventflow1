import { Activity, AlertTriangle, ArrowRight, Boxes, CalendarCheck } from 'lucide-react'
import type { Conflict, Page, Prefill, Reservation } from './types'
import { resources } from './mock'
import { bookedMinutes, heatClass, overallUtilization, windowDates } from './stats'
import { fmtDate, fmtDay, fmtWeekday, timeAgo, todayISO } from './date'
import StatCard from './StatCard'
import Badge from './Badge'
import { ResourceTag, resourceById, resourceIcons } from './ResourceTag'

interface Props {
  reservations: Reservation[]
  conflicts: Conflict[]
  onNew: (p?: Prefill) => void
  onNavigate: (p: Page) => void
}

export default function Dashboard({ reservations, conflicts, onNew, onNavigate }: Props) {
  const dates = windowDates()
  const today = todayISO()
  const open = conflicts.filter((c) => c.status === 'open')
  const pending = reservations.filter((r) => r.status === 'pending').length
  const util = overallUtilization(resources.map((r) => r.id), reservations)
  const recent = [...conflicts].sort((a, b) => b.loggedAt - a.loggedAt).slice(0, 4)
  const upcoming = [...reservations].sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)).slice(0, 5)
  const conflictCells = new Set(open.map((c) => `${c.resourceId}|${c.date}`))

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total resources" value={resources.length} hint="Stage, power, audio, visual, seating" icon={Boxes} tone="blue" onClick={() => onNavigate('resources')} />
        <StatCard label="Active reservations" value={reservations.length} hint={`${pending} awaiting approval`} icon={CalendarCheck} tone="green" onClick={() => onNavigate('reservations')} />
        <StatCard label="Open conflicts" value={open.length} hint={open.length ? 'Needs rescheduling' : 'All clear'} icon={AlertTriangle} tone="red" onClick={() => onNavigate('conflicts')} />
        <StatCard label="Resource utilization" value={`${util}%`} hint="Next 14 days, 08:00–23:00" icon={Activity} tone="gold" onClick={() => onNavigate('analytics')} />
      </div>

      <div className="grid gap-6 2xl:grid-cols-3">
        {/* Heatmap */}
        <section className="card p-6 2xl:col-span-2">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white">Two-week availability</h2>
              <p className="text-xs text-slate-500">Click any cell to start a reservation for that resource and day.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded border border-emerald-400/30 bg-emerald-400/10" /> Free</span>
              <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded bg-gold/30" /> Partly booked</span>
              <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded bg-gold" /> Heavily booked</span>
              <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded border-2 border-red-400" /> Open conflict</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="grid min-w-[760px] grid-cols-[150px_repeat(14,minmax(0,1fr))] gap-1.5">
              <div />
              {dates.map((d) => (
                <div key={d} className={`pb-1 text-center leading-tight ${d === today ? 'text-gold' : 'text-slate-500'}`}>
                  <p className="text-[10px] font-medium">{fmtWeekday(d)}</p>
                  <p className={`text-xs font-bold ${d === today ? 'text-gold' : 'text-slate-300'}`}>{fmtDay(d).split(' ')[0]}</p>
                </div>
              ))}
              {resources.map((r) => {
                const Icon = resourceIcons[r.id]
                return (
                  <div key={r.id} className="contents">
                    <div className="flex items-center gap-2 pr-2 text-sm font-semibold text-slate-200">
                      <Icon className="h-4 w-4 text-gold" /> <span className="truncate">{r.name}</span>
                    </div>
                    {dates.map((d) => {
                      const mins = bookedMinutes(r.id, d, reservations)
                      const hasConflict = conflictCells.has(`${r.id}|${d}`)
                      return (
                        <button
                          key={d}
                          onClick={() => onNew({ date: d, resourceIds: [r.id] })}
                          title={`${r.name} · ${fmtDate(d)} · ${(mins / 60).toFixed(1)}h booked${hasConflict ? ' · conflict' : ''}`}
                          className={`h-10 rounded-md border transition ${heatClass(mins)} ${hasConflict ? '!border-2 !border-red-400' : ''}`}
                          aria-label={`${r.name} on ${fmtDate(d)}`}
                        />
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Recent conflicts */}
        <section className="card flex flex-col p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Recent conflicts</h2>
            <button onClick={() => onNavigate('conflicts')} className="flex items-center gap-1 text-xs font-semibold text-gold hover:underline">
              View all <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="flex-1 space-y-3">
            {recent.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No conflicts. Every booking is clean.</p>}
            {recent.map((c) => (
              <div key={c.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <ResourceTag id={c.resourceId} tone={c.status === 'open' ? 'danger' : 'default'} />
                  <Badge kind={c.status} />
                </div>
                <p className="mt-2 text-sm font-semibold text-white">{c.incomingName}</p>
                <p className="text-xs text-slate-500">
                  clashes with {reservations.find((r) => r.id === c.existingId)?.event ?? 'an existing booking'} · {fmtDate(c.date)}, {c.start}–{c.end}
                </p>
                <p className="mt-1 text-[11px] text-slate-600">{timeAgo(c.loggedAt)}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Upcoming */}
      <section className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-white">Next up</h2>
          <button onClick={() => onNavigate('reservations')} className="flex items-center gap-1 text-xs font-semibold text-gold hover:underline">
            All reservations <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        <div className="divide-y divide-white/5">
          {upcoming.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-x-6 gap-y-2 py-3">
              <div className="w-28 shrink-0">
                <p className="text-sm font-bold text-white">{fmtDate(r.date)}</p>
                <p className="text-xs text-slate-500">{r.start}–{r.end}</p>
              </div>
              <div className="min-w-[180px] flex-1">
                <p className="text-sm font-semibold text-slate-100">{r.event}</p>
                <p className="text-xs text-slate-500">{r.organizer}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {r.resourceIds.map((id) => <ResourceTag key={id} id={id} />)}
              </div>
              <Badge kind={r.status} />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
