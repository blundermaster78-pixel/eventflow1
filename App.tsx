import { useState } from 'react'
import type { Conflict, Page, Prefill, Reservation } from './types'
import { mockReservations, seedConflicts } from './data/mock'
import { fmtDate } from './lib/date'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import ReservationModal from './components/ReservationModal'
import { useToast } from './components/Toast'
import Dashboard from './pages/Dashboard'
import CalendarPage from './pages/CalendarPage'
import Resources from './pages/Resources'
import Reservations from './pages/Reservations'
import Conflicts from './pages/Conflicts'
import Analytics from './pages/Analytics'

export default function App() {
  const toast = useToast()
  const [page, setPage] = useState<Page>('dashboard')
  const [reservations, setReservations] = useState<Reservation[]>(mockReservations)
  const [conflicts, setConflicts] = useState<Conflict[]>(seedConflicts)
  const [modal, setModal] = useState<{ key: number; prefill?: Prefill } | null>(null)
  const [query, setQuery] = useState('')

  const openConflicts = conflicts.filter((c) => c.status === 'open').length

  const openBooking = (prefill?: Prefill) => setModal({ key: Date.now(), prefill })

  const handleQuery = (q: string) => {
    setQuery(q)
    if (page !== 'reservations') setPage('reservations')
  }

  // Blocked attempts are logged once (deduped by id) so the Conflicts page tells the story.
  const logConflicts = (incoming: Conflict[]) =>
    setConflicts((prev) => {
      const ids = new Set(prev.map((c) => c.id))
      return [...incoming.filter((c) => !ids.has(c.id)), ...prev]
    })

  const confirmReservation = (res: Reservation, replaceId?: string) => {
    setReservations((prev) => [...prev.filter((r) => r.id !== replaceId), res])
    // Anything this booking was blocked on (or replaced) is now resolved.
    setConflicts((prev) =>
      prev.map((c) =>
        c.status === 'open' &&
        ((replaceId && c.incomingId === replaceId) || (c.kind === 'blocked' && c.incomingName === res.event))
          ? { ...c, status: 'resolved' }
          : c,
      ),
    )
    toast.push({
      type: 'success',
      title: 'Reservation confirmed',
      message: `${res.event} · ${fmtDate(res.date)}, ${res.start}–${res.end} · ${res.resourceIds.length} resources reserved.`,
    })
  }

  const cancelReservation = (id: string) => {
    const r = reservations.find((x) => x.id === id)
    setReservations((prev) => prev.filter((x) => x.id !== id))
    setConflicts((prev) => prev.map((c) => (c.status === 'open' && (c.incomingId === id || c.existingId === id) ? { ...c, status: 'resolved' } : c)))
    toast.push({ type: 'info', title: 'Reservation cancelled', message: r ? `${r.event} was removed and its resources are free again.` : undefined })
  }

  const resolveConflict = (id: string) => {
    setConflicts((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'resolved' } : c)))
    toast.push({ type: 'success', title: 'Conflict marked resolved' })
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar page={page} onNavigate={setPage} openConflicts={openConflicts} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          page={page}
          query={query}
          onQuery={handleQuery}
          onNew={() => openBooking()}
          openConflicts={openConflicts}
          onBell={() => setPage('conflicts')}
        />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-[1500px]">
            {page === 'dashboard' && <Dashboard reservations={reservations} conflicts={conflicts} onNew={openBooking} onNavigate={setPage} />}
            {page === 'calendar' && <CalendarPage reservations={reservations} conflicts={conflicts} onNew={openBooking} />}
            {page === 'resources' && <Resources reservations={reservations} onNew={openBooking} />}
            {page === 'reservations' && <Reservations reservations={reservations} conflicts={conflicts} query={query} onQuery={setQuery} onCancel={cancelReservation} />}
            {page === 'conflicts' && <Conflicts reservations={reservations} conflicts={conflicts} onNew={openBooking} onResolve={resolveConflict} />}
            {page === 'analytics' && <Analytics reservations={reservations} conflicts={conflicts} />}
          </div>
        </main>
      </div>

      {modal && (
        <ReservationModal
          key={modal.key}
          prefill={modal.prefill}
          reservations={reservations}
          onClose={() => setModal(null)}
          onConfirm={confirmReservation}
          onLogConflicts={logConflicts}
        />
      )}
    </div>
  )
}
