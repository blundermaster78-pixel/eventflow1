import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Lightbulb,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'
import type { AltSlot, Conflict, Prefill, Reservation, ResourceHit, ResourceId } from './types'
import { eventTemplates, resources } from './mock'
import { checkAvailability, DAY_END, DAY_START, findAlternatives, WINDOW_DAYS } from '.conflicts'
import { addDays, fmtDate, fromMin, toMin, todayISO } from './date'
import { useToast } from './Toast'
import { resourceById, resourceIcons } from './ResourceTag'

interface Props {
  prefill?: Prefill
  reservations: Reservation[]
  onClose: () => void
  onConfirm: (r: Reservation, replaceId?: string) => void
  onLogConflicts: (c: Conflict[]) => void
}

interface Result {
  status: 'clear' | 'conflict'
  hits: ResourceHit[]
  alternatives: AltSlot[]
  applied?: AltSlot
}

const TIMES: string[] = []
for (let m = DAY_START; m <= DAY_END; m += 30) TIMES.push(fromMin(m))

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold/15 text-xs font-bold text-gold">{n}</span>
        <h3 className="text-sm font-bold text-white">{title}</h3>
      </div>
      {children}
    </section>
  )
}

export default function ReservationModal({ prefill, reservations, onClose, onConfirm, onLogConflicts }: Props) {
  const toast = useToast()
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [name, setName] = useState(prefill?.name ?? '')
  const [organizer, setOrganizer] = useState(prefill?.organizer ?? '')
  const [date, setDate] = useState(prefill?.date ?? addDays(todayISO(), 1))
  const [start, setStart] = useState(prefill?.start ?? '18:00')
  const [end, setEnd] = useState(prefill?.end ?? '21:00')
  const [selected, setSelected] = useState<ResourceId[]>(prefill?.resourceIds ?? [])
  const [result, setResult] = useState<Result | null>(null)
  const autoRan = useRef(false)

  const minDate = todayISO()
  const maxDate = addDays(minDate, WINDOW_DAYS - 1)
  const duration = toMin(end) - toMin(start)
  const timeValid = duration > 0
  const canCheck = name.trim().length > 0 && selected.length > 0 && timeValid && !!date
  const ignoreId = prefill?.replaceId

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    if (prefill?.autoCheck && !autoRan.current) {
      autoRan.current = true
      runCheck()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const invalidate = () => setResult(null)

  const pickTemplate = (id: string) => {
    const t = eventTemplates.find((x) => x.id === id)!
    setTemplateId(id)
    setName(t.name)
    setSelected(t.resources)
    setEnd(fromMin(Math.min(DAY_END, toMin(start) + t.hours * 60)))
    invalidate()
  }

  const toggleResource = (id: ResourceId) => {
    setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
    invalidate()
  }

  const loadDemo = () => {
    // Alumni Gala Night (+4 days, 18:00–23:00) holds Stage + Sound + Generator
    pickTemplate('concert')
    setName('Spring Music Fest')
    setOrganizer('Music Society')
    setDate(addDays(todayISO(), 4))
    setStart('19:00')
    setEnd('22:00')
    invalidate()
  }

  function runCheck() {
    const req = { date, start, end, resourceIds: selected }
    const hits = checkAvailability(req, reservations, ignoreId)
    if (hits.length === 0) {
      setResult({ status: 'clear', hits: [], alternatives: [] })
      toast.push({ type: 'success', title: 'All resources available', message: `${selected.length} of ${selected.length} resources are free for this slot.` })
      return
    }
    const alternatives = findAlternatives(req, reservations, ignoreId)
    setResult({ status: 'conflict', hits, alternatives })
    const unavailable = new Set(hits.map((h) => h.resourceId)).size
    toast.push({ type: 'error', title: 'Conflict detected', message: `${unavailable} of ${selected.length} resources are already booked.` })
    onLogConflicts(
      hits.map((h) => ({
        id: `blk-${name.trim()}-${date}-${start}-${h.resourceId}-${h.reservation.id}`,
        resourceId: h.resourceId,
        date,
        start: fromMin(Math.max(toMin(start), toMin(h.reservation.start))),
        end: fromMin(Math.min(toMin(end), toMin(h.reservation.end))),
        existingId: h.reservation.id,
        incomingId: ignoreId,
        incomingName: name.trim(),
        incomingStart: start,
        incomingEnd: end,
        incomingResourceIds: selected,
        kind: 'blocked' as const,
        status: 'open' as const,
        loggedAt: Date.now(),
      })),
    )
  }

  const applyAlternative = (alt: AltSlot) => {
    setDate(alt.date)
    setStart(alt.start)
    setEnd(alt.end)
    setResult({ status: 'clear', hits: [], alternatives: [], applied: alt })
    toast.push({ type: 'info', title: 'Alternative slot selected', message: `${fmtDate(alt.date)}, ${alt.start}–${alt.end}. Ready to confirm.` })
  }

  const confirm = () => {
    // Re-verify right before saving so a stale result can never double-book.
    if (checkAvailability({ date, start, end, resourceIds: selected }, reservations, ignoreId).length > 0) {
      runCheck()
      return
    }
    onConfirm(
      {
        id: `res-${Date.now()}`,
        event: name.trim(),
        organizer: organizer.trim() || 'Student Affairs',
        date,
        start,
        end,
        resourceIds: selected,
        status: 'confirmed',
      },
      ignoreId,
    )
    onClose()
  }

  const hitsByResource = useMemo(() => {
    const m = new Map<ResourceId, ResourceHit[]>()
    result?.hits.forEach((h) => m.set(h.resourceId, [...(m.get(h.resourceId) ?? []), h]))
    return m
  }, [result])

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="card !bg-ink-800 flex max-h-[92vh] w-full max-w-5xl animate-pop flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-white">{ignoreId ? 'Reschedule reservation' : 'New reservation'}</h2>
            <p className="text-xs text-slate-500">Pick resources and a time. EventFlow checks every resource before confirming.</p>
          </div>
          <div className="flex items-center gap-2">
            {!ignoreId && (
              <button onClick={loadDemo} className="btn-ghost !px-3 !py-2 text-xs">
                <Sparkles className="h-3.5 w-3.5 text-gold" /> Try a conflict
              </button>
            )}
            <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 lg:grid-cols-5">
          {/* Form */}
          <div className="space-y-6 overflow-y-auto p-6 lg:col-span-3">
            <Step n={1} title="Select event">
              <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {eventTemplates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => pickTemplate(t.id)}
                    className={`rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition ${
                      templateId === t.id ? 'border-gold bg-gold/10 text-gold' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Event name</label>
                  <input className="input" value={name} onChange={(e) => { setName(e.target.value); invalidate() }} placeholder="e.g. Spring Music Fest" />
                </div>
                <div>
                  <label className="label">Organizer</label>
                  <input className="input" value={organizer} onChange={(e) => setOrganizer(e.target.value)} placeholder="e.g. Music Society" />
                </div>
              </div>
            </Step>

            <Step n={2} title="Date and time">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="label">Date</label>
                  <input type="date" className="input" min={minDate} max={maxDate} value={date} onChange={(e) => { setDate(e.target.value); invalidate() }} />
                </div>
                <div>
                  <label className="label">Start</label>
                  <select className="input" value={start} onChange={(e) => { setStart(e.target.value); invalidate() }}>
                    {TIMES.slice(0, -1).map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">End</label>
                  <select className="input" value={end} onChange={(e) => { setEnd(e.target.value); invalidate() }}>
                    {TIMES.slice(1).map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <p className={`mt-2 flex items-center gap-1.5 text-xs ${timeValid ? 'text-slate-500' : 'text-red-400'}`}>
                <Clock className="h-3.5 w-3.5" />
                {timeValid ? `${Math.floor(duration / 60)}h ${duration % 60 ? `${duration % 60}m` : ''} · bookable ${fromMin(DAY_START)}–${fromMin(DAY_END)} within the next two weeks` : 'End time must be after the start time.'}
              </p>
            </Step>

            <Step n={3} title="Select resources">
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {resources.map((r) => {
                  const Icon = resourceIcons[r.id]
                  const on = selected.includes(r.id)
                  const blocked = result && on && hitsByResource.has(r.id)
                  const free = result && on && !hitsByResource.has(r.id)
                  return (
                    <button
                      key={r.id}
                      onClick={() => toggleResource(r.id)}
                      className={`relative rounded-xl border p-3.5 text-left transition ${
                        blocked
                          ? 'border-red-400/60 bg-red-400/10'
                          : free
                            ? 'border-emerald-400/50 bg-emerald-400/10'
                            : on
                              ? 'border-gold bg-gold/10'
                              : 'border-white/10 bg-white/[0.03] hover:border-white/25'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <Icon className={`h-5 w-5 ${blocked ? 'text-red-300' : free ? 'text-emerald-300' : on ? 'text-gold' : 'text-slate-400'}`} />
                        {on && (
                          <span className={`flex h-5 w-5 items-center justify-center rounded-full ${blocked ? 'bg-red-400' : free ? 'bg-emerald-400' : 'bg-gold'} text-ink-950`}>
                            {blocked ? <X className="h-3 w-3" strokeWidth={3} /> : <Check className="h-3 w-3" strokeWidth={3} />}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm font-semibold text-white">{r.name}</p>
                      <p className="text-[11px] text-slate-500">{r.spec}</p>
                    </button>
                  )
                })}
              </div>
              <p className="mt-2 text-xs text-slate-500">{selected.length} selected. All of them must be free for the reservation to go through.</p>
            </Step>
          </div>

          {/* Availability panel */}
          <div className="overflow-y-auto border-t border-white/10 bg-ink-900/60 p-6 lg:col-span-2 lg:border-l lg:border-t-0">
            <Step n={4} title="Availability">
              {!result && (
                <div className="rounded-xl border border-dashed border-white/15 p-6 text-center">
                  <ShieldCheck className="mx-auto h-9 w-9 text-gold/70" />
                  <p className="mt-3 text-sm font-semibold text-white">Ready to check</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    {canCheck
                      ? `We'll test ${selected.length} resource${selected.length > 1 ? 's' : ''} against every booking on ${fmtDate(date)}.`
                      : 'Add an event name, a valid time and at least one resource.'}
                  </p>
                </div>
              )}

              {result?.status === 'clear' && (
                <div className="animate-fade-in space-y-4">
                  <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4">
                    <div className="flex items-center gap-2 font-semibold text-emerald-300">
                      <CheckCircle2 className="h-5 w-5" /> {result.applied ? 'Alternative slot applied' : 'No conflicts found'}
                    </div>
                    <p className="mt-1 text-sm text-emerald-200/80">All {selected.length} resources are free for the slot below.</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-sm font-bold text-white">{name || 'Untitled event'}</p>
                    <p className="mt-1 flex items-center gap-2 text-sm text-slate-300"><CalendarDays className="h-4 w-4 text-gold" />{fmtDate(date)}</p>
                    <p className="mt-1 flex items-center gap-2 text-sm text-slate-300"><Clock className="h-4 w-4 text-gold" />{start} – {end}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {selected.map((id) => (
                        <span key={id} className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-xs font-medium text-emerald-300">
                          <Check className="h-3 w-3" /> {resourceById(id).name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {result?.status === 'conflict' && (
                <div className="animate-fade-in space-y-5">
                  <div className="rounded-xl border border-red-400/30 bg-red-400/10 p-4">
                    <div className="flex items-center gap-2 font-semibold text-red-300">
                      <AlertTriangle className="h-5 w-5" /> Conflict detected
                    </div>
                    <p className="mt-1 text-sm text-red-200/80">
                      {hitsByResource.size} of {selected.length} resources are already booked on {fmtDate(date)}, {start}–{end}.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {selected.map((id) => {
                      const hits = hitsByResource.get(id)
                      const Icon = resourceIcons[id]
                      return (
                        <div key={id} className={`rounded-xl border p-3 ${hits ? 'border-red-400/30 bg-red-400/[0.06]' : 'border-white/10 bg-white/[0.03]'}`}>
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${hits ? 'text-red-300' : 'text-emerald-300'}`} />
                            <span className="text-sm font-semibold text-white">{resourceById(id).name}</span>
                            <span className={`ml-auto text-xs font-semibold ${hits ? 'text-red-300' : 'text-emerald-300'}`}>{hits ? 'Unavailable' : 'Free'}</span>
                          </div>
                          {hits?.map((h) => (
                            <div key={h.reservation.id} className="mt-2 rounded-lg bg-black/30 px-3 py-2 text-xs">
                              <p className="font-semibold text-slate-200">Already booked: {h.reservation.event}</p>
                              <p className="mt-0.5 text-slate-500">
                                {h.reservation.start}–{h.reservation.end} · {h.reservation.organizer}
                                {h.reservation.status === 'pending' ? ' · pending' : ''}
                              </p>
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>

                  <div>
                    <p className="mb-2 flex items-center gap-2 text-sm font-bold text-white">
                      <Lightbulb className="h-4 w-4 text-gold" /> Alternative slots
                    </p>
                    {result.alternatives.length === 0 ? (
                      <p className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-slate-400">
                        No slot in the next two weeks has all {selected.length} resources free. Try removing a resource or shortening the event.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {result.alternatives.map((a) => (
                          <button
                            key={`${a.date}-${a.start}`}
                            onClick={() => applyAlternative(a)}
                            className="group flex w-full items-center gap-3 rounded-xl border border-gold/25 bg-gold/[0.06] p-3 text-left transition hover:border-gold hover:bg-gold/10"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-white">{fmtDate(a.date)} · {a.start}–{a.end}</p>
                              <p className="text-xs text-slate-400">{a.note} · all {selected.length} resources free</p>
                            </div>
                            <span className="flex items-center gap-1 text-xs font-bold text-gold">
                              Use slot <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Step>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-white/10 px-6 py-4">
          <p className="hidden text-xs text-slate-500 sm:block">
            {result?.status === 'clear' ? 'Confirming saves the booking and blocks these resources for others.' : 'Nothing is saved until you confirm.'}
          </p>
          <div className="ml-auto flex gap-3">
            <button onClick={onClose} className="btn-ghost">Cancel</button>
            {result?.status === 'clear' ? (
              <button onClick={confirm} className="btn-gold"><Check className="h-4 w-4" strokeWidth={3} /> Confirm reservation</button>
            ) : (
              <button onClick={runCheck} disabled={!canCheck} className="btn-gold">
                <ShieldCheck className="h-4 w-4" /> {result ? 'Check again' : 'Check availability'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
