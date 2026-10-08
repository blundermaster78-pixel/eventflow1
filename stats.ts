import type { Reservation, ResourceId } from '../types'
import { DAY_END, DAY_START, WINDOW_DAYS } from './conflicts'
import { addDays, toMin, todayISO } from './date'

export const windowDates = () => {
  const t = todayISO()
  return Array.from({ length: WINDOW_DAYS }, (_, i) => addDays(t, i))
}

export const DAY_MINUTES = DAY_END - DAY_START

/** Booked minutes (clipped to operating hours) for a resource on one date. */
export function bookedMinutes(resourceId: ResourceId, date: string, reservations: Reservation[]) {
  let total = 0
  for (const r of reservations) {
    if (r.date !== date || !r.resourceIds.includes(resourceId)) continue
    const s = Math.max(DAY_START, toMin(r.start))
    const e = Math.min(DAY_END, toMin(r.end))
    if (e > s) total += e - s
  }
  return Math.min(total, DAY_MINUTES)
}

export function utilization(resourceId: ResourceId, reservations: Reservation[]) {
  const dates = windowDates()
  const booked = dates.reduce((sum, d) => sum + bookedMinutes(resourceId, d, reservations), 0)
  return Math.round((booked / (dates.length * DAY_MINUTES)) * 100)
}

export function overallUtilization(ids: ResourceId[], reservations: Reservation[]) {
  const dates = windowDates()
  const booked = ids.reduce(
    (sum, id) => sum + dates.reduce((s, d) => s + bookedMinutes(id, d, reservations), 0),
    0,
  )
  return Math.round((booked / (ids.length * dates.length * DAY_MINUTES)) * 100)
}

export function heatClass(mins: number) {
  const r = mins / DAY_MINUTES
  if (mins === 0) return 'bg-emerald-400/[0.08] border-emerald-400/20 hover:bg-emerald-400/20'
  if (r < 0.3) return 'bg-gold/20 border-gold/25 hover:bg-gold/30'
  if (r < 0.55) return 'bg-gold/40 border-gold/40 hover:bg-gold/50'
  if (r < 0.8) return 'bg-gold/65 border-gold/60 hover:bg-gold/75'
  return 'bg-gold border-gold hover:bg-gold-300'
}
