import { useState } from 'react'
import { Search, Trash2 } from 'lucide-react'
import type { Conflict, Reservation, ReservationStatus, ResourceId } from '../types'
import { resources } from '../data/mock'
import { conflictedIds } from '../lib/conflicts'
import { fmtDate } from '../lib/date'
import Badge from '../components/Badge'
import { ResourceTag } from '../components/ResourceTag'

interface Props {
  reservations: Reservation[]
  conflicts: Conflict[]
  query: string
  onQuery: (q: string) => void
  onCancel: (id: string) => void
}

export default function Reservations({ reservations, conflicts, query, onQuery, onCancel }: Props) {
  const [status, setStatus] = useState<ReservationStatus | 'conflict' | 'all'>('all')
  const [resource, setResource] = useState<ResourceId | 'all'>('all')
  const bad = conflictedIds(conflicts)

  const rows = reservations
    .filter((r) => {
      const text = (r.event + r.organizer).toLowerCase().includes(query.toLowerCase())
      const st = status === 'all' || (status === 'conflict' ? bad.has(r.id) : r.status === status)
      const rs = resource === 'all' || r.resourceIds.includes(resource)
      return text && st && rs
    })
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input className="input pl-10" placeholder="Search events or organizers" value={query} onChange={(e) => onQuery(e.target.value)} />
        </div>
        <select className="input !w-auto" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          <option value="all">All statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending">Pending</option>
          <option value="conflict">Has conflict</option>
        </select>
        <select className="input !w-auto" value={resource} onChange={(e) => setResource(e.target.value as typeof resource)}>
          <option value="all">All resources</option>
          {resources.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <p className="ml-auto text-sm text-slate-500">{rows.length} of {reservations.length} reservations</p>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs text-slate-500">
              <th className="px-5 py-3.5 font-semibold">Event</th>
              <th className="px-5 py-3.5 font-semibold">Date</th>
              <th className="px-5 py-3.5 font-semibold">Time</th>
              <th className="px-5 py-3.5 font-semibold">Resources</th>
              <th className="px-5 py-3.5 font-semibold">Status</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((r) => (
              <tr key={r.id} className="transition hover:bg-white/[0.03]">
                <td className="px-5 py-4">
                  <p className="font-semibold text-white">{r.event}</p>
                  <p className="text-xs text-slate-500">{r.organizer}</p>
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-slate-300">{fmtDate(r.date)}</td>
                <td className="whitespace-nowrap px-5 py-4 text-slate-300">{r.start}–{r.end}</td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-1.5">{r.resourceIds.map((id) => <ResourceTag key={id} id={id} />)}</div>
                </td>
                <td className="px-5 py-4"><Badge kind={bad.has(r.id) ? 'conflict' : r.status} /></td>
                <td className="px-5 py-4 text-right">
                  <button onClick={() => onCancel(r.id)} className="rounded-lg p-2 text-slate-500 transition hover:bg-red-400/10 hover:text-red-300" title="Cancel reservation" aria-label={`Cancel ${r.event}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-12 text-center text-sm text-slate-500">No reservations match these filters. Clear a filter or create a new reservation.</p>}
      </div>
    </div>
  )
}
