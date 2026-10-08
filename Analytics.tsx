import { Activity, CalendarClock, ShieldCheck, Trophy } from 'lucide-react'
import type { Conflict, Reservation } from '../types'
import { resources } from '../data/mock'
import { fmtDate, fmtDay, fmtWeekday } from '../lib/date'
import { overallUtilization, utilization, windowDates } from '../lib/stats'
import StatCard from '../components/StatCard'
import { resourceIcons } from '../components/ResourceTag'

interface Props {
  reservations: Reservation[]
  conflicts: Conflict[]
}

export default function Analytics({ reservations, conflicts }: Props) {
  const dates = windowDates()
  const ids = resources.map((r) => r.id)
  const perResource = resources.map((r) => ({ r, u: utilization(r.id, reservations) })).sort((a, b) => b.u - a.u)
  const perDay = dates.map((d) => ({ d, n: reservations.filter((r) => r.date === d).reduce((s, r) => s + r.resourceIds.length, 0) }))
  const maxDay = Math.max(1, ...perDay.map((x) => x.n))
  const peak = perDay.reduce((a, b) => (b.n > a.n ? b : a), perDay[0])
  const conflictsBy = resources.map((r) => ({ r, n: conflicts.filter((c) => c.resourceId === r.id).length })).sort((a, b) => b.n - a.n)
  const maxC = Math.max(1, ...conflictsBy.map((x) => x.n))
  const prevented = conflicts.filter((c) => c.kind === 'blocked').length

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Overall utilization" value={`${overallUtilization(ids, reservations)}%`} hint="All six resources, 14 days" icon={Activity} tone="gold" />
        <StatCard label="Busiest resource" value={perResource[0].r.short} hint={`${perResource[0].u}% utilized`} icon={Trophy} tone="blue" />
        <StatCard label="Peak day" value={fmtDay(peak.d)} hint={`${peak.n} resource bookings`} icon={CalendarClock} tone="green" />
        <StatCard label="Double-bookings prevented" value={prevented} hint="Blocked at check time" icon={ShieldCheck} tone="red" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card p-6">
          <h2 className="text-base font-bold text-white">Utilization by resource</h2>
          <p className="mb-5 text-xs text-slate-500">Share of operating hours booked over the next 14 days</p>
          <div className="space-y-4">
            {perResource.map(({ r, u }) => {
              const Icon = resourceIcons[r.id]
              return (
                <div key={r.id}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-semibold text-slate-200"><Icon className="h-4 w-4 text-gold" />{r.name}</span>
                    <span className="font-bold text-white">{u}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-300" style={{ width: `${Math.min(100, u)}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="card p-6">
          <h2 className="text-base font-bold text-white">Conflicts by resource</h2>
          <p className="mb-5 text-xs text-slate-500">Where demand collides most often</p>
          <div className="space-y-4">
            {conflictsBy.map(({ r, n }) => (
              <div key={r.id}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-200">{r.name}</span>
                  <span className="font-bold text-white">{n}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-red-400" style={{ width: `${(n / maxC) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="card p-6">
        <h2 className="text-base font-bold text-white">Daily demand</h2>
        <p className="mb-6 text-xs text-slate-500">Resource bookings per day. {fmtDate(peak.d)} is the busiest.</p>
        <div className="flex h-48 items-end gap-2">
          {perDay.map(({ d, n }) => (
            <div key={d} className="flex h-full flex-1 flex-col items-center justify-end gap-2" title={`${fmtDate(d)}: ${n} resource bookings`}>
              <span className="text-[11px] font-semibold text-slate-400">{n || ''}</span>
              <div className={`w-full rounded-t-md ${d === peak.d ? 'bg-gold' : 'bg-gold/40'}`} style={{ height: `${(n / maxDay) * 100}%`, minHeight: n ? 6 : 2 }} />
              <div className="text-center leading-tight">
                <p className="text-[10px] text-slate-500">{fmtWeekday(d)}</p>
                <p className="text-[11px] font-semibold text-slate-300">{fmtDay(d).split(' ')[0]}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
