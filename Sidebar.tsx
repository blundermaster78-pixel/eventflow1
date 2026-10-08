import { AlertTriangle, BarChart3, Boxes, CalendarDays, ClipboardList, LayoutDashboard, Layers } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Page } from '../types'

const items: { id: Page; label: string; icon: LucideIcon }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'resources', label: 'Resources', icon: Boxes },
  { id: 'reservations', label: 'Reservations', icon: ClipboardList },
  { id: 'conflicts', label: 'Conflicts', icon: AlertTriangle },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
]

interface Props {
  page: Page
  onNavigate: (p: Page) => void
  openConflicts: number
}

export default function Sidebar({ page, onNavigate, openConflicts }: Props) {
  return (
    <aside className="flex w-[76px] shrink-0 flex-col border-r border-white/10 bg-ink-900/90 lg:w-64">
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold text-ink-950 shadow-glow">
          <Layers className="h-5 w-5" strokeWidth={2.5} />
        </div>
        <div className="hidden lg:block">
          <p className="text-lg font-extrabold leading-none tracking-tight text-white">EventFlow</p>
          <p className="mt-1 text-[11px] text-slate-500">Zero double-bookings</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {items.map(({ id, label, icon: Icon }) => {
          const active = page === id
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              title={label}
              className={`group relative flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition ${
                active ? 'bg-gold/10 text-gold' : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {active && <span className="absolute left-0 top-2 h-[calc(100%-1rem)] w-1 rounded-r-full bg-gold" />}
              <Icon className="h-5 w-5 shrink-0" />
              <span className="hidden lg:inline">{label}</span>
              {id === 'conflicts' && openConflicts > 0 && (
                <span className="ml-auto hidden rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold text-white lg:inline">
                  {openConflicts}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div className="hidden p-4 lg:block">
        <div className="rounded-xl border border-gold/20 bg-gold/5 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gold">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-gold" />
            </span>
            Conflict engine on
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
            Every booking is checked against all six resources before it is confirmed.
          </p>
        </div>
      </div>
    </aside>
  )
}
