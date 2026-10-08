import { Armchair, Monitor, Projector, Theater, Volume2, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ResourceId } from '../types'
import { resources } from '../data/mock'

export const resourceIcons: Record<ResourceId, LucideIcon> = {
  stage: Theater,
  generator: Zap,
  sound: Volume2,
  led: Monitor,
  projector: Projector,
  chairs: Armchair,
}

export const resourceById = (id: ResourceId) => resources.find((r) => r.id === id)!

export function ResourceTag({ id, tone = 'default' }: { id: ResourceId; tone?: 'default' | 'danger' }) {
  const Icon = resourceIcons[id]
  const cls =
    tone === 'danger'
      ? 'border-red-400/30 bg-red-400/10 text-red-300'
      : 'border-white/10 bg-white/5 text-slate-300'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-medium ${cls}`}>
      <Icon className="h-3.5 w-3.5" />
      {resourceById(id).short}
    </span>
  )
}
