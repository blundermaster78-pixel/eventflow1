import { Bell, Plus, Search } from 'lucide-react'
import type { Page } from './types'

const titles: Record<Page, { title: string; sub: string }> = {
  dashboard: { title: 'Dashboard', sub: 'Resource availability for the next two weeks' },
  calendar: { title: 'Calendar', sub: 'Every reservation, day by day' },
  resources: { title: 'Resources', sub: 'Event-staging equipment inventory' },
  reservations: { title: 'Reservations', sub: 'Search, filter and manage bookings' },
  conflicts: { title: 'Conflicts', sub: 'Double-booking attempts caught by EventFlow' },
  analytics: { title: 'Analytics', sub: 'How resources are being used' },
}

interface Props {
  page: Page
  query: string
  onQuery: (q: string) => void
  onNew: () => void
  openConflicts: number
  onBell: () => void
}

export default function Topbar({ page, query, onQuery, onNew, openConflicts, onBell }: Props) {
  const t = titles[page]
  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-white/10 bg-ink-900/70 px-6 backdrop-blur">
      <div className="min-w-0">
        <h1 className="truncate text-lg font-bold text-white">{t.title}</h1>
        <p className="hidden truncate text-xs text-slate-500 sm:block">{t.sub}</p>
      </div>

      <div className="relative ml-auto hidden w-full max-w-xs md:block">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search events or organizers"
          className="input pl-10"
        />
      </div>

      <button onClick={onBell} className="btn-ghost relative !px-3 max-md:ml-auto" aria-label="Open conflicts">
        <Bell className="h-4 w-4" />
        {openConflicts > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {openConflicts}
          </span>
        )}
      </button>

      <button onClick={onNew} className="btn-gold">
        <Plus className="h-4 w-4" strokeWidth={3} />
        <span className="hidden sm:inline">New Reservation</span>
      </button>

      <div className="hidden items-center gap-3 border-l border-white/10 pl-4 xl:flex">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-600 text-xs font-bold text-gold">EO</div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-white">Events Office</p>
          <p className="text-xs text-slate-500">Student Affairs</p>
        </div>
      </div>
    </header>
  )
}
