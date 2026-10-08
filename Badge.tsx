type Kind = 'confirmed' | 'pending' | 'conflict' | 'open' | 'resolved' | 'available' | 'inuse'

const map: Record<Kind, { cls: string; label: string }> = {
  confirmed: { cls: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300', label: 'Confirmed' },
  pending: { cls: 'border-gold/30 bg-gold/10 text-gold-300', label: 'Pending' },
  conflict: { cls: 'border-red-400/30 bg-red-400/10 text-red-300', label: 'Conflict' },
  open: { cls: 'border-red-400/30 bg-red-400/10 text-red-300', label: 'Open' },
  resolved: { cls: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300', label: 'Resolved' },
  available: { cls: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300', label: 'Available now' },
  inuse: { cls: 'border-gold/30 bg-gold/10 text-gold-300', label: 'In use now' },
}

export default function Badge({ kind }: { kind: Kind }) {
  const m = map[kind]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${m.cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {m.label}
    </span>
  )
}
