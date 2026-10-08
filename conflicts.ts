import type { AltSlot, AvailabilityRequest, Conflict, Reservation, ResourceHit } from '../types'
import { addDays, fromMin, toMin, todayISO } from './date'

export const DAY_START = 8 * 60 // 08:00
export const DAY_END = 23 * 60 // 23:00
export const WINDOW_DAYS = 14

export const overlaps = (aS: number, aE: number, bS: number, bE: number) => aS < bE && bS < aE

/**
 * Multi-resource check: every requested resource is tested against every
 * existing reservation on that date. One hit per (resource, reservation).
 */
export function checkAvailability(req: AvailabilityRequest, reservations: Reservation[], ignoreId?: string): ResourceHit[] {
  const s = toMin(req.start)
  const e = toMin(req.end)
  const hits: ResourceHit[] = []
  for (const r of reservations) {
    if (r.id === ignoreId || r.date !== req.date) continue
    if (!overlaps(s, e, toMin(r.start), toMin(r.end))) continue
    for (const id of req.resourceIds) {
      if (r.resourceIds.includes(id)) hits.push({ resourceId: id, reservation: r })
    }
  }
  return hits
}

/**
 * Suggest up to `max` slots with the same duration where ALL requested
 * resources are free. Prefers the same day, then neighbouring days, and
 * spreads suggestions across different days.
 */
export function findAlternatives(
  req: AvailabilityRequest,
  reservations: Reservation[],
  ignoreId?: string,
  max = 3,
): AltSlot[] {
  const dur = toMin(req.end) - toMin(req.start)
  const reqStart = toMin(req.start)
  const today = todayISO()
  const lastDay = addDays(today, WINDOW_DAYS - 1)
  const cands: { date: string; s: number; off: number; score: number }[] = []

  for (let off = -3; off <= 7; off++) {
    const date = addDays(req.date, off)
    if (date < today || date > lastDay) continue
    for (let s = DAY_START; s + dur <= DAY_END; s += 30) {
      if (off === 0 && s === reqStart) continue
      const slot = { ...req, date, start: fromMin(s), end: fromMin(s + dur) }
      if (checkAvailability(slot, reservations, ignoreId).length === 0) {
        cands.push({ date, s, off, score: Math.abs(off) * 1000 + (off < 0 ? 10 : 0) + Math.abs(s - reqStart) })
      }
    }
  }
  cands.sort((a, b) => a.score - b.score)

  const picked: typeof cands = []
  // pass 1: best slot per distinct day
  for (const c of cands) {
    if (picked.length >= max) break
    if (!picked.some((p) => p.date === c.date)) picked.push(c)
  }
  // pass 2: fill with well-spaced slots on the same day
  for (const c of cands) {
    if (picked.length >= max) break
    if (!picked.includes(c) && picked.every((p) => p.date !== c.date || Math.abs(p.s - c.s) >= 120)) picked.push(c)
  }

  return picked
    .sort((a, b) => a.score - b.score)
    .map((c) => ({
      date: c.date,
      start: fromMin(c.s),
      end: fromMin(c.s + dur),
      note:
        c.off === 0
          ? c.s < reqStart
            ? 'Same day, earlier'
            : 'Same day, later'
          : c.off === 1
            ? 'Next day, same time window'
            : c.off === -1
              ? 'Previous day'
              : c.off > 0
                ? `${c.off} days later`
                : `${-c.off} days earlier`,
    }))
}

/** Scan existing data for overlapping bookings that share a resource. */
export function detectOverlaps(reservations: Reservation[]): Conflict[] {
  const out: Conflict[] = []
  let n = 0
  for (let i = 0; i < reservations.length; i++) {
    for (let j = i + 1; j < reservations.length; j++) {
      const a = reservations[i]
      const b = reservations[j]
      if (a.date !== b.date) continue
      if (!overlaps(toMin(a.start), toMin(a.end), toMin(b.start), toMin(b.end))) continue
      const shared = a.resourceIds.filter((id) => b.resourceIds.includes(id))
      if (!shared.length) continue
      const [existing, incoming] = a.status === 'pending' && b.status !== 'pending' ? [b, a] : [a, b]
      n++
      for (const resourceId of shared) {
        out.push({
          id: `seed-${existing.id}-${incoming.id}-${resourceId}`,
          resourceId,
          date: a.date,
          start: fromMin(Math.max(toMin(a.start), toMin(b.start))),
          end: fromMin(Math.min(toMin(a.end), toMin(b.end))),
          existingId: existing.id,
          incomingId: incoming.id,
          incomingName: incoming.event,
          incomingStart: incoming.start,
          incomingEnd: incoming.end,
          incomingResourceIds: incoming.resourceIds,
          kind: 'overlap',
          status: 'open',
          loggedAt: Date.now() - n * 47 * 60000,
        })
      }
    }
  }
  return out
}

/** Reservation ids that are the "incoming" side of an open conflict. */
export const conflictedIds = (conflicts: Conflict[]) => {
  const s = new Set<string>()
  conflicts.forEach((c) => {
    if (c.status === 'open' && c.incomingId) s.add(c.incomingId)
  })
  return s
}
