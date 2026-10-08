import { createContext, useCallback, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'
interface ToastItem {
  id: number
  type: ToastType
  title: string
  message?: string
}

interface ToastApi {
  push: (t: Omit<ToastItem, 'id'>) => void
}

const ToastContext = createContext<ToastApi>({ push: () => {} })
export const useToast = () => useContext(ToastContext)

const styles: Record<ToastType, { ring: string; icon: ReactNode }> = {
  success: { ring: 'border-emerald-400/40', icon: <CheckCircle2 className="h-5 w-5 text-emerald-400" /> },
  error: { ring: 'border-red-400/40', icon: <AlertTriangle className="h-5 w-5 text-red-400" /> },
  info: { ring: 'border-gold/40', icon: <Info className="h-5 w-5 text-gold" /> },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const dismiss = (id: number) => setItems((p) => p.filter((i) => i.id !== id))

  const push = useCallback((t: Omit<ToastItem, 'id'>) => {
    const id = Date.now() + Math.random()
    setItems((p) => [...p, { ...t, id }])
    setTimeout(() => setItems((p) => p.filter((i) => i.id !== id)), 4500)
  }, [])

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-3">
        {items.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex animate-slide-in items-start gap-3 rounded-xl border bg-ink-700 p-4 shadow-panel ${styles[t.type].ring}`}
          >
            <div className="mt-0.5">{styles[t.type].icon}</div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">{t.title}</p>
              {t.message && <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{t.message}</p>}
            </div>
            <button onClick={() => dismiss(t.id)} className="text-slate-500 hover:text-white" aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
