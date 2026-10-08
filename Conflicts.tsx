import { useState } from 'react'
import { ArrowRight, CheckCircle2, Lightbulb, ShieldCheck } from 'lucide-react'
import type { Conflict, Prefill, Reservation } from '../types'
import { fmtDate, timeAgo } from '../lib/date'
import Badge from '../components/Badge'
import { ResourceTag, resourceById } from '../components/ResourceTag'

interface Props {
  reservations: Reservation[]
  conflicts: Conflict[]
  onNew: (p?: Prefill) => void
  onResolve: (id: string) => void
}

export default function Conflicts({ reservations, conflicts, onNew, onResolve }: Props) {
  const [tab, setTab] = useState<'all' | 'open' | 'resolved'>('open')
  const list = [...conflicts].filter((c) => tab === 'all' || c.status === tab).sort((a, b) => b.loggedAt - a.loggedAt)
  const count = (s: 'open' | 'resolved') => conflicts.filter((c) => c.status === s).length

  const reschedule = (c: Conflict) =>
    onNew({
      name: c.incomingName,
      organizer: reservations.find((r) => r.id === c.incomingId)?.organizer,
      date: c.date,
      start: c.incomingStart,
      end: c.incomingEnd,
      resourceIds: c.incomingResourceIds,
      replaceId: c.incomingId,
      autoCheck: true,
    })

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {([
          ['open', `Open (${count('open')})`],
          ['resolved', `Resolved (${count('resolved')})`],
          ['all', `All (${conflicts.length})`],
        ] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${tab === id ? 'border-gold bg-gold/10 text-gold' : 'border-white/10 text-slate-400 hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      {list.length === 0 && (
        <div className="card flex flex-col items-center p-14 text-center">
          <ShieldCheck className="h-10 w-10 text-emerald-400" />
          <p className="mt-3 text-base font-bold text-white">No conflicts here</p>
          <p className="mt-1 text-sm text-slate-500">Create a reservation that overlaps an existing one to see the engine catch it.</p>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        {list.map((c) => {
          const existing = reservations.find((r) => r.id === c.existingId)
          return (
            <article key={c.id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <ResourceTag id={c.resourceId} tone={c.status === 'open' ? 'danger' : 'default'} />
                  <span className="text-xs text-slate-500">{c.kind === 'overlap' ? 'Double-booking in schedule' : 'Booking attempt blocked'} · {timeAgo(c.loggedAt)}</span>
                </div>
                <Badge kind={c.status} />
              </div>

              <p className="mt-4 text-sm text-slate-300">
                <span className="font-semibold text-white">{resourceById(c.resourceId).name}</span> is wanted by two events on {fmtDate(c.date)}. Overlap: <span className="font-semibold text-red-300">{c.start}–{c.end}</span>
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
                  <p className="text-xs text-slate-500">Existing booking</p>
                  <p className="mt-1 text-sm font-bold text-white">{existing?.event ?? 'Removed booking'}</p>
                  {existing && <p className="text-xs text-slate-400">{existing.start}–{existing.end} · {existing.organizer}</p>}
                </div>
                <div className="hidden items-center text-slate-600 sm:flex"><ArrowRight className="h-4 w-4 rotate-180" /></div>
                <div className="rounded-xl border border-red-400/25 bg-red-400/[0.06] p-3.5">
                  <p className="text-xs text-slate-500">{c.kind === 'overlap' ? 'Pending request' : 'Blocked request'}</p>
                  <p className="mt-1 text-sm font-bold text-white">{c.incomingName}</p>
                  <p className="text-xs text-slate-400">{c.incomingStart}–{c.incomingEnd} · {c.incomingResourceIds.length} resources</p>
                </div>
              </div>

              {c.status === 'open' ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => reschedule(c)} className="btn-gold !py-2 text-xs">
                    <Lightbulb className="h-4 w-4" /> Find alternative slots
                  </button>
                  <button onClick={() => onResolve(c.id)} className="btn-ghost !py-2 text-xs">
                    <CheckCircle2 className="h-4 w-4" /> Mark resolved
                  </button>
                </div>
              ) : (
                <p className="mt-4 flex items-center gap-2 text-xs text-emerald-300"><CheckCircle2 className="h-4 w-4" /> Resolved. No double-booking occurred.</p>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}
