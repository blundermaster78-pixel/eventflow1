import type { LucideIcon } from 'lucide-react'

const tones = {
  gold: 'bg-gold/10 text-gold border-gold/20',
  red: 'bg-red-400/10 text-red-300 border-red-400/20',
  green: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20',
  blue: 'bg-sky-400/10 text-sky-300 border-sky-400/20',
}

interface Props {
  label: string
  value: string | number
  hint?: string
  icon: LucideIcon
  tone?: keyof typeof tones
  onClick?: () => void
}

export default function StatCard({ label, value, hint, icon: Icon, tone = 'gold', onClick }: Props) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className="card flex items-center gap-4 p-5 text-left transition enabled:hover:border-gold/30 disabled:cursor-default"
    >
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${tones[tone]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-slate-400">{label}</p>
        <p className="text-3xl font-extrabold tracking-tight text-white">{value}</p>
        {hint && <p className="truncate text-xs text-slate-500">{hint}</p>}
      </div>
    </button>
  )
}
