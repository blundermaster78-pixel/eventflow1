import { useState } from 'react'
import { CalendarPlus } from 'lucide-react'
import type { Conflict, Prefill, Reservation, ResourceId } from './types'
import { resources } from './mock'
import { conflictedIds } from './conflicts'
import { fmtDate, fmtDay, fmtWeekday, todayISO } from './date'
import { windowDates } from './stats'
import Badge from './Badge'
import { ResourceTag } from './ResourceTag'

interface Props {
  reservations: Reservation[]
  conflicts: Conflict[]
  onNew: (p?: Prefill) => void
}

export default function CalendarPage({ reservations, conflicts, onNew }: Props) {
  const today = todayISO()
  const dates = windowDates()
  const [selected, setSelected] = useState(today)
  const [filter, setFilter] = useState<ResourceId | 'all'>('all')
  const bad = conflictedIds(conflicts)

  const forDay = (d: string) =>
    reservations
      .filter((r) => r.date === d && (filter === 'all' || r.resourceIds.includes(filter)))
      .sort((a, b) => a.start.localeCompare(b.start))

  const chip = (r: Reservation) =>
    bad.has(r.id)
      ? 'border-red-400/40 bg-red-400/15 text-red-200'
      : r.status === 'pending'
        ? 'border-gold/40 border-dashed bg-gold/5 text-gold-300'
        : 'border-gold/30 bg-gold/15 text-gold-300'

  const dayList = forDay(selected)

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <section className="card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setFilter('all')} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${filter === 'all' ? 'border-gold bg-gold/10 text-gold' : 'border-white/10 text-slate-400 hover:text-white'}`}>
              All resources
            </button>
            {resources.map((r) => (
              <button key={r.id} onClick={() => setFilter(r.id)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${filter === r.id ? 'border-gold bg-gold/10 text-gold' : 'border-white/10 text-slate-400 hover:text-white'}`}>
                {r.short}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded bg-gold/60" /> Confirmed</span>
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded border border-dashed border-gold" /> Pending</span>
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded bg-red-400" /> Conflict</span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {dates.map((d) => {
            const items = forDay(d)
            const isSel = d === selected
            return (
              <button
                key={d}
                onClick={() => setSelected(d)}
                className={`flex min-h-[138px] flex-col rounded-xl border p-2 text-left transition ${
                  isSel ? 'border-gold bg-gold/[0.06]' : 'border-white/10 bg-white/[0.02] hover:border-white/25'
                }`}
              >
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className={`text-sm font-bold ${d === today ? 'text-gold' : 'text-white'}`}>{fmtDay(d)}</span>
                  <span className="text-[10px] text-slate-500">{d === today ? 'Today' : fmtWeekday(d)}</span>
                </div>
                <div className="space-y-1">
                  {items.slice(0, 3).map((r) => (
                    <div key={r.id} className={`truncate rounded-md border px-1.5 py-1 text-[10.5px] font-semibold ${chip(r)}`}>
                      {r.start} {r.event}
                    </div>
                  ))}
                  {items.length > 3 && <p className="px-1 text-[10px] font-semibold text-slate-400">+{items.length - 3} more</p>}
                </div>
              </button>
            )
          })}
        </div>
      </section>

      <aside className="card h-fit p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white">{fmtDate(selected)}</h2>
            <p className="text-xs text-slate-500">{dayList.length} reservation{dayList.length === 1 ? '' : 's'}</p>
          </div>
          <button onClick={() => onNew({ date: selected })} className="btn-gold !px-3 !py-2 text-xs">
            <CalendarPlus className="h-4 w-4" /> Reserve
          </button>
        </div>
        <div className="space-y-3">
          {dayList.length === 0 && <p className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-slate-500">Nothing booked. This day is wide open.</p>}
          {dayList.map((r) => (
            <div key={r.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-white">{r.event}</p>
                  <p className="text-xs text-slate-500">{r.start}–{r.end} · {r.organizer}</p>
                </div>
                <Badge kind={bad.has(r.id) ? 'conflict' : r.status} />
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {r.resourceIds.map((id) => <ResourceTag key={id} id={id} />)}
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  )
}
