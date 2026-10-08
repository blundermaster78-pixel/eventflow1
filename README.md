# EventFlow

Dark, gold-accented dashboard for university event-staging resource reservations — **without double-booking**.
Frontend-only MVP (React + Vite + TypeScript + Tailwind + lucide-react) with mock data.

## Run

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

## 60-second demo script

1. Dashboard → show the 2-week availability heatmap and the open conflicts.
2. **New Reservation** → click **Try a conflict** (pre-fills Stage + Generator + Sound for a night that the Alumni Gala already holds).
3. **Check availability** → all three resources are flagged, each with the existing booking.
4. Pick one of the 3 **alternative slots** → panel turns green.
5. **Confirm reservation** → toast, new booking appears on Calendar / Reservations, heatmap updates.
6. Conflicts page → **Find alternative slots** on a pending request to reschedule it.

## Where things live

- `src/lib/conflicts.ts` — multi-resource conflict detection + alternative-slot search
- `src/data/mock.ts` — 6 resources, 14 reservations (relative to today), seeded conflicts
- `src/components/ReservationModal.tsx` — the booking → conflict → alternative → confirm flow
- `src/pages/*` — Dashboard, Calendar, Resources, Reservations, Conflicts, Analytics
