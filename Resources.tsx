import { useState } from 'react'
import { CalendarPlus, Search } from 'lucide-react'
import type { Category, Prefill, Reservation } from '../types'
import { resources } from '../data/mock'
import { toMin, fmtDate, todayISO } from '../lib/date'
import { utilization, windowDates } from '../lib/stats'
import Badge from '../components/Badge'
import { resourceIcons } from '../components/ResourceTag'

const categories: (Category | 'All')[] = ['All', 'Staging', 'Power', 'Audio', 'Visual', 'Furniture']

interface Props {
  reservations: Reservation[]
  onNew: (p?: Prefill) => void
}

export default function Resources({ reservations, onNew }: Props) {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<Category | 'All'>('All')

  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const today = todayISO()
  const dates = new Set(windowDates())

  const list = resources.filter(
    (r) => (cat === 'All' || r.category === cat) && (r.name + r.description + r.category).toLowerCase().includes(q.toLowerCase()),
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input className="input pl-10" placeholder="Search resources" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition ${cat === c ? 'border-gold bg-gold/10 text-gold' : 'border-white/10 text-slate-400 hover:text-white'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 && <p className="card p-10 text-center text-sm text-slate-500">No resources match your search.</p>}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {list.map((r) => {
          const Icon = resourceIcons[r.id]
          const mine = reservations.filter((x) => x.resourceIds.includes(r.id) && dates.has(x.date))
          const next = [...mine].sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)).find((x) => x.date > today || (x.date === today && toMin(x.end) > nowMin))
          const inUse = mine.some((x) => x.date === today && toMin(x.start) <= nowMin && nowMin < toMin(x.end))
          const u = utilization(r.id, reservations)
          return (
            <article key={r.id} className="card flex flex-col p-6 transition hover:border-gold/30">
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gold/20 bg-gold/10 text-gold">
                  <Icon className="h-6 w-6" />
                </div>
                <Badge kind={inUse ? 'inuse' : 'available'} />
              </div>
              <h3 className="mt-4 text-lg font-bold text-white">{r.name}</h3>
              <p className="text-xs text-slate-500">{r.category} · {r.spec}</p>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">{r.description}</p>

              <div className="mt-5">
                <div className="mb-1.5 flex justify-between text-xs">
                  <span className="text-slate-400">Utilization, next 14 days</span>
                  <span className="font-bold text-white">{u}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gold" style={{ width: `${Math.min(100, u)}%` }} />
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-black/25 p-3 text-xs">
                <p className="text-slate-500">{mine.length} booking{mine.length === 1 ? '' : 's'} this fortnight</p>
                <p className="mt-0.5 font-semibold text-slate-200">
                  {next ? `Next: ${next.event}, ${fmtDate(next.date)} ${next.start}` : 'No upcoming bookings'}
                </p>
              </div>

              <button onClick={() => onNew({ resourceIds: [r.id] })} className="btn-ghost mt-5 w-full">
                <CalendarPlus className="h-4 w-4 text-gold" /> Reserve {r.short}
              </button>
            </article>
          )
        })}
      </div>
    </div>
  )
}
